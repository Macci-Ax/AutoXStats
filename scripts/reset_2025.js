
import { getDb } from '../src/server/config/db.js';

const db = getDb();

console.log("Resetting 2025 Finished Events...");

// 1. Identify Events to delete
const eventsToDelete = db.prepare("SELECT id, title FROM physical_events WHERE start_date LIKE '2025%' AND status != 'upcoming'").all();
console.log(`Found ${eventsToDelete.length} events to delete.`);

if (eventsToDelete.length > 0) {
    const placeholders = eventsToDelete.map(() => '?').join(',');
    const ids = eventsToDelete.map(e => e.id);

    // 2. Delete Results linked to these events
    const resInfo = db.prepare(`DELETE FROM race_results WHERE event_id IN (${placeholders})`).run(ids);
    console.log(`Deleted ${resInfo.changes} race results.`);

    // 3. Delete Championship Events linked to these events
    const ceInfo = db.prepare(`DELETE FROM championship_events WHERE physical_event_id IN (${placeholders})`).run(ids);
    console.log(`Deleted ${ceInfo.changes} championship events.`);

    // 4. Delete the Physical Events
    const peInfo = db.prepare(`DELETE FROM physical_events WHERE id IN (${placeholders})`).run(ids);
    console.log(`Deleted ${peInfo.changes} physical events.`);

    // 5. Clean up duplicates in drivers if any leftovers? No, we trust previous merge OR let it be. 
    // Drivers are global.
}

console.log("Reset complete.");
