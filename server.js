import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import Parser from 'rss-parser';
import session from 'express-session';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 3000;
const DB_PATH = './autox.db';

app.use(cors({
    origin: 'http://localhost:5173', // Vite default port
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());
app.use(cookieParser());

// Session Configuration
app.use(session({
    secret: 'autoxstats_secret_key_change_in_prod', // INSECURE: Move to env var in prod
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Middleware: Require Admin
const requireAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'ADMIN') {
        return next();
    }
    return res.status(403).json({ error: "Access denied. Admin privileges required." });
    return res.status(403).json({ error: "Access denied. Admin privileges required." });
};

// Configure Multer for File Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Serve Static Files (Uploads)
app.use('/uploads', express.static('uploads'));

// Auth Endpoints

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    // Simple validation
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (match) {
            // Create session
            req.session.user = {
                id: user.id,
                email: user.email,
                role: user.role
            };
            res.json({ message: "Login successful", user: req.session.user });
        } else {
            res.status(401).json({ error: "Invalid email or password" });
        }
    });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: "Could not log out" });
        }
        res.clearCookie('connect.sid');
        res.json({ message: "Logout successful" });
    });
});

// GET /api/auth/me
app.get('/api/auth/me', (req, res) => {
    if (req.session && req.session.user) {
        res.json({ authenticated: true, user: req.session.user });
    } else {
        res.json({ authenticated: false, user: null });
    }
});

// Helper to get DB connection (using callback-based sqlite3 for simplicity in standard node usage with 'sqlite3' package)
const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
    } else {
        console.log("Connected to the SQLite database.");
        // Ensure photo_tags table exists
        db.run(`CREATE TABLE IF NOT EXISTS photo_tags (
            id TEXT PRIMARY KEY,
            photo_id TEXT,
            driver_id TEXT,
            FOREIGN KEY(photo_id) REFERENCES photos(id),
            FOREIGN KEY(driver_id) REFERENCES drivers(id)
        )`);
    }
});

app.get('/', (req, res) => {
    res.send('AutoXStats API Server is running. Access endpoints at /api/drivers or /api/events');
});

// GET /api/years
// Returns all years for which data exists, sorted descending
app.get('/api/years', (req, res) => {
    const query = `
        SELECT DISTINCT strftime('%Y', pe.start_date) as year
        FROM physical_events pe
        JOIN championship_events ce ON pe.id = ce.physical_event_id
        JOIN race_results rr ON ce.id = rr.championship_event_id
        WHERE pe.start_date IS NOT NULL
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
// Returns physical events with their championship events
// Query params: ?year=YYYY (optional, defaults to current year)
app.get('/api/events', (req, res) => {
    const year = req.query.year || String(new Date().getFullYear());
    const query = `
        SELECT 
            pe.id,
            pe.title as name,
            pe.start_date as date,
            pe.location,
            pe.status,
            pe.description,
            ce.id as championship_event_id,
            ce.championship_id as championship,
            ce.has_results
        FROM physical_events pe
        LEFT JOIN championship_events ce ON pe.id = ce.physical_event_id
        WHERE strftime('%Y', pe.start_date) = ?
        ORDER BY pe.start_date, ce.championship_id
    `;

    db.all(query, [year], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }

        // Group by physical event
        const eventsMap = {};
        rows.forEach(row => {
            if (!eventsMap[row.id]) {
                eventsMap[row.id] = {
                    id: row.id,
                    name: row.name,
                    date: row.date,
                    location: row.location,
                    status: row.status === 'finished' ? 'COMPLETED' :
                        row.status === 'running' ? 'LIVE' : 'UPCOMING',
                    description: row.description,
                    championships: []
                };
            }
            if (row.championship_event_id) {
                eventsMap[row.id].championships.push({
                    championshipEventId: row.championship_event_id,
                    championship: row.championship,
                    hasResults: row.has_results === 1
                });
            }
        });

        // For backwards compatibility, also include 'championship' as first championship
        const events = Object.values(eventsMap).map(e => ({
            ...e,
            championship: e.championships.length > 0 ? e.championships[0].championship : null
        }));

        res.json(events);
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
    const query = "SELECT id, name, start_number FROM drivers ORDER BY name";
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
// PUT /api/results/:id
// Update a specific race result (Rank, Points, Championship Points, Car, and StartNr)
app.put('/api/results/:id', requireAdmin, (req, res) => {
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

// GET /api/events/:id/results
// Supports both physical_event_id (returns all results) and championship filtering
// Query params: ?championship=DRCV (optional, filters by championship)
app.get('/api/events/:id/results', (req, res) => {
    const eventId = req.params.id;
    const championship = req.query.championship;

    let query = `
        SELECT 
            rr.id,
            rr.class_id,
            c.name as class_name,
            COALESCE(rr.start_number, d.start_number) as start_number,
            COALESCE(rr.car, d.car) as car,
            rr.rank,
            rr.points,
            rr.championship_points,
            d.name as driver_name,
            d.team as driver_team,
            ce.championship_id as championship
        FROM race_results rr
        JOIN championship_events ce ON rr.championship_event_id = ce.id
        JOIN physical_events pe ON ce.physical_event_id = pe.id
        JOIN classes c ON rr.class_id = c.id
        JOIN drivers d ON rr.driver_id = d.id
        WHERE pe.id = ?
    `;

    const params = [eventId];

    if (championship) {
        query += ` AND ce.championship_id = ?`;
        params.push(championship);
    }

    query += ` ORDER BY c.name, rr.rank ASC`;

    db.all(query, params, (err, rows) => {
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

// POST /api/photos
// Upload new photos (supports multiple)
app.post('/api/photos', upload.array('photos'), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
    }

    const { eventId, photographer } = req.body;
    const finalPhotographer = photographer || 'Unknown';
    const uploadedPhotos = [];

    // Prepare insert statement
    const stmt = db.prepare(`
        INSERT INTO photos (id, event_id, storage_path, photographer, created_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    // Process each file
    const errors = [];
    req.files.forEach(file => {
        const fileUrl = `/uploads/${file.filename}`;
        const photoId = 'p_' + Date.now() + '_' + Math.round(Math.random() * 1000); // Unique ID

        try {
            stmt.run([photoId, eventId || 'e_general', fileUrl, finalPhotographer]);
            uploadedPhotos.push({
                id: photoId,
                url: fileUrl,
                eventId: eventId,
                photographer: finalPhotographer,
                uploadDate: new Date().toISOString()
            });
        } catch (err) {
            console.error("Error saving photo:", err.message);
            errors.push(err.message);
        }
    });

    stmt.finalize();

    if (uploadedPhotos.length === 0 && errors.length > 0) {
        return res.status(500).json({ error: "Failed to save photos", details: errors });
    }

    res.json({
        message: `${uploadedPhotos.length} photos uploaded successfully`,
        photos: uploadedPhotos,
        errors: errors.length > 0 ? errors : undefined
    });
});

// GET /api/gallery/events
// Returns physical events that have photos, with count and latest photo as cover
app.get('/api/gallery/events', (req, res) => {
    const query = `
        SELECT 
            pe.id, 
            pe.title as name, 
            pe.start_date as date, 
            COUNT(p.id) as photo_count,
            (SELECT storage_path FROM photos p2 WHERE p2.physical_event_id = pe.id ORDER BY p2.created_at DESC LIMIT 1) as cover_url
        FROM physical_events pe
        JOIN photos p ON pe.id = p.physical_event_id
        GROUP BY pe.id
        ORDER BY pe.start_date DESC
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Error fetching gallery events:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// GET /api/photos
app.get('/api/photos', (req, res) => {
    const { eventId } = req.query;
    let query = `
        SELECT 
            p.*,
            GROUP_CONCAT(pt.id || '::' || pt.driver_id || '::' || IFNULL(d.name, 'Unknown'), '||') as tags_raw
        FROM photos p
        LEFT JOIN photo_tags pt ON p.id = pt.photo_id
        LEFT JOIN drivers d ON pt.driver_id = d.id
    `;
    const params = [];
    if (eventId) {
        query += " WHERE p.physical_event_id = ?";
        params.push(eventId);
    }
    query += " GROUP BY p.id ORDER BY p.created_at DESC";

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error("Error fetching photos:", err.message);
            return res.status(500).json({ error: err.message });
        }

        // Map to frontend expectation
        const photos = rows.map(r => {
            const tags = [];
            if (r.tags_raw) {
                r.tags_raw.split('||').forEach(t => {
                    const parts = t.split('::');
                    if (parts.length === 3) {
                        tags.push({ id: parts[0], driverId: parts[1], name: parts[2] });
                    }
                });
            }
            return {
                id: r.id,
                url: r.storage_path,
                eventId: r.physical_event_id,
                photographer: r.photographer || 'Gast',
                uploadDate: r.created_at,
                highResAvailable: true,
                tags: tags
            };
        });
        res.json(photos);
    });
});

// POST /api/photos/:id/tags
// Add a tag to a photo
app.post('/api/photos/:id/tags', requireAdmin, (req, res) => {
    const photoId = req.params.id;
    const { driverId } = req.body;

    if (!driverId) return res.status(400).json({ error: "Driver ID required" });

    const tagId = 'tag_' + Date.now() + '_' + Math.round(Math.random() * 1000);
    db.run(
        "INSERT INTO photo_tags (id, photo_id, driver_id) VALUES (?, ?, ?)",
        [tagId, photoId, driverId],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Tag added", tag: { id: tagId, driverId } });
        }
    );
});

// DELETE /api/photos/:id/tags/:tagId
// Remove a tag
app.delete('/api/photos/:id/tags/:tagId', requireAdmin, (req, res) => {
    const { tagId } = req.params;
    db.run("DELETE FROM photo_tags WHERE id = ?", [tagId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Tag removed" });
    });
});

// GET /api/drivers/:id/photos
// Get all photos tagged for a driver
app.get('/api/drivers/:id/photos', (req, res) => {
    const driverId = req.params.id;
    const query = `
        SELECT p.* 
        FROM photos p
        JOIN photo_tags pt ON p.id = pt.photo_id
        WHERE pt.driver_id = ?
        ORDER BY p.created_at DESC
    `;
    db.all(query, [driverId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const photos = rows.map(r => ({
            id: r.id,
            url: r.storage_path,
            eventId: r.event_id,
            photographer: r.photographer || 'Gast',
            uploadDate: r.created_at,
            highResAvailable: true
        }));
        res.json(photos);
    });
});
// ============================================
// ADMIN EVENT MANAGEMENT ENDPOINTS
// ============================================

// GET /api/admin/physical-events
// Returns all physical events for admin management
app.get('/api/admin/physical-events', requireAdmin, (req, res) => {
    const query = `
        SELECT 
            pe.*,
            GROUP_CONCAT(ce.id || '::' || ce.championship_id || '::' || ce.has_results, '||') as champ_events_raw
        FROM physical_events pe
        LEFT JOIN championship_events ce ON pe.id = ce.physical_event_id
        GROUP BY pe.id
        ORDER BY pe.start_date DESC
    `;

    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const events = rows.map(pe => {
            const championships = [];
            if (pe.champ_events_raw) {
                pe.champ_events_raw.split('||').forEach((ce) => {
                    const [id, champId, hasResults] = ce.split('::');
                    championships.push({ id, championshipId: champId, hasResults: hasResults === '1' });
                });
            }
            return {
                id: pe.id,
                title: pe.title,
                startDate: pe.start_date,
                endDate: pe.end_date,
                location: pe.location,
                description: pe.description,
                status: pe.status,
                championships
            };
        });
        res.json(events);
    });
});

// POST /api/admin/physical-events
// Create a new physical event
app.post('/api/admin/physical-events', requireAdmin, (req, res) => {
    const { title, startDate, endDate, location, description, status, championships } = req.body;

    if (!title || !startDate) {
        return res.status(400).json({ error: "Title and startDate are required" });
    }

    const physicalId = 'pe_' + Date.now();

    db.run(
        `INSERT INTO physical_events (id, title, start_date, end_date, location, description, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [physicalId, title, startDate, endDate || startDate, location || '', description || '', status || 'upcoming'],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });

            // Add championship events if provided
            if (championships && Array.isArray(championships)) {
                championships.forEach((champ) => {
                    const ceId = 'ce_' + Date.now() + '_' + Math.round(Math.random() * 1000);
                    db.run(
                        `INSERT INTO championship_events (id, physical_event_id, championship_id, has_results)
                         VALUES (?, ?, ?, ?)`,
                        [ceId, physicalId, champ.championshipId, champ.hasResults ? 1 : 0]
                    );
                });
            }

            res.json({
                message: "Event created successfully",
                eventId: physicalId
            });
        }
    );
});

// PUT /api/admin/physical-events/:id
// Update a physical event
app.put('/api/admin/physical-events/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { title, startDate, endDate, location, description, status } = req.body;

    db.run(
        `UPDATE physical_events 
         SET title = ?, start_date = ?, end_date = ?, location = ?, description = ?, status = ?
         WHERE id = ?`,
        [title, startDate, endDate, location, description, status, id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: "Event not found" });
            res.json({ message: "Event updated successfully" });
        }
    );
});

// DELETE /api/admin/physical-events/:id
// Delete a physical event (only if no results attached)
app.delete('/api/admin/physical-events/:id', requireAdmin, (req, res) => {
    const { id } = req.params;

    // Check for results first
    db.get(
        `SELECT COUNT(*) as count FROM race_results rr
         JOIN championship_events ce ON rr.championship_event_id = ce.id
         WHERE ce.physical_event_id = ?`,
        [id],
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (row.count > 0) {
                return res.status(400).json({
                    error: "Cannot delete event with existing results",
                    resultCount: row.count
                });
            }

            // Delete championship_events first, then physical_event
            db.run(`DELETE FROM championship_events WHERE physical_event_id = ?`, [id], (err) => {
                if (err) return res.status(500).json({ error: err.message });

                db.run(`DELETE FROM physical_events WHERE id = ?`, [id], function (err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ message: "Event deleted successfully" });
                });
            });
        }
    );
});

// POST /api/admin/championship-events
// Add a championship to an existing physical event
app.post('/api/admin/championship-events', requireAdmin, (req, res) => {
    const { physicalEventId, championshipId, hasResults } = req.body;

    if (!physicalEventId || !championshipId) {
        return res.status(400).json({ error: "physicalEventId and championshipId are required" });
    }

    const ceId = 'ce_' + Date.now() + '_' + Math.round(Math.random() * 1000);

    db.run(
        `INSERT INTO championship_events (id, physical_event_id, championship_id, has_results)
         VALUES (?, ?, ?, ?)`,
        [ceId, physicalEventId, championshipId, hasResults ? 1 : 0],
        function (err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: "This championship is already attached to this event" });
                }
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: "Championship added successfully", championshipEventId: ceId });
        }
    );
});

// DELETE /api/admin/championship-events/:id
// Remove a championship from a physical event
app.delete('/api/admin/championship-events/:id', requireAdmin, (req, res) => {
    const { id } = req.params;

    // Check for results first
    db.get(
        `SELECT COUNT(*) as count FROM race_results WHERE championship_event_id = ?`,
        [id],
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (row.count > 0) {
                return res.status(400).json({
                    error: "Cannot remove championship with existing results",
                    resultCount: row.count
                });
            }

            db.run(`DELETE FROM championship_events WHERE id = ?`, [id], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: "Championship removed successfully" });
            });
        }
    );
});

// GET /api/admin/championships
// Returns list of available championships
app.get('/api/admin/championships', (req, res) => {
    db.all('SELECT * FROM championships ORDER BY name', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
