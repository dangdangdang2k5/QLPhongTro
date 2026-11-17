const { pool } = require('../config/database');
const BillingService = require('../services/billingService');
const TelegramService = require('../services/telegramService');

class DashboardController {
    /**
     * Admin Dashboard - Modern SaaS View with KPIs, Chart.js, Quick Status Switcher
     */
    static async showDashboard(req, res, next) {
        try {
            const currentMonth = parseInt(process.env.PAYMENT_MONTH || 8, 10);
            const currentYear = parseInt(process.env.PAYMENT_YEAR || 2026, 10);

            // 1. Thống kê KPI phòng
            const [[roomStats]] = await pool.query(`
                SELECT 
                    COUNT(*) as total_rooms,
                    SUM(CASE WHEN status = 'OCCUPIED' THEN 1 ELSE 0 END) as occupied_rooms,
                    SUM(CASE WHEN status = 'VACANT' THEN 1 ELSE 0 END) as vacant_rooms,
                    SUM(CASE WHEN status = 'MAINTENANCE' THEN 1 ELSE 0 END) as maintenance_rooms
                FROM rooms
            `);

            // 2. Thống kê KPI tài chính tháng hiện tại
            const [[invoiceStats]] = await pool.query(`
                SELECT 
                    COUNT(*) as total_invoices,
                    COALESCE(SUM(CASE WHEN status = 'PAID' THEN total_amount ELSE 0 END), 0) as total_collected,
                    COALESCE(SUM(CASE WHEN status IN ('UNPAID', 'PENDING', 'OVERDUE') THEN total_amount ELSE 0 END), 0) as total_uncollected,
                    SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_count,
                    SUM(CASE WHEN status = 'OVERDUE' THEN 1 ELSE 0 END) as overdue_count
                FROM invoices
                WHERE payment_month = ? AND payment_year = ?
            `, [currentMonth, currentYear]);

            // 3. Danh sách các phòng và hóa đơn tháng hiện tại
            const [roomsWithInvoices] = await pool.query(`
                SELECT r.id as room_id, r.room_number, r.base_price, r.status as room_status,
                       i.id as invoice_id, i.room_fee, i.electricity_units, i.electricity_price,
                       i.electricity_fee, i.water_fee, i.total_amount, i.status as invoice_status
                FROM rooms r
                LEFT JOIN invoices i ON i.room_id = r.id AND i.payment_month = ? AND i.payment_year = ?
                ORDER BY r.id ASC
            `, [currentMonth, currentYear]);

            // 4. Dữ liệu biểu đồ doanh thu theo 6 tháng gần nhất
            const [monthlyRevenue] = await pool.query(`
                SELECT payment_month, payment_year, 
                       COALESCE(SUM(CASE WHEN status = 'PAID' THEN total_amount ELSE 0 END), 0) as revenue
                FROM invoices
                GROUP BY payment_year, payment_month
                ORDER BY payment_year ASC, payment_month ASC
                LIMIT 6
            `);

            // 5. Thống kê cơ cấu phí (Tiền phòng, điện, nước)
            const [[feeBreakdown]] = await pool.query(`
                SELECT 
                    COALESCE(SUM(room_fee), 0) as total_room_fee,
                    COALESCE(SUM(electricity_fee), 0) as total_electricity_fee,
                    COALESCE(SUM(water_fee), 0) as total_water_fee
                FROM invoices
                WHERE payment_month = ? AND payment_year = ?
            `, [currentMonth, currentYear]);

            res.render('admin_dashboard', {
                title: 'Admin Dashboard - QLPhongTro PRO',
                user: req.session.user,
                currentMonth,
                currentYear,
                roomStats,
                invoiceStats,
                rooms: roomsWithInvoices,
                monthlyRevenue: JSON.stringify(monthlyRevenue),
                feeBreakdown: JSON.stringify(feeBreakdown),
                formatCurrency: BillingService.formatCurrency,
                tg_status: req.query.tg_status || null
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Test kết nối Telegram Bot từ Dashboard
     */
    static async testTelegram(req, res, next) {
        try {
            const adminChatId = process.env.ADMIN_TELEGRAM_CHAT_ID;
            if (!adminChatId) {
                return res.redirect('/admin/dashboard?tg_status=no_chat_id');
            }

            const appUrl = (process.env.APP_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
            const testMsg = 
                `🔔 <b>QLPhongTro PRO - TEST KẾT NỐI</b>\n\n` +
                `🎉 <b>Telegram Bot đã kết nối thành công!</b>\n` +
                `Hệ thống sẽ tự động thông báo ngay khi có khách thuê gửi yêu cầu xác nhận chuyển khoản.`;

            const success = await TelegramService.sendTelegramMessageWithButton(
                adminChatId,
                testMsg,
                '🏠 Mở Dashboard Quản Trị',
                `${appUrl}/admin/dashboard`
            );

            res.redirect(`/admin/dashboard?tg_status=${success ? 'success' : 'failed'}`);
        } catch (err) {
            next(err);
        }
    }

    /**
     * Kích hoạt Telegram Webhook
     */
    static async setTelegramWebhook(req, res, next) {
        try {
            const appUrl = (process.env.APP_BASE_URL || '').replace(/\/$/, '');
            if (!appUrl) {
                return res.redirect('/admin/dashboard?tg_status=no_app_url');
            }

            const webhookUrl = `${appUrl}/telegram/webhook`;
            const success = await TelegramService.setWebhook(webhookUrl);
            res.redirect(`/admin/dashboard?tg_status=${success ? 'webhook_success' : 'webhook_failed'}`);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = DashboardController;
