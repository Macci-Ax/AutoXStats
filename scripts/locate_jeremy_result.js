
import { getDb } from '../src/server/config/db.js';

const db = getDb();

console.log("Searching for Jeremy's results matching screenshot...");
// Conditions: Driver='Jeremy de Vries', Rank=1 OR Points=9 OR (EventPts=24)
const name = "Jeremy de Vries";
const driver = db.prepare("SELECT * FROM drivers WHERE name LIKE ?").get(`%${name}%`);

const results = db.prepare(`
    SELECT r.*, e.title 
    FROM race_results r 
    JOIN physical_events e ON r.event_id = e.id
    WHERE r.driver_id = ?
`).all(driver.id);

results.forEach(r => {
    // Print if interesting
    if (r.rank === 1 || r.event_points >= 20 || r.points === 9) {
        console.log(`[${r.id}] Event: ${r.title} (${r.event_id}) Class: ${r.class_id}`);
        console.log(`    Rank: ${r.rank}, Pts: ${r.points}, EvtPts: ${r.event_points}, Runs: ${r.run_1}/${r.run_2}/${r.run_3}/${r.run_4}`);
    }
});
