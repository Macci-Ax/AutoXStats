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
        // DROP existing table first
        db.run(`DROP TABLE IF EXISTS users`, (err) => {
            if (err) {
                console.error("Error dropping table:", err.message);
                return;
            }
            console.log("Dropped existing users table.");
        });

        // Create table with created_at field
        db.run(`CREATE TABLE users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error("Error creating table:", err.message);
                return;
            }
            console.log("Users table created with created_at field.");
        });

        // Insert Admin
        const adminId = 'admin_001';

        const insertStmt = db.prepare(`
            INSERT INTO users (id, email, password_hash, role, created_at) 
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);

        insertStmt.run(adminId, adminEmail, passwordHash, 'ADMIN', (err) => {
            if (err) {
                console.error("Error inserting admin:", err.message);
            } else {
                console.log(`Admin user '${adminEmail}' created successfully.`);
            }
            insertStmt.finalize();
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

setupUsers();
