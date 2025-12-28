
import { getDb } from '../src/server/config/db.js';

const db = getDb();
console.log("Searching for specific runs...");

const results = db.prepare("SELECT r.*, e.title, c.name as c_name FROM race_results r JOIN physical_events e ON r.event_id = e.id JOIN classes c ON r.class_id = c.id").all();

for (const r of results) {
    if (r.event_points === 24 || r.event_points === 21) {
        // Check run signature
        // 24: 9/9/6/0 (or order) -> Screenshot says 9/9/6/0? Or 6/3/6/9?
        // Rank 8 Sven Cordes: 6/3/6/9 - 24 pkt.
        // Rank 12 Mike Hellweg: 3/6/9/0 - 18 pkt.
        // Wait, Jeremy entry in screenshot?
        // Rank 11 Jeremy: 9/1/4/7 - 21 pkt.

        // I want to find the event containing Jeremy with 21 or 24 points.
        if (r.driver_id.includes('abe9faef') || (r.driver_name && r.driver_name.includes('Jeremy'))) {
            console.log(`FOUND: Event: ${r.title} Class: ${r.c_name}`);
            console.log(`  Driver: ${r.driver_name} (ID: ${r.driver_id})`);
            console.log(`  Runs: ${r.run_1}/${r.run_2}/${r.run_3}/${r.run_4} = ${r.event_points}`);
        }
    }
}
