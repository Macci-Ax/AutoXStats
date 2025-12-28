
import { getDb } from '../src/server/config/db.js';

const db = getDb();

try {
    console.log("Clearing old DRCV class_events...");
    const delResult = db.prepare("DELETE FROM class_events WHERE class_id LIKE 'd_%'").run();
    console.log(`Deleted ${delResult.changes} rows.`);
} catch (e) {
    console.log(`Delete error: ${e.message}`);
}

console.log("\nGenerating new class_events from race_results...");

const combos = db.prepare(`
    SELECT DISTINCT r.class_id, r.championship_event_id
    FROM race_results r
    JOIN classes c ON r.class_id = c.id
    WHERE c.championship_id = 'DRCV' 
      AND r.championship_event_id IS NOT NULL
`).all();

console.log(`Found ${combos.length} unique class/event combinations.`);

let inserted = 0;
for (const combo of combos) {
    let discipline = 'klasse';
    if (combo.class_id.includes('_lang')) {
        discipline = 'langstrecke';
    } else if (combo.class_id.includes('_el_')) {
        discipline = 'endlauf';
    } else if (combo.class_id.includes('_sc_')) {
        discipline = 'supercup';
    }

    const ce = db.prepare("SELECT physical_event_id FROM championship_events WHERE id = ?").get(combo.championship_event_id);
    const eventId = ce ? ce.physical_event_id : null;

    if (!eventId) {
        console.log(`  Skipping ${combo.class_id} / ${combo.championship_event_id} - no physical_event_id`);
        continue;
    }

    // Check existing columns
    try {
        db.prepare(`
            INSERT INTO class_events (class_id, event_id, discipline, is_counting, championship_event_id)
            VALUES (?, ?, ?, 1, ?)
        `).run(combo.class_id, eventId, discipline, combo.championship_event_id);
        inserted++;
    } catch (e) {
        if (e.message.includes('UNIQUE')) {
            // Already exists, skip
        } else {
            console.log(`  Error: ${e.message}`);
        }
    }
}

console.log(`Inserted ${inserted} class_events entries.`);

const count = db.prepare("SELECT COUNT(*) as c FROM class_events WHERE class_id LIKE 'd_%'").get();
console.log(`Total DRCV class_events: ${count.c}`);
