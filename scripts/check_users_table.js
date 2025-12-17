import Database from 'better-sqlite3';

const db = new Database('./autox.db');

console.log('Users table schema:');
const schema = db.prepare('PRAGMA table_info(users)').all();
console.log(schema);

console.log('\nExisting users:');
const users = db.prepare('SELECT id, email, role, created_at FROM users').all();
console.log(users);

db.close();
