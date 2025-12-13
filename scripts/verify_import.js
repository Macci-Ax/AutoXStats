import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../autox.db');
const db = new Database(dbPath);

console.log('--- Verification ---');
const drcvCount = db.prepare("SELECT count(*) as c FROM drivers WHERE current_class_id LIKE 'd_%'").get().c;
console.log(`DRCV Drivers: ${drcvCount}`);

const wacvCount = db.prepare("SELECT count(*) as c FROM drivers WHERE current_class_id LIKE 'w_%'").get().c;
console.log(`WACV Drivers: ${wacvCount}`);

const totalParts = db.prepare("SELECT count(*) as c FROM driver_participations").get().c;
console.log(`Total Participations: ${totalParts}`);

const sampleDrcv = db.prepare("SELECT * FROM drivers WHERE current_class_id LIKE 'd_%' LIMIT 1").get();
if (sampleDrcv) {
    console.log('Sample DRCV Driver:', sampleDrcv.name, sampleDrcv.current_class_id);
    const parts = db.prepare("SELECT * FROM driver_participations WHERE driver_id = ?").all(sampleDrcv.id);
    console.log('  Participations:', parts.length);
} else {
    console.log('No DRCV drivers found.');
}
db.close();
