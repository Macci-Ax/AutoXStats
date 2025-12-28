
import { getDb } from '../src/server/config/db.js';

const db = getDb();

const name = "Jeremy de Vries";
const driver = db.prepare("SELECT * FROM drivers WHERE name LIKE ?").get(`%${name}%`);
if (!driver) { console.log("Driver not found"); process.exit(); }

console.log(`Checking multiple results per event for ${driver.name} (id: ${driver.id})`);

// Find events where he has > 1 result
const multiResults = db.prepare(`
    SELECT event_id, count(*) as c, group_concat(class_id) as classes, group_concat(id) as ids
    FROM race_results 
    WHERE driver_id = ?
    GROUP BY event_id
    HAVING c > 1
`).all(driver.id);

console.log(`Found ${multiResults.length} events with multiple entries.`);

for (const m of multiResults) {
    const evt = db.prepare("SELECT title FROM physical_events WHERE id = ?").get(m.event_id);
    const evtTitle = evt ? evt.title : "UNKNOWN/DELETED EVENT";

    console.log(`\nEvent: ${evtTitle} (${m.event_id})`);
    console.log(`  Classes: ${m.classes}`);
    console.log(`  IDs: ${m.ids}`);

    // Check Class Names
    const classIds = m.classes.split(',');
    for (const cid of classIds) {
        const cls = db.prepare("SELECT name, championship_id FROM classes WHERE id = ?").get(cid);
        if (cls) {
            console.log(`  Class ${cid}: "${cls.name}" (${cls.championship_id})`);
        } else {
            console.log(`  Class ${cid}: UNKNOWN CLASS`);
        }
    }
}
