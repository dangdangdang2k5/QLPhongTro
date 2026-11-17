/**
 * Middleware bắt lỗi tập trung (Centralized Error Handler)
 * Không bao giờ làm lộ stack trace trong môi trường production
 */
function errorHandler(err, req, res, next) {
    console.error(`[Error] ${new Date().toISOString()} - ${req.method} ${req.url}:`, err.stack || err.message);

    const isProduction = process.env.NODE_ENV === 'production';
    const statusCode = err.status || err.statusCode || 500;
    const errorMessage = err.message || 'Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau.';

    if (req.xhr || req.headers.accept?.includes('json')) {
        return res.status(statusCode).json({
            success: false,
            message: errorMessage,
            ...(isProduction ? {} : { stack: err.stack })
        });
    }

    res.status(statusCode).render('error', {
        title: 'Có lỗi xảy ra',
        statusCode,
        message: errorMessage,
        stack: isProduction ? null : err.stack
    });
}

/**
 * Middleware xử lý 404 Not Found
 */
function notFoundHandler(req, res, next) {
    if (req.xhr || req.headers.accept?.includes('json')) {
        return res.status(404).json({ success: false, message: 'Đường dẫn API không tồn tại.' });
    }
    res.status(404).render('error', {
        title: '404 - Không tìm thấy trang',
        statusCode: 404,
        message: 'Trang hoặc tài nguyên bạn tìm kiếm không tồn tại.'
    });
}

module.exports = {
    errorHandler,
    notFoundHandler
};
