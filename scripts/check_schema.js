import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../autox.db');

const db = new Database(dbPath);

// Check schema
console.log('SCHEMA:');
const tableInfo = db.prepare("PRAGMA table_info(race_results)").all();
tableInfo.forEach(col => console.log(col.name));

console.log('---');
console.log('COUNT:', db.prepare("SELECT COUNT(*) as c FROM race_results").get().c);

db.close();
