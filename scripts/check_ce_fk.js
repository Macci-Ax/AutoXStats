
import { getDb } from '../src/server/config/db.js';

const db = getDb();

console.log("class_events CREATE statement:");
const info = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='class_events'").get();
console.log(info.sql);

console.log("\nForeign key pragma:");
const fks = db.pragma("foreign_key_list(class_events)");
console.log(JSON.stringify(fks, null, 2));

console.log("\nForeign keys enabled?");
const fkOn = db.pragma("foreign_keys");
console.log(fkOn);
