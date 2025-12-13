import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../autox.db');
const db = new Database(dbPath, { verbose: console.log });

const mockDrivers = [
    // --- DRCV Langstrecke ---
    {
        id: 'd_210',
        name: 'René Bouma',
        team: 'Digga Racing Team',
        car: 'Spezialtourenwagen',
        number: 210,
        driverClass: 'Langstrecke',
        current_class_id: 'd_lang',
        points: 218,
        seasonRank: 1,
        wins: 3,
        heatWins: 0,
        podiums: 5
    },
    {
        id: 'd_1',
        name: 'Tobias Hönicke',
        team: 'Team Hönicke',
        car: 'Spezialtourenwagen',
        number: 1,
        driverClass: 'Langstrecke',
        current_class_id: 'd_lang',
        points: 200,
        seasonRank: 2,
        wins: 2,
        heatWins: 0,
        podiums: 4
    },

    // --- DRCV Klasse 01 ---
    {
        id: 'd_163',
        name: 'Mike Hellweg',
        team: 'Team Hellweg',
        car: 'Serientourenwagen bis 1400 ccm',
        number: 163,
        driverClass: 'Klasse 01',
        current_class_id: 'd_k1',
        points: 69,
        seasonRank: 1,
        wins: 4,
        heatWins: 18,
        podiums: 5
    },

    // --- DRCV Klasse 05 ---
    {
        id: 'd_504',
        name: 'Marc Schauseil',
        team: 'Racing Team Velbert',
        car: 'Supertourenwagen bis 1600 ccm (4WD)',
        number: 504,
        driverClass: 'Klasse 05',
        current_class_id: 'd_k5',
        points: 86,
        seasonRank: 1,
        wins: 4,
        heatWins: 21,
        podiums: 5
    }
];

const insertDriver = db.prepare(`
    INSERT OR REPLACE INTO drivers 
    (id, name, team, car, start_number, current_class_id, points, season_rank, wins, heat_wins, podiums) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertParticipation = db.prepare(`
    INSERT OR REPLACE INTO driver_participations 
    (driver_id, class_id, points, rank, wins, podiums) 
    VALUES (?, ?, ?, ?, ?, ?)
`);

const transaction = db.transaction(() => {
    for (const d of mockDrivers) {
        // Insert Driver
        insertDriver.run(
            d.id, d.name, d.team, d.car, d.number,
            d.current_class_id, d.points, d.seasonRank,
            d.wins, d.heatWins, d.podiums
        );

        // Insert Participation
        insertParticipation.run(
            d.id, d.current_class_id, d.points, d.seasonRank, d.wins, d.podiums
        );

        console.log(`Seeded driver ${d.name}`);
    }
});

try {
    transaction();
    console.log('DRCV Mock Data Seeded Successfully.');
} catch (e) {
    console.error('Seeding failed:', e);
} finally {
    db.close();
}
