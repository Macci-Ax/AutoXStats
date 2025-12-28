
import { getDb } from './src/server/config/db.js';

const db = getDb();
const info = db.pragma('table_info(physical_events)');
console.log(JSON.stringify(info, null, 2));
