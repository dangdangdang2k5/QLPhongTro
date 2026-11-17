const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
    console.log('[Migration] Bắt đầu khởi tạo cơ sở dữ liệu MySQL...');

    const host = process.env.DB_HOST || '127.0.0.1';
    const port = parseInt(process.env.DB_PORT, 10) || 3306;
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD || '';
    const database = process.env.DB_NAME || 'qlphongtro';

    let conn;
    try {
        // 1. Kết nối không cần database để tạo database nếu chưa có
        conn = await mysql.createConnection({ host, port, user, password, multipleStatements: true });
        console.log(`[Migration] Kết nối MySQL Server (${host}:${port}) thành công.`);

        await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        console.log(`[Migration] Database \`${database}\` sẵn sàng.`);
        await conn.changeUser({ database });

        // 2. Đọc và thực thi schema.sql
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        console.log('[Migration] Đang áp dụng schema.sql (7 bảng quan hệ)...');
        await conn.query(schemaSql);
        console.log('[Migration] Áp dụng schema thành công!');

        // 3. Đọc và thực thi seed.sql
        const seedPath = path.join(__dirname, 'seed.sql');
        const seedSql = fs.readFileSync(seedPath, 'utf8');
        console.log('[Migration] Đang nạp dữ liệu mẫu seed.sql...');
        await conn.query(seedSql);
        console.log('[Migration] Nạp dữ liệu mẫu thành công!');

        console.log('\n======================================================');
        console.log('🎉 KHỞI TẠO CƠ SỞ DỮ LIỆU MYSQL HOÀN TẤT THÀNH CÔNG!');
        console.log('Tài khoản Admin mặc định:  admin   / admin123');
        console.log('Tài khoản Tenant mẫu (P1): phong1  / phong123');
        console.log('======================================================\n');
    } catch (err) {
        console.error('[Migration] LỖI KHỞI TẠO DATABASE:', err.message);
        process.exit(1);
    } finally {
        if (conn) await conn.end();
    }
}

if (require.main === module) {
    runMigration();
}

module.exports = runMigration;
