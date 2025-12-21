import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.resolve('./autox.db');

console.log('Opening database at:', DB_PATH);
const db = new Database(DB_PATH);

// Check if columns already exist
const tableInfo = db.pragma('table_info(users)');
const columns = tableInfo.map(col => col.name);

console.log('Existing columns:', columns);

const migrations = [];

if (!columns.includes('email_verified')) {
    migrations.push('ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0');
}

if (!columns.includes('email_verification_token')) {
    migrations.push('ALTER TABLE users ADD COLUMN email_verification_token TEXT');
}

if (!columns.includes('email_verification_expires_at')) {
    migrations.push('ALTER TABLE users ADD COLUMN email_verification_expires_at TEXT');
}

if (migrations.length === 0) {
    console.log('No migrations needed - all columns already exist.');
} else {
    console.log(`Running ${migrations.length} migration(s)...`);

    for (const sql of migrations) {
        console.log('Executing:', sql);
        db.exec(sql);
    }

    console.log('Migrations completed successfully!');
}

// Mark existing admin users as verified
const adminUpdate = db.prepare("UPDATE users SET email_verified = 1 WHERE role = 'ADMIN'");
const result = adminUpdate.run();
console.log(`Marked ${result.changes} admin user(s) as email verified.`);

db.close();
console.log('Database closed.');
