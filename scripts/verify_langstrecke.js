
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('autox.db');

const query = `
    SELECT 
        r.rank, 
        r.points, 
        c.name as class_name,
        count(*) as count
    FROM race_results r
    JOIN classes c ON r.class_id = c.id
    WHERE LOWER(c.name) LIKE '%langstrecke%' AND r.rank <= 25
    GROUP BY r.rank, r.points, c.name
    ORDER BY r.rank
`;

console.log("Checking Langstrecke Points...");
console.log("Rank | Points | Count | Class");
console.log("-----|--------|-------|------");

db.all(query, [], (err, rows) => {
    if (err) {
        console.error(err.message);
        process.exit(1);
    }

    const rules = {
        1: 40, 2: 35, 3: 30, 4: 27, 5: 25, 6: 23, 7: 21, 8: 19, 9: 17,
        10: 16, 11: 15, 12: 14, 13: 13, 14: 12, 15: 11, 16: 10, 17: 9,
        18: 8, 19: 7, 20: 6, 21: 5, 22: 4, 23: 3, 24: 2, 25: 1
    };

    let fail = false;
    rows.forEach(row => {
        console.log(`${row.rank.toString().padEnd(4)} | ${row.points.toString().padEnd(6)} | ${row.count.toString().padEnd(5)} | ${row.class_name}`);

        const expected = rules[row.rank];
        if (expected && row.points !== expected) {
            console.error(`  MISMATCH: Rank ${row.rank} should have ${expected}`);
            fail = true;
        }
    });

    if (!fail && rows.length > 0) console.log("\nVERIFICATION PASSED for Langstrecke.");
    else if (rows.length === 0) console.log("\nWARNING: No Langstrecke results found to verify.");
    else console.log("\nVERIFICATION FAILED");

    db.close();
});
