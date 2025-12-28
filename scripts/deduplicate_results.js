
import { getDb } from '../src/server/config/db.js';

const db = getDb();

console.log("Checking for duplicate results...");

const dups = db.prepare(`
    SELECT event_id, driver_id, class_id, count(*) as c, group_concat(id) as ids
    FROM race_results
    GROUP BY event_id, driver_id, class_id
    HAVING c > 1
`).all();

console.log(`Found ${dups.length} duplicate result sets.`);

let deleted = 0;
for (const d of dups) {
    const ids = d.ids.split(',');
    // We want to keep the "best" one. 
    // Fetch them all to inspect.
    const rows = ids.map(id => db.prepare("SELECT * FROM race_results WHERE id = ?").get(id));

    // Sort by "completeness" (e.g. has run_1)
    // or just keep the one with ID matching the event if possible (cleaner)
    // The import creates ID like res_{event_id}...
    // If we merged event A->B, result from A has ID res_A... but event_id=B.
    // Result from B has ID res_B... and event_id=B.
    // We likely want to keep res_B (matches event ID).
    // Also check for data quality (run_1 not null).

    rows.sort((a, b) => {
        const scoreA = (a.run_1 !== null ? 10 : 0) + (a.id.includes(a.event_id) ? 5 : 0);
        const scoreB = (b.run_1 !== null ? 10 : 0) + (b.id.includes(b.event_id) ? 5 : 0);
        return scoreB - scoreA;
    });

    const keep = rows[0];
    const trash = rows.slice(1);

    for (const t of trash) {
        db.prepare("DELETE FROM race_results WHERE id = ?").run(t.id);
        deleted++;
    }
}

console.log(`Deleted ${deleted} duplicate result rows.`);
