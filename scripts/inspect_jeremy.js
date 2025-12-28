
import { getDb } from '../src/server/config/db.js';

const db = getDb();

const name = "Jeremy de Vries";
console.log(`Searching for '${name}'...`);
const drivers = db.prepare("SELECT * FROM drivers WHERE name LIKE ?").all(`%${name}%`);
console.log(drivers);

if (drivers.length > 0) {
    const ids = drivers.map(d => d.id);
    const placeholders = ids.map(() => '?').join(',');

    console.log("\nRecent Results for these drivers:");
    const results = db.prepare(`SELECT * FROM race_results WHERE driver_id IN (${placeholders}) LIMIT 10`).all(ids);
    results.forEach(r => {
        console.log(`[${r.id}] Evt:${r.event_id} Cls:${r.class_id} Rank:${r.rank} Pts:${r.points}/${r.championship_points} R1:${r.run_1}`);
    });
}
