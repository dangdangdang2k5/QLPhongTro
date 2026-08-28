import os
import sqlite3

DATABASE = os.path.join(os.path.dirname(__file__), 'database.db')

def get_db():
    """Ket noi den SQLite database va tra ve doi tuong connection."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Khoi tao cac bang rooms va payments, tao du lieu mau 6 phong neu chua co."""
    conn = get_db()
    cursor = conn.cursor()
    
    # 1. Bang rooms
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_number TEXT NOT NULL
        )
    ''')

    # 2. Bang payments chi tiet tung ky thanh toan
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id INTEGER NOT NULL,
            payment_month INTEGER NOT NULL,
            payment_year INTEGER NOT NULL,
            room_fee INTEGER NOT NULL DEFAULT 2000000,
            electricity_units INTEGER NOT NULL DEFAULT 0,
            electricity_price INTEGER NOT NULL DEFAULT 4000,
            electricity_fee INTEGER NOT NULL DEFAULT 0,
            water_fee INTEGER NOT NULL DEFAULT 0,
            total_amount INTEGER NOT NULL DEFAULT 2000000,
            status TEXT NOT NULL DEFAULT 'UNPAID',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (room_id) REFERENCES rooms(id),
            UNIQUE(room_id, payment_month, payment_year)
        )
    ''')
    
    # Seed 6 phong neu bang rooms rong
    cursor.execute('SELECT COUNT(*) as count FROM rooms')
    if cursor.fetchone()['count'] == 0:
        rooms_data = [(f'Phòng {i}',) for i in range(1, 7)]
        cursor.executemany('INSERT INTO rooms (room_number) VALUES (?)', rooms_data)
        conn.commit()

    # Seed payment thang 8/2026 cho 6 phong neu chua co
    cursor.execute('SELECT id FROM rooms')
    all_rooms = cursor.fetchall()
    month = 8
    year = 2026
    for r in all_rooms:
        cursor.execute('''
            SELECT id FROM payments 
            WHERE room_id = ? AND payment_month = ? AND payment_year = ?
        ''', (r['id'], month, year))
        if cursor.fetchone() is None:
            cursor.execute('''
                INSERT INTO payments (
                    room_id, payment_month, payment_year, room_fee, 
                    electricity_units, electricity_price, electricity_fee, 
                    water_fee, total_amount, status
                ) VALUES (?, ?, ?, 2000000, 0, 4000, 0, 0, 2000000, 'UNPAID')
            ''', (r['id'], month, year))
    conn.commit()
    conn.close()
    print('[DB] Khoi tao va cap nhat he thong database thanh cong!')

if __name__ == '__main__':
    init_db()
