
import { getDb } from './src/server/config/db.js';

const db = getDb();
console.log("Checking race_results runs...");
const rows = db.prepare("SELECT * FROM race_results WHERE run_1 IS NOT NULL LIMIT 5").all();
console.log(rows);
