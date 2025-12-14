import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';

const DB_PATH = './autox.db';

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
        process.exit(1);
    }
    console.log("Connected to the SQLite database.");
});

async function setupUsers() {
    const saltRounds = 10;
    const adminEmail = 'admin@autox.com';
    const plainPassword = 'admin123';

    // Hash the password
    const passwordHash = await bcrypt.hash(plainPassword, saltRounds);

    db.serialize(() => {
        // Create table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL
        )`, (err) => {
            if (err) {
                console.error("Error creating table:", err.message);
                return;
            }
            console.log("Users table verified/created.");
        });

        // Insert Admin
        // Using a fixed ID for the admin for simplicity or UUID
        const adminId = 'admin_001';

        const insertStmt = db.prepare(`
            INSERT INTO users (id, email, password_hash, role) 
            VALUES (?, ?, ?, ?)
            ON CONFLICT(email) DO UPDATE SET
                password_hash = excluded.password_hash,
                role = excluded.role
        `);

        insertStmt.run(adminId, adminEmail, passwordHash, 'ADMIN', (err) => {
            if (err) {
                console.error("Error inserting admin:", err.message);
            } else {
                console.log(`Admin user '${adminEmail}' upserted successfully.`);
            }
            insertStmt.finalize();
        });
    });

    // Close after a short delay to ensure async ops finish (serialize typically handles order, but close is immediate)
    // Actually db.close() inside serialize might trigger before run callbacks if not careful.
    // Better to close in callback or just let script finish.
    setTimeout(() => {
        db.close((err) => {
            if (err) console.error(err.message);
            else console.log("Database connection closed.");
        });
    }, 1000);
}

setupUsers();
