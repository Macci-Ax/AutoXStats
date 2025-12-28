
import { getDb } from '../src/server/config/db.js';

const db = getDb();

// Check a specific driver
const driver = db.prepare("SELECT * FROM drivers WHERE name LIKE '%Mike Hellweg%'").get();
if (!driver) { console.log("Driver not found"); process.exit(); }

console.log(`Driver: ${driver.name} (${driver.id})`);

// Check participations
const parts = db.prepare("SELECT * FROM driver_participations WHERE driver_id = ?").all(driver.id);
console.log(`\nParticipations: ${parts.length}`);
parts.forEach(p => console.log(`  Class: ${p.class_id}, Points: ${p.points}`));

// Check results  
const results = db.prepare(`
    SELECT r.*, c.name as class_name, pe.title as event_title
    FROM race_results r
    LEFT JOIN classes c ON r.class_id = c.id
    LEFT JOIN championship_events ce ON r.championship_event_id = ce.id
    LEFT JOIN physical_events pe ON ce.physical_event_id = pe.id
    WHERE r.driver_id = ?
`).all(driver.id);

console.log(`\nResults: ${results.length}`);
results.forEach(r => {
    console.log(`  ${r.event_title || 'NO_EVENT'} - ${r.class_name} - Rank: ${r.rank}, ChampPts: ${r.championship_points}`);
});

// Check class_events for this driver's classes
const classIds = [...new Set(parts.map(p => p.class_id))];
console.log(`\nClass Events for classes [${classIds.join(', ')}]:`);
for (const cid of classIds) {
    const ces = db.prepare("SELECT * FROM class_events WHERE class_id = ?").all(cid);
    console.log(`  ${cid}: ${ces.length} events`);
}
