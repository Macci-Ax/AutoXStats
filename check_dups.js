
import { getDb } from './src/server/config/db.js';

const db = getDb();

console.log("Checking for duplicate drivers (by name)...");
const dupDrivers = db.prepare(`
    SELECT name, count(*) as c, group_concat(id) as ids 
    FROM drivers 
    GROUP BY name 
    HAVING c > 1
`).all();
console.log(dupDrivers);

console.log("\nChecking for duplicate events (by title)...");
const dupEvents = db.prepare(`
    SELECT title, count(*) as c, group_concat(id) as ids 
    FROM physical_events 
    GROUP BY title 
    HAVING c > 1
`).all();
console.log(dupEvents);

console.log("\nChecking for duplicate results (same driver/event/class)...");
// This shouldn't exist if ID is constructed deterministically, but checking regardless
const dupResults = db.prepare(`
    SELECT event_id, driver_id, class_id, count(*) as c
    FROM race_results
    GROUP BY event_id, driver_id, class_id
    HAVING c > 1
`).all();
console.log(dupResults);
