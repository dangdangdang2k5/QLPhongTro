-- ====================================================================
-- QLPhongTro PRO - Initial Seed Data
-- ====================================================================

-- 1. SEED USERS
-- Password for admin: admin123
-- Password for tenants: phong123
INSERT INTO users (id, username, password_hash, full_name, phone, role) VALUES
(1, 'admin', '$2b$10$0Qhx6.UPSJKKkK5vSNdB2OITi9jwCDGSzP4KoUEHNd5DtOF92KJ3a', 'Chủ Nhà Quản Trị', '0942216511', 'ADMIN'),
(2, 'phong1', '$2b$10$IuxBHRNpA7aA4s2Uqufzfej7LY.nHQa95TdpH0eUbz2hUCs0lzhJS', 'Nguyễn Văn An (P1)', '0912345671', 'TENANT'),
(3, 'phong2', '$2b$10$IuxBHRNpA7aA4s2Uqufzfej7LY.nHQa95TdpH0eUbz2hUCs0lzhJS', 'Trần Thị Bình (P2)', '0912345672', 'TENANT'),
(4, 'phong3', '$2b$10$IuxBHRNpA7aA4s2Uqufzfej7LY.nHQa95TdpH0eUbz2hUCs0lzhJS', 'Lê Văn Cường (P3)', '0912345673', 'TENANT'),
(5, 'phong4', '$2b$10$IuxBHRNpA7aA4s2Uqufzfej7LY.nHQa95TdpH0eUbz2hUCs0lzhJS', 'Phạm Thị Dung (P4)', '0912345674', 'TENANT'),
(6, 'phong5', '$2b$10$IuxBHRNpA7aA4s2Uqufzfej7LY.nHQa95TdpH0eUbz2hUCs0lzhJS', 'Hoàng Văn Em (P5)', '0912345675', 'TENANT'),
(7, 'phong6', '$2b$10$IuxBHRNpA7aA4s2Uqufzfej7LY.nHQa95TdpH0eUbz2hUCs0lzhJS', 'Vũ Thị Phương (P6)', '0912345676', 'TENANT')
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);

-- 2. SEED ROOMS
INSERT INTO rooms (id, room_number, base_price, status, current_tenant_id) VALUES
(1, 'Phòng 1', 2000000.00, 'OCCUPIED', 2),
(2, 'Phòng 2', 2000000.00, 'OCCUPIED', 3),
(3, 'Phòng 3', 2000000.00, 'OCCUPIED', 4),
(4, 'Phòng 4', 2000000.00, 'OCCUPIED', 5),
(5, 'Phòng 5', 2000000.00, 'OCCUPIED', 6),
(6, 'Phòng 6', 2000000.00, 'OCCUPIED', 7)
ON DUPLICATE KEY UPDATE base_price=VALUES(base_price);

-- 3. SEED INVOICES (Kỳ 8/2026 và 11/2026 mẫu)
INSERT INTO invoices (
    id, invoice_code, room_id, payment_month, payment_year,
    room_fee, electricity_start, electricity_end, electricity_units, electricity_price, electricity_fee,
    water_fee, extra_fee, discount_amount, total_amount, status, due_date
) VALUES
(1, 'INV-202608-P1', 1, 8, 2026, 2000000.00, 100, 200, 100, 4000.00, 400000.00, 150000.00, 0.00, 0.00, 2550000.00, 'UNPAID', '2026-08-30'),
(2, 'INV-202608-P2', 2, 8, 2026, 2000000.00, 50, 120, 70, 4000.00, 280000.00, 150000.00, 0.00, 0.00, 2430000.00, 'PENDING', '2026-08-30'),
(3, 'INV-202608-P3', 3, 8, 2026, 2000000.00, 80, 140, 60, 4000.00, 240000.00, 150000.00, 0.00, 0.00, 2390000.00, 'PAID', '2026-08-30'),
(4, 'INV-202608-P4', 4, 8, 2026, 2000000.00, 110, 190, 80, 4000.00, 320000.00, 150000.00, 0.00, 0.00, 2470000.00, 'UNPAID', '2026-08-30'),
(5, 'INV-202608-P5', 5, 8, 2026, 2000000.00, 70, 135, 65, 4000.00, 260000.00, 150000.00, 0.00, 0.00, 2410000.00, 'UNPAID', '2026-08-30'),
(6, 'INV-202608-P6', 6, 8, 2026, 2000000.00, 90, 150, 60, 4000.00, 240000.00, 150000.00, 0.00, 0.00, 2390000.00, 'UNPAID', '2026-08-30')
ON DUPLICATE KEY UPDATE total_amount=VALUES(total_amount);

-- 4. SEED INVOICE ITEMS
INSERT INTO invoice_items (invoice_id, item_name, quantity, unit_price, amount) VALUES
(1, 'Tiền thuê phòng', 1.00, 2000000.00, 2000000.00),
(1, 'Tiền điện (100-200)', 100.00, 4000.00, 400000.00),
(1, 'Tiền nước', 1.00, 150000.00, 150000.00),

(2, 'Tiền thuê phòng', 1.00, 2000000.00, 2000000.00),
(2, 'Tiền điện (50-120)', 70.00, 4000.00, 280000.00),
(2, 'Tiền nước', 1.00, 150000.00, 150000.00),

(3, 'Tiền thuê phòng', 1.00, 2000000.00, 2000000.00),
(3, 'Tiền điện (80-140)', 60.00, 4000.00, 240000.00),
(3, 'Tiền nước', 1.00, 150000.00, 150000.00);

-- 5. SEED SAMPLE PAYMENTS
INSERT INTO payments (id, invoice_id, amount, payment_method, transaction_code, status, paid_at, confirmed_by, note) VALUES
(1, 2, 2430000.00, 'VIETQR_MB', 'MB_TXN_002', 'PENDING', NOW(), NULL, 'Khách thuê Phòng 2 đã xác nhận chuyển khoản'),
(2, 3, 2390000.00, 'VIETQR_MB', 'MB_TXN_003', 'CONFIRMED', NOW(), 1, 'Admin đã đối soát ngân hàng và xác nhận nhận đủ tiền')
ON DUPLICATE KEY UPDATE amount=VALUES(amount);
