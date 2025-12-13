import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../autox.db');
const db = new Database(dbPath);

const row = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='events'").get();
console.log(row.sql);

db.close();
