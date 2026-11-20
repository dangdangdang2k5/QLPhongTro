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

## ☁️ Triển Khai Lên Render.com

1. **Tạo Web Service trên Render** kết nối với repository GitHub này.
2. Cấu hình các mục:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
3. Cung cấp các biến môi trường tại tab **Environment Variables**:
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (kết nối MySQL Cloud như Aiven, Clever Cloud hoặc Supabase)
   - `SESSION_SECRET`
   - `BANK_CODE`: `MB`
   - `BANK_ACCOUNT`: `0942216511`
   - `BANK_ACCOUNT_NAME`: `HOANG MINH DANG`
   - `TELEGRAM_BOT_TOKEN`, `ADMIN_TELEGRAM_CHAT_ID`, `APP_BASE_URL`
