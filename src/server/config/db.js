import sqlite3 from 'sqlite3';
import path from 'path';

// Use absolute path or relative to root (assuming run from root)
const DB_PATH = './autox.db';

let dbInstance = null;

export const getDb = () => {
    if (!dbInstance) {
        dbInstance = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE, (err) => {
            if (err) {
                console.error("Error opening database:", err.message);
            } else {
                console.log("Connected to the SQLite database.");
                // Ensure photo_tags table exists (moved from server.js)
                dbInstance.run(`CREATE TABLE IF NOT EXISTS photo_tags (
                    id TEXT PRIMARY KEY,
                    photo_id TEXT,
                    driver_id TEXT,
                    FOREIGN KEY(photo_id) REFERENCES photos(id),
                    FOREIGN KEY(driver_id) REFERENCES drivers(id)
                )`);
            }
        });
    }
    return dbInstance;
};
