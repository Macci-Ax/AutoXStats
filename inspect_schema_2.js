
import { getDb } from './src/server/config/db.js';

const db = getDb();
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
console.log("Tables:", tables);
