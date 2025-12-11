
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('autox.db');

const query = `
    SELECT 
        d.id as driver_id,
        c.id as class_id,
        c.name as class_name,
        c.championship_id,
        SUM(r.points) as points
    FROM drivers d
    LEFT JOIN race_results r ON d.id = r.driver_id
    LEFT JOIN classes c ON r.class_id = c.id
    WHERE d.name LIKE '%Fischer%'
    GROUP BY d.id, r.class_id
`;

console.log("Checking API-like query results for Fischer...");
db.all(query, [], (err, rows) => {
    if (err) console.error(err);
    else {
        rows.forEach(r => {
            console.log(`Driver: ${r.driver_id} | Class: ${r.class_name} (${r.class_id}) | Champ: ${r.championship_id} | Points: ${r.points}`);
        });
    }
    db.close();
});
