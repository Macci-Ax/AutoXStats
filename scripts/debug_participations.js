import Database from 'better-sqlite3';
const db = new Database('./autox.db');

const drcv = db.prepare(`
    SELECT COUNT(*) as c 
    FROM driver_participations dp 
    JOIN classes c ON dp.class_id = c.id 
    WHERE dp.points > 0 AND c.championship_id = 'DRCV'
`).get();
console.log('DRCV participations with points:', drcv.c);

const wacv = db.prepare(`
    SELECT COUNT(*) as c 
    FROM driver_participations dp 
    JOIN classes c ON dp.class_id = c.id 
    WHERE dp.points > 0 AND c.championship_id = 'WACV'
`).get();
console.log('WACV participations with points:', wacv.c);
