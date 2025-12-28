
import { getDb } from '../src/server/config/db.js';

const db = getDb();

function normalizeDate(d) {
    if (!d) return '';
    return d.split(' ')[0]; // Take 'YYYY-MM-DD' part if time buffer exists
}

// 1. Deduplicate Drivers with explicit handling
console.log("Merging duplicate drivers...");
const dupDrivers = db.prepare("SELECT name, group_concat(id) as ids FROM drivers GROUP BY name HAVING count(*) > 1").all();

let driversMerged = 0;
// Disable FK for a moment to allow heavy edits? No, safer to do it right.
// Or just handle errors row by row.

for (const d of dupDrivers) {
    const ids = d.ids.split(',');
    const primaryId = ids[0];
    const duplicateIds = ids.slice(1);

    console.log(`Processing ${d.name} (${ids.length} copies)`);

    for (const dupId of duplicateIds) {
        // Participations
        try {
            // Re-point participations. If conflict (driver already participating in class), delete dup participation
            const parts = db.prepare("SELECT * FROM driver_participations WHERE driver_id = ?").all(dupId);
            for (const p of parts) {
                try {
                    db.prepare("UPDATE driver_participations SET driver_id = ? WHERE driver_id = ? AND class_id = ?").run(primaryId, dupId, p.class_id);
                } catch (e) {
                    // Conflict, so primary already has it. Just delete dup.
                    db.prepare("DELETE FROM driver_participations WHERE driver_id = ? AND class_id = ?").run(dupId, p.class_id);
                }
            }

            // Results
            const results = db.prepare("SELECT * FROM race_results WHERE driver_id = ?").all(dupId);
            for (const r of results) {
                try {
                    // Check if collision on ID? race_results ID contains driver_id usually.
                    // If ID is constructed from driver_ID, updating driver_id column won't change ID column.
                    // But we might violate Unique(event, driver, class).
                    db.prepare("UPDATE race_results SET driver_id = ? WHERE id = ?").run(primaryId, r.id);
                } catch (e) {
                    // Collision.
                    console.log(`  Conflict merging result for ${d.name}. Deleting dup result.`);
                    db.prepare("DELETE FROM race_results WHERE id = ?").run(r.id);
                }
            }

            // Users
            try {
                db.prepare("UPDATE users SET driver_id = ? WHERE driver_id = ?").run(primaryId, dupId);
            } catch (e) { }

            // Now delete driver
            db.prepare("DELETE FROM drivers WHERE id = ?").run(dupId);
            driversMerged++;

        } catch (err) {
            console.error(`  Error merging ${dupId}: ${err.message}`);
        }
    }
}
console.log(`Merged ${driversMerged} duplicate driver records.`);


// 2. Deduplicate Events - Location Match + Year
console.log("Checking for duplicate events...");
const allEvents = db.prepare("SELECT * FROM physical_events").all();

// Simplify: Match loosely on Title similarity or Location+Date
// The user said: "Gleidorf" vs "Gleidorf 22.06.2025"
// Date should be same year.

// Sort events by Title length? We want "Gleidorf 22..." (generated) to likely supersede "Gleidorf" (manual placeholder?) OR merge into manual?
// Usually, we want to keep the one with MORE info (Date).
// But if "Gleidorf" (old) has ID like 'pe_4' and "Gleidorf 22..." has 'evt_...', we might want to keep one or other.
// Let's assume we want to keep the one with the Date in title if it's the 'better' one, OR keep the old one and update it.
// Strategy: Group by Location (first word).
// If multiple in same location within 7 days, merge.

const byLoc = {};
for (const ev of allEvents) {
    const loc = ev.location || ev.title.split(' ')[0];
    if (!byLoc[loc]) byLoc[loc] = [];
    byLoc[loc].push(ev);
}

let eventsMerged = 0;
for (const loc in byLoc) {
    const group = byLoc[loc];
    if (group.length > 1) {
        // Compare every pair
        for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
                const e1 = group[i];
                const e2 = group[j];

                // Check date closeness
                const d1 = new Date(e1.start_date);
                const d2 = new Date(e2.start_date);

                const diffTime = Math.abs(d2 - d1);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays < 60) { // Same season window?
                    // Merge!
                    // Pick target: The one with Valid Date string in title? Or simply e1?
                    // E1 is from list which was DB order.
                    // Let's merge e2 INTO e1 (keep e1).

                    console.log(`Merging event "${e2.title}" (${e2.id}) -> "${e1.title}" (${e1.id})`);

                    // 1. Move Results
                    // race_results has event_id constraint? No, but logic needs care
                    // Update event_id
                    const results = db.prepare("SELECT * FROM race_results WHERE event_id = ?").all(e2.id);
                    for (const r of results) {
                        try {
                            db.prepare("UPDATE race_results SET event_id = ? WHERE id = ?").run(e1.id, r.id);
                        } catch (e) {
                            // Conflict?
                            db.prepare("DELETE FROM race_results WHERE id = ?").run(r.id);
                        }
                    }

                    // 2. Move Championships
                    const ces = db.prepare("SELECT * FROM championship_events WHERE physical_event_id = ?").all(e2.id);
                    for (const ce of ces) {
                        try {
                            db.prepare("UPDATE championship_events SET physical_event_id = ? WHERE id = ?").run(e1.id, ce.id);
                        } catch (e) {
                            // E1 already has this champ? Then we need to merge Results linked to THIS CE to the OTHER CE
                            const targetCE = db.prepare("SELECT id FROM championship_events WHERE physical_event_id = ? AND championship_id = ?").get(e1.id, ce.championship_id);
                            if (targetCE) {
                                // Update results linked to ce.id to targetCE.id
                                // This is RaceResults.championship_event_id column
                                db.prepare("UPDATE OR IGNORE race_results SET championship_event_id = ? WHERE championship_event_id = ?").run(targetCE.id, ce.id);
                                db.prepare("DELETE FROM championship_events WHERE id = ?").run(ce.id);
                            }
                        }
                    }

                    // 3. Delete e2
                    db.prepare("DELETE FROM physical_events WHERE id = ?").run(e2.id);
                    eventsMerged++;

                    // Remove e2 from group array to avoid double processing?
                    // Actually logic holds, just continue.
                }
            }
        }
    }
}
console.log(`Merged ${eventsMerged} duplicate events.`);
