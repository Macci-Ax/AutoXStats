
import { getDb } from '../src/server/config/db.js';

const db = getDb();

const events = db.prepare("SELECT * FROM physical_events ORDER BY start_date").all();
events.forEach(e => {
    console.log(`[${e.id}] ${e.title} (${e.start_date}) Status: ${e.status}`);
});
