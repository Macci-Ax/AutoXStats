import sqlite3 from 'sqlite3';

const DB_PATH = './autox.db';

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
        process.exit(1);
    }
    console.log("Connected to the SQLite database.");
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS event_participations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        physical_event_id TEXT NOT NULL REFERENCES physical_events(id),
        is_public INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, physical_event_id)
    )`, (err) => {
        if (err) {
            console.error("Error creating event_participations table:", err.message);
        } else {
            console.log("event_participations table created successfully.");
        }
    });
});

setTimeout(() => {
    db.close((err) => {
        if (err) console.error(err.message);
        else console.log("Database connection closed.");
    });
}, 500);
