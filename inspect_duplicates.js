
import { getDb } from './src/server/config/db.js';

const db = getDb();

console.log("--- Events Check ---");
const events = db.prepare("SELECT * FROM physical_events ORDER BY start_date").all();
events.forEach(e => {
    console.log(`[${e.id}] "${e.title}" Date: ${e.start_date}`);
});

console.log("\n--- Drivers Check ---");
const drivers = db.prepare("SELECT name, count(*) as c FROM drivers GROUP BY name HAVING c > 1").all();
console.log(`Found ${drivers.length} duplicate driver names.`);
if (drivers.length > 0) {
    drivers.slice(0, 10).forEach(d => console.log(`"${d.name}": ${d.c} copies`));
}
