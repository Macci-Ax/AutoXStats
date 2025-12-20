
import Database from 'better-sqlite3';
const db = new Database('./autox.db');

const drcvClasses = db.prepare("SELECT * FROM classes WHERE championship_id = 'DRCV'").all();
console.log(`Found ${drcvClasses.length} DRCV classes.`);

for (const cls of drcvClasses) {
    const parts = db.prepare("SELECT count(*) as c FROM driver_participations WHERE class_id = ? AND points > 0").get(cls.id);
    if (parts.c > 0) {
        console.log(`Class ${cls.name} (${cls.id}) has ${parts.c} participations with points.`);
    }
}
