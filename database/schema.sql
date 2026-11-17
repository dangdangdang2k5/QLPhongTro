-- ====================================================================
-- QLPhongTro PRO - MySQL Relational Database Schema
-- Standard: InnoDB, utf8mb4, Strict Constraints, Foreign Keys & Indexes
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS invoice_items;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. USERS: Quản lý tài khoản Admin và Tenant (Khách thuê)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NULL,
    role ENUM('ADMIN', 'TENANT') NOT NULL DEFAULT 'TENANT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_role (role),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. ROOMS: Danh sách phòng trọ linh hoạt (không hard-code 6 phòng)
CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(50) NOT NULL UNIQUE,
    base_price DECIMAL(12, 2) NOT NULL DEFAULT 2000000.00,
    status ENUM('VACANT', 'OCCUPIED', 'MAINTENANCE') NOT NULL DEFAULT 'OCCUPIED',
    current_tenant_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (current_tenant_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_room_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. INVOICES: Quản lý kỳ hóa đơn theo từng phòng
CREATE TABLE invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_code VARCHAR(50) NOT NULL UNIQUE,
    room_id INT NOT NULL,
    payment_month INT NOT NULL,
    payment_year INT NOT NULL,
    room_fee DECIMAL(12, 2) NOT NULL DEFAULT 2000000.00,
    electricity_start INT NOT NULL DEFAULT 0,
    electricity_end INT NOT NULL DEFAULT 0,
    electricity_units INT NOT NULL DEFAULT 0,
    electricity_price DECIMAL(10, 2) NOT NULL DEFAULT 4000.00,
    electricity_fee DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    water_fee DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    extra_fee DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 2000000.00,
    status ENUM('UNPAID', 'PENDING', 'PAID', 'OVERDUE') NOT NULL DEFAULT 'UNPAID',
    due_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT,
    UNIQUE KEY uk_room_period (room_id, payment_month, payment_year),
    INDEX idx_invoice_status (status),
    INDEX idx_invoice_period (payment_year, payment_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. INVOICE_ITEMS: Bảng kê chi tiết từng dòng phí trong hóa đơn
CREATE TABLE invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
    unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    INDEX idx_item_invoice (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. PAYMENTS: Lịch sử xác nhận và giao dịch thanh toán
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'VIETQR_MB',
    transaction_code VARCHAR(100) NULL,
    status ENUM('PENDING', 'CONFIRMED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    paid_at TIMESTAMP NULL,
    confirmed_by INT NULL,
    note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_payment_invoice (invoice_id),
    INDEX idx_payment_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. NOTIFICATIONS: Lịch sử gửi thông báo Telegram
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NULL,
    channel VARCHAR(50) NOT NULL DEFAULT 'TELEGRAM',
    recipient VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('SENT', 'FAILED') NOT NULL DEFAULT 'SENT',
    error_log TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
    INDEX idx_notif_invoice (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. AUDIT_LOGS: Nhật ký thao tác hệ thống (Audit Trail)
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    details JSON NULL,
    ip_address VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
