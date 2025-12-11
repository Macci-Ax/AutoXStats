
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('autox.db');

const name = 'Fischer';
console.log(`Checking participations for drivers like '%${name}%'...`);

const query = `
    SELECT 
        d.name,
        d.id as driver_id,
        dp.class_id,
        c.name as class_name,
        dp.points,
        dp.wins
    FROM drivers d
    JOIN driver_participations dp ON d.id = dp.driver_id
    JOIN classes c ON dp.class_id = c.id
    WHERE d.name LIKE ?
`;

db.all(query, [`%${name}%`], (err, rows) => {
    if (err) console.error(err);
    else {
        if (rows.length === 0) console.log("No participations found.");
        rows.forEach(r => {
            console.log(`[${r.driver_id}] ${r.name} -> ${r.class_name} (${r.class_id}) | Pts: ${r.points} | Wins: ${r.wins}`);
        });
    }
    db.close();
});
