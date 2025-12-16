/**
 * Verification Script for Joint Events Implementation
 * 
 * Run with: node scripts/verify_joint_events.js
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../autox.db');
const db = new Database(dbPath);

console.log('Joint Events Verification');
console.log('='.repeat(50));

// 1. Verify physical_events table exists and has data
const physicalEvents = db.prepare('SELECT COUNT(*) as count FROM physical_events').get();
console.log(`\n[1] Physical Events: ${physicalEvents.count}`);

// 2. Verify championship_events table exists and has data
const champEvents = db.prepare('SELECT COUNT(*) as count FROM championship_events').get();
console.log(`[2] Championship Events: ${champEvents.count}`);

// 3. Verify all race_results have valid championship_event_id
const resultsWithChampEvent = db.prepare(
    'SELECT COUNT(*) as count FROM race_results WHERE championship_event_id IS NOT NULL'
).get();
const totalResults = db.prepare('SELECT COUNT(*) as count FROM race_results').get();
console.log(`[3] Race Results with championship_event_id: ${resultsWithChampEvent.count}/${totalResults.count}`);

// 4. Check for orphaned results (no valid championship_event_id)
const orphanedResults = db.prepare(`
    SELECT COUNT(*) as count FROM race_results rr
    WHERE rr.championship_event_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM championship_events ce WHERE ce.id = rr.championship_event_id)
`).get();
console.log(`[4] Orphaned Results (invalid FK): ${orphanedResults.count}`);

// 5. Verify no championship_events without physical_events
const orphanedChampEvents = db.prepare(`
    SELECT COUNT(*) as count FROM championship_events ce
    WHERE NOT EXISTS (SELECT 1 FROM physical_events pe WHERE pe.id = ce.physical_event_id)
`).get();
console.log(`[5] Orphaned Championship Events: ${orphanedChampEvents.count}`);

// 6. Sample joint events (if any)
const jointEvents = db.prepare(`
    SELECT pe.id, pe.title, COUNT(ce.id) as champ_count
    FROM physical_events pe
    JOIN championship_events ce ON pe.id = ce.physical_event_id
    GROUP BY pe.id
    HAVING champ_count > 1
`).all();
console.log(`[6] Joint Events (multiple championships): ${jointEvents.length}`);
if (jointEvents.length > 0) {
    jointEvents.forEach(e => console.log(`    - ${e.title}: ${e.champ_count} championships`));
}

// 7. Summary
console.log('\n' + '='.repeat(50));
const allPassed =
    physicalEvents.count > 0 &&
    champEvents.count > 0 &&
    resultsWithChampEvent.count > 0 &&
    orphanedResults.count === 0 &&
    orphanedChampEvents.count === 0;

if (allPassed) {
    console.log('✓ All verification checks PASSED');
} else {
    console.log('✗ Some verification checks FAILED');
}

db.close();
