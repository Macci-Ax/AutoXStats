
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../autox.db');
const db = new Database(dbPath);

const result = db.prepare("SELECT event_id FROM race_results LIMIT 1").get();
console.log("Race Result Event ID:", result ? result.event_id : "No results");

if (result && result.event_id) {
    const event = db.prepare("SELECT * FROM physical_events WHERE id = ?").get(result.event_id);
    console.log("Matching Physical Event:", event);
} else {
    // List some physical events
    const events = db.prepare("SELECT * FROM physical_events LIMIT 5").all();
    console.log("Physical Events sample:", events);
}
