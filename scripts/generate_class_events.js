
import { getDb } from '../src/server/config/db.js';

const db = getDb();

console.log("Generating class_events for DRCV...");

// Get all unique class_id + championship_event_id combinations from race_results for DRCV
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
    // Determine discipline based on class_id
    let discipline = 'klasse';
    if (combo.class_id.includes('_lang')) {
        discipline = 'langstrecke';
    } else if (combo.class_id.includes('_el_')) {
        discipline = 'endlauf';
    } else if (combo.class_id.includes('_sc_')) {
        discipline = 'supercup';
    }

    try {
        db.prepare(`
            INSERT OR IGNORE INTO class_events (class_id, championship_event_id, discipline, is_counting)
            VALUES (?, ?, ?, 1)
        `).run(combo.class_id, combo.championship_event_id, discipline);
        inserted++;
    } catch (e) {
        console.log(`  Error inserting ${combo.class_id} / ${combo.championship_event_id}: ${e.message}`);
    }
}

console.log(`Inserted ${inserted} class_events entries.`);

// Verify
const count = db.prepare("SELECT COUNT(*) as c FROM class_events WHERE class_id LIKE 'd_%'").get();
console.log(`Total DRCV class_events: ${count.c}`);
