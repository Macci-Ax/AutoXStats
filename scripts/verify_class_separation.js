
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('autox.db');

const query = `
    SELECT 
        d.id as driver_id,
        c.id as class_id,
        d.name, 
        d.team, 
        d.car, 
        d.start_number as number, 
        COALESCE(c.name, d_c.name) as driverClass,
        d.bio,
        d.season_rank,
        d.points as static_points,
        SUM(r.points) as calc_points,
        COUNT(r.id) as races
    FROM drivers d
    LEFT JOIN race_results r ON d.id = r.driver_id
    LEFT JOIN classes c ON r.class_id = c.id
    LEFT JOIN classes d_c ON d.current_class_id = d_c.id
    GROUP BY d.id, COALESCE(r.class_id, d.current_class_id)
    ORDER BY driverClass, COALESCE(SUM(r.points), d.points) DESC
`;

console.log("Running aggregation query...");

db.all(query, [], (err, rows) => {
    if (err) {
        console.error("Query Failed:", err.message);
        process.exit(1);
    }

    console.log(`Query returned ${rows.length} rows.`);

    // Check if any driver appears twice (indicating multiple classes)
    const driverCounts = {};
    rows.forEach(r => {
        driverCounts[r.driver_id] = (driverCounts[r.driver_id] || 0) + 1;
    });

    const multiClassDrivers = Object.keys(driverCounts).filter(id => driverCounts[id] > 1);
    if (multiClassDrivers.length > 0) {
        console.log("Found drivers in multiple classes:", multiClassDrivers);
        console.log("Verification SUCCESS: Logic supports splitting by class.");
    } else {
        console.log("No drivers currently in multiple classes found (this is expected if data is simple).");
        console.log("Verification PASSED (Query is valid).");
    }

    if (rows.length > 0) {
        console.log("Sample Row:", rows[0]);
    }

    db.close();
});
