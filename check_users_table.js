import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./autox.db', (err) => {
    if (err) {
        console.error(err.message);
        return;
    }
    console.log('Connected to the database.');
});

db.serialize(() => {
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
        if (err) {
            console.error(err.message);
        }
        if (row) {
            console.log("Users table exists.");
            db.get("SELECT * FROM users WHERE role='ADMIN'", (err, row) => {
                if (row) {
                    console.log("Admin user exists.");
                } else {
                    console.log("No ADMIN user found.");
                }
            });
        } else {
            console.log("Users table does NOT exist.");
        }
    });
});

db.close();
