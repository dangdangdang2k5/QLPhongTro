const bcrypt = require('bcrypt');
const { pool } = require('../config/database');

class AuthController {
    /**
     * Hiển thị trang đăng nhập Tenant (Khách thuê)
     */
    static showTenantLogin(req, res) {
        if (req.session.user) {
            if (req.session.user.role === 'ADMIN') return res.redirect('/admin/dashboard');
            return res.redirect('/');
        }
        res.render('login', { error: null, title: 'Đăng Nhập Khách Thuê' });
    }

    /**
     * Xử lý đăng nhập Tenant
     */
    static async handleTenantLogin(req, res, next) {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                return res.render('login', { error: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.', title: 'Đăng Nhập Khách Thuê' });
            }

            const [users] = await pool.query(
                `SELECT u.*, r.id as room_id, r.room_number 
                 FROM users u
                 LEFT JOIN rooms r ON r.current_tenant_id = u.id
                 WHERE u.username = ? LIMIT 1`,
                [username.trim()]
            );

            if (users.length === 0) {
                return res.render('login', { error: 'Tài khoản hoặc mật khẩu không chính xác.', title: 'Đăng Nhập Khách Thuê' });
            }

            const user = users[0];
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.render('login', { error: 'Tài khoản hoặc mật khẩu không chính xác.', title: 'Đăng Nhập Khách Thuê' });
            }

            // Lưu session an toàn
            req.session.user = {
                id: user.id,
                username: user.username,
                fullName: user.full_name,
                role: user.role,
                roomId: user.room_id || null,
                roomNumber: user.room_number || null
            };

            // Ghi audit log
            await pool.query(
                'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
                [user.id, 'LOGIN', JSON.stringify({ role: user.role }), req.ip]
            );

            if (user.role === 'ADMIN') {
                return res.redirect('/admin/dashboard');
            }
            return res.redirect('/');
        } catch (err) {
            next(err);
        }
    }

    /**
     * Hiển thị trang đăng nhập Admin
     */
    static showAdminLogin(req, res) {
        if (req.session.user && req.session.user.role === 'ADMIN') {
            return res.redirect('/admin/dashboard');
        }
        res.render('admin_login', { error: null, title: 'Admin Login - QLPhongTro PRO' });
    }

    /**
     * Xử lý đăng nhập Admin
     */
    static async handleAdminLogin(req, res, next) {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                return res.render('admin_login', { error: 'Vui lòng nhập tài khoản và mật khẩu quản trị.', title: 'Admin Login' });
            }

            const [users] = await pool.query(
                'SELECT * FROM users WHERE username = ? AND role = "ADMIN" LIMIT 1',
                [username.trim()]
            );

            if (users.length === 0) {
                return res.render('admin_login', { error: 'Tài khoản hoặc mật khẩu quản trị không đúng.', title: 'Admin Login' });
            }

            const admin = users[0];
            const isMatch = await bcrypt.compare(password, admin.password_hash);
            if (!isMatch) {
                return res.render('admin_login', { error: 'Tài khoản hoặc mật khẩu quản trị không đúng.', title: 'Admin Login' });
            }

            req.session.user = {
                id: admin.id,
                username: admin.username,
                fullName: admin.full_name,
                role: 'ADMIN'
            };

            // Ghi log
            await pool.query(
                'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
                [admin.id, 'ADMIN_LOGIN', JSON.stringify({ username: admin.username }), req.ip]
            );

            return res.redirect('/admin/dashboard');
        } catch (err) {
            next(err);
        }
    }

    /**
     * Đăng xuất hệ thống
     */
    static logout(req, res) {
        const isAdmin = req.session.user && req.session.user.role === 'ADMIN';
        req.session.destroy(() => {
            res.redirect(isAdmin ? '/admin/login' : '/login');
        });
    }
}

module.exports = AuthController;
