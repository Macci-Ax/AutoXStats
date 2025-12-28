
import { getDb } from '../src/server/config/db.js';

const db = getDb();
const triggers = db.prepare("SELECT name, tbl_name, sql FROM sqlite_master WHERE type = 'trigger'").all();
console.log(JSON.stringify(triggers, null, 2));
