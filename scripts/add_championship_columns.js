import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../autox.db');

const db = new Database(dbPath);

// Check if columns exist and add them if not
const tableInfo = db.prepare("PRAGMA table_info(race_results)").all();
const columns = tableInfo.map(col => col.name);

console.log("Existing columns:", columns.join(', '));

// Add missing columns
const columnsToAdd = [
    { name: 'license_type', def: "TEXT DEFAULT 'DRCV'" },
    { name: 'championship_points', def: "INTEGER DEFAULT 0" }
];

for (const col of columnsToAdd) {
    if (!columns.includes(col.name)) {
        console.log(`Adding column: ${col.name}`);
        db.exec(`ALTER TABLE race_results ADD COLUMN ${col.name} ${col.def}`);
    } else {
        console.log(`Column ${col.name} already exists`);
    }
}

// Set default license_type for reconstructed events
console.log("\nSetting license_type = 'DRCV' for all reconstructed events...");
const result = db.prepare("UPDATE race_results SET license_type = 'DRCV' WHERE reconstructed = 1 OR license_type IS NULL").run();
console.log(`Updated ${result.changes} rows`);

// Show current state
console.log("\nCurrent license_type distribution:");
const distribution = db.prepare("SELECT license_type, COUNT(*) as cnt FROM race_results GROUP BY license_type").all();
distribution.forEach(r => console.log(`  ${r.license_type}: ${r.cnt}`));

db.close();
console.log("\nDone!");
