import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';

const app = express();
const PORT = 3000;
const DB_PATH = './autox.db';

app.use(cors());
app.use(express.json());

// Helper to get DB connection (using callback-based sqlite3 for simplicity in standard node usage with 'sqlite3' package)
const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
    } else {
        console.log("Connected to the SQLite database.");
    }
});

app.get('/', (req, res) => {
    res.send('AutoXStats API Server is running. Access endpoints at /api/drivers or /api/events');
});

// GET /api/drivers
// Returns all drivers with calculated total stats
app.get('/api/drivers', (req, res) => {
    // We already have accumulated points in the 'drivers' table from initialization,
    // but the real source of truth for race logic is race_results.
    // However, our init script did update the drivers table roughly? 
    // Actually, init_db.py creates drivers with seed data but didn't update them from the PDF results.
    // The PDF importer inserted into `race_results`.
    // So we should aggregate from race_results to get "current" stats?
    // OR we can just join race_results.

    // Aggregation Query
    const query = `
        SELECT 
            d.id as driver_id,
            dp.class_id,
            d.name, 
            d.team, 
            d.car, 
            d.start_number as number, 
            c.name as driverClass,
            d.bio,
            RANK() OVER (
                PARTITION BY dp.class_id 
                ORDER BY COALESCE(SUM(r.points), dp.points) DESC
            ) as season_rank,
            d.heat_wins as static_heat,
            dp.points as static_points,
            c.championship_id as champ_id,
            SUM(r.points) as calc_points,
            COUNT(CASE WHEN r.rank = 1 THEN 1 END) as calc_wins,
            COUNT(CASE WHEN r.rank = 2 THEN 1 END) as calc_second,
            COUNT(CASE WHEN r.rank = 3 THEN 1 END) as calc_third,
            SUM(r.heat_wins) as calc_heat,
            COUNT(r.id) as races,
            COUNT(CASE WHEN r.rank <= 3 THEN 1 END) as calc_podiums
        FROM drivers d
        JOIN driver_participations dp ON d.id = dp.driver_id
        JOIN classes c ON dp.class_id = c.id
        LEFT JOIN race_results r ON d.id = r.driver_id AND dp.class_id = r.class_id
        GROUP BY d.id, dp.class_id
        ORDER BY driverClass, COALESCE(SUM(r.points), dp.points) DESC
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Database Error:", err.message);
            res.status(400).json({ error: err.message });
            return;
        }

        // Transform to match Frontend Interface 'Driver'
        const drivers = rows.map(row => {
            const hasRaces = row.races > 0;
            // Use composite ID for unique React keys if same driver is in multiple classes
            // Format: driver_id::class_id
            const uniqueId = row.class_id ? `${row.driver_id}::${row.class_id}` : row.driver_id;

            return {
                id: uniqueId,
                originalId: row.driver_id, // Keep original ID for detailed queries
                name: row.name,
                team: row.team || "",
                car: row.car || "",
                number: row.number,
                driverClass: row.driverClass || "Unassigned",
                points: hasRaces ? (row.calc_points || 0) : (row.static_points || 0),
                wins: hasRaces ? row.calc_wins : (row.static_wins || 0),
                secondPlaces: hasRaces ? row.calc_second : (row.static_second || 0),
                thirdPlaces: hasRaces ? row.calc_third : (row.static_third || 0),
                heatWins: hasRaces ? (row.calc_heat || 0) : (row.static_heat || 0),
                podiums: hasRaces ? row.calc_podiums : (row.static_podiums || 0),
                seasonRank: row.season_rank || 0,
                bio: row.bio || "",
                avatarUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=200',
                championships: row.champ_id ? [row.champ_id] : []
            };
        });

        res.json(drivers);
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
                SUM(r.points) as calc_points,
                COUNT(r.id) as races
            FROM drivers d
            JOIN driver_participations dp ON d.id = dp.driver_id
            LEFT JOIN race_results r ON d.id = r.driver_id AND dp.class_id = r.class_id
            WHERE dp.class_id = ?
            GROUP BY d.id
            ORDER BY COALESCE(SUM(r.points), dp.points) DESC
            LIMIT 3
        `;

        db.all(driversQuery, [classId], (err, rows) => {
            if (err) {
                console.error("Database Error (Drivers):", err.message);
                return res.status(500).json({ error: err.message });
            }

            const drivers = rows.map(row => ({
                id: row.id,
                name: row.name,
                team: row.team || "",
                points: row.races > 0 ? (row.calc_points || 0) : (row.static_points || 0),
                avatarUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=200'
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
app.get('/api/events', (req, res) => {
    const query = `
        SELECT e.id, e.championship_id as championship, e.name, e.date, e.location, e.status
        FROM events e
        ORDER BY e.date
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
