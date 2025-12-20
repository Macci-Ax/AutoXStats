import Database from 'better-sqlite3';
import path from 'path';

// Use absolute path or relative to root (assuming run from root)
const DB_PATH = './autox.db';

let dbInstance = null;

export const getDb = () => {
    if (!dbInstance) {
        dbInstance = new Database(DB_PATH);
        console.log("Connected to the SQLite database (better-sqlite3).");

        // Ensure photo_tags table exists
        dbInstance.prepare(`CREATE TABLE IF NOT EXISTS photo_tags (
            id TEXT PRIMARY KEY,
            photo_id TEXT,
            driver_id TEXT,
            FOREIGN KEY(photo_id) REFERENCES photos(id),
            FOREIGN KEY(driver_id) REFERENCES drivers(id)
        )`).run();
    }
    return dbInstance;
};
