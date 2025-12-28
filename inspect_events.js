
import { getDb } from './src/server/config/db.js';
const db = getDb();
const info = db.pragma('table_info(physical_events)');
console.log(info.map(c => c.name));
