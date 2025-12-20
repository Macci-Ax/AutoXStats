
import Database from 'better-sqlite3';
const db = new Database('./autox.db');

const classes = db.prepare("SELECT id, name, championship_id FROM classes").all();
console.log("Total classes:", classes.length);
console.log("Sample:", classes.slice(0, 5));

const drcv = classes.filter(c => c.championship_id === 'DRCV');
console.log("DRCV classes count:", drcv.length);

const wacv = classes.filter(c => c.championship_id === 'WACV');
console.log("WACV classes count:", wacv.length);
