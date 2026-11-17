const mysql = require('mysql2/promise');
require('dotenv').config();

// Cấu hình Connection Pool cho MySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'qlphongtro',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true,
    timezone: '+07:00'
});

// Helper kiểm tra kết nối
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log(`[Database] Đã kết nối thành công đến MySQL: ${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || 'qlphongtro'}`);
        connection.release();
        return true;
    } catch (err) {
        console.error('[Database] Lỗi kết nối MySQL:', err.message);
        return false;
    }
}

module.exports = {
    pool,
    testConnection
};
