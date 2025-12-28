
import { getDb } from '../src/server/config/db.js';

const db = getDb();

// Find all triggers
console.log("Finding triggers on class_events...");
const triggers = db.prepare("SELECT name, sql FROM sqlite_master WHERE type = 'trigger' AND tbl_name = 'class_events'").all();
console.log(`Found ${triggers.length} triggers:`);
triggers.forEach(t => console.log(`  - ${t.name}`));

// Drop all triggers on class_events
for (const t of triggers) {
    console.log(`Dropping trigger: ${t.name}`);
    db.exec(`DROP TRIGGER IF EXISTS ${t.name}`);
}

console.log("\nNow trying to insert class_events...");

const combos = db.prepare(`
    SELECT DISTINCT r.class_id, r.championship_event_id
    FROM race_results r
    JOIN classes c ON r.class_id = c.id
    WHERE c.championship_id = 'DRCV' 
      AND r.championship_event_id IS NOT NULL
`).all();

console.log(`Found ${combos.length} unique class/event combinations.`);

// Clear old DRCV entries
db.prepare("DELETE FROM class_events WHERE class_id LIKE 'd_%'").run();

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

    if (!eventId) continue;

    try {
        db.prepare(`
            INSERT INTO class_events (class_id, event_id, discipline, is_counting, championship_event_id)
            VALUES (?, ?, ?, 1, ?)
        `).run(combo.class_id, eventId, discipline, combo.championship_event_id);
        inserted++;
    } catch (e) {
        console.log(`  Error: ${e.message}`);
    }
}

console.log(`Inserted ${inserted} class_events entries.`);
const count = db.prepare("SELECT COUNT(*) as c FROM class_events WHERE class_id LIKE 'd_%'").get();
console.log(`Total DRCV class_events: ${count.c}`);
