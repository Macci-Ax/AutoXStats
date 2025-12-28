
import { getDb } from '../src/server/config/db.js';

const db = getDb();

// Find ALL triggers
console.log("Finding all triggers...");
const triggers = db.prepare("SELECT name, tbl_name, sql FROM sqlite_master WHERE type = 'trigger'").all();
console.log(`Found ${triggers.length} triggers:`);
triggers.forEach(t => {
    console.log(`  - ${t.name} on ${t.tbl_name}`);
    if (t.sql && t.sql.includes('events')) {
        console.log(`    ^ References 'events' table!`);
    }
});

// Drop all triggers
console.log("\nDropping all triggers...");
for (const t of triggers) {
    try {
        db.exec(`DROP TRIGGER IF EXISTS "${t.name}"`);
        console.log(`  Dropped: ${t.name}`);
    } catch (e) {
        console.log(`  Error dropping ${t.name}: ${e.message}`);
    }
}

console.log("\nVerifying triggers removed...");
const remaining = db.prepare("SELECT name FROM sqlite_master WHERE type = 'trigger'").all();
console.log(`Remaining triggers: ${remaining.length}`);
