import express from 'express';
import { getDb } from '../config/db.js';
import { requireAdmin } from '../middleware/admin.js';

const router = express.Router();

// GET /all-drivers (Admin dropdown)
router.get('/all-drivers', (req, res) => {
    const db = getDb();
    const query = "SELECT id, name, start_number FROM drivers ORDER BY name";
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json(rows);
    });
});

// GET /driver-results (For editing)
router.get('/driver-results', (req, res) => {
    const { driver_id } = req.query;
    if (!driver_id) return res.status(400).json({ error: "Missing driver_id" });
    const db = getDb();

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
            return res.status(400).json({ error: err.message });
        }
        res.json(rows);
    });
});

// GET /physical-events (Admin List)
router.get('/physical-events', requireAdmin, (req, res) => {
    const db = getDb();
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

// POST /physical-events (Create)
router.post('/physical-events', requireAdmin, (req, res) => {
    const { title, startDate, endDate, location, description, status, championships } = req.body;
    const db = getDb();

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

// PUT /physical-events/:id (Update)
router.put('/physical-events/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { title, startDate, endDate, location, description, status } = req.body;
    const db = getDb();

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

// DELETE /physical-events/:id (Delete)
router.delete('/physical-events/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const db = getDb();

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

// POST /championship-events (Add championship to event)
router.post('/championship-events', requireAdmin, (req, res) => {
    const { physicalEventId, championshipId, hasResults } = req.body;
    const db = getDb();

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

// DELETE /championship-events/:id (Remove championship from event)
router.delete('/championship-events/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const db = getDb();

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

// GET /championships (List)
router.get('/championships', (req, res) => {
    const db = getDb();
    db.all('SELECT * FROM championships ORDER BY name', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

export default router;

// PUT /results/:id (Update result) - Note: Base path includes /api/admin? Or handled in main app?
// The original was /api/results/:id.
// If I mount this router at /api/admin, then this becomes /api/admin/results/:id
// But the frontend might expect /api/results/:id.
// I should probably put this in a resultRoutes.js or keep it here and mount appropriately.
// Let's create `resultRoutes.js` for this specific endpoint if it's general purpose,
// but it requires admin. I'll put it here and decide mounting later or make a dedicated router file.
// Actually, `driver-results` above is for admin.
// I'll keep it here and assume I mount it or handle it.
// Wait, `PUT /api/results/:id` was top level. It requires admin though.
// I will create `resultRoutes.js` for result manipulation and export it.
// Or just handle it in `adminRoutes.js` if it is strictly admin.
