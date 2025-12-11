
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('autox.db');

const query = `
    SELECT 
        d.id as driver_id,
        COALESCE(r.class_id, d.current_class_id) as group_key,
        c.id as class_id,
        d.name, 
        c.name as class_name_from_c,
        SUM(r.points) as calc_points,
        COUNT(r.id) as r_count
    FROM drivers d
    LEFT JOIN race_results r ON d.id = r.driver_id
    LEFT JOIN classes c ON r.class_id = c.id
    LEFT JOIN classes d_c ON d.current_class_id = d_c.id
    WHERE d.name LIKE '%Sebastian Fischer%'
    GROUP BY d.id, COALESCE(r.class_id, d.current_class_id)
`;

console.log("Running aggregation query for Sebastian Fischer...");

db.all(query, [], (err, rows) => {
    if (err) {
        console.error("Query Failed:", err.message);
    } else {
        console.log(`Returned ${rows.length} rows.`);
        rows.forEach(r => {
            console.log(JSON.stringify(r));
        });
    }
    db.close();
});
