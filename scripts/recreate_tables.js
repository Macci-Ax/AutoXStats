
import { getDb } from '../src/server/config/db.js';

const db = getDb();
console.log("Recreating tables to fix schema issues...");

db.prepare("DROP TABLE IF EXISTS race_results").run();

db.prepare(`
    CREATE TABLE race_results (
        id TEXT PRIMARY KEY,
        event_id TEXT,
        championship_event_id TEXT,
        driver_id TEXT,
        class_id TEXT,
        rank INTEGER,
        points INTEGER,
        laps INTEGER,
        total_time TEXT,
        heat_wins INTEGER DEFAULT 0,
        start_number INTEGER,
        license_type TEXT DEFAULT 'DRCV',
        car TEXT,
        championship_points INTEGER DEFAULT 0,
        run_1 INTEGER DEFAULT NULL,
        run_2 INTEGER DEFAULT NULL,
        run_3 INTEGER DEFAULT NULL,
        run_4 INTEGER DEFAULT NULL,
        event_points INTEGER DEFAULT NULL,
        FOREIGN KEY(event_id) REFERENCES physical_events(id),
        FOREIGN KEY(championship_event_id) REFERENCES championship_events(id),
        FOREIGN KEY(driver_id) REFERENCES drivers(id),
        FOREIGN KEY(class_id) REFERENCES classes(id)
    )
`).run();

console.log("race_results recreated.");

console.log("Clearing 2025 events...");
// Now we can safe delete
const eventsToDelete = db.prepare("SELECT id FROM physical_events WHERE start_date LIKE '2025%' AND status != 'upcoming'").all();
if (eventsToDelete.length > 0) {
    const ids = eventsToDelete.map(e => e.id);
    const placeholders = ids.map(() => '?').join(',');

    db.prepare(`DELETE FROM championship_events WHERE physical_event_id IN (${placeholders})`).run(ids);
    db.prepare(`DELETE FROM physical_events WHERE id IN (${placeholders})`).run(ids);
    console.log(`Deleted ${ids.length} 2025 physical events.`);
}

console.log("Done.");
