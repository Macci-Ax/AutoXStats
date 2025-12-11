import sqlite3 from 'sqlite3';

// Use verbose mode
const sql = sqlite3.verbose();
const db = new sql.Database('./autox.db', sql.OPEN_READONLY);

const query = `
    SELECT 
        d.id as driver_id,
        dp.class_id,
        d.name, 
        c.name as driverClass,
        RANK() OVER (
            PARTITION BY dp.class_id 
            ORDER BY COALESCE(SUM(r.points), dp.points) DESC
        ) as season_rank,
        dp.points as static_points,
        SUM(r.points) as calc_points
    FROM drivers d
    JOIN driver_participations dp ON d.id = dp.driver_id
    JOIN classes c ON dp.class_id = c.id
    LEFT JOIN race_results r ON d.id = r.driver_id AND dp.class_id = r.class_id
    GROUP BY d.id, dp.class_id
    ORDER BY driverClass, COALESCE(SUM(r.points), dp.points) DESC
    LIMIT 5
`;

db.all(query, [], (err, rows) => {
    if (err) {
        console.error("SQL Error:", err.message);
    } else {
        console.log("Query Results:", rows);
    }
});
