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
    // Check if column exists or just try to add and ignore error
    db.run("ALTER TABLE photos ADD COLUMN photographer TEXT;", (err) => {
        if (err) {
            if (err.message.includes("duplicate column name")) {
                console.log("Column 'photographer' already exists.");
            } else {
                console.error("Error adding column:", err.message);
                // Don't exit 1, maybe table doesn't exist yet (created on first insert?)
                // Actually server.js implies table exists or we insert into it. 
                // The init script usually creates tables.
            }
        } else {
            console.log("Column 'photographer' added successfully.");
        }
    });
});

db.close(() => {
    console.log("Closed database connection.");
});
