
import { getDb } from '../src/server/config/db.js';

const db = getDb();
const info = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='race_results'").get();
console.log(info.sql);
