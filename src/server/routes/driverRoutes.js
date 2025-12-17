import express from 'express';
import { getDb } from '../config/db.js';

const router = express.Router();

// GET / (All Drivers with stats)
router.get('/', (req, res) => {
    const year = req.query.year || String(new Date().getFullYear());
    const db = getDb();

    // 1. Fetch Class Events (The Rules)
    const rulesQuery = `
        SELECT cle.class_id, cle.championship_event_id, cle.discipline 
        FROM class_events cle
        JOIN championship_events ce ON cle.championship_event_id = ce.id
        JOIN physical_events pe ON ce.physical_event_id = pe.id
        WHERE strftime('%Y', pe.start_date) = ?
    `;

    // 2. Fetch All Results (The Data)
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
            r.heat_wins as race_heat_wins
        FROM drivers d
        JOIN driver_participations dp ON d.id = dp.driver_id
        JOIN classes c ON dp.class_id = c.id
        LEFT JOIN race_results r ON d.id = r.driver_id AND dp.class_id = r.class_id
        LEFT JOIN championship_events ce ON r.championship_event_id = ce.id
        LEFT JOIN physical_events pe ON ce.physical_event_id = pe.id
        WHERE (pe.id IS NULL OR strftime('%Y', pe.start_date) = ?)
    `;

    db.all(rulesQuery, [year], (err, rulesRows) => {
        if (err) {
            console.error("Database Error (Rules):", err.message);
            return res.status(500).json({ error: err.message });
        }

        // Map: class_id -> { discipline, validEvents: Set(event_id) }
        const classRules = {};
        rulesRows.forEach(r => {
            if (!classRules[r.class_id]) {
                classRules[r.class_id] = { discipline: r.discipline, validEvents: new Set() };
            }
            classRules[r.class_id].validEvents.add(r.championship_event_id);
        });

        db.all(dataQuery, [year], (err, dataRows) => {
            if (err) {
                console.error("Database Error (Data):", err.message);
                return res.status(500).json({ error: err.message });
            }

            // Group by Driver+Class
            const driverMap = {};

            dataRows.forEach(row => {
                const key = `${row.driver_id}::${row.class_id}`;
                if (!driverMap[key]) {
                    driverMap[key] = {
                        driver_id: row.driver_id,
                        class_id: row.class_id,
                        name: row.name,
                        team: row.team,
                        car: row.car,
                        number: row.number,
                        bio: row.bio,
                        driverClass: row.driverClass,
                        champ_id: row.champ_id,
                        static_points: row.static_points || 0,
                        static_heat: row.static_heat || 0,
                        results: []
                    };
                }
                if (row.result_id) {
                    driverMap[key].results.push({
                        championship_event_id: row.championship_event_id,
                        points: row.championship_points || 0,
                        rank: row.rank,
                        heat_wins: row.race_heat_wins || 0
                    });
                }
            });

            // Calculate Points with Streicher Logic
            const entries = Object.values(driverMap).map(d => {
                const rules = classRules[d.class_id];
                const validEventIds = rules ? rules.validEvents : new Set();
                const discipline = rules ? rules.discipline : 'unknown';

                // Filter results to only valid events for this class
                const validResults = d.results.filter(r => validEventIds.has(r.championship_event_id));

                // For Streicher logic: take all valid events, map points, then drop
                const allEventScores = [];
                validEventIds.forEach(champEventId => {
                    const res = validResults.find(r => r.championship_event_id === champEventId);
                    allEventScores.push(res ? res.points : 0);
                });

                // Sort descending
                allEventScores.sort((a, b) => b - a);

                let rawPoints = allEventScores.reduce((sum, p) => sum + p, 0);
                let finalPoints = 0;

                if (discipline === 'klasse' || discipline === 'endlauf') {
                    // Drop last 1 (User correction from original code comment)
                    const scoresToCount = allEventScores.slice(0, Math.max(0, allEventScores.length - 1));
                    finalPoints = scoresToCount.reduce((sum, p) => sum + p, 0);
                } else {
                    finalPoints = rawPoints;
                }

                const hasRaces = validResults.length > 0;

                const wins = validResults.filter(r => r.rank === 1).length;
                const seconds = validResults.filter(r => r.rank === 2).length;
                const thirds = validResults.filter(r => r.rank === 3).length;
                const fourths = validResults.filter(r => r.rank === 4).length;
                const fifths = validResults.filter(r => r.rank === 5).length;
                const heatWins = validResults.reduce((sum, r) => sum + (r.heat_wins || 0), 0);

                return {
                    driver: {
                        id: d.driver_id,
                        name: d.name,
                        bio: d.bio || "",
                        avatarUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=200',
                    },
                    team: d.team ? { id: 't_unknown', name: d.team } : undefined,
                    car: d.car || "",
                    number: d.number,
                    driverClass: d.driverClass || "Unassigned",
                    championships: d.champ_id ? [d.champ_id] : [],
                    stats: {
                        points: hasRaces ? finalPoints : d.static_points,
                        rawPoints: hasRaces ? rawPoints : d.static_points,
                        droppedPoints: hasRaces ? (rawPoints - finalPoints) : 0,
                        wins: hasRaces ? wins : 0,
                        secondPlaces: hasRaces ? seconds : 0,
                        thirdPlaces: hasRaces ? thirds : 0,
                        fourthPlaces: hasRaces ? fourths : 0,
                        fifthPlaces: hasRaces ? fifths : 0,
                        heatWins: hasRaces ? heatWins : d.static_heat,
                        podiums: hasRaces ? (wins + seconds + thirds) : 0,
                        seasonRank: 0,
                    },
                    _classId: d.class_id
                };
            });

            // Recalculate Season Ranks (Grouped by Class ID)
            const byClass = {};
            entries.forEach(e => {
                const key = e._classId || e.driverClass;
                if (!byClass[key]) byClass[key] = [];
                byClass[key].push(e);
            });

            Object.keys(byClass).forEach(key => {
                byClass[key].sort((a, b) => b.stats.points - a.stats.points);
                byClass[key].forEach((e, idx) => {
                    e.stats.seasonRank = idx + 1;
                });
            });

            const sortedEntries = Object.values(byClass).flat();

            sortedEntries.sort((a, b) => {
                if (a.driverClass < b.driverClass) return -1;
                if (a.driverClass > b.driverClass) return 1;
                return a.stats.seasonRank - b.stats.seasonRank;
            });

            res.json(sortedEntries);
        });
    });
});

// GET /:id/results (Specific Driver Results)
router.get('/:id/results', (req, res) => {
    const driverId = req.params.id;
    const db = getDb();
    const query = `
        SELECT 
            pe.title as event_name, 
            pe.start_date as event_date, 
            c.name as class_name, 
            r.rank, 
            COALESCE(r.championship_points, r.points) as points,
            r.heat_wins
        FROM race_results r
        JOIN championship_events ce ON r.championship_event_id = ce.id
        JOIN physical_events pe ON ce.physical_event_id = pe.id
        LEFT JOIN classes c ON r.class_id = c.id
        WHERE r.driver_id = ?
        ORDER BY pe.start_date DESC
    `;

    db.all(query, [driverId], (err, rows) => {
        if (err) {
            console.error("Error fetching driver results:", err.message);
            res.json([]);
            return;
        }
        res.json(rows || []);
    });
});

export default router;
