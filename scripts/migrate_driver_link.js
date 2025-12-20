import Database from 'better-sqlite3';

const db = new Database('./autox.db');

console.log('Starting migration...');

// 1. Add driver_id to users if not exists
try {
    const userCols = db.prepare('PRAGMA table_info(users)').all();
    const hasDriverId = userCols.some(col => col.name === 'driver_id');

    if (!hasDriverId) {
        console.log('Adding driver_id to users table...');
        db.prepare('ALTER TABLE users ADD COLUMN driver_id TEXT').run();
    } else {
        console.log('users.driver_id already exists.');
    }
} catch (err) {
    console.error('Error updating users table:', err);
}

// 2. Create driver_requests table
try {
    console.log('Creating driver_requests table...');
    db.prepare(`
        CREATE TABLE IF NOT EXISTS driver_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            driver_id TEXT NOT NULL,
            status TEXT DEFAULT 'PENDING',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(driver_id) REFERENCES drivers(id)
        )
    `).run();
    console.log('driver_requests table ready.');
} catch (err) {
    console.error('Error creating driver_requests table:', err);
}

db.close();
console.log('Migration complete.');
