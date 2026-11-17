const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { requireAuth, requireRoomOwnerOrAdmin } = require('../middlewares/authMiddleware');
const InvoiceController = require('../controllers/invoiceController');
const PaymentController = require('../controllers/paymentController');
const ReportController = require('../controllers/reportController');
const TelegramService = require('../services/telegramService');
const BillingService = require('../services/billingService');

/**
 * Trang chủ người thuê: xem danh sách các phòng với nút "Kiểm tra hóa đơn"
 */
router.get('/', requireAuth, async (req, res, next) => {
    try {
        const month = parseInt(process.env.PAYMENT_MONTH || 8, 10);
        const year = parseInt(process.env.PAYMENT_YEAR || 2026, 10);

        let query = `
            SELECT r.id, r.room_number, r.status as room_status,
                   COALESCE(i.total_amount, r.base_price) as amount,
                   COALESCE(i.status, 'UNPAID') as status,
                   i.id as invoice_id
            FROM rooms r
            LEFT JOIN invoices i ON i.room_id = r.id AND i.payment_month = ? AND i.payment_year = ?
        `;
        const params = [month, year];

        // Nếu là Tenant, ưu tiên hoặc lọc theo phòng của họ (nếu có gán phòng)
        if (req.session.user.role === 'TENANT' && req.session.user.roomId) {
            query += ' WHERE r.id = ?';
            params.push(req.session.user.roomId);
        }

        query += ' ORDER BY r.id ASC';

        const [rooms] = await pool.query(query, params);

        res.render('index', {
            title: 'Thu Tiền Phòng Trọ - QLPhongTro PRO',
            rooms,
            user: req.session.user,
            formatCurrency: BillingService.formatCurrency
        });
    } catch (err) {
        next(err);
    }
});

// Tra cứu hóa đơn
router.get('/invoice/:id', requireAuth, InvoiceController.getInvoiceDetail);
router.get('/invoice/:id/pdf', requireAuth, ReportController.exportInvoicePdf);

// Trang thanh toán VietQR
router.get('/payment/:roomId', requireAuth, requireRoomOwnerOrAdmin, PaymentController.showPaymentPage);
router.post('/payment/:invoiceId/confirm', requireAuth, PaymentController.confirmPayment);

/**
 * Endpoint Webhook Telegram Bot (Xử lý khi khách/chủ trọ gửi /start để lấy Chat ID)
 */
router.post('/telegram/webhook', async (req, res) => {
    try {
        const data = req.body || {};
        const message = data.message || data.edited_message;

        if (message && message.chat && message.chat.id) {
            const chatId = message.chat.id;
            const replyText = 
                `🏠 <b>QLPhongTro PRO Bot</b>\n\n` +
                `Kết nối thành công!\n\n` +
                `Chat ID của bạn:\n` +
                `<code>${chatId}</code>\n\n` +
                `<i>(Hãy copy số Chat ID này và dán vào ADMIN_TELEGRAM_CHAT_ID trong file .env hoặc trên Render nhé!)</i>`;

            await TelegramService.sendTelegramMessage(chatId, replyText);
        }
    } catch (err) {
        console.error('[Telegram Webhook Error]:', err.message);
    }
    res.status(200).json({ ok: true });
});

module.exports = router;
