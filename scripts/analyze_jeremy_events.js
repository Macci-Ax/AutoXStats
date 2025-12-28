
import { getDb } from '../src/server/config/db.js';

const db = getDb();

const name = "Jeremy de Vries";
const driver = db.prepare("SELECT * FROM drivers WHERE name LIKE ?").get(`%${name}%`);
if (!driver) { console.log('Driver not found'); process.exit(); }

const results = db.prepare("SELECT r.*, e.title as event_title FROM race_results r JOIN physical_events e ON r.event_id = e.id WHERE r.driver_id = ?").all(driver.id);

console.log(`Results for ${driver.name} (${driver.id}):`);
results.forEach(r => {
    console.log(`Event: "${r.event_title}" (ID: ${r.event_id}) Class: ${r.class_id} Rk:${r.rank} Pts:${r.points}`);
});
