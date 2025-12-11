
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('autox.db');

const query = `
    SELECT rank, points, count(*) as count
    FROM race_results 
    WHERE rank <= 10
    GROUP BY rank, points
    ORDER BY rank
`;

console.log("Rank | Points | Count");
console.log("-----|--------|------");

db.all(query, [], (err, rows) => {
    if (err) {
        console.error(err.message);
        process.exit(1);
    }
    rows.forEach(row => {
        console.log(`${row.rank.toString().padEnd(4)} | ${row.points.toString().padEnd(6)} | ${row.count}`);
    });

    // Check specific expectation
    const map = { 1: 9, 2: 7, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2, 8: 1 };
    let fail = false;
    rows.forEach(row => {
        if (map[row.rank] !== undefined) {
            if (row.points !== map[row.rank]) {
                console.error(`MISMATCH: Rank ${row.rank} has ${row.points}, expected ${map[row.rank]}`);
                fail = true;
            }
        }
    });

    if (!fail) console.log("\nVERIFICATION PASSED: All ranks 1-8 have correct points.");
    else console.log("\nVERIFICATION FAILED");

    db.close();
});
