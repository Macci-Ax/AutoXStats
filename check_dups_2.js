
import { getDb } from './src/server/config/db.js';

const db = getDb();

console.log("--- Events ---");
const events = db.prepare("SELECT id, title, start_date, location FROM physical_events").all();
events.forEach(e => console.log(`${e.id}: ${e.title} (${e.start_date})`));

console.log("\n--- Duplicate Drivers ---");
const dupDrivers = db.prepare(`
    SELECT name, count(*) as c, group_concat(id) as ids 
    FROM drivers 
    GROUP BY name 
    HAVING c > 1
`).all();
dupDrivers.forEach(d => console.log(`${d.name}: ${d.c} [${d.ids}]`));
