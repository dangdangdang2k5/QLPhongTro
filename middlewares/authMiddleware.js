/**
 * Middleware kiểm tra phiên đăng nhập người dùng
 */
function requireAuth(req, res, next) {
    if (!req.session || !req.session.user) {
        if (req.xhr || req.headers.accept?.includes('json')) {
            return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập để tiếp tục.' });
        }
        return res.redirect('/login');
    }
    next();
}

/**
 * Middleware yêu cầu quyền Quản trị viên (ADMIN)
 */
function requireAdmin(req, res, next) {
    if (!req.session || !req.session.user) {
        if (req.xhr || req.headers.accept?.includes('json')) {
            return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập Admin.' });
        }
        return res.redirect('/admin/login');
    }

    if (req.session.user.role !== 'ADMIN') {
        if (req.xhr || req.headers.accept?.includes('json')) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập khu vực Quản trị.' });
        }
        return res.status(403).render('error', { 
            message: 'Truy cập bị từ chối: Khu vực này chỉ dành cho Quản trị viên.' 
        });
    }

    next();
}

/**
 * Middleware cho phép cả Admin hoặc Tenant đúng phòng truy cập
 */
function requireRoomOwnerOrAdmin(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.redirect('/login');
    }

    // Admin có toàn quyền xem mọi phòng
    if (req.session.user.role === 'ADMIN') {
        return next();
    }

    // Tenant chỉ được xem phòng của chính mình
    const requestedRoomId = parseInt(req.params.roomId || req.params.room_id || req.body.room_id, 10);
    if (req.session.user.roomId && req.session.user.roomId !== requestedRoomId) {
        if (req.xhr || req.headers.accept?.includes('json')) {
            return res.status(403).json({ success: false, message: 'Bạn không thể xem dữ liệu của phòng khác.' });
        }
        return res.status(403).render('error', {
            message: 'Bạn không có quyền truy cập thông tin của phòng này.'
        });
    }

    next();
}

module.exports = {
    requireAuth,
    requireAdmin,
    requireRoomOwnerOrAdmin
};
