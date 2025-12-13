import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../autox.db');
const db = new Database(dbPath);

try {
    console.log("Adding 'reconstructed' column to race_results...");
    db.exec("ALTER TABLE race_results ADD COLUMN reconstructed BOOLEAN DEFAULT FALSE;");
    console.log("Success.");
} catch (e) {
    if (e.message.includes('duplicate column')) {
        console.log("Column already exists.");
    } else {
        console.error("Error:", e);
    }
}

db.close();
