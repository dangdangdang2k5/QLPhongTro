const { pool } = require('../config/database');

class RoomController {
    /**
     * Danh sách phòng quản lý (Admin View)
     */
    static async listRooms(req, res, next) {
        try {
            const [rooms] = await pool.query(`
                SELECT r.*, u.full_name as tenant_name, u.phone as tenant_phone,
                       i.total_amount as current_bill, i.status as current_bill_status, i.id as invoice_id
                FROM rooms r
                LEFT JOIN users u ON r.current_tenant_id = u.id
                LEFT JOIN invoices i ON i.room_id = r.id AND i.payment_month = ? AND i.payment_year = ?
                ORDER BY r.id ASC
            `, [parseInt(process.env.PAYMENT_MONTH || 8, 10), parseInt(process.env.PAYMENT_YEAR || 2026, 10)]);

            const [tenants] = await pool.query(`
                SELECT id, username, full_name, phone FROM users WHERE role = 'TENANT' ORDER BY full_name ASC
            `);

            res.render('admin_rooms', {
                title: 'Quản Lý Danh Sách Phòng - QLPhongTro PRO',
                rooms,
                tenants,
                user: req.session.user
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Thêm phòng mới
     */
    static async createRoom(req, res, next) {
        try {
            const { room_number, base_price, status, current_tenant_id } = req.body;
            if (!room_number) {
                return res.status(400).json({ success: false, message: 'Tên phòng không được để trống.' });
            }

            const price = Math.max(0, parseFloat(base_price) || 2000000);
            const tenantId = current_tenant_id ? parseInt(current_tenant_id, 10) : null;
            const roomStatus = ['VACANT', 'OCCUPIED', 'MAINTENANCE'].includes(status) ? status : 'OCCUPIED';

            const [result] = await pool.query(
                'INSERT INTO rooms (room_number, base_price, status, current_tenant_id) VALUES (?, ?, ?, ?)',
                [room_number.trim(), price, roomStatus, tenantId]
            );

            await pool.query(
                'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
                [req.session.user.id, 'CREATE_ROOM', JSON.stringify({ roomId: result.insertId, room_number }), req.ip]
            );

            res.redirect('/admin/rooms');
        } catch (err) {
            next(err);
        }
    }

    /**
     * Cập nhật thông tin phòng
     */
    static async updateRoom(req, res, next) {
        try {
            const roomId = parseInt(req.params.id, 10);
            const { room_number, base_price, status, current_tenant_id } = req.body;

            const price = Math.max(0, parseFloat(base_price) || 2000000);
            const tenantId = current_tenant_id ? parseInt(current_tenant_id, 10) : null;
            const roomStatus = ['VACANT', 'OCCUPIED', 'MAINTENANCE'].includes(status) ? status : 'OCCUPIED';

            await pool.query(
                `UPDATE rooms 
                 SET room_number = ?, base_price = ?, status = ?, current_tenant_id = ?
                 WHERE id = ?`,
                [room_number.trim(), price, roomStatus, tenantId, roomId]
            );

            await pool.query(
                'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
                [req.session.user.id, 'UPDATE_ROOM', JSON.stringify({ roomId, room_number, status }), req.ip]
            );

            res.redirect('/admin/rooms');
        } catch (err) {
            next(err);
        }
    }
}

module.exports = RoomController;
