const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('autox.db');

const query = `
    SELECT 
        d.id, 
        d.name, 
        d.team, 
        d.car, 
        d.start_number as number, 
        c.name as driverClass,
        d.bio,
        d.season_rank,
        SUM(r.points) as total_points,
        COUNT(CASE WHEN r.rank = 1 THEN 1 END) as wins,
        SUM(r.points) as points,
        COUNT(r.id) as races,
        COUNT(CASE WHEN r.rank <= 3 THEN 1 END) as podiums
    FROM drivers d
    LEFT JOIN race_results r ON d.id = r.driver_id
    LEFT JOIN classes c ON d.current_class_id = c.id
    GROUP BY d.id
    ORDER BY d.current_class_id, total_points DESC
`;

db.all(query, [], (err, rows) => {
    if (err) {
        console.error("Query Error:", err.message);
    } else {
        console.log("Query Success. Rows:", rows.length);
        if (rows.length > 0) {
            console.log("Sample Row:", rows[0]);
        }
    }
    db.close();
});
