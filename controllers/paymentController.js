const { pool } = require('../config/database');
const VietQRService = require('../services/vietqrService');
const TelegramService = require('../services/telegramService');
const BillingService = require('../services/billingService');

class PaymentController {
    /**
     * Trang thanh toán VietQR cho từng phòng/hóa đơn
     */
    static async showPaymentPage(req, res, next) {
        try {
            const roomId = parseInt(req.params.roomId, 10);
            const month = parseInt(process.env.PAYMENT_MONTH || 8, 10);
            const year = parseInt(process.env.PAYMENT_YEAR || 2026, 10);

            const [invoices] = await pool.query(`
                SELECT i.*, r.room_number 
                FROM invoices i
                JOIN rooms r ON i.room_id = r.id
                WHERE i.room_id = ? AND i.payment_month = ? AND i.payment_year = ?
            `, [roomId, month, year]);

            if (invoices.length === 0) {
                return res.status(404).render('error', { message: 'Chưa có hóa đơn cho phòng này trong kỳ hiện tại.' });
            }

            const invoice = invoices[0];

            // Bảo mật: Tenant chỉ thanh toán phòng mình
            if (req.session.user && req.session.user.role === 'TENANT') {
                if (req.session.user.roomId && req.session.user.roomId !== invoice.room_id) {
                    return res.status(403).render('error', { message: 'Bạn không có quyền truy cập thanh toán của phòng khác.' });
                }
            }

            const transferContent = `TIEN PHONG ${invoice.room_id} THANG ${invoice.payment_month}/${invoice.payment_year}`;
            const qrUrl = VietQRService.generateQrUrl({
                amount: invoice.total_amount,
                transferContent
            });
            const bankConfig = VietQRService.getBankConfig();

            res.render('payment', {
                title: `Thanh Toán - ${invoice.room_number}`,
                invoice,
                qrUrl,
                bankConfig,
                transferContent,
                user: req.session.user,
                formatCurrency: BillingService.formatCurrency
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Tenant nhấn "Tôi đã chuyển khoản" -> Đổi sang PENDING và báo Telegram
     */
    static async confirmPayment(req, res, next) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const invoiceId = parseInt(req.params.invoiceId, 10);
            const [invoices] = await conn.query(`
                SELECT i.*, r.room_number 
                FROM invoices i
                JOIN rooms r ON i.room_id = r.id
                WHERE i.id = ?
            `, [invoiceId]);

            if (invoices.length === 0) {
                return res.status(404).render('error', { message: 'Hóa đơn không tồn tại.' });
            }

            const invoice = invoices[0];

            if (invoice.status === 'UNPAID') {
                // 1. Cập nhật trạng thái hóa đơn sang PENDING
                await conn.query('UPDATE invoices SET status = "PENDING", updated_at = NOW() WHERE id = ?', [invoiceId]);

                // 2. Lưu vào bảng payments
                await conn.query(`
                    INSERT INTO payments (invoice_id, amount, payment_method, status, paid_at, note)
                    VALUES (?, ?, 'VIETQR_MB', 'PENDING', NOW(), ?)
                `, [invoiceId, invoice.total_amount, 'Khách thuê xác nhận đã chuyển khoản thành công']);

                // 3. Gửi thông báo Telegram tức thì cho Admin
                const adminChatId = process.env.ADMIN_TELEGRAM_CHAT_ID;
                if (adminChatId) {
                    const formattedAmount = BillingService.formatCurrency(invoice.total_amount);
                    const transferMsg = `TIEN PHONG ${invoice.room_id} THANG ${invoice.payment_month}/${invoice.payment_year}`;
                    const appUrl = (process.env.APP_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
                    const adminDashboardUrl = `${appUrl}/admin/dashboard`;

                    const tgMessage = 
                        `🔔 <b>THÔNG BÁO CHUYỂN KHOẢN MỚI (QLPhongTro PRO)</b>\n\n` +
                        `🏠 <b>Phòng:</b> ${invoice.room_number}\n` +
                        `💰 <b>Số tiền:</b> ${formattedAmount}\n` +
                        `📅 <b>Kỳ:</b> Tháng ${invoice.payment_month}/${invoice.payment_year}\n` +
                        `📝 <b>Nội dung CK:</b> <code>${transferMsg}</code>\n\n` +
                        `⚡ <i>Khách thuê đã bấm 'Tôi đã chuyển khoản'. Vui lòng kiểm tra tài khoản MB Bank và duyệt thanh toán!</i>`;

                    await TelegramService.sendTelegramMessageWithButton(
                        adminChatId,
                        tgMessage,
                        '🔍 Mở Dashboard Duyệt',
                        adminDashboardUrl
                    );
                }
            }

            await conn.commit();
            res.redirect(`/payment/${invoice.room_id}`);
        } catch (err) {
            await conn.rollback();
            next(err);
        } finally {
            conn.release();
        }
    }

    /**
     * Admin duyệt thanh toán -> chuyển sang PAID
     */
    static async approvePayment(req, res, next) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const invoiceId = parseInt(req.params.invoiceId, 10);
            await conn.query('UPDATE invoices SET status = "PAID", updated_at = NOW() WHERE id = ?', [invoiceId]);

            await conn.query(`
                UPDATE payments 
                SET status = 'CONFIRMED', confirmed_by = ?, updated_at = NOW() 
                WHERE invoice_id = ? AND status = 'PENDING'
            `, [req.session.user.id, invoiceId]);

            await conn.query(
                'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
                [req.session.user.id, 'APPROVE_PAYMENT', JSON.stringify({ invoiceId }), req.ip]
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
     * Admin reset trạng thái về UNPAID
     */
    static async resetPayment(req, res, next) {
        try {
            const invoiceId = parseInt(req.params.invoiceId, 10);
            await pool.query('UPDATE invoices SET status = "UNPAID", updated_at = NOW() WHERE id = ?', [invoiceId]);

            await pool.query(
                'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
                [req.session.user.id, 'RESET_PAYMENT', JSON.stringify({ invoiceId }), req.ip]
            );

            res.redirect('/admin/dashboard');
        } catch (err) {
            next(err);
        }
    }
}

module.exports = PaymentController;
