import express from 'express';
import { getDb } from '../config/db.js';

const router = express.Router();

// GET /events (Main Event List)
router.get('/', (req, res) => {
    const db = getDb();
    const year = req.query.year || String(new Date().getFullYear());
    const query = `
        SELECT 
            pe.id,
            pe.title as name,
            pe.start_date as date,
            pe.location,
            pe.status,
            GROUP_CONCAT(ce.id || '::' || ce.championship_id || '::' || ce.has_results, '||') as champ_events_raw
        FROM physical_events pe
        LEFT JOIN championship_events ce ON pe.id = ce.physical_event_id
        WHERE strftime('%Y', pe.start_date) = ?
        GROUP BY pe.id
        ORDER BY pe.start_date DESC
    `;

    try {
        const rows = db.prepare(query).all(year);
        const events = rows.map(r => {
            // Parse championship events
            const championships = [];
            if (r.champ_events_raw) {
                r.champ_events_raw.split('||').forEach(ce => {
                    const [id, champId, hasResults] = ce.split('::');
                    if (id && champId) {
                        championships.push({
                            championshipEventId: id,
                            championship: champId,
                            hasResults: hasResults === '1'
                        });
                    }
                });
            }
            return {
                id: r.id,
                name: r.name,
                date: r.date,
                location: r.location,
                status: r.status === 'finished' ? 'COMPLETED' : (r.status === 'running' ? 'LIVE' : 'UPCOMING'),
                championships: championships,
                // Legacy field for backwards compatibility
                championship: championships.length > 0 ? championships[0].championship : ''
            };
        });
        res.json(events);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// GET /events/:id/results (Event Results)
router.get('/:id/results', (req, res) => {
    const db = getDb();
    const eventId = req.params.id; // physical_event_id
    const championship = req.query.championship;

    let query = `
        SELECT 
            r.id,
            pe.title,
            ce.championship_id,
            c.name as class_name,
            c.id as class_id,
            d.name as driver_name,
            d.team as driver_team,
            d.id as driver_id,
            COALESCE(r.start_number, d.start_number) as start_number,
            COALESCE(r.car, d.car) as car,
            r.rank,
            r.run_1,
            r.run_2,
            r.run_3,
            r.run_4,
            r.event_points,
            COALESCE(r.championship_points, r.points) as championship_points
        FROM physical_events pe
        JOIN championship_events ce ON pe.id = ce.physical_event_id
        JOIN race_results r ON ce.id = r.championship_event_id
        JOIN classes c ON r.class_id = c.id
        JOIN drivers d ON r.driver_id = d.id
        WHERE pe.id = ?
    `;

    const params = [eventId];

    if (championship) {
        query += ` AND ce.championship_id = ?`;
        params.push(championship);
    }

    query += ` ORDER BY c.name, r.rank`;

    try {
        const rows = db.prepare(query).all(params);
        // Return flat array matching frontend expectations
        res.json(rows || []);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

export default router;
