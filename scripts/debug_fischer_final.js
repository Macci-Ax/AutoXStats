
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('autox.db');

const drvId = 'drv_6798f633';
const outputFile = 'fischer_dump.txt';
let output = '';

db.serialize(() => {
    output += "--- Classes matching '06' ---\n";
    db.all("SELECT * FROM classes WHERE name LIKE '%06%'", [], (err, rows) => {
        if (err) console.error(err);
        else {
            rows.forEach(r => output += `${JSON.stringify(r)}\n`);
        }
    });

    output += `\n--- Results for ${drvId} ---\n`;
    db.all(`
        SELECT r.id, r.class_id, r.rank, r.points, c.name as class_name, c.championship_id
        FROM race_results r
        LEFT JOIN classes c ON r.class_id = c.id
        WHERE r.driver_id = ?
    `, [drvId], (err, rows) => {
        if (err) console.error(err);
        else {
            rows.forEach(r => {
                output += `ClassID: ${r.class_id} | Name: ${r.class_name} | Champ: ${r.championship_id} | Rank: ${r.rank}\n`;
            });
        }

        fs.writeFileSync(outputFile, output);
        console.log("Dumped to " + outputFile);
    });
});

setTimeout(() => db.close(), 1000);
