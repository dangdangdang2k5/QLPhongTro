import os
import urllib.parse
from functools import wraps
from flask import Flask, render_template, redirect, url_for, abort, request, session
from dotenv import load_dotenv
from db import get_db, init_db

# Load biến môi trường từ file .env
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-12345')

# Cấu hình Admin
ADMIN_USERNAME = os.getenv('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'admin123')

# Cấu hình thanh toán & ngân hàng
BANK_CODE = os.getenv('BANK_CODE', 'MB')
BANK_NAME = os.getenv('BANK_NAME', 'MB Bank')
BANK_ACCOUNT = os.getenv('BANK_ACCOUNT', '0942216511')
BANK_ACCOUNT_NAME = os.getenv('BANK_ACCOUNT_NAME', '').strip()
PAYMENT_MONTH = os.getenv('PAYMENT_MONTH', '8')
PAYMENT_YEAR = os.getenv('PAYMENT_YEAR', '2026')

# Khởi tạo database và seed dữ liệu nếu chưa có
init_db()

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
# USER (NGƯỜI THUÊ) ROUTES
# ==========================================

@app.route('/')
def home():
    """Trang chủ dành cho người thuê: hiển thị danh sách 6 phòng với tổng tiền mới nhất."""
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

@app.route('/payment/<int:room_id>')
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
def confirm_payment(room_id):
    """Người thuê bấm 'Tôi đã chuyển khoản' -> chuyển trạng thái UNPAID sang PENDING."""
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

    conn.close()
    return redirect(url_for('payment', room_id=room_id))

# ==========================================
# ADMIN ROUTES
# ==========================================

@app.route('/admin', methods=['GET', 'POST'])
def admin_login():
    """Trang đăng nhập dành cho Admin."""
    if session.get('is_admin'):
        return redirect(url_for('admin_dashboard'))

    error = None
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')

        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            session['is_admin'] = True
            return redirect(url_for('admin_dashboard'))
        else:
            error = 'Tên đăng nhập hoặc mật khẩu không chính xác!'

    return render_template('admin_login.html', error=error)

@app.route('/admin/dashboard')
@admin_required
def admin_dashboard():
    """Dashboard quản lý 6 phòng và duyệt thanh toán của Admin."""
    conn = get_db()
    cursor = conn.cursor()
    query = '''
        SELECT r.id, r.room_number, p.room_fee, p.electricity_units, 
               p.electricity_fee, p.water_fee, p.total_amount, p.status
        FROM rooms r
        LEFT JOIN payments p ON r.id = p.room_id 
             AND p.payment_month = ? AND p.payment_year = ?
        ORDER BY r.id ASC
    '''
    cursor.execute(query, (int(PAYMENT_MONTH), int(PAYMENT_YEAR)))
    rooms = cursor.fetchall()
    conn.close()

    return render_template(
        'admin.html',
        rooms=rooms,
        payment_month=PAYMENT_MONTH,
        payment_year=PAYMENT_YEAR
    )

@app.route('/admin/room/<int:room_id>', methods=['GET', 'POST'])
@admin_required
def admin_room_detail(room_id):
    """Admin nhập và chỉnh sửa thông tin tiền phòng, số điện, tiền nước."""
    conn = get_db()
    cursor = conn.cursor()

    if request.method == 'POST':
        try:
            room_fee = int(request.form.get('room_fee', 2000000))
            electricity_units = int(request.form.get('electricity_units', 0))
            water_fee = int(request.form.get('water_fee', 0))
        except (ValueError, TypeError):
            room_fee = 2000000
            electricity_units = 0
            water_fee = 0

        # Backend tự tính toán lại: Tiền điện = số điện * 4.000đ
        electricity_price = 4000
        electricity_fee = electricity_units * electricity_price
        total_amount = room_fee + electricity_fee + water_fee

        # Lưu thông tin hóa đơn vào SQLite
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
        SELECT r.id, r.room_number, p.room_fee, p.electricity_units, 
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
    """Admin xác nhận đã nhận tiền trong tài khoản MB Bank -> chuyển PENDING sang PAID."""
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

    # Kiểm tra bảo mật: chỉ cho phép duyệt khi trạng thái thực sự là PENDING
    if payment_rec['status'] == 'PENDING':
        cursor.execute(
            "UPDATE payments SET status = 'PAID', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (payment_rec['id'],)
        )
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
