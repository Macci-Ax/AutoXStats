import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../autox.db');
const db = new Database(dbPath, { verbose: console.log });

// Check counts
const driverCount = db.prepare('SELECT count(*) as c FROM drivers').get().c;
const drcvDriverCount = db.prepare("SELECT count(*) as c FROM drivers WHERE current_class_id LIKE 'd_%'").get().c;
const participationCount = db.prepare('SELECT count(*) as c FROM driver_participations').get().c;

console.log(`Total Drivers: ${driverCount}`);
console.log(`DRCV Drivers (by class ID): ${drcvDriverCount}`);
console.log(`Total Participations: ${participationCount}`);

if (drcvDriverCount > 0) {
    // Check if they have participations
    const missingParticipations = db.prepare(`
        SELECT d.id, d.current_class_id, d.points 
        FROM drivers d
        LEFT JOIN driver_participations dp ON d.id = dp.driver_id AND d.current_class_id = dp.class_id
        WHERE d.current_class_id LIKE 'd_%' AND dp.driver_id IS NULL
    `).all();

    console.log(`Drivers missing participations: ${missingParticipations.length}`);

    if (missingParticipations.length > 0) {
        const insertPart = db.prepare('INSERT INTO driver_participations (driver_id, class_id, points) VALUES (?, ?, ?)');
        const transaction = db.transaction(() => {
            for (const d of missingParticipations) {
                insertPart.run(d.id, d.current_class_id, d.points || 0);
            }
        });
        transaction();
        console.log(`Restored ${missingParticipations.length} participations.`);
    }
} else {
    console.log('No DRCV drivers found in drivers table. Database might need full seed.');
}

db.close();
