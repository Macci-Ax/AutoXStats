
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../autox.db');
const db = new Database(dbPath, { verbose: console.log });

console.log('Starting Migration...');

const migrationSteps = [
    // 4.1 Teams
    `CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
    );`,

    // 4.2 Team Memberships
    `CREATE TABLE IF NOT EXISTS team_memberships (
        team_id TEXT NOT NULL,
        driver_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        role TEXT NOT NULL,
        PRIMARY KEY (team_id, driver_id, event_id)
    );`,

    // 4.3 Photos
    `CREATE TABLE IF NOT EXISTS photos (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        storage_path TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS photo_driver_tags (
        photo_id TEXT NOT NULL,
        driver_id TEXT NOT NULL,
        PRIMARY KEY (photo_id, driver_id)
    );`,

    // 4.4 Videos
    `CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY,
        driver_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        youtube_url TEXT NOT NULL,
        consent_given BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    // 5.1 Extract Teams
    `INSERT OR IGNORE INTO teams (id, name)
    SELECT DISTINCT
        lower(replace(team, ' ', '_')) AS id,
        team
    FROM drivers
    WHERE team IS NOT NULL;`,

    // 5.2 Create Team Memberships
    `INSERT OR IGNORE INTO team_memberships (team_id, driver_id, event_id, role)
    SELECT DISTINCT
        lower(replace(d.team, ' ', '_')) AS team_id,
        d.id AS driver_id,
        e.id AS event_id,
        'driver' AS role
    FROM drivers d
    JOIN events e ON e.championship_id = (
        SELECT championship_id FROM classes WHERE id = d.current_class_id
    )
    WHERE d.team IS NOT NULL;`,

    // 5.3 Move Event-Specific Fields
    // Using try-catch for ALTER TABLE as they might fail on re-run or strict SQLite versions if columns exist
    // However, instructions say "Add missing columns", so we attempt it. 
    // Checking column existence first to avoid error would be cleaner but direct EXEC is requested.
    // Better-sqlite3 throws if column exists. 
];

// Special handling for ALTER TABLE to make it idempotent-ish or safe
const alterSteps = [
    {
        sql: `ALTER TABLE race_results ADD COLUMN start_number INTEGER;`,
        check: `SELECT start_number FROM race_results LIMIT 1;`
    },
    {
        sql: `ALTER TABLE race_results ADD COLUMN car TEXT;`,
        check: `SELECT car FROM race_results LIMIT 1;`
    }
];

const updateRaceResults = `
    UPDATE race_results
    SET
        start_number = (SELECT start_number FROM drivers WHERE drivers.id = race_results.driver_id),
        car = (SELECT car FROM drivers WHERE drivers.id = race_results.driver_id)
    WHERE driver_id IN (SELECT id FROM drivers);
`;

const transaction = db.transaction(() => {
    // 1. Create Tables & Insert Data
    for (const step of migrationSteps) {
        db.exec(step);
    }

    // 2. Alter Tables (safely)
    for (const step of alterSteps) {
        try {
            // Check if column exists by trying to select it. If it fails, we run the ALTER.
            // Actually, simpler to just run ALTER and catch specific error "duplicate column name"
            db.exec(step.sql);
        } catch (e) {
            if (e.message.includes('duplicate column name')) {
                console.log(`Column already exists, skipping: ${step.sql}`);
            } else {
                throw e;
            }
        }
    }

    // 3. Update Data
    db.exec(updateRaceResults);
});

try {
    transaction();
    console.log('Migration completed successfully.');
} catch (e) {
    console.error('Migration failed:', e);
    process.exit(1);
} finally {
    db.close();
}
