
import { getDb } from '../src/server/config/db.js';

const db = getDb();

console.log("class_events schema:");
const info = db.pragma("table_info(class_events)");
console.log(JSON.stringify(info, null, 2));

console.log("\nSample class_events:");
const samples = db.prepare("SELECT * FROM class_events WHERE class_id = 'd_k1' LIMIT 3").all();
console.log(JSON.stringify(samples, null, 2));
