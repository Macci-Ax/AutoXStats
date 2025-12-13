import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../autox.db');

const db = new Database(dbPath);
const output = [];

// Check schema
output.push('=== race_results schema ===');
const tableInfo = db.prepare("PRAGMA table_info(race_results)").all();
tableInfo.forEach(col => output.push(`  ${col.name} (${col.type})`));

// Check if license_type exists
const hasLicenseType = tableInfo.some(col => col.name === 'license_type');
const hasChampionshipPoints = tableInfo.some(col => col.name === 'championship_points');
output.push(`\nHas license_type: ${hasLicenseType}`);
output.push(`Has championship_points: ${hasChampionshipPoints}`);

output.push('\n=== Total race_results count ===');
const count = db.prepare("SELECT COUNT(*) as cnt FROM race_results").get();
output.push(`Count: ${count.cnt}`);

if (hasLicenseType) {
    output.push('\n=== Distinct license_type values ===');
    const licenseTypes = db.prepare("SELECT DISTINCT license_type, COUNT(*) as cnt FROM race_results GROUP BY license_type").all();
    licenseTypes.forEach(lt => output.push(`  ${lt.license_type}: ${lt.cnt}`));
}

output.push('\n=== Events ===');
const events = db.prepare("SELECT id, championship_id, name, date, status FROM events").all();
events.forEach(e => output.push(`  ${e.id} | ${e.championship_id} | ${e.name} | ${e.date} | ${e.status}`));

db.close();

fs.writeFileSync(path.join(__dirname, 'db_check_result.txt'), output.join('\n'), 'utf8');
console.log('Output written to scripts/db_check_result.txt');
