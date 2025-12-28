
import { getDb } from './src/server/config/db.js';

const db = getDb();
const row = db.prepare("SELECT * FROM physical_events WHERE title LIKE '%Dauborn%'").get();
console.log(row);
