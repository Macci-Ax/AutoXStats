import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../autox.db');
const db = new Database(dbPath);

const columns = db.prepare("PRAGMA table_info(events)").all();
console.log(JSON.stringify(columns, null, 2));

db.close();
