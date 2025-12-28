
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../autox.db');
const db = new Database(dbPath);

const driver_id = 'drv_abe9faef';

const query = `
    SELECT 
        rr.id,
        rr.class_id,
        e.title as event_name,
        e.start_date as event_date,
        c.name as class_name,
        COALESCE(rr.start_number, d.start_number) as start_number,
        COALESCE(rr.car, d.car) as car,
        rr.rank,
        rr.points,
        rr.championship_points,
        d.name as driver_name
    FROM race_results rr
    JOIN physical_events e ON rr.event_id = e.id
    JOIN classes c ON rr.class_id = c.id
    JOIN drivers d ON rr.driver_id = d.id
    WHERE rr.driver_id = ?
    ORDER BY e.start_date DESC
`;

try {
    const rows = db.prepare(query).all(driver_id);
    console.log("Success! Found " + rows.length + " rows.");
    console.log(rows);
} catch (err) {
    console.error("SQL Error:", err.message);
}
