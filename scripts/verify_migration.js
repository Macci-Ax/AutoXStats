
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../autox.db');
const db = new Database(dbPath, { readonly: true });

console.log('--- Verification Report ---');

// 6.1 Validate Teams
try {
    const teams = db.prepare("SELECT * FROM teams").all();
    console.log(`\nTeams Count: ${teams.length}`);
    if (teams.length > 0) {
        console.log('Sample Teams:', teams.slice(0, 5));
    } else {
        console.error('ERROR: No teams found!');
    }
} catch (e) {
    console.error('ERROR validating teams:', e.message);
}

// 6.2 Validate Team Memberships
try {
    const memberships = db.prepare(`
        SELECT d.name as driver, t.name as team, e.name as event
        FROM team_memberships tm
        JOIN drivers d ON d.id = tm.driver_id
        JOIN teams t ON t.id = tm.team_id
        JOIN events e ON e.id = tm.event_id
        LIMIT 20
    `).all();
    console.log(`\nMemberships Sample Count: ${memberships.length}`);
    if (memberships.length > 0) {
        console.log('Sample Memberships:', memberships.slice(0, 3));
    } else {
        console.warn('WARNING: No memberships found (might be expected if no matching data).');
    }
} catch (e) {
    console.error('ERROR validating memberships:', e.message);
}

// 6.3 Validate Race Results
try {
    const results = db.prepare(`
        SELECT driver_id, start_number, car
        FROM race_results
        WHERE start_number IS NOT NULL
        LIMIT 20
    `).all();
    console.log(`\nRace Results with populated start_number/car: ${results.length} (sample size)`);
    if (results.length > 0) {
        console.log('Sample Race Results:', results.slice(0, 3));
    } else {
        console.warn('WARNING: No race results with start_number found.');
    }
} catch (e) {
    console.error('ERROR validating race_results:', e.message);
}

// Check if new tables exist
const newTables = ['teams', 'team_memberships', 'photos', 'videos', 'photo_driver_tags'];
console.log('\nTable Existence Check:');
newTables.forEach(table => {
    const exists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`).get();
    console.log(`- ${table}: ${exists ? 'OK' : 'MISSING'}`);
});

db.close();
