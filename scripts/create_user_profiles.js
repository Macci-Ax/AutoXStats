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
    // Create user_profiles table
    db.run(`CREATE TABLE IF NOT EXISTS user_profiles (
        user_id TEXT PRIMARY KEY REFERENCES users(id),
        display_name TEXT,
        bio TEXT,
        avatar_image_id TEXT,
        social_instagram TEXT,
        social_facebook TEXT,
        social_youtube TEXT,
        is_display_name_public INTEGER DEFAULT 0,
        is_bio_public INTEGER DEFAULT 0,
        is_social_public INTEGER DEFAULT 0,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error("Error creating user_profiles table:", err.message);
        } else {
            console.log("user_profiles table created successfully.");
        }
    });
});

setTimeout(() => {
    db.close((err) => {
        if (err) console.error(err.message);
        else console.log("Database connection closed.");
    });
}, 500);
