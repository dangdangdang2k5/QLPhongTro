# 🏠 QLPhongTro

> **Hệ thống quản lý nhà trọ, hóa đơn và thanh toán dành cho chủ trọ và người thuê.**

![Python](https://img.shields.io/badge/Python-Flask-blue)
![Database](https://img.shields.io/badge/Database-SQLite-green)
![Deployment](https://img.shields.io/badge/Deploy-Render-purple)
![Status](https://img.shields.io/badge/Status-Development-orange)

---

## 📖 Giới thiệu

**QLPhongTro** là một ứng dụng web quản lý nhà trọ được xây dựng nhằm đơn giản hóa việc tạo hóa đơn, theo dõi tiền phòng và quản lý trạng thái thanh toán.

Hệ thống được thiết kế cho mô hình nhà trọ nhỏ, trong đó:

- 👨‍💼 **Chủ trọ (Admin)** quản lý phòng và hóa đơn.
- 👤 **Người thuê** kiểm tra hóa đơn và thực hiện thanh toán.
- 💳 Hệ thống hỗ trợ tạo **VietQR** với số tiền và nội dung chuyển khoản tương ứng.
- 🔔 Hỗ trợ tích hợp **Telegram Bot** để gửi thông báo.
- 🔐 Website người thuê được bảo vệ bằng **Access Key**.

Project được phát triển chủ yếu nhằm mục đích **học tập, thực hành Backend/Web Development và sử dụng trong phạm vi gia đình**.

---

# ✨ Tính năng chính

## 👤 Người thuê

- 🔐 Truy cập website bằng **Access Key**
- 🏠 Xem danh sách phòng
- 🧾 Kiểm tra hóa đơn
- 🏠 Xem tiền phòng
- ⚡ Xem tiền điện
- 💧 Xem tiền nước
- 💰 Xem tổng số tiền cần thanh toán
- 💳 Thanh toán bằng VietQR
- 📝 QR tự động chứa số tiền và nội dung chuyển khoản
- 🔔 Báo **"Tôi đã chuyển khoản"**
- 🟡 Theo dõi trạng thái chờ xác nhận
- 🟢 Theo dõi trạng thái đã thanh toán
- 📱 Nhận thông báo Telegram

---

## 👨‍💼 Admin

Admin có khu vực quản lý riêng tại:

`/admin`

Các chức năng chính:

- 🔐 Đăng nhập Admin
- 📊 Dashboard quản lý
- 🏠 Quản lý danh sách phòng
- 🧾 Tạo và cập nhật hóa đơn
- 💵 Nhập tiền phòng
- ⚡ Nhập số điện
- 🧮 Tự động tính tiền điện
- 💧 Nhập tiền nước
- 💰 Tự động tính tổng hóa đơn
- ✏️ Chỉnh sửa hóa đơn
- 🔔 Theo dõi yêu cầu xác nhận thanh toán
- ✅ Xác nhận đã nhận tiền
- 🔄 Reset trạng thái thanh toán
- 📱 Nhận thông báo Telegram khi khách báo đã chuyển khoản

---

# 🧾 Hệ thống hóa đơn

Mỗi hóa đơn bao gồm:

| Khoản phí | Mô tả |
|---|---|
| 🏠 Tiền phòng | Tiền thuê phòng hàng tháng |
| ⚡ Tiền điện | Tính dựa trên số điện sử dụng |
| 💧 Tiền nước | Chi phí nước |
| 💰 Tổng cộng | Tổng toàn bộ khoản phí |

### ⚡ Tiền điện

Đơn giá hiện tại:

**4.000đ / số điện**

Ví dụ:

```text
100 số × 4.000đ = 400.000đ
```

Hệ thống tự động tính:

```text
Tiền phòng
     +
Tiền điện
     +
Tiền nước
     ↓
TỔNG HÓA ĐƠN
```

---

# 💳 Quy trình thanh toán

```text
┌─────────────────────┐
│     Người thuê      │
└──────────┬──────────┘
           │
           ▼
      🔐 Access Key
           │
           ▼
       🏠 Trang chủ
           │
           ▼
     🔎 Chọn phòng
           │
           ▼
     🧾 Xem hóa đơn
           │
           ▼
  💳 Tiếp tục thanh toán
           │
           ▼
       📱 VietQR
           │
           ▼
      Chuyển khoản
           │
           ▼
 "Tôi đã chuyển khoản"
           │
           ▼
       🟡 PENDING
           │
           ▼
   👨‍💼 Admin kiểm tra
           │
           ▼
      ✅ Xác nhận
           │
           ▼
        🟢 PAID
```

---

# 🚦 Trạng thái thanh toán

Hệ thống sử dụng 3 trạng thái chính:

### 🔴 UNPAID

> Hóa đơn chưa được thanh toán.

### 🟡 PENDING

> Người thuê đã báo chuyển khoản và đang chờ Admin kiểm tra.

### 🟢 PAID

> Admin đã xác nhận nhận được tiền.

Luồng trạng thái:

```text
🔴 UNPAID
    │
    │ Người thuê báo đã chuyển khoản
    ▼
🟡 PENDING
    │
    │ Admin xác nhận
    ▼
🟢 PAID
```

Admin có thể **Reset trạng thái** khi cần thiết.

---

# 📱 VietQR

QLPhongTro hỗ trợ tạo QR chuyển khoản với các thông tin:

- 🏦 Ngân hàng
- 💳 Số tài khoản
- 💰 Số tiền
- 📝 Nội dung chuyển khoản

Ví dụ:

```text
Số tiền:
2.550.000đ

Nội dung:
PHONG 1 THANH TOAN THANG 8
```

Người thuê chỉ cần quét QR bằng ứng dụng ngân hàng để thực hiện chuyển khoản.

> ⚠️ VietQR chỉ hỗ trợ tạo thông tin chuyển khoản. Hệ thống hiện tại chưa tự động xác minh giao dịch ngân hàng.

---

# 🤖 Telegram Notification

QLPhongTro hỗ trợ tích hợp **Telegram Bot API** để tự động gửi thông báo.

### Khi khách báo đã chuyển khoản

```text
👤 Người thuê
      │
      │ "Tôi đã chuyển khoản"
      ▼
🌐 QLPhongTro
      │
      ▼
🤖 Telegram Bot
      │
      ▼
📱 Admin
```

Ví dụ thông báo:

```text
🔔 QL PHÒNG TRỌ

Phòng 1 đã báo chuyển khoản.

💰 Tổng tiền: 2.550.000đ
🟡 Trạng thái: Chờ xác nhận
```

### Khi Admin cập nhật hóa đơn

```text
👨‍💼 Admin
      │
      │ Update Invoice
      ▼
🌐 QLPhongTro
      │
      ▼
🤖 Telegram Bot
      │
      ▼
📱 Người thuê
```

Telegram Notification có thể được sử dụng cho:

- 🧾 Hóa đơn mới
- ✏️ Hóa đơn được cập nhật
- 💳 Khách báo chuyển khoản
- ✅ Admin xác nhận thanh toán
- 🔄 Reset trạng thái

---

# 🔐 Access Key

Website dành cho người thuê được bảo vệ bằng một lớp **Access Key**.

```text
Truy cập website
        │
        ▼
   🔐 Access Key
        │
     ┌──┴──┐
     │     │
    Sai   Đúng
     │     │
     ▼     ▼
   ❌     🏠
       Trang chủ
```

Access Key không được lưu trực tiếp trong source code mà được lấy từ **Environment Variables**.

Điều này cho phép thay đổi Access Key trên server mà không cần sửa source code.

---

# 🔒 Admin Authentication

Khu vực Admin hoạt động độc lập với Access Key của người thuê.

```text
          /admin
             │
             ▼
      🔐 Admin Login
             │
             ▼
       📊 Dashboard
             │
       ┌─────┴─────┐
       ▼           ▼
   🏠 Phòng     🧾 Hóa đơn
       │           │
       └─────┬─────┘
             ▼
       💳 Thanh toán
```

---

# 🏗️ Kiến trúc hệ thống

```text
                     ┌─────────────────┐
                     │    👤 TENANT    │
                     └────────┬────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │   🔐 ACCESS     │
                     │      KEY        │
                     └────────┬────────┘
                              │
                              ▼
┌──────────────┐     ┌─────────────────┐
│ 👨‍💼 ADMIN   │────▶│   🌐 FLASK APP │
└──────────────┘     └────────┬────────┘
                              │
             ┌────────────────┼────────────────┐
             │                │                │
             ▼                ▼                ▼
      ┌────────────┐   ┌────────────┐   ┌─────────────┐
      │ 🗄️ SQLite │   │ 💳 VietQR  │   │ 🤖 Telegram│
      │  Database  │   │            │   │     API     │
      └────────────┘   └────────────┘   └─────────────┘
```

---

# 🛠️ Tech Stack

| Technology | Sử dụng |
|---|---|
| 🐍 **Python** | Backend |
| 🌶️ **Flask** | Web Framework |
| 🗄️ **SQLite** | Database |
| 🌐 **HTML5** | Frontend |
| 🎨 **CSS3** | Styling |
| ⚡ **JavaScript** | Client-side Interaction |
| 💳 **VietQR** | QR Payment |
| 🤖 **Telegram Bot API** | Notification |
| 🚀 **Gunicorn** | Production Server |
| ☁️ **Render** | Deployment |
| 🐙 **GitHub** | Version Control |

---

# 📂 Cấu trúc tổng quan

```text
QLPhongTro/
│
├── app.py
├── db.py
├── requirements.txt
├── .gitignore
│
├── static/
│   ├── css/
│   └── js/
│
└── templates/
    ├── index.html
    ├── access.html
    ├── payment.html
    ├── admin_login.html
    ├── admin.html
    └── ...
```

---

# 🔐 Environment Variables

Các thông tin nhạy cảm không được hard-code trực tiếp vào source code.

Project sử dụng các Environment Variables như:

```env
SITE_ACCESS_KEY=********

FLASK_SECRET_KEY=********

ADMIN_USERNAME=********
ADMIN_PASSWORD=********

TELEGRAM_BOT_TOKEN=********
TELEGRAM_BOT_USERNAME=********
ADMIN_TELEGRAM_CHAT_ID=********

APP_BASE_URL=********
```

> ⚠️ Các giá trị thật không được commit lên GitHub.

---

# 🛡️ Security

Một số biện pháp bảo vệ được sử dụng:

- 🔐 Access Key cho khu vực người thuê
- 🔐 Authentication riêng cho Admin
- 🔑 Secret được lưu bằng Environment Variables
- 🙈 `.env` được loại khỏi Git
- 🤖 Telegram Bot Token không public
- 🍪 Flask Session
- 🚫 Không lưu mật khẩu trực tiếp trong frontend

---

# 🗺️ Roadmap

### Core System

- [x] Quản lý 6 phòng
- [x] Admin Dashboard
- [x] Admin Login
- [x] Access Key
- [x] Quản lý hóa đơn
- [x] Tiền phòng
- [x] Tiền điện
- [x] Tiền nước
- [x] Tính tổng tự động

### Payment

- [x] VietQR
- [x] Nội dung chuyển khoản
- [x] UNPAID
- [x] PENDING
- [x] PAID
- [x] Admin xác nhận thanh toán
- [x] Reset trạng thái

### Notification

- [ ] Telegram Notification hoàn chỉnh
- [ ] Liên kết Telegram với từng phòng
- [ ] Thông báo hóa đơn mới
- [ ] Thông báo thanh toán
- [ ] Nhắc hóa đơn chưa thanh toán

### Future

- [ ] 📊 Thống kê doanh thu
- [ ] 📜 Lịch sử thanh toán
- [ ] 🏦 Tự động xác minh giao dịch ngân hàng
- [ ] 📈 Dashboard thống kê
- [ ] 🗄️ PostgreSQL
- [ ] 💾 Database Backup
- [ ] 👥 Multi-admin
- [ ] 🔑 Role-based Access Control
- [ ] 📧 Email Notification
- [ ] 🐳 Docker
- [ ] ⚙️ CI/CD

---

# 🎓 Mục đích Project

QLPhongTro đồng thời là project thực hành các kiến thức:

```text
Python
   ↓
Flask
   ↓
Routing
   ↓
Session / Authentication
   ↓
Database
   ↓
CRUD
   ↓
External API
   ↓
Telegram Bot
   ↓
Payment QR
   ↓
Git / GitHub
   ↓
Deployment
```

Qua project có thể thực hành cách xây dựng một ứng dụng web có:

**Frontend → Backend → Database → External API → Deployment**

---

# ⚠️ Disclaimer

> **QLPhongTro là project cá nhân phục vụ mục đích học tập, thử nghiệm và sử dụng trong phạm vi gia đình.**

Hệ thống hiện tại không phải một payment gateway và không tự động xác nhận rằng giao dịch ngân hàng đã thành công.

Việc xác nhận thanh toán cuối cùng vẫn được thực hiện bởi Admin.

Nếu triển khai ở quy mô lớn hoặc sử dụng cho mục đích thương mại, project cần được bổ sung thêm các cơ chế về:

- Authentication & Authorization
- Database Backup
- Transaction Verification
- Audit Logging
- Rate Limiting
- Monitoring
- Production Database
- Security Review

---

<div align="center">

### 🏠 QLPhongTro

**Manage • Invoice • Payment • Notification**

Made with Python & Flask

</div>
