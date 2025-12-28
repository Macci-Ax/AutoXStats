
import Database from 'better-sqlite3';
import fs from 'fs';

let logBuffer = "";

const db = new Database('autox.db', { verbose: console.log });

function getChampPointsForRank(adjustedRank, isLangstrecke) {
    if (isLangstrecke) {
        const langPoints = { 1: 40, 2: 35, 3: 30, 4: 27, 5: 25, 6: 23, 7: 21, 8: 19, 9: 17 };
        if (langPoints[adjustedRank]) return langPoints[adjustedRank];
        if (adjustedRank >= 10 && adjustedRank <= 25) return 26 - adjustedRank;
        return 0;
    } else {
        const pointsMap = { 1: 9, 2: 7, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2, 8: 1 };
        return pointsMap[adjustedRank] || 0;
    }
}

const year = '2025';

// 2. Fetch All Results (The Data) - including license_type for TL rule
const dataQuery = `
    SELECT 
        d.id as driver_id,
        d.name, 
        d.team, 
        d.car, 
        d.start_number as number, 
        d.bio,
        d.heat_wins as static_heat,
        dp.points as static_points,
        dp.class_id,
        c.name as driverClass,
        c.championship_id as champ_id,
        r.id as result_id,
        r.championship_event_id,
        r.championship_points,
        r.rank,
        r.heat_wins as race_heat_wins,
        r.license_type
    FROM drivers d
    JOIN driver_participations dp ON d.id = dp.driver_id
    JOIN classes c ON dp.class_id = c.id
    LEFT JOIN race_results r ON d.id = r.driver_id AND dp.class_id = r.class_id
    LEFT JOIN championship_events ce ON r.championship_event_id = ce.id
    LEFT JOIN physical_events pe ON ce.physical_event_id = pe.id
    WHERE (pe.id IS NULL OR strftime('%Y', pe.start_date) = ?)
`;

// console.log("Running Query...");
const dataRows = db.prepare(dataQuery).all(year);
// console.log(`Fetched ${dataRows.length} rows.`);

// Filter strictly for testing context if needed, but we need global context for ranking
// Step 1: Build event/class result groups to calculate adjusted ranks
const eventClassResults = {};
dataRows.forEach(row => {
    if (!row.result_id) return;
    const key = `${row.championship_event_id}::${row.class_id}`;
    if (!eventClassResults[key]) {
        eventClassResults[key] = [];
    }
    eventClassResults[key].push({
        driver_id: row.driver_id,
        rank: row.rank,
        license_type: row.license_type || 'DRCV',
        result_id: row.result_id,
        heat_wins: row.race_heat_wins || 0,
        name: row.name // Added for debug
    });
});

const log = (msg) => {
    console.log(msg);
    logBuffer += msg + "\n";
};

log("\n--- Debugging Event: ce_evt_a328083f_DRCV (Class 6) ---");
const debugKey = 'ce_evt_a328083f_DRCV::d_k6';
const debugResults = eventClassResults[debugKey];

if (debugResults) {
    log("Raw Results for Event:");
    debugResults.forEach(r => log(JSON.stringify({ name: r.name, rank: r.rank, license: r.license_type })));

    // Apply Logic
    debugResults.sort((a, b) => a.rank - b.rank);
    const drcvResults = debugResults.filter(r => r.license_type !== 'TL');

    log("Filtered DRCV Results:");
    drcvResults.forEach((r, i) => {
        log(JSON.stringify({ name: r.name, originalRank: r.rank, newRank: i + 1, points: getChampPointsForRank(i + 1, false) }));
    });
} else {
    log("No results found for debug event key: " + debugKey);
}

// Full Logic Execution for Dennis Hagedorn
const adjustedPointsMap = {};
Object.entries(eventClassResults).forEach(([key, results]) => {
    const [champEventId, classId] = key.split('::');
    const isLangstrecke = classId.includes('_lang');

    // Sort by original rank
    results.sort((a, b) => a.rank - b.rank);

    // Filter out TL for ranking, but keep track of all
    const drcvResults = results.filter(r => r.license_type !== 'TL');

    // Assign adjusted rank and points for DRCV drivers
    drcvResults.forEach((r, idx) => {
        const adjustedRank = idx + 1;
        adjustedPointsMap[r.result_id] = getChampPointsForRank(adjustedRank, isLangstrecke);
    });

    // TL drivers get 0 championship points
    results.filter(r => r.license_type === 'TL').forEach(r => {
        adjustedPointsMap[r.result_id] = 0;
    });
});


const targetClassId = 'd_k6'; // Based on previous debug output "d_k6" for Klasse 6 events. Warning: DB search said "w_k6". Using "d_k6" as per previous logs.

log(`\n--- Dennis Hagedorn Calculation (Target Class: ${targetClassId}) ---`);

const dennisRows = dataRows.filter(r => r.name && r.name.includes("Dennis Hagedorn"));

const dennisResults = [];
const allDennisResults = [];

dennisRows.forEach(row => {
    if (row.result_id) {
        const adjustedPoints = adjustedPointsMap[row.result_id];
        const isTargetClass = row.class_id === targetClassId;

        log(`Event: ${row.championship_event_id}, Class: ${row.class_id}, Rank: ${row.rank}, License: ${row.license_type}, Adjusted: ${adjustedPoints} ${isTargetClass ? '[MATCH]' : ''}`);

        if (isTargetClass) {
            dennisResults.push(adjustedPoints || 0);
        }
        allDennisResults.push(adjustedPoints || 0);
    }
});

// Drop lowest result (Streicher) logic mimics server.js
// Sort descending
dennisResults.sort((a, b) => b - a);

const rawPoints = dennisResults.reduce((sum, p) => sum + p, 0);

// Drop 1
const scoresToCount = dennisResults.slice(0, Math.max(0, dennisResults.length - 1));
const finalPoints = scoresToCount.reduce((sum, p) => sum + p, 0);

log(`\nRaw Points (Klasse 6): ${rawPoints}`);
log(`Dropped Points: ${rawPoints - finalPoints}`);
log(`Final Points (Klasse 6): ${finalPoints}`);


fs.writeFileSync('debug_result.txt', logBuffer);
