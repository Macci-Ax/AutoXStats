import Database from 'better-sqlite3';

const db = new Database('./autox.db');

console.log('--- Users Table Info ---');
const usersInfo = db.prepare('PRAGMA table_info(users)').all();
usersInfo.forEach(col => console.log(`${col.name} (${col.type})`));

console.log('\n--- Checking for driver_requests ---');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='driver_requests'").all();
console.log(tables.length > 0 ? 'driver_requests exists' : 'driver_requests does NOT exist');

db.close();
