import sqlite3 from 'sqlite3';

const DB_PATH = './autox.db';

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
        process.exit(1);
    }
    console.log("Connected to the SQLite database.");
});

function createStatusUpdatesTable() {
    db.serialize(() => {
        // Create the status_updates table
        db.run(`CREATE TABLE IF NOT EXISTS status_updates (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            driver_id TEXT,
            content TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (driver_id) REFERENCES drivers(id)
        )`, (err) => {
            if (err) {
                console.error("Error creating table:", err.message);
                return;
            }
            console.log("status_updates table created successfully.");
        });

        // Create index for faster lookups by user_id
        db.run(`CREATE INDEX IF NOT EXISTS idx_status_user_id ON status_updates(user_id)`, (err) => {
            if (err) {
                console.error("Error creating user_id index:", err.message);
            } else {
                console.log("Index on user_id created.");
            }
        });

        // Create index for faster lookups by driver_id
        db.run(`CREATE INDEX IF NOT EXISTS idx_status_driver_id ON status_updates(driver_id)`, (err) => {
            if (err) {
                console.error("Error creating driver_id index:", err.message);
            } else {
                console.log("Index on driver_id created.");
            }
        });
    });

    // Close after a short delay
    setTimeout(() => {
        db.close((err) => {
            if (err) console.error(err.message);
            else console.log("Database connection closed.");
        });
    }, 1000);
}

createStatusUpdatesTable();
