import express from 'express';
import Parser from 'rss-parser';
import { getDb } from '../config/db.js';

const router = express.Router();

// GET /years
router.get('/years', (req, res) => {
    const db = getDb();
    const query = `
        SELECT DISTINCT strftime('%Y', pe.start_date) as year
        FROM physical_events pe
        JOIN championship_events ce ON pe.id = ce.physical_event_id
        WHERE ce.has_results = 1
        ORDER BY year DESC
    `;
    try {
        const rows = db.prepare(query).all();
        res.json(rows.map(r => r.year));
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// GET /classes
router.get('/classes', (req, res) => {
    const db = getDb();
    const query = "SELECT * FROM classes ORDER BY name";
    try {
        const rows = db.prepare(query).all();
        res.json(rows);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /leaderboard/random-class
router.get('/leaderboard/random-class', (req, res) => {
    const db = getDb();

    const championship = req.query.championship;
    console.log("Request for random class. Champ filter:", championship);

    // First get all classes that have drivers
    let classesQuery = `
        SELECT DISTINCT c.id, c.name, c.championship_id 
        FROM classes c 
        JOIN driver_participations dp ON c.id = dp.class_id 
        WHERE dp.points > 0
    `;

    const params = [];
    if (championship) {
        classesQuery += ` AND c.championship_id = ?`;
        params.push(championship);
    }

    try {
        const classes = db.prepare(classesQuery).all(...params);
        if (!classes || classes.length === 0) {
            return res.json({ className: 'Keine Klasse', drivers: [] });
        }

        const randomClass = classes[Math.floor(Math.random() * classes.length)];
        const classId = randomClass.id;

        const driversQuery = `
    SELECT
    d.id, d.name, d.team, d.car,
        dp.points as total_points
            FROM drivers d
            JOIN driver_participations dp ON d.id = dp.driver_id
            WHERE dp.class_id = ?
        ORDER BY dp.points DESC
            LIMIT 3
        `;

        const drivers = db.prepare(driversQuery).all(classId);
        res.json({
            className: randomClass.name,
            championship: randomClass.championship_id,
            drivers: drivers.map(d => ({
                id: d.id,
                name: d.name,
                team: d.team || '',
                car: d.car || '',
                points: d.total_points
            }))
        });
    } catch (err) {
        return res.json({ className: 'Fehler', drivers: [] });
    }
});

// GET /youtube-feed
router.get('/youtube-feed', async (req, res) => {
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
        // Fallback mock data
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

export default router;
