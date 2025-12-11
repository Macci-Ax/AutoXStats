
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('autox.db');

const name = "Sebastian Fischer";

db.serialize(() => {
    // 1. Check for multiple drivers
    console.log("--- Drivers ---");
    db.all("SELECT * FROM drivers WHERE name LIKE ?", [`%${name}%`], (err, rows) => {
        if (err) console.error(err);
        else console.log(rows);
    });

    // 2. Check all results for these drivers
    console.log("\n--- Race Results for Drivers matching name ---");
    db.all(`
        SELECT r.id, r.driver_id, r.class_id, r.rank, r.points, c.name as class_name, e.name as event_name
        FROM race_results r
        JOIN drivers d ON r.driver_id = d.id
        JOIN classes c ON r.class_id = c.id
        JOIN events e ON r.event_id = e.id
        WHERE d.name LIKE ?
    `, [`%${name}%`], (err, rows) => {
        if (err) console.error(err);
        else rows.forEach(r => console.log(r));
    });
});

setTimeout(() => db.close(), 2000);
