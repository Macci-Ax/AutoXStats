
import { getDb } from '../src/server/config/db.js';

const db = getDb();

console.log("Disabling foreign keys temporarily...");
db.pragma("foreign_keys = OFF");

console.log("Backing up WACV class_events...");
const wacvEntries = db.prepare("SELECT * FROM class_events WHERE class_id LIKE 'w_%'").all();
console.log(`  Backed up ${wacvEntries.length} WACV entries.`);

console.log("Dropping old class_events table...");
db.exec("DROP TABLE IF EXISTS class_events");

console.log("Creating new class_events table...");
db.exec(`
    CREATE TABLE class_events (
        class_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        discipline TEXT NOT NULL CHECK (discipline IN ('klasse', 'endlauf', 'supercup', 'langstrecke')),
        is_counting BOOLEAN NOT NULL DEFAULT TRUE,
        championship_event_id TEXT,
        PRIMARY KEY (class_id, event_id, discipline),
        FOREIGN KEY (event_id) REFERENCES physical_events(id),
        FOREIGN KEY (class_id) REFERENCES classes(id)
    )
`);

console.log("Restoring WACV entries...");
for (const e of wacvEntries) {
    try {
        db.prepare(`
            INSERT INTO class_events (class_id, event_id, discipline, is_counting, championship_event_id)
            VALUES (?, ?, ?, ?, ?)
        `).run(e.class_id, e.event_id, e.discipline, e.is_counting, e.championship_event_id);
    } catch (err) {
        console.log(`  Error restoring ${e.class_id}: ${err.message}`);
    }
}

console.log("Generating DRCV class_events from race_results...");
const combos = db.prepare(`
    SELECT DISTINCT r.class_id, r.championship_event_id
    FROM race_results r
    JOIN classes c ON r.class_id = c.id
    WHERE c.championship_id = 'DRCV' 
      AND r.championship_event_id IS NOT NULL
`).all();

let inserted = 0;
for (const combo of combos) {
    let discipline = 'klasse';
    if (combo.class_id.includes('_lang')) discipline = 'langstrecke';
    else if (combo.class_id.includes('_el_')) discipline = 'endlauf';
    else if (combo.class_id.includes('_sc_')) discipline = 'supercup';

    const ce = db.prepare("SELECT physical_event_id FROM championship_events WHERE id = ?").get(combo.championship_event_id);
    if (!ce) continue;

    try {
        db.prepare(`
            INSERT OR IGNORE INTO class_events (class_id, event_id, discipline, is_counting, championship_event_id)
            VALUES (?, ?, ?, 1, ?)
        `).run(combo.class_id, ce.physical_event_id, discipline, combo.championship_event_id);
        inserted++;
    } catch (err) {
        // Skip duplicates
    }
}

console.log(`Inserted ${inserted} DRCV class_events.`);

db.pragma("foreign_keys = ON");

const total = db.prepare("SELECT COUNT(*) as c FROM class_events").get();
console.log(`Total class_events: ${total.c}`);
