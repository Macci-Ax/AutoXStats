
import { getDb } from '../src/server/config/db.js';

const db = getDb();

const name = "Jeremy de Vries";
const driver = db.prepare("SELECT * FROM drivers WHERE name LIKE ?").get(`%${name}%`);
if (!driver) { process.exit(); }

const multiResults = db.prepare(`
    SELECT event_id, count(*) as c, group_concat(class_id) as classes, group_concat(id) as ids
    FROM race_results 
    WHERE driver_id = ?
    GROUP BY event_id
    HAVING c > 1
`).all(driver.id);

console.log(`Checking duplicates for ${driver.name}:`);

for (const m of multiResults) {
    const evt = db.prepare("SELECT title FROM physical_events WHERE id = ?").get(m.event_id);
    const evtTitle = evt ? evt.title : `MISSING (${m.event_id})`;

    // Check for duplicate class names or IDs
    const classIds = m.classes.split(',');
    const classNames = [];
    for (const cid of classIds) {
        const cls = db.prepare("SELECT name FROM classes WHERE id = ?").get(cid);
        if (cls) classNames.push(cls.name);
        else classNames.push("UNKNOWN");
    }

    // Check if any class name repeats
    const nameCounts = {};
    classNames.forEach(n => nameCounts[n] = (nameCounts[n] || 0) + 1);

    const dups = Object.keys(nameCounts).filter(n => nameCounts[n] > 1);
    if (dups.length > 0) {
        console.log(`\nEvent: ${evtTitle} (${m.event_id}) -> DUP CLASSES: ${dups.join(', ')}`);
        console.log(`  Classes IDs: ${m.classes}`);
        console.log(`  Classes Names: ${classNames.join(', ')}`);
        console.log(`  Result IDs: ${m.ids}`);
    }
}
