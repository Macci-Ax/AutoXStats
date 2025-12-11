import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./autox.db');

db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
    console.log("Tables:", rows);
});

const classId = 'd_k1';

const driversQuery = `
    SELECT 
        d.id, d.name, d.team, d.car, 
        dp.points as static_points,
        SUM(r.points) as calc_points,
        COUNT(r.id) as races
    FROM drivers d
    JOIN driver_participations dp ON d.id = dp.driver_id
    LEFT JOIN race_results r ON d.id = r.driver_id AND dp.class_id = r.class_id
    WHERE dp.class_id = ?
    GROUP BY d.id
//    ORDER BY COALESCE(SUM(r.points), dp.points) DESC
    LIMIT 3
`;

db.all(driversQuery, [classId], (err, rows) => {
    if (err) {
        console.error("Query Failed:", err.message);
    } else {
        console.log("Query Success:", rows);
    }
});
