
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = './autox.db';
const db = new Database(dbPath);

const championship = 'DRCV';

let classesQuery = `
    SELECT DISTINCT c.id, c.name, c.championship_id 
    FROM classes c 
    JOIN driver_participations dp ON c.id = dp.class_id 
    WHERE dp.points > 0
`;

const params = [];
if (championship) {
    classesQuery += ` AND c.championship_id = ?`;
    params.push(championship);
}

console.log("Query:", classesQuery);
console.log("Params:", params);

const classes = db.prepare(classesQuery).all(...params);
console.log("Results count:", classes.length);
console.log("Results:", classes);
