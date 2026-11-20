-- ====================================================================
-- QLPhongTro PRO - Initial Seed Data (Kỳ hiện tại: Tháng 11/2026)
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

-- 3. SEED INVOICES (Lịch sử Tháng 9/2026, 10/2026 và Kỳ Hiện Tại Tháng 11/2026)
INSERT INTO invoices (
    id, invoice_code, room_id, payment_month, payment_year,
    room_fee, electricity_start, electricity_end, electricity_units, electricity_price, electricity_fee,
    water_fee, extra_fee, discount_amount, total_amount, status, due_date
) VALUES
-- Lịch sử Tháng 9/2026 (Đã thu xong)
(101, 'INV-202609-P1', 1, 9, 2026, 2000000.00, 80, 160, 80, 4000.00, 320000.00, 150000.00, 0.00, 0.00, 2470000.00, 'PAID', '2026-09-30'),
(102, 'INV-202609-P2', 2, 9, 2026, 2000000.00, 40, 100, 60, 4000.00, 240000.00, 150000.00, 0.00, 0.00, 2390000.00, 'PAID', '2026-09-30'),
(103, 'INV-202609-P3', 3, 9, 2026, 2000000.00, 60, 120, 60, 4000.00, 240000.00, 150000.00, 0.00, 0.00, 2390000.00, 'PAID', '2026-09-30'),
(104, 'INV-202609-P4', 4, 9, 2026, 2000000.00, 90, 165, 75, 4000.00, 300000.00, 150000.00, 0.00, 0.00, 2450000.00, 'PAID', '2026-09-30'),
(105, 'INV-202609-P5', 5, 9, 2026, 2000000.00, 50, 110, 60, 4000.00, 240000.00, 150000.00, 0.00, 0.00, 2390000.00, 'PAID', '2026-09-30'),
(106, 'INV-202609-P6', 6, 9, 2026, 2000000.00, 70, 130, 60, 4000.00, 240000.00, 150000.00, 0.00, 0.00, 2390000.00, 'PAID', '2026-09-30'),

-- Lịch sử Tháng 10/2026 (Đã thu xong)
(201, 'INV-202610-P1', 1, 10, 2026, 2000000.00, 160, 250, 90, 4000.00, 360000.00, 150000.00, 0.00, 0.00, 2510000.00, 'PAID', '2026-10-31'),
(202, 'INV-202610-P2', 2, 10, 2026, 2000000.00, 100, 170, 70, 4000.00, 280000.00, 150000.00, 0.00, 0.00, 2430000.00, 'PAID', '2026-10-31'),
(203, 'INV-202610-P3', 3, 10, 2026, 2000000.00, 120, 185, 65, 4000.00, 260000.00, 150000.00, 0.00, 0.00, 2410000.00, 'PAID', '2026-10-31'),
(204, 'INV-202610-P4', 4, 10, 2026, 2000000.00, 165, 250, 85, 4000.00, 340000.00, 150000.00, 0.00, 0.00, 2490000.00, 'PAID', '2026-10-31'),
(205, 'INV-202610-P5', 5, 10, 2026, 2000000.00, 110, 180, 70, 4000.00, 280000.00, 150000.00, 0.00, 0.00, 2430000.00, 'PAID', '2026-10-31'),
(206, 'INV-202610-P6', 6, 10, 2026, 2000000.00, 130, 200, 70, 4000.00, 280000.00, 150000.00, 0.00, 0.00, 2430000.00, 'PAID', '2026-10-31'),

-- Kỳ Hiện Tại Tháng 11/2026
(1, 'INV-202611-P1', 1, 11, 2026, 2000000.00, 250, 350, 100, 4000.00, 400000.00, 150000.00, 0.00, 0.00, 2550000.00, 'UNPAID', '2026-11-30'),
(2, 'INV-202611-P2', 2, 11, 2026, 2000000.00, 170, 240, 70, 4000.00, 280000.00, 150000.00, 0.00, 0.00, 2430000.00, 'PENDING', '2026-11-30'),
(3, 'INV-202611-P3', 3, 11, 2026, 2000000.00, 185, 245, 60, 4000.00, 240000.00, 150000.00, 0.00, 0.00, 2390000.00, 'PAID', '2026-11-30'),
(4, 'INV-202611-P4', 4, 11, 2026, 2000000.00, 250, 330, 80, 4000.00, 320000.00, 150000.00, 0.00, 0.00, 2470000.00, 'UNPAID', '2026-11-30'),
(5, 'INV-202611-P5', 5, 11, 2026, 2000000.00, 180, 245, 65, 4000.00, 260000.00, 150000.00, 0.00, 0.00, 2410000.00, 'UNPAID', '2026-11-30'),
(6, 'INV-202611-P6', 6, 11, 2026, 2000000.00, 200, 260, 60, 4000.00, 240000.00, 150000.00, 0.00, 0.00, 2390000.00, 'OVERDUE', '2026-11-15')
ON DUPLICATE KEY UPDATE total_amount=VALUES(total_amount);

-- 4. SEED INVOICE ITEMS (Tháng 11/2026)
INSERT INTO invoice_items (invoice_id, item_name, quantity, unit_price, amount) VALUES
(1, 'Tiền thuê phòng', 1.00, 2000000.00, 2000000.00),
(1, 'Tiền điện (250-350)', 100.00, 4000.00, 400000.00),
(1, 'Tiền nước', 1.00, 150000.00, 150000.00),

(2, 'Tiền thuê phòng', 1.00, 2000000.00, 2000000.00),
(2, 'Tiền điện (170-240)', 70.00, 4000.00, 280000.00),
(2, 'Tiền nước', 1.00, 150000.00, 150000.00),

(3, 'Tiền thuê phòng', 1.00, 2000000.00, 2000000.00),
(3, 'Tiền điện (185-245)', 60.00, 4000.00, 240000.00),
(3, 'Tiền nước', 1.00, 150000.00, 150000.00),

(4, 'Tiền thuê phòng', 1.00, 2000000.00, 2000000.00),
(4, 'Tiền điện (250-330)', 80.00, 4000.00, 320000.00),
(4, 'Tiền nước', 1.00, 150000.00, 150000.00),

(5, 'Tiền thuê phòng', 1.00, 2000000.00, 2000000.00),
(5, 'Tiền điện (180-245)', 65.00, 4000.00, 260000.00),
(5, 'Tiền nước', 1.00, 150000.00, 150000.00),

(6, 'Tiền thuê phòng', 1.00, 2000000.00, 2000000.00),
(6, 'Tiền điện (200-260)', 60.00, 4000.00, 240000.00),
(6, 'Tiền nước', 1.00, 150000.00, 150000.00);

-- 5. SEED SAMPLE PAYMENTS
INSERT INTO payments (id, invoice_id, amount, payment_method, transaction_code, status, paid_at, confirmed_by, note) VALUES
(1, 2, 2430000.00, 'VIETQR_MB', 'MB_TXN_NOV002', 'PENDING', '2026-11-20 10:15:00', NULL, 'Khách thuê Phòng 2 đã xác nhận chuyển khoản'),
(2, 3, 2390000.00, 'VIETQR_MB', 'MB_TXN_NOV003', 'CONFIRMED', '2026-11-18 14:20:00', 1, 'Admin đã đối soát ngân hàng và xác nhận nhận đủ tiền')
ON DUPLICATE KEY UPDATE amount=VALUES(amount);
