const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middlewares/authMiddleware');
const DashboardController = require('../controllers/dashboardController');
const RoomController = require('../controllers/roomController');
const InvoiceController = require('../controllers/invoiceController');
const PaymentController = require('../controllers/paymentController');
const ReportController = require('../controllers/reportController');

// Tất cả các route trong adminRoutes đều yêu cầu quyền ADMIN
router.use(requireAdmin);

// Dashboard
router.get('/', (req, res) => res.redirect('/admin/dashboard'));
router.get('/dashboard', DashboardController.showDashboard);

// Quản lý phòng
router.get('/rooms', RoomController.listRooms);
router.post('/rooms', RoomController.createRoom);
router.post('/rooms/:id/update', RoomController.updateRoom);

// Quản lý hóa đơn
router.get('/invoices', InvoiceController.listInvoices);
router.get('/room/:roomId', InvoiceController.showEditInvoiceForm);
router.post('/room/:roomId', InvoiceController.saveInvoice);
router.post('/invoices/:id/set-status', InvoiceController.setInvoiceStatus);
router.get('/invoices/:id/pdf', ReportController.exportInvoicePdf);

// Quản lý thanh toán
router.post('/payment/:invoiceId/approve', PaymentController.approvePayment);
router.post('/payment/:invoiceId/reset', PaymentController.resetPayment);

// Cài đặt Telegram Bot
router.post('/test-telegram', DashboardController.testTelegram);
router.post('/set-telegram-webhook', DashboardController.setTelegramWebhook);

module.exports = router;
