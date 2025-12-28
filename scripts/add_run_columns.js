
import { getDb } from '../src/server/config/db.js';

const db = getDb();

try {
    console.log("Adding columns to race_results...");
    db.prepare("ALTER TABLE race_results ADD COLUMN run_1 INTEGER DEFAULT NULL").run();
    console.log("Added run_1");
} catch (e) { console.log("run_1 might already exist or error: " + e.message); }

try {
    db.prepare("ALTER TABLE race_results ADD COLUMN run_2 INTEGER DEFAULT NULL").run();
    console.log("Added run_2");
} catch (e) { }

try {
    db.prepare("ALTER TABLE race_results ADD COLUMN run_3 INTEGER DEFAULT NULL").run();
    console.log("Added run_3");
} catch (e) { }

try {
    db.prepare("ALTER TABLE race_results ADD COLUMN run_4 INTEGER DEFAULT NULL").run();
    console.log("Added run_4");
} catch (e) { }

try {
    db.prepare("ALTER TABLE race_results ADD COLUMN event_points INTEGER DEFAULT NULL").run();
    console.log("Added event_points");
} catch (e) { }

console.log("Done.");
