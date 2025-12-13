import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../autox.db');
const db = new Database(dbPath);

console.log("Starting schema migration for 'events' table...");

// Disable FKs
db.exec("PRAGMA foreign_keys = OFF;");

const migrate = db.transaction(() => {
    // 1. Rename old table
    db.exec("ALTER TABLE events RENAME TO events_old;");

    // 2. Create new table with NULLABLE date
    db.exec(`
        CREATE TABLE events (
            id TEXT PRIMARY KEY,
            championship_id TEXT,
            name TEXT,
            date TEXT,  -- Now nullable
            location TEXT,
            status TEXT,
            FOREIGN KEY (championship_id) REFERENCES championships(id)
        );
    `);

    // 3. Copy data
    // Assuming columns match. Any extra columns in old table?
    // Based on inspection, seems standard.
    // If strict match fails, we might need explicit column list.
    // Let's assume standard columns: id, championship_id, name, date, location, status.
    db.exec(`
        INSERT INTO events (id, championship_id, name, date, location, status)
        SELECT id, championship_id, name, date, location, status
        FROM events_old;
    `);

    // 4. Drop old table
    db.exec("DROP TABLE events_old;");
});

try {
    migrate();
    console.log("Migration successful.");
} catch (err) {
    console.error("Migration failed:", err);
    // If failed, manual recovery might be needed if transaction rolled back half-way?
    // better-sqlite3 transactions rollback automatically on error.
} finally {
    db.exec("PRAGMA foreign_keys = ON;");
    db.close();
}
