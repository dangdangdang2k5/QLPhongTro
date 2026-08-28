import os
import urllib.parse
from functools import wraps
from flask import Flask, render_template, redirect, url_for, abort, request, session, jsonify
from dotenv import load_dotenv
from db import get_db, init_db
from telegram_service import send_telegram_message, send_telegram_message_with_button, set_telegram_webhook

# Load biến môi trường từ file .env (nếu chạy local)
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = (os.getenv('FLASK_SECRET_KEY') or os.getenv('SECRET_KEY', 'dev-secret-key-12345')).strip()

# Cấu hình Admin
ADMIN_USERNAME = os.getenv('ADMIN_USERNAME', 'admin').strip()
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'admin123').strip()

# Cấu hình thanh toán & ngân hàng
BANK_CODE = os.getenv('BANK_CODE', 'MB').strip()
BANK_NAME = os.getenv('BANK_NAME', 'MB Bank').strip()
BANK_ACCOUNT = os.getenv('BANK_ACCOUNT', '0942216511').strip()
BANK_ACCOUNT_NAME = os.getenv('BANK_ACCOUNT_NAME', '').strip()
PAYMENT_MONTH = os.getenv('PAYMENT_MONTH', '8').strip()
PAYMENT_YEAR = os.getenv('PAYMENT_YEAR', '2026').strip()

# Khởi tạo database và seed dữ liệu nếu chưa có
init_db()

# Decorator yêu cầu mã Access Key dành cho Người thuê
def tenant_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('site_authorized'):
            return redirect(url_for('site_access'))
        return f(*args, **kwargs)
    return decorated_function

# Decorator yêu cầu quyền Admin
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('is_admin'):
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return decorated_function

# Filter Jinja định dạng tiền tệ Việt Nam (ví dụ: 2000000 -> 2.000.000đ)
@app.template_filter('currency')
def currency_filter(value):
    try:
        return f"{int(value):,}".replace(",", ".") + "đ"
    except (ValueError, TypeError):
        return f"{value}đ"

# ==========================================
# TELEGRAM WEBHOOK (/start -> LẤY CHAT ID)
# ==========================================

@app.route('/telegram/webhook', methods=['POST'])
def telegram_webhook():
    """Webhook nhận tin nhắn từ Telegram Bot (khi người dùng gửi /start để lấy Chat ID)."""
    data = request.get_json(silent=True) or {}
    message = data.get('message') or data.get('edited_message')

    if message:
        chat = message.get('chat', {})
        chat_id = chat.get('id')
        text = (message.get('text') or '').strip()

        if chat_id:
            reply_text = (
                "🏠 <b>QLPhongTro Bot</b>\n\n"
                "Kết nối thành công!\n\n"
                "Chat ID của bạn:\n"
                f"<code>{chat_id}</code>\n\n"
                "<i>(Hãy copy số Chat ID này và dán vào ADMIN_TELEGRAM_CHAT_ID trên Render nhé!)</i>"
            )
            send_telegram_message(chat_id=chat_id, message=reply_text)

    return jsonify({'ok': True}), 200

# ==========================================
# ACCESS KEY & AUTH ROUTES (NGƯỜI THUÊ)
# ==========================================

@app.route('/access', methods=['GET', 'POST'])
def site_access():
    """Trang xác thực Access Key dành cho người thuê."""
    if session.get('site_authorized'):
        return redirect(url_for('home'))

    error = None
    if request.method == 'POST':
        key_input = request.form.get('access_key', '').strip()
        # Đọc Access Key động từ Environment Variable
        site_access_key = os.getenv('SITE_ACCESS_KEY', '').strip()

        if site_access_key and key_input == site_access_key:
            session['site_authorized'] = True
            return redirect(url_for('home'))
        else:
            error = '❌ Mã truy cập không đúng.'

    return render_template('access.html', error=error)

@app.route('/logout')
def site_logout():
    """Thoát quyền truy cập của người thuê."""
    session.pop('site_authorized', None)
    return redirect(url_for('site_access'))

# ==========================================
# USER (NGƯỜI THUÊ) ROUTES - ĐƯỢC BẢO VỆ BỞI ACCESS KEY
# ==========================================

@app.route('/')
@tenant_required
def home():
    """Trang chủ dành cho người thuê: hiển thị danh sách 6 phòng với nút 'Kiểm tra hóa đơn'."""
    conn = get_db()
    cursor = conn.cursor()
    query = '''
        SELECT r.id, r.room_number, p.total_amount as amount, p.status
        FROM rooms r
        LEFT JOIN payments p ON r.id = p.room_id 
             AND p.payment_month = ? AND p.payment_year = ?
        ORDER BY r.id ASC
    '''
    cursor.execute(query, (int(PAYMENT_MONTH), int(PAYMENT_YEAR)))
    rooms = cursor.fetchall()
    conn.close()
    return render_template('index.html', rooms=rooms)

@app.route('/invoice/<int:room_id>')
@tenant_required
def invoice_detail(room_id):
    """Trang chi tiết hóa đơn: tiền phòng, số điện x đơn giá, tiền nước, tổng tiền."""
    conn = get_db()
    cursor = conn.cursor()
    query = '''
        SELECT r.id, r.room_number, p.room_fee, p.electricity_units, 
               p.electricity_price, p.electricity_fee, p.water_fee, 
               p.total_amount, p.status
        FROM rooms r
        JOIN payments p ON r.id = p.room_id 
             AND p.payment_month = ? AND p.payment_year = ?
        WHERE r.id = ?
    '''
    cursor.execute(query, (int(PAYMENT_MONTH), int(PAYMENT_YEAR), room_id))
    room = cursor.fetchone()
    conn.close()

    if room is None:
        abort(404)

    return render_template(
        'invoice.html',
        room=room,
        payment_month=PAYMENT_MONTH,
        payment_year=PAYMENT_YEAR
    )

@app.route('/payment/<int:room_id>')
@tenant_required
def payment(room_id):
    """Trang thanh toán chi tiết cho từng phòng với mã VietQR tạo động theo tổng tiền."""
    conn = get_db()
    cursor = conn.cursor()
    query = '''
        SELECT r.id, r.room_number, p.total_amount as amount, p.status
        FROM rooms r
        JOIN payments p ON r.id = p.room_id 
             AND p.payment_month = ? AND p.payment_year = ?
        WHERE r.id = ?
    '''
    cursor.execute(query, (int(PAYMENT_MONTH), int(PAYMENT_YEAR), room_id))
    room = cursor.fetchone()
    conn.close()

    if room is None:
        abort(404)

    # Nội dung chuyển khoản tự động: TIEN PHONG {id} THANG {thang}/{nam}
    transfer_content = f"TIEN PHONG {room['id']} THANG {PAYMENT_MONTH}/{PAYMENT_YEAR}"

    params = {
        'amount': room['amount'],
        'addInfo': transfer_content
    }
    if BANK_ACCOUNT_NAME:
        params['accountName'] = BANK_ACCOUNT_NAME

    query_string = urllib.parse.urlencode(params)
    qr_url = f"https://img.vietqr.io/image/{BANK_CODE}-{BANK_ACCOUNT}-compact2.png?{query_string}"

    return render_template(
        'payment.html',
        room=room,
        bank_name=BANK_NAME,
        bank_account=BANK_ACCOUNT,
        bank_account_name=BANK_ACCOUNT_NAME,
        payment_month=PAYMENT_MONTH,
        payment_year=PAYMENT_YEAR,
        transfer_content=transfer_content,
        qr_url=qr_url
    )

@app.route('/payment/<int:room_id>/confirm', methods=['POST'])
@tenant_required
def confirm_payment(room_id):
    """Người thuê bấm 'Tôi đã chuyển khoản' -> chuyển trạng thái UNPAID sang PENDING và gửi thông báo Telegram."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, status FROM payments 
        WHERE room_id = ? AND payment_month = ? AND payment_year = ?
    ''', (room_id, int(PAYMENT_MONTH), int(PAYMENT_YEAR)))
    payment_rec = cursor.fetchone()

    if payment_rec is None:
        conn.close()
        abort(404)

    # Chỉ chuyển UNPAID -> PENDING
    if payment_rec['status'] == 'UNPAID':
        cursor.execute(
            "UPDATE payments SET status = 'PENDING', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (payment_rec['id'],)
        )
        conn.commit()

        # Gửi thông báo tự động qua Telegram cho Admin
        admin_chat_id = os.getenv('ADMIN_TELEGRAM_CHAT_ID', '').strip()
        if admin_chat_id:
            cursor.execute('''
                SELECT r.room_number, p.total_amount 
                FROM rooms r
                JOIN payments p ON r.id = p.room_id 
                     AND p.payment_month = ? AND p.payment_year = ?
                WHERE r.id = ?
            ''', (int(PAYMENT_MONTH), int(PAYMENT_YEAR), room_id))
            detail = cursor.fetchone()

            if detail:
                formatted_amount = f"{detail['total_amount']:,}".replace(",", ".") + "đ"
                transfer_msg = f"TIEN PHONG {room_id} THANG {PAYMENT_MONTH}/{PAYMENT_YEAR}"
                app_url = os.getenv('APP_BASE_URL', 'http://127.0.0.1:5000').rstrip('/')
                admin_dashboard_url = f"{app_url}/admin"

                tg_message = (
                    f"🔔 <b>THÔNG BÁO CHUYỂN KHOẢN MỚI</b>\n\n"
                    f"🏠 <b>Phòng:</b> {detail['room_number']}\n"
                    f"💰 <b>Số tiền:</b> {formatted_amount}\n"
                    f"📅 <b>Kỳ:</b> Tháng {PAYMENT_MONTH}/{PAYMENT_YEAR}\n"
                    f"📝 <b>Nội dung CK:</b> <code>{transfer_msg}</code>\n\n"
                    f"⚡ <i>Người thuê đã bấm 'Tôi đã chuyển khoản'. Vui lòng kiểm tra tài khoản MB Bank và duyệt thanh toán!</i>"
                )
                send_telegram_message_with_button(
                    chat_id=admin_chat_id,
                    message=tg_message,
                    button_text="🔍 Mở Dashboard Duyệt",
                    button_url=admin_dashboard_url
                )

    conn.close()
    return redirect(url_for('payment', room_id=room_id))

# ==========================================
# ADMIN ROUTES (HOÀN TOÀN ĐỘC LẬP VỚI ACCESS KEY)
# ==========================================

@app.route('/admin', methods=['GET', 'POST'])
def admin_login():
    """Trang đăng nhập dành cho Admin."""
    if session.get('is_admin'):
        return redirect(url_for('admin_dashboard'))

    error = None
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()

        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            session['is_admin'] = True
            return redirect(url_for('admin_dashboard'))
        else:
            error = f'Tên đăng nhập hoặc mật khẩu không chính xác! (Mặc định: {ADMIN_USERNAME} / {ADMIN_PASSWORD})'

    return render_template('admin_login.html', error=error)

@app.route('/admin/dashboard')
@admin_required
def admin_dashboard():
    """Dashboard quản lý 6 phòng và duyệt thanh toán của Admin."""
    conn = get_db()
    cursor = conn.cursor()
    query = '''
        SELECT r.id, r.room_number, p.room_fee, p.electricity_units, p.electricity_price,
               p.electricity_fee, p.water_fee, p.total_amount, p.status
        FROM rooms r
        LEFT JOIN payments p ON r.id = p.room_id 
             AND p.payment_month = ? AND p.payment_year = ?
        ORDER BY r.id ASC
    '''
    cursor.execute(query, (int(PAYMENT_MONTH), int(PAYMENT_YEAR)))
    rooms = cursor.fetchall()
    conn.close()

    # Nhận thông báo test Telegram / Webhook nếu có
    tg_status = request.args.get('tg_status')

    return render_template(
        'admin.html',
        rooms=rooms,
        payment_month=PAYMENT_MONTH,
        payment_year=PAYMENT_YEAR,
        tg_status=tg_status
    )

@app.route('/admin/payment/<int:room_id>/set-status', methods=['POST'])
@admin_required
def set_payment_status(room_id):
    """Admin chuyển đổi linh hoạt giữa 3 chế độ: UNPAID, PENDING, PAID."""
    new_status = request.form.get('status', '').strip().upper()
    if new_status not in ['UNPAID', 'PENDING', 'PAID']:
        new_status = 'UNPAID'

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE payments 
        SET status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE room_id = ? AND payment_month = ? AND payment_year = ?
    ''', (new_status, room_id, int(PAYMENT_MONTH), int(PAYMENT_YEAR)))
    conn.commit()
    conn.close()
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/set-telegram-webhook', methods=['POST'])
@admin_required
def admin_set_telegram_webhook():
    """Đăng ký Webhook tự động với Telegram để Bot nhận lệnh /start."""
    app_url = os.getenv('APP_BASE_URL', '').rstrip('/')
    if not app_url:
        return redirect(url_for('admin_dashboard', tg_status='no_app_url'))

    webhook_url = f"{app_url}/telegram/webhook"
    success = set_telegram_webhook(webhook_url)
    status = 'webhook_success' if success else 'webhook_failed'
    return redirect(url_for('admin_dashboard', tg_status=status))

@app.route('/admin/test-telegram', methods=['POST'])
@admin_required
def admin_test_telegram():
    """Gửi tin nhắn test kết nối Telegram Bot."""
    admin_chat_id = os.getenv('ADMIN_TELEGRAM_CHAT_ID', '').strip()
    if not admin_chat_id:
        return redirect(url_for('admin_dashboard', tg_status='no_chat_id'))

    app_url = os.getenv('APP_BASE_URL', 'http://127.0.0.1:5000').rstrip('/')
    test_msg = (
        "🔔 <b>QL PHÒNG TRỌ</b>\n\n"
        "🎉 <b>Telegram Bot đã kết nối thành công!</b>\n"
        "Từ bây giờ bạn sẽ nhận được thông báo ngay khi có người thuê bấm 'Tôi đã chuyển khoản'."
    )
    success = send_telegram_message_with_button(
        chat_id=admin_chat_id,
        message=test_msg,
        button_text="🏠 Mở Website Quản Trị",
        button_url=f"{app_url}/admin"
    )
    status = 'success' if success else 'failed'
    return redirect(url_for('admin_dashboard', tg_status=status))

@app.route('/admin/room/<int:room_id>', methods=['GET', 'POST'])
@admin_required
def admin_room_detail(room_id):
    """Admin nhập và chỉnh sửa thông tin tiền phòng, số điện, đơn giá, tiền nước và trạng thái."""
    conn = get_db()
    cursor = conn.cursor()

    if request.method == 'POST':
        try:
            room_fee = int(request.form.get('room_fee', 2000000))
            electricity_units = int(request.form.get('electricity_units', 0))
            electricity_price = int(request.form.get('electricity_price', 4000))
            water_fee = int(request.form.get('water_fee', 0))
        except (ValueError, TypeError):
            room_fee = 2000000
            electricity_units = 0
            electricity_price = 4000
            water_fee = 0

        # Backend validation: không cho số âm
        room_fee = max(0, room_fee)
        electricity_units = max(0, electricity_units)
        electricity_price = max(0, electricity_price)
        water_fee = max(0, water_fee)

        # Backend tự tính toán lại
        electricity_fee = electricity_units * electricity_price
        total_amount = room_fee + electricity_fee + water_fee

        # Nhận trạng thái được chọn (UNPAID / PENDING / PAID)
        selected_status = request.form.get('status', '').strip().upper()
        if selected_status in ['UNPAID', 'PENDING', 'PAID']:
            cursor.execute('''
                UPDATE payments 
                SET room_fee = ?,
                    electricity_units = ?,
                    electricity_price = ?,
                    electricity_fee = ?,
                    water_fee = ?,
                    total_amount = ?,
                    status = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE room_id = ? AND payment_month = ? AND payment_year = ?
            ''', (
                room_fee, electricity_units, electricity_price,
                electricity_fee, water_fee, total_amount, selected_status,
                room_id, int(PAYMENT_MONTH), int(PAYMENT_YEAR)
            ))
        else:
            # Nếu không truyền status thì giữ nguyên status cũ
            cursor.execute('''
                UPDATE payments 
                SET room_fee = ?,
                    electricity_units = ?,
                    electricity_price = ?,
                    electricity_fee = ?,
                    water_fee = ?,
                    total_amount = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE room_id = ? AND payment_month = ? AND payment_year = ?
            ''', (
                room_fee, electricity_units, electricity_price,
                electricity_fee, water_fee, total_amount,
                room_id, int(PAYMENT_MONTH), int(PAYMENT_YEAR)
            ))

        conn.commit()
        conn.close()
        return redirect(url_for('admin_dashboard'))

    # GET: Xem form chi tiết phòng
    query = '''
        SELECT r.id, r.room_number, p.room_fee, p.electricity_units, p.electricity_price,
               p.electricity_fee, p.water_fee, p.total_amount, p.status
        FROM rooms r
        JOIN payments p ON r.id = p.room_id 
             AND p.payment_month = ? AND p.payment_year = ?
        WHERE r.id = ?
    '''
    cursor.execute(query, (int(PAYMENT_MONTH), int(PAYMENT_YEAR), room_id))
    room = cursor.fetchone()
    conn.close()

    if room is None:
        abort(404)

    return render_template(
        'admin_room.html',
        room=room,
        payment_month=PAYMENT_MONTH,
        payment_year=PAYMENT_YEAR
    )

@app.route('/admin/payment/<int:room_id>/approve', methods=['POST'])
@admin_required
def approve_payment(room_id):
    """Admin xác nhận đã nhận tiền trong tài khoản MB Bank -> chuyển sang PAID."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE payments 
        SET status = 'PAID', updated_at = CURRENT_TIMESTAMP 
        WHERE room_id = ? AND payment_month = ? AND payment_year = ?
    ''', (room_id, int(PAYMENT_MONTH), int(PAYMENT_YEAR)))
    conn.commit()
    conn.close()
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/payment/<int:room_id>/reset', methods=['POST'])
@admin_required
def reset_payment(room_id):
    """Admin reset trạng thái thanh toán về UNPAID mà KHÔNG làm mất dữ liệu hóa đơn."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE payments 
        SET status = 'UNPAID', updated_at = CURRENT_TIMESTAMP 
        WHERE room_id = ? AND payment_month = ? AND payment_year = ?
    ''', (room_id, int(PAYMENT_MONTH), int(PAYMENT_YEAR)))
    conn.commit()
    conn.close()
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/logout')
def admin_logout():
    """Đăng xuất khỏi phiên làm việc Admin."""
    session.pop('is_admin', None)
    return redirect(url_for('admin_login'))

if __name__ == '__main__':
    app.run(debug=True, port=5000)
