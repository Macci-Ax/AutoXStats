
import { getDb } from '../src/server/config/db.js';

const db = getDb();
console.log(JSON.stringify(db.pragma('table_info(race_results)'), null, 2));
