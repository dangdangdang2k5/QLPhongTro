# 🏢 QLPhongTro PRO - Professional Room Management System

Hệ thống Quản lý và Thu tiền Phòng trọ Chuyên nghiệp, được xây dựng trên nền tảng **Node.js, Express.js và MySQL**, tích hợp thanh toán thông minh qua **VietQR MB Bank** và thông báo thời gian thực qua **Telegram Bot API**.

---

## 🚀 Tính Năng Nổi Bật

1. **Xác thực & Phân quyền (RBAC):**
   - **Admin:** Quản trị toàn diện phòng trọ, lập hóa đơn, duyệt thanh toán, xem báo cáo doanh thu & biểu đồ Chart.js.
   - **Tenant (Khách thuê):** Đăng nhập theo từng phòng, bảo mật dữ liệu tuyệt đối (không xem chéo phòng khác), xem chi tiết số điện/nước và thanh toán QR.
   - Mật khẩu được mã hóa an toàn bằng thuật toán **bcrypt**.

2. **Quản lý Hóa đơn & Tính toán Điện Nước Tự Động:**
   - Hỗ trợ ghi **chỉ số điện đầu kỳ và cuối kỳ**, tự động tính số ký điện tiêu thụ và thành tiền.
   - Công thức: `Tổng tiền = Tiền phòng + (Chỉ số cuối - Chỉ số đầu) × Giá điện + Tiền nước + Phụ phí - Giảm trừ`.
   - Backend tự động tính toán lại 100%, bảo đảm toàn vẹn tài chính.
   - Trạng thái hóa đơn: `UNPAID` (Chưa trả), `PENDING` (Chờ duyệt), `PAID` (Đã thanh toán), `OVERDUE` (Quá hạn).

3. **Thanh toán VietQR Động (MB Bank):**
   - Tự động sinh mã VietQR MB Bank theo số tài khoản `0942216511`, số tiền chính xác và cú pháp chuyển khoản tương ứng từng phòng.
   - Nút sao chép 1-click số tài khoản và nội dung chuyển khoản.

4. **Tự động hóa qua Telegram Bot API:**
   - Bot tự động gửi tin nhắn báo tiền về cho chủ trọ ngay khi khách bấm *"Tôi đã chuyển khoản"* kèm nút duyệt 1-click.
   - Tích hợp Webhook tự động nhận lệnh `/start` để lấy Chat ID nhanh chóng.

5. **Admin SaaS Dashboard & Xuất Hóa Đơn PDF:**
   - Dashboard trực quan với thẻ KPI (doanh thu, công nợ, số phòng đang thuê/trống).
   - Biểu đồ **Chart.js** thống kê doanh thu theo tháng và cơ cấu chi phí.
   - Hỗ trợ xuất file PDF hóa đơn bằng thư viện `pdfkit`.

---

## 🛠️ Công Nghệ Sử Dụng

- **Backend:** Node.js (v20+), Express.js, RESTful API
- **Database:** MySQL, `mysql2/promise` (Connection Pool & Prepared Statements)
- **Bảo mật:** `bcrypt`, `helmet`, `express-rate-limit`, `express-session`
- **Frontend:** HTML5, CSS3 Mobile-First, Vanilla JavaScript, Chart.js, EJS Templates
- **Báo cáo:** `pdfkit`
- **Tích hợp:** VietQR API, Telegram Bot API

---

## 📂 Cấu Trúc Dự Án

```text
QLPhongTro/
├── config/
│   └── database.js               # Kết nối MySQL Connection Pool
├── controllers/
│   ├── authController.js         # Xử lý đăng nhập Admin & Tenant
│   ├── roomController.js         # Quản lý danh sách phòng
│   ├── invoiceController.js      # Lập và quản lý hóa đơn
│   ├── paymentController.js      # Xử lý thanh toán VietQR & duyệt tiền
│   ├── dashboardController.js    # Số liệu KPI và biểu đồ Chart.js
│   └── reportController.js       # Xuất hóa đơn ra file PDF
├── services/
│   ├── billingService.js         # Thuật toán tính toán tài chính Backend
│   ├── vietqrService.js          # Sinh URL VietQR MB Bank
│   └── telegramService.js        # Gọi Telegram Bot API
├── routes/
│   ├── authRoutes.js
│   ├── adminRoutes.js
│   └── tenantRoutes.js
├── middlewares/
│   ├── authMiddleware.js         # Kiểm tra phiên đăng nhập & phân quyền
│   └── errorMiddleware.js        # Bắt lỗi tập trung
├── database/
│   ├── schema.sql                # 7 bảng quan hệ chuẩn hóa
│   ├── seed.sql                  # Dữ liệu khởi tạo mẫu
│   └── migrate.js                # Script chạy migration tự động
├── public/                       # CSS, JS, Assets
├── views/                        # Giao diện EJS Templates
├── tests/                        # Bộ kiểm thử tự động (Unit & Integration)
├── server.js                     # File khởi động chính Express
├── package.json
└── .env
```

---

## ⚡ Hướng Dẫn Cài Đặt & Chạy Cục Bộ (Local)

### 1. Chuẩn bị Cơ sở dữ liệu MySQL
- Mở **XAMPP Control Panel** và bấm **Start** tại mục **MySQL** (mặc định cổng `3306`, user `root`, không có mật khẩu).

### 2. Khởi tạo Cơ sở dữ liệu
Chạy lệnh tự động tạo database `qlphongtro`, 7 bảng dữ liệu và nạp dữ liệu mẫu:
```bash
npm run init-db
```

### 3. Chạy Kiểm Thử Hệ Thống
```bash
npm test
```

### 4. Khởi động Web Server
```bash
npm start
```
Truy cập website tại:
- **Trang Khách Thuê:** [http://localhost:3000/login](http://localhost:3000/login)
- **Trang Quản Trị Admin:** [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

---

## 🔑 Tài Khoản Mặc Định

| Vai trò | Tên đăng nhập | Mật khẩu | Mô tả |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Quản trị viên toàn quyền |
| **Khách Phòng 1** | `phong1` | `phong123` | Khách thuê Phòng 1 |
| **Khách Phòng 2** | `phong2` | `phong123` | Khách thuê Phòng 2 |
| **Khách Phòng 3** | `phong3` | `phong123` | Khách thuê Phòng 3 |
| *(Tương tự)* | `phong4` .. `phong6` | `phong123` | Các phòng còn lại |

---

## 🖥️ Triển Khai Trên Máy Chủ Cloud VPS (Ubuntu Linux & Nginx)

1. **Kết nối SSH vào máy chủ VPS**:
   ```bash
   ssh -i ~/.ssh/oracle_vps ubuntu@129.221.157.112
   ```

2. **Cài đặt môi trường cần thiết**:
   ```bash
   # Cài đặt Node.js v20 LTS và MySQL Server 8.0
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs mysql-server nginx
   ```

3. **Tải mã nguồn và cài đặt thư viện**:
   ```bash
   sudo git clone https://github.com/dangdangdang2k5/QLPhongTro.git /opt/phongtro
   cd /opt/phongtro
   npm install --omit=dev
   ```

4. **Cấu hình biến môi trường (`/opt/phongtro/.env`)**:
   ```env
   PORT=5000
   NODE_ENV=production
   SESSION_SECRET=dev-secret-key-12345
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=phongtro_user
   DB_PASSWORD=PhongTro@2026!Secure
   DB_NAME=qlphongtro
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=admin123
   TELEGRAM_BOT_TOKEN=8510620043:AAHgBjWjU4Gb7oLZRbhhOE8a9QGXNWd6O4g
   TELEGRAM_BOT_USERNAME=PhongTroMH_bot
   ADMIN_TELEGRAM_CHAT_ID=7387114957
   APP_BASE_URL=http://quanliphongtro.duckdns.org
   BANK_CODE=MB
   BANK_NAME=MB Bank
   BANK_ACCOUNT=0942216511
   BANK_ACCOUNT_NAME=HOANG MINH DANG
   PAYMENT_MONTH=11
   PAYMENT_YEAR=2026
   ```

5. **Khởi tạo cơ sở dữ liệu MySQL**:
   ```bash
   npm run init-db
   ```

6. **Quản lý dịch vụ tự động với Systemd (`/etc/systemd/system/phongtro.service`)**:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable phongtro
   sudo systemctl restart phongtro
   ```

7. **Cấu hình Nginx Reverse Proxy (Cổng 80 -> Cổng 5000)**:
   - Gán tên miền chính thức: **`http://quanliphongtro.duckdns.org/`**
   - Nginx nhận request công khai và chuyển tiếp nội bộ về ứng dụng Node.js.
