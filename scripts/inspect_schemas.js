
import { getDb } from '../src/server/config/db.js';

const db = getDb();
console.log("CE Schema:");
const ce = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='championship_events'").get();
console.log(ce ? ce.sql : "Not Found");

console.log("PE Schema:");
const pe = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='physical_events'").get();
console.log(pe ? pe.sql : "Not Found");
