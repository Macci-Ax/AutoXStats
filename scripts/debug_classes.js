
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('autox.db');

const queryClasses = `SELECT id, name FROM classes ORDER BY name`;
const queryK6 = `
    SELECT d.name, c.name as class_name
    FROM drivers d
    JOIN race_results r ON d.id = r.driver_id
    JOIN classes c ON r.class_id = c.id
    WHERE c.name LIKE '%lasse%6%' OR c.name LIKE '%lasse%06%'
`;

db.serialize(() => {
    console.log("--- All Classes ---");
    db.all(queryClasses, [], (err, rows) => {
        if (err) console.error(err);
        else rows.forEach(r => console.log(`${r.id}: ${r.name}`));
    });

    console.log("\n--- Drivers in Klasse 6 ---");
    db.all(queryK6, [], (err, rows) => {
        if (err) console.error(err);
        else {
            if (rows.length === 0) console.log("No drivers found in Klasse 6.");
            rows.forEach(r => console.log(`${r.name} (${r.class_name})`));
        }
    });
});

setTimeout(() => db.close(), 1000);
