import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../autox.db');

const db = new Database(dbPath);
const lines = [];

lines.push("=== race_results count ===");
const count = db.prepare("SELECT COUNT(*) as cnt FROM race_results").get();
lines.push(`Total: ${count.cnt}`);

lines.push("\n=== license_type distribution ===");
const distribution = db.prepare("SELECT license_type, COUNT(*) as cnt FROM race_results GROUP BY license_type").all();
distribution.forEach(r => lines.push(`  ${r.license_type || 'NULL'}: ${r.cnt}`));

lines.push("\n=== TL drivers sample ===");
const tlDrivers = db.prepare(`
  SELECT rr.license_type, rr.rank, rr.points, d.name, e.name as event_name
  FROM race_results rr
  JOIN drivers d ON rr.driver_id = d.id
  JOIN events e ON rr.event_id = e.id
  WHERE rr.license_type = 'TL'
  LIMIT 10
`).all();
if (tlDrivers.length > 0) {
    tlDrivers.forEach(r => lines.push(`  ${r.name} | ${r.event_name} | rank: ${r.rank} | points: ${r.points}`));
} else {
    lines.push("  No TL drivers found");
}

lines.push("\n=== Events imported ===");
const events = db.prepare("SELECT id, name, date FROM events ORDER BY date").all();
events.forEach(e => lines.push(`  ${e.id}: ${e.name} (${e.date})`));

db.close();

fs.writeFileSync(path.join(__dirname, 'verify_output.txt'), lines.join('\n'), 'utf8');
console.log("Output written to scripts/verify_output.txt");
console.log(lines.join('\n'));
