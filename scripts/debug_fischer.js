
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('autox.db');

const name = "Sebastian Fischer";

const query = `
    SELECT 
        d.id, d.name, c.name as class_name, r.rank, r.points
    FROM drivers d
    JOIN race_results r ON d.id = r.driver_id
    JOIN classes c ON r.class_id = c.id
    WHERE d.name LIKE ?
`;

console.log(`Searching for ${name}...`);

db.all(query, [`%${name}%`], (err, rows) => {
    if (err) {
        console.error(err.message);
        process.exit(1);
    }
    if (rows.length === 0) {
        console.log("No results found.");
    } else {
        console.log("Found results:");
        rows.forEach(r => {
            console.log(`  [${r.id}] ${r.name} - ${r.class_name}: Rank ${r.rank} (${r.points} pts)`);
        });
    }
    db.close();
});
