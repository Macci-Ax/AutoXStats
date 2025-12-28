
import { getDb } from '../src/server/config/db.js';

const db = getDb();

// 1. Deduplicate Drivers
console.log("Merging duplicate drivers...");
const dupDrivers = db.prepare("SELECT name, group_concat(id) as ids FROM drivers GROUP BY name HAVING count(*) > 1").all();

let driversMerged = 0;
for (const d of dupDrivers) {
    const ids = d.ids.split(',');
    const primaryId = ids[0];
    const duplicateIds = ids.slice(1);

    // Merge duplicates into primary
    for (const dupId of duplicateIds) {
        try {
            // Update participations
            db.prepare("UPDATE OR IGNORE driver_participations SET driver_id = ? WHERE driver_id = ?").run(primaryId, dupId);
            db.prepare("DELETE FROM driver_participations WHERE driver_id = ?").run(dupId); // Delete remaining duplicates

            // Update results
            db.prepare("UPDATE OR IGNORE race_results SET driver_id = ? WHERE driver_id = ?").run(primaryId, dupId);
            db.prepare("DELETE FROM race_results WHERE driver_id = ?").run(dupId);

            // Update users link
            db.prepare("UPDATE OR IGNORE users SET driver_id = ? WHERE driver_id = ?").run(primaryId, dupId);

            // Delete duplicate driver
            db.prepare("DELETE FROM drivers WHERE id = ?").run(dupId);

            driversMerged++;
        } catch (err) {
            console.error(`Error merging ${d.name} (${dupId} -> ${primaryId}):`, err);
        }
    }
}
console.log(`Merged ${driversMerged} duplicate driver records.`);


// 2. Deduplicate Events using spatial/fuzzy logic
// We suspect "Location" vs "Location DD.MM.YYYY"
console.log("Checking for duplicate events...");
const allEvents = db.prepare("SELECT * FROM physical_events").all();
const locMap = {};

// Group by location (first word roughly)
for (const ev of allEvents) {
    const loc = ev.location; // Should be just 'Dauborn', 'Eppe' etc.
    if (!locMap[loc]) locMap[loc] = [];
    locMap[loc].push(ev);
}

let eventsMerged = 0;
for (const loc in locMap) {
    const group = locMap[loc];
    if (group.length > 1) {
        // Try to find pairs with same date
        // Create map by Date
        const byDate = {};
        for (const ev of group) {
            if (!byDate[ev.start_date]) byDate[ev.start_date] = [];
            byDate[ev.start_date].push(ev);
        }

        for (const date in byDate) {
            const dateGroup = byDate[date];
            if (dateGroup.length > 1) {
                // Determine primary: prefer the one with data or just the first one?
                // Prefer the one that is NOT 'reconstructed' status maybe? or has longer title?
                // Let's pick the first one as primary
                const primary = dateGroup[0];
                const dups = dateGroup.slice(1);

                for (const dup of dups) {
                    console.log(`Merging event "${dup.title}" (${dup.id}) into "${primary.title}" (${primary.id})`);

                    // Update results
                    db.prepare("UPDATE OR IGNORE race_results SET event_id = ? WHERE event_id = ?").run(primary.id, dup.id);
                    db.prepare("DELETE FROM race_results WHERE event_id = ?").run(dup.id);

                    // Update champ events - this is tricky, champ events point to phys events
                    // Get champ events for dup
                    const dupCEs = db.prepare("SELECT * FROM championship_events WHERE physical_event_id = ?").all(dup.id);
                    for (const dce of dupCEs) {
                        // Check if primary already has this championship
                        const existing = db.prepare("SELECT id FROM championship_events WHERE physical_event_id = ? AND championship_id = ?").get(primary.id, dce.championship_id);
                        if (existing) {
                            // Re-link results from dup-CE to primary-CE
                            db.prepare("UPDATE OR IGNORE race_results SET championship_event_id = ? WHERE championship_event_id = ?").run(existing.id, dce.id);
                            // Delete dup-CE
                            // Results might have constraint issues if we don't handle them carefuly
                            db.prepare("DELETE FROM championship_events WHERE id = ?").run(dce.id);
                        } else {
                            // Move CE to primary PE
                            db.prepare("UPDATE championship_events SET physical_event_id = ? WHERE id = ?").run(primary.id, dce.id);
                        }
                    }

                    // Delete dup physical event
                    db.prepare("DELETE FROM physical_events WHERE id = ?").run(dup.id);
                    eventsMerged++;
                }
            }
        }
    }
}
console.log(`Merged ${eventsMerged} duplicate events.`);

