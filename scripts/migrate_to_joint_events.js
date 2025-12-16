/**
 * Migration Script: Joint Events (Multi-Championship Support)
 * 
 * This script migrates the database from the old single-championship event model
 * to the new physical_events + championship_events model.
 * 
 * Run with: node scripts/migrate_to_joint_events.js
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../autox.db');
const db = new Database(dbPath, { verbose: console.log });

console.log('Starting Joint Events Migration...');
console.log('='.repeat(50));

// Enable foreign keys (will be enforced after migration)
db.pragma('foreign_keys = OFF');

try {
    db.transaction(() => {
        // ============================================
        // STEP 1: Create physical_events table
        // ============================================
        console.log('\n[1/7] Creating physical_events table...');
        db.exec(`
            CREATE TABLE IF NOT EXISTS physical_events (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                start_date TEXT NOT NULL,
                end_date TEXT,
                location TEXT,
                description TEXT,
                status TEXT DEFAULT 'upcoming'
            )
        `);

        // ============================================
        // STEP 2: Create championship_events table
        // ============================================
        console.log('[2/7] Creating championship_events table...');
        db.exec(`
            CREATE TABLE IF NOT EXISTS championship_events (
                id TEXT PRIMARY KEY,
                physical_event_id TEXT NOT NULL,
                championship_id TEXT NOT NULL,
                has_results INTEGER DEFAULT 0,
                FOREIGN KEY (physical_event_id) REFERENCES physical_events(id),
                FOREIGN KEY (championship_id) REFERENCES championships(id),
                UNIQUE(physical_event_id, championship_id)
            )
        `);

        // ============================================
        // STEP 3: Migrate existing events data
        // ============================================
        console.log('[3/7] Migrating existing events...');

        const oldEvents = db.prepare('SELECT * FROM events').all();
        console.log(`   Found ${oldEvents.length} events to migrate`);

        const insertPhysical = db.prepare(`
            INSERT INTO physical_events (id, title, start_date, end_date, location, description, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const insertChampionship = db.prepare(`
            INSERT INTO championship_events (id, physical_event_id, championship_id, has_results)
            VALUES (?, ?, ?, ?)
        `);

        for (const event of oldEvents) {
            // Create physical event with same ID (prefixed for clarity)
            const physicalId = `pe_${event.id}`;
            const champEventId = `ce_${event.id}`;

            // Determine status mapping
            let status = 'upcoming';
            if (event.status === 'COMPLETED') status = 'finished';
            else if (event.status === 'LIVE') status = 'running';

            // Check if event has results
            const resultCount = db.prepare(
                'SELECT COUNT(*) as count FROM race_results WHERE event_id = ?'
            ).get(event.id);
            const hasResults = resultCount.count > 0 ? 1 : 0;

            // Insert physical event
            insertPhysical.run(
                physicalId,
                event.name,
                event.date,
                event.date, // end_date same as start for single-day
                event.location,
                null, // description
                status
            );

            // Insert championship event
            insertChampionship.run(
                champEventId,
                physicalId,
                event.championship_id,
                hasResults
            );

            console.log(`   ✓ Migrated: ${event.name} → ${physicalId} + ${champEventId}`);
        }

        // ============================================
        // STEP 4: Add championship_event_id to race_results
        // ============================================
        console.log('[4/7] Updating race_results table...');

        // Add new column
        db.exec(`
            ALTER TABLE race_results ADD COLUMN championship_event_id TEXT
        `);

        // Update existing records
        const updateResults = db.prepare(`
            UPDATE race_results 
            SET championship_event_id = 'ce_' || event_id
            WHERE event_id IS NOT NULL
        `);
        const resultChanges = updateResults.run();
        console.log(`   Updated ${resultChanges.changes} race_results records`);

        // ============================================
        // STEP 5: Update photos table
        // ============================================
        console.log('[5/7] Updating photos table...');

        // Check if photos table exists
        const photosExists = db.prepare(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='photos'"
        ).get();

        if (photosExists) {
            // Add new column
            db.exec(`
                ALTER TABLE photos ADD COLUMN physical_event_id TEXT
            `);

            // Update existing records
            const updatePhotos = db.prepare(`
                UPDATE photos 
                SET physical_event_id = 'pe_' || event_id
                WHERE event_id IS NOT NULL
            `);
            const photoChanges = updatePhotos.run();
            console.log(`   Updated ${photoChanges.changes} photos records`);
        } else {
            console.log('   Photos table not found, skipping...');
        }

        // ============================================
        // STEP 6: Update class_events table
        // ============================================
        console.log('[6/7] Updating class_events table...');

        const classEventsExists = db.prepare(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='class_events'"
        ).get();

        if (classEventsExists) {
            // Add new column
            db.exec(`
                ALTER TABLE class_events ADD COLUMN championship_event_id TEXT
            `);

            // Update existing records
            const updateClassEvents = db.prepare(`
                UPDATE class_events 
                SET championship_event_id = 'ce_' || event_id
                WHERE event_id IS NOT NULL
            `);
            const classEventChanges = updateClassEvents.run();
            console.log(`   Updated ${classEventChanges.changes} class_events records`);
        } else {
            console.log('   class_events table not found, skipping...');
        }

        // ============================================
        // STEP 7: Drop old events table
        // ============================================
        console.log('[7/7] Dropping old events table...');
        db.exec('DROP TABLE IF EXISTS events');
        console.log('   ✓ Old events table dropped');

    })();

    // Re-enable foreign keys
    db.pragma('foreign_keys = ON');

    console.log('\n' + '='.repeat(50));
    console.log('Migration completed successfully!');
    console.log('='.repeat(50));

    // Verification summary
    const physicalCount = db.prepare('SELECT COUNT(*) as count FROM physical_events').get();
    const champEventCount = db.prepare('SELECT COUNT(*) as count FROM championship_events').get();
    const resultsWithChampEvent = db.prepare(
        'SELECT COUNT(*) as count FROM race_results WHERE championship_event_id IS NOT NULL'
    ).get();

    console.log('\nVerification Summary:');
    console.log(`  Physical Events: ${physicalCount.count}`);
    console.log(`  Championship Events: ${champEventCount.count}`);
    console.log(`  Race Results with championship_event_id: ${resultsWithChampEvent.count}`);

} catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('The database was not modified (transaction rolled back).');
    process.exit(1);
} finally {
    db.close();
}
