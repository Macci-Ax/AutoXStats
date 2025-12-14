import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import Parser from 'rss-parser';

const app = express();
const PORT = 3000;
const DB_PATH = './autox.db';

app.use(cors());
app.use(express.json());

// Helper to get DB connection (using callback-based sqlite3 for simplicity in standard node usage with 'sqlite3' package)
const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
    } else {
        console.log("Connected to the SQLite database.");
    }
});

app.get('/', (req, res) => {
    res.send('AutoXStats API Server is running. Access endpoints at /api/drivers or /api/events');
});

// GET /api/years
// Returns all years for which data exists, sorted descending
app.get('/api/years', (req, res) => {
    const query = `
        SELECT DISTINCT strftime('%Y', e.date) as year
        FROM events e
        JOIN race_results rr ON e.id = rr.event_id
        WHERE e.date IS NOT NULL
        ORDER BY year DESC
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Database Error (Years):", err.message);
            res.status(400).json({ error: err.message });
            return;
        }
        const years = rows.map(r => parseInt(r.year)).filter(y => !isNaN(y));
        res.json(years);
    });
});

// GET /api/drivers
// Returns all drivers with calculated total stats
// Query params: ?year=YYYY (optional, defaults to current year)
// GET /api/drivers
// Returns all drivers with calculated total stats including Streicher (dropped scores)
// Query params: ?year=YYYY (optional, defaults to current year)
app.get('/api/drivers', (req, res) => {
    // Use query parameter year or default to current year
    const year = req.query.year || String(new Date().getFullYear());

    // 1. Fetch Class Events (The Rules)
    const rulesQuery = `
        SELECT class_id, event_id, discipline 
        FROM class_events 
        JOIN events e ON class_events.event_id = e.id
        WHERE strftime('%Y', e.date) = ?
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
            dp.points as static_points, -- Fallback for manual points
            dp.class_id,
            c.name as driverClass,
            c.championship_id as champ_id,
            r.id as result_id,
            r.event_id,
            r.championship_points,
            r.rank,
            r.heat_wins as race_heat_wins
        FROM drivers d
        JOIN driver_participations dp ON d.id = dp.driver_id
        JOIN classes c ON dp.class_id = c.id
        LEFT JOIN race_results r ON d.id = r.driver_id AND dp.class_id = r.class_id
        LEFT JOIN events e ON r.event_id = e.id
        WHERE (e.id IS NULL OR strftime('%Y', e.date) = ?)
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
            classRules[r.class_id].validEvents.add(r.event_id);
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
                if (row.result_id) { // If they have a result
                    driverMap[key].results.push({
                        event_id: row.event_id,
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
                const validResults = d.results.filter(r => validEventIds.has(r.event_id));

                // Determine missing events (did not participate) -> 0 points
                // Actually, for Streicher logic, we just take the list of ALL valid events for the class,
                // map the driver's points (0 if missing), and then drop.

                const allEventScores = [];
                validEventIds.forEach(eventId => {
                    const res = validResults.find(r => r.event_id === eventId);
                    allEventScores.push(res ? res.points : 0);
                });

                // Sort descending
                allEventScores.sort((a, b) => b - a);

                let rawPoints = allEventScores.reduce((sum, p) => sum + p, 0);
                let finalPoints = 0;

                // RULE: Drop 2 worst results ONLY for 'klasse'
                // BUT: Only if there are enough events? Usually rule is absolute.
                // Assuming simple "Drop worst 2" for now.

                if (discipline === 'klasse' || discipline === 'endlauf') {
                    // Drop last 1 (User correction)
                    const scoresToCount = allEventScores.slice(0, Math.max(0, allEventScores.length - 1));
                    finalPoints = scoresToCount.reduce((sum, p) => sum + p, 0);
                } else {
                    // No drops for other disciplines
                    finalPoints = rawPoints;
                }

                // Legacy / Static Data Handling
                const hasRaces = validResults.length > 0;

                // Aggregates
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
                        rawPoints: hasRaces ? rawPoints : d.static_points, // NEW FIELD
                        droppedPoints: hasRaces ? (rawPoints - finalPoints) : 0, // NEW FIELD
                        wins: hasRaces ? wins : 0,
                        secondPlaces: hasRaces ? seconds : 0,
                        thirdPlaces: hasRaces ? thirds : 0,
                        fourthPlaces: hasRaces ? fourths : 0,
                        fifthPlaces: hasRaces ? fifths : 0,
                        heatWins: hasRaces ? heatWins : d.static_heat,
                        podiums: hasRaces ? (wins + seconds + thirds) : 0,
                        seasonRank: 0, // Will recalculate sorting below
                    }
                };
            });

            // Recalculate Season Ranks properly across the whole list (grouped by class)
            // 1. Group by class name
            const byClass = {};
            entries.forEach(e => {
                if (!byClass[e.driverClass]) byClass[e.driverClass] = [];
                byClass[e.driverClass].push(e);
            });

            // 2. Sort and assign rank
            Object.keys(byClass).forEach(cls => {
                // Sort by Points (Desc), then Wins, then Seconds... (simple version: just Points)
                byClass[cls].sort((a, b) => b.stats.points - a.stats.points);
                byClass[cls].forEach((e, idx) => {
                    e.stats.seasonRank = idx + 1;
                });
            });

            // Flatten back to list
            const sortedEntries = Object.values(byClass).flat();

            // Final sort for display (optional, can just return list)
            // Sorting by Class Name then Rank
            sortedEntries.sort((a, b) => {
                if (a.driverClass < b.driverClass) return -1;
                if (a.driverClass > b.driverClass) return 1;
                return a.stats.seasonRank - b.stats.seasonRank;
            });

            res.json(sortedEntries);
        });
    });
});

// GET /api/leaderboard/random-class
// Returns top 3 drivers for a random class
app.get('/api/leaderboard/random-class', (req, res) => {
    // 1. Select a random class that has participations
    const classQuery = `
        SELECT c.id, c.name FROM classes c
        JOIN driver_participations dp ON c.id = dp.class_id
        GROUP BY c.id
        ORDER BY RANDOM()
        LIMIT 1
    `;

    db.get(classQuery, [], (err, classRow) => {
        if (err) {
            console.error("Database Error (Random Class):", err.message);
            res.status(500).json({ error: err.message });
            return;
        }

        if (!classRow) {
            res.status(404).json({ error: "No active classes found" });
            return;
        }

        const classId = classRow.id;
        const className = classRow.name;

        // 2. Get Top 3 drivers for this class
        const driversQuery = `
            SELECT 
                d.id, d.name, d.team, d.car, 
                dp.points as static_points,
                SUM(r.championship_points) as calc_points,
                COUNT(r.id) as races
            FROM drivers d
            JOIN driver_participations dp ON d.id = dp.driver_id
            LEFT JOIN race_results r ON d.id = r.driver_id AND dp.class_id = r.class_id
                AND EXISTS (SELECT 1 FROM class_events ce WHERE ce.class_id = r.class_id AND ce.event_id = r.event_id)
            WHERE dp.class_id = ?
            GROUP BY d.id
            ORDER BY COALESCE(SUM(r.championship_points), dp.points) DESC
            LIMIT 3
        `;

        db.all(driversQuery, [classId], (err, rows) => {
            if (err) {
                console.error("Database Error (Drivers):", err.message);
                return res.status(500).json({ error: err.message });
            }

            const drivers = rows.map(row => ({
                driver: {
                    id: row.id,
                    name: row.name,
                    avatarUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=200'
                },
                team: row.team ? { id: 't_unk', name: row.team } : undefined,
                car: row.car || "",
                stats: {
                    points: row.races > 0 ? (row.calc_points || 0) : (row.static_points || 0),
                    wins: 0, podiums: 0, heatWins: 0, secondPlaces: 0, thirdPlaces: 0, fourthPlaces: 0, fifthPlaces: 0 // Simplification for random widget
                }
            }));

            res.json({
                classId,
                className,
                drivers
            });
        });
    });
});

// GET /api/drivers/:id/results
app.get('/api/drivers/:id/results', (req, res) => {
    const driverId = req.params.id;
    const query = `
        SELECT 
            e.name as event_name, 
            e.date as event_date, 
            c.name as class_name, 
            r.rank, 
            r.points,
            r.heat_wins
        FROM race_results r
        JOIN events e ON r.event_id = e.id
        LEFT JOIN classes c ON r.class_id = c.id
        WHERE r.driver_id = ?
        ORDER BY e.date DESC
    `;

    db.all(query, [driverId], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// GET /api/events
// Query params: ?year=YYYY (optional, defaults to current year)
app.get('/api/events', (req, res) => {
    const year = req.query.year || String(new Date().getFullYear());
    const query = `
        SELECT e.id, e.championship_id as championship, e.name, e.date, e.location, e.status
        FROM events e
        WHERE strftime('%Y', e.date) = ?
        ORDER BY e.date
    `;

    db.all(query, [year], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// GET /api/classes
// Returns all classes available in the system
app.get('/api/classes', (req, res) => {
    const query = "SELECT * FROM classes ORDER BY name";
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// GET /api/race-results
// Returns results for a specific event and class
// Query params: ?event_id=...&class_id=...
app.get('/api/race-results', (req, res) => {
    const { event_id, class_id } = req.query;

    if (!event_id || !class_id) {
        return res.status(400).json({ error: "Missing required query params: event_id, class_id" });
    }

    const query = `
        SELECT 
            rr.id, 
            d.name as driver_name, 
            COALESCE(rr.start_number, d.start_number) as start_number, 
            COALESCE(rr.car, d.car) as car,
            rr.rank, 
            rr.points, 
            rr.championship_points 
        FROM race_results rr
        JOIN drivers d ON rr.driver_id = d.id
        WHERE rr.event_id = ? AND rr.class_id = ?
        ORDER BY rr.rank
    `;

    db.all(query, [event_id, class_id], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// GET /api/admin/all-drivers
// Returns simple list of all drivers for the dropdown
app.get('/api/admin/all-drivers', (req, res) => {
    const query = "SELECT id, name FROM drivers ORDER BY name";
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// GET /api/admin/driver-results
// Returns all results for a specific driver (for admin editing)
app.get('/api/admin/driver-results', (req, res) => {
    const { driver_id } = req.query;
    if (!driver_id) return res.status(400).json({ error: "Missing driver_id" });

    const query = `
        SELECT 
            rr.id,
            rr.class_id,
            e.name as event_name,
            e.date as event_date,
            c.name as class_name,
            COALESCE(rr.start_number, d.start_number) as start_number,
            COALESCE(rr.car, d.car) as car,
            rr.rank,
            rr.points,
            rr.championship_points,
            d.name as driver_name
        FROM race_results rr
        JOIN events e ON rr.event_id = e.id
        JOIN classes c ON rr.class_id = c.id
        JOIN drivers d ON rr.driver_id = d.id
        WHERE rr.driver_id = ?
        ORDER BY e.date DESC
    `;

    db.all(query, [driver_id], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// PUT /api/results/:id
// Update a specific race result (Rank, Points, Championship Points, Car, and StartNr)
app.put('/api/results/:id', (req, res) => {
    const resultId = req.params.id;
    const { rank, points, championship_points, car, start_number } = req.body;

    // Validate inputs (basic)
    if (rank === undefined || points === undefined || championship_points === undefined) {
        return res.status(400).json({ error: "Missing required fields: rank, points, championship_points" });
    }

    const query = `
        UPDATE race_results 
        SET rank = ?, points = ?, championship_points = ?, car = ?, start_number = ?
        WHERE id = ?
    `;

    db.run(query, [rank, points, championship_points, car, start_number, resultId], function (err) {
        if (err) {
            console.error("Error updating result:", err.message);
            res.status(400).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: "Result not found" });
            return;
        }
        res.json({ message: "Result updated successfully", changes: this.changes });
    });
});

app.get('/api/events/:id/results', (req, res) => {
    const eventId = req.params.id;
    const query = `
        SELECT 
            rr.id,
            rr.class_id,
            c.name as class_name,
            -- Prioritize result-specific start number and car, fallback to driver defaults
            COALESCE(rr.start_number, d.start_number) as start_number,
            COALESCE(rr.car, d.car) as car,
            rr.rank,
            rr.points,
            rr.championship_points,
            d.name as driver_name,
            d.team as driver_team
        FROM race_results rr
        JOIN classes c ON rr.class_id = c.id
        JOIN drivers d ON rr.driver_id = d.id
        WHERE rr.event_id = ?
        ORDER BY c.name, rr.rank ASC
    `;

    db.all(query, [eventId], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// GET /api/youtube-feed
// Returns latest 3 videos from the configured channel
app.get('/api/youtube-feed', async (req, res) => {
    // TODO: Replace with actual Channel ID for @marc.ristau
    // Try to find it via: https://www.youtube.com/@marc.ristau -> View Source -> "channelId"
    const CHANNEL_ID = 'UCwDptcdlkqp4uWGXe7gGk1Q';
    const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
    const parser = new Parser();

    try {
        const feed = await parser.parseURL(FEED_URL);
        const videos = feed.items.slice(0, 3).map(item => ({
            id: item.id.replace('yt:video:', ''),
            title: item.title,
            link: item.link,
            thumbnail: `https://i.ytimg.com/vi/${item.id.replace('yt:video:', '')}/mqdefault.jpg`,
            date: item.pubDate
        }));
        res.json(videos);
    } catch (error) {
        console.error("Error fetching YouTube feed:", error.message);
        // Fallback mock data if feed fails (or ID is invalid)
        res.json([
            {
                id: 'mock1',
                title: 'Autocross Saison 2025 - Teaser (Placeholder)',
                link: 'https://www.youtube.com/@marc.ristau',
                thumbnail: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=800',
                date: new Date().toISOString()
            },
            {
                id: 'mock2',
                title: 'Onboard Kamera - Finale (Placeholder)',
                link: 'https://www.youtube.com/@marc.ristau',
                thumbnail: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800',
                date: new Date().toISOString()
            },
            {
                id: 'mock3',
                title: 'Fahrerlager Tour (Placeholder)',
                link: 'https://www.youtube.com/@marc.ristau',
                thumbnail: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=800',
                date: new Date().toISOString()
            }
        ]);
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
