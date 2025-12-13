import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../autox.db');

const db = new Database(dbPath);

// Check all tables
console.log('=== ALL TABLES ===');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
tables.forEach(t => {
    console.log(`\n--- ${t.name} ---`);
    const cols = db.prepare(`PRAGMA table_info(${t.name})`).all();
    cols.forEach(c => console.log(`  ${c.name}`));
});

// Check drivers table for license info
console.log('\n=== DRIVERS sample ===');
const drivers = db.prepare("SELECT * FROM drivers LIMIT 3").all();
console.log(JSON.stringify(drivers, null, 2));

db.close();
