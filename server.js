const path = require('path');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection } = require('./config/database');
const BillingService = require('./services/billingService');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Hỗ trợ reverse proxy (Nginx)
app.set('trust proxy', 1);

// 1. Cấu hình bảo mật Helmet (cho phép tải ảnh VietQR và thư viện Chart.js)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "https://img.vietqr.io"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: null
        }
    }
}));

// 2. Rate Limiting: Giới hạn tần suất request để phòng chống Brute-force & DDoS
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 300, // Tối đa 300 requests mỗi 15 phút
    message: { success: false, message: 'Quá nhiều yêu cầu từ IP của bạn. Vui lòng thử lại sau 15 phút.' }
});
app.use(limiter);

// 3. Phân tích Request Body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Quản lý phiên đăng nhập an toàn (Express Session)
app.use(session({
    secret: process.env.SESSION_SECRET || process.env.SECRET_KEY || 'qlphongtro-session-secret-2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.COOKIE_SECURE === 'true',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 1 ngày
    }
}));

// 5. Cấu hình Template Engine EJS & Static Files
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Biến toàn cục cho views
app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    res.locals.appName = 'QLPhongTro PRO';
    res.locals.formatCurrency = BillingService.formatCurrency;
    next();
});

// 6. Định tuyến (Routes)
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/', tenantRoutes);

// 7. Xử lý lỗi tập trung
app.use(notFoundHandler);
app.use(errorHandler);

// 8. Khởi động Web Server
async function startServer() {
    console.log('[Server] Đang khởi động QLPhongTro PRO...');
    await testConnection();

    app.listen(PORT, () => {
        console.log(`\n======================================================`);
        console.log(`🚀 QLPhongTro PRO đang chạy tại: http://localhost:${PORT}`);
        console.log(`👉 Trang khách thuê:            http://localhost:${PORT}/login`);
        console.log(`👉 Trang quản trị Admin:        http://localhost:${PORT}/admin/login`);
        console.log(`======================================================\n`);
    });
}

if (require.main === module) {
    startServer();
}

module.exports = app;
