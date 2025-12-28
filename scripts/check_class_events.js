
import { getDb } from '../src/server/config/db.js';

const db = getDb();

console.log("Checking class_events table...");
const ce = db.prepare("SELECT * FROM class_events LIMIT 20").all();
console.log(`Found ${ce.length} class_events.`);
console.log(JSON.stringify(ce.slice(0, 5), null, 2));

console.log("\nChecking race_results with championship_event_id...");
const rr = db.prepare("SELECT id, event_id, championship_event_id, class_id, championship_points FROM race_results WHERE championship_event_id IS NOT NULL LIMIT 10").all();
console.log(`Found ${rr.length} results with championship_event_id.`);
console.log(JSON.stringify(rr.slice(0, 3), null, 2));
