const { pool } = require('../config/database');
const BillingService = require('../services/billingService');

class InvoiceController {
    /**
     * Danh sách hóa đơn (Admin View - Tìm kiếm & Lọc nâng cao)
     */
    static async listInvoices(req, res, next) {
        try {
            const { room_id, month, year, status } = req.query;

            let query = `
                SELECT i.*, r.room_number, u.full_name as tenant_name
                FROM invoices i
                JOIN rooms r ON i.room_id = r.id
                LEFT JOIN users u ON r.current_tenant_id = u.id
                WHERE 1=1
            `;
            const params = [];

            if (room_id) {
                query += ' AND i.room_id = ?';
                params.push(parseInt(room_id, 10));
            }
            if (month) {
                query += ' AND i.payment_month = ?';
                params.push(parseInt(month, 10));
            }
            if (year) {
                query += ' AND i.payment_year = ?';
                params.push(parseInt(year, 10));
            }
            if (status) {
                query += ' AND i.status = ?';
                params.push(status);
            }

            query += ' ORDER BY i.payment_year DESC, i.payment_month DESC, r.id ASC';

            const [invoices] = await pool.query(query, params);
            const [rooms] = await pool.query('SELECT id, room_number FROM rooms ORDER BY id ASC');

            res.render('admin_invoices', {
                title: 'Quản Lý Hóa Đơn - QLPhongTro PRO',
                invoices,
                rooms,
                filters: req.query,
                user: req.session.user,
                formatCurrency: BillingService.formatCurrency
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Chi tiết hóa đơn (Cho Tenant tra cứu hoặc Admin xem)
     */
    static async getInvoiceDetail(req, res, next) {
        try {
            const invoiceId = parseInt(req.params.id, 10);
            const [invoices] = await pool.query(`
                SELECT i.*, r.room_number, u.full_name as tenant_name, u.phone as tenant_phone
                FROM invoices i
                JOIN rooms r ON i.room_id = r.id
                LEFT JOIN users u ON r.current_tenant_id = u.id
                WHERE i.id = ?
            `, [invoiceId]);

            if (invoices.length === 0) {
                return res.status(404).render('error', { message: 'Không tìm thấy hóa đơn yêu cầu.' });
            }

            const invoice = invoices[0];

            // Bảo mật: Tenant chỉ được xem hóa đơn phòng của mình
            if (req.session.user.role === 'TENANT') {
                if (req.session.user.roomId && req.session.user.roomId !== invoice.room_id) {
                    return res.status(403).render('error', { message: 'Bạn không có quyền xem hóa đơn của phòng khác.' });
                }
            }

            const [items] = await pool.query('SELECT * FROM invoice_items WHERE invoice_id = ?', [invoiceId]);

            res.render('invoice_detail', {
                title: `Chi Tiết Hóa Đơn - ${invoice.room_number}`,
                invoice,
                items,
                user: req.session.user,
                formatCurrency: BillingService.formatCurrency
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Hiển thị trang form tạo hoặc sửa hóa đơn (Admin)
     */
    static async showEditInvoiceForm(req, res, next) {
        try {
            const roomId = parseInt(req.params.roomId, 10);
            const now = new Date();
            const month = parseInt(req.query.month || process.env.PAYMENT_MONTH || (now.getMonth() + 1), 10);
            const year = parseInt(req.query.year || process.env.PAYMENT_YEAR || now.getFullYear(), 10);

            const [rooms] = await pool.query('SELECT * FROM rooms WHERE id = ?', [roomId]);
            if (rooms.length === 0) {
                return res.status(404).render('error', { message: 'Không tìm thấy phòng.' });
            }
            const room = rooms[0];

            let [invoices] = await pool.query(
                'SELECT * FROM invoices WHERE room_id = ? AND payment_month = ? AND payment_year = ?',
                [roomId, month, year]
            );

            let invoice = invoices[0] || null;

            res.render('admin_invoice_edit', {
                title: `Cập Nhật Hóa Đơn - ${room.room_number}`,
                room,
                invoice,
                month,
                year,
                user: req.session.user,
                formatCurrency: BillingService.formatCurrency
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Lưu/Cập nhật hóa đơn với Transaction an toàn và tính toán Backend
     */
    static async saveInvoice(req, res, next) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const roomId = parseInt(req.params.roomId, 10);
            const { month, year, room_fee, electricity_start, electricity_end, electricity_price, water_fee, extra_fee, discount_amount, status, due_date } = req.body;

            const paymentMonth = parseInt(month, 10);
            const paymentYear = parseInt(year, 10);

            // Backend tự động tính toán chính xác 100%
            const calc = BillingService.calculateInvoice({
                room_fee,
                electricity_start,
                electricity_end,
                electricity_price,
                water_fee,
                extra_fee,
                discount_amount
            });

            const invoiceCode = BillingService.generateInvoiceCode(roomId, paymentMonth, paymentYear);
            const validStatus = ['UNPAID', 'PENDING', 'PAID', 'OVERDUE'].includes(status) ? status : 'UNPAID';

            // Kiểm tra xem hóa đơn tháng này đã tồn tại chưa
            const [existing] = await conn.query(
                'SELECT id FROM invoices WHERE room_id = ? AND payment_month = ? AND payment_year = ?',
                [roomId, paymentMonth, paymentYear]
            );

            let invoiceId;
            if (existing.length > 0) {
                invoiceId = existing[0].id;
                await conn.query(`
                    UPDATE invoices SET
                        room_fee = ?,
                        electricity_start = ?,
                        electricity_end = ?,
                        electricity_units = ?,
                        electricity_price = ?,
                        electricity_fee = ?,
                        water_fee = ?,
                        extra_fee = ?,
                        discount_amount = ?,
                        total_amount = ?,
                        status = ?,
                        due_date = ?,
                        updated_at = NOW()
                    WHERE id = ?
                `, [
                    calc.roomFee, calc.electricityStart, calc.electricityEnd, calc.electricityUnits,
                    calc.electricityPrice, calc.electricityFee, calc.waterFee, calc.extraFee,
                    calc.discountAmount, calc.totalAmount, validStatus, due_date || null, invoiceId
                ]);
            } else {
                const [result] = await conn.query(`
                    INSERT INTO invoices (
                        invoice_code, room_id, payment_month, payment_year,
                        room_fee, electricity_start, electricity_end, electricity_units, electricity_price, electricity_fee,
                        water_fee, extra_fee, discount_amount, total_amount, status, due_date
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    invoiceCode, roomId, paymentMonth, paymentYear,
                    calc.roomFee, calc.electricityStart, calc.electricityEnd, calc.electricityUnits,
                    calc.electricityPrice, calc.electricityFee, calc.waterFee, calc.extraFee,
                    calc.discountAmount, calc.totalAmount, validStatus, due_date || null
                ]);
                invoiceId = result.insertId;
            }

            // Đồng bộ lại bảng invoice_items chi tiết
            await conn.query('DELETE FROM invoice_items WHERE invoice_id = ?', [invoiceId]);
            await conn.query(`
                INSERT INTO invoice_items (invoice_id, item_name, quantity, unit_price, amount) VALUES
                (?, 'Tiền thuê phòng', 1.00, ?, ?),
                (?, ?, ?, ?, ?),
                (?, 'Tiền nước sinh hoạt', 1.00, ?, ?)
            `, [
                invoiceId, calc.roomFee, calc.roomFee,
                invoiceId, `Tiền điện (${calc.electricityStart} - ${calc.electricityEnd})`, calc.electricityUnits, calc.electricityPrice, calc.electricityFee,
                invoiceId, calc.waterFee, calc.waterFee
            ]);

            await conn.query(
                'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
                [req.session.user.id, 'SAVE_INVOICE', JSON.stringify({ invoiceId, roomId, totalAmount: calc.totalAmount }), req.ip]
            );

            await conn.commit();
            res.redirect('/admin/dashboard');
        } catch (err) {
            await conn.rollback();
            next(err);
        } finally {
            conn.release();
        }
    }

    /**
     * Chuyển đổi trạng thái hóa đơn nhanh (1-click switcher)
     */
    static async setInvoiceStatus(req, res, next) {
        try {
            const invoiceId = parseInt(req.params.id, 10);
            const { status } = req.body;
            if (!['UNPAID', 'PENDING', 'PAID', 'OVERDUE'].includes(status)) {
                return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ.' });
            }

            await pool.query('UPDATE invoices SET status = ?, updated_at = NOW() WHERE id = ?', [status, invoiceId]);

            await pool.query(
                'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
                [req.session.user.id, 'CHANGE_INVOICE_STATUS', JSON.stringify({ invoiceId, status }), req.ip]
            );

            res.redirect('/admin/dashboard');
        } catch (err) {
            next(err);
        }
    }
}

module.exports = InvoiceController;
