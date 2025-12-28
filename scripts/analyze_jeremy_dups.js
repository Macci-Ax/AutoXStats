
import { getDb } from '../src/server/config/db.js';

const db = getDb();

const name = "Jeremy de Vries";
const drivers = db.prepare("SELECT * FROM drivers WHERE name LIKE ?").all(`%${name}%`);
const driverIds = drivers.map(d => d.id);

console.log(`Driver IDs for ${name}:`, driverIds);

const results = db.prepare(`SELECT id, event_id, driver_id, class_id, rank, points, event_points, run_1 FROM race_results WHERE driver_id IN (${driverIds.map(() => '?').join(',')})`).all(driverIds);

// Group by Event+Class
const grouped = {};
results.forEach(r => {
    const key = `${r.event_id}_${r.class_id}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
});

Object.keys(grouped).forEach(k => {
    const group = grouped[k];
    if (group.length > 1) {
        console.log(`\nDuplicate for ${k}:`);
        group.forEach(r => {
            console.log(JSON.stringify(r));
        });
    }
});
