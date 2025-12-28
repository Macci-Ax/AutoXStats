import express from 'express';
import { getDb } from '../config/db.js';
import { requireAdmin } from '../middleware/admin.js';

const router = express.Router();

// GET /all-drivers (Admin dropdown)
router.get('/all-drivers', (req, res) => {
    const db = getDb();
    const query = "SELECT id, name, start_number FROM drivers ORDER BY name";
    try {
        const rows = db.prepare(query).all();
        res.json(rows);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
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
            rr.event_id,
            e.title as event_name,
            e.start_date as event_date,
            c.name as class_name,
            COALESCE(rr.start_number, d.start_number) as start_number,
            COALESCE(rr.car, d.car) as car,
            rr.rank,
            rr.points,
            rr.championship_points,
            rr.license_type,
            d.name as driver_name
        FROM race_results rr
        JOIN physical_events e ON rr.event_id = e.id
        JOIN classes c ON rr.class_id = c.id
        JOIN drivers d ON rr.driver_id = d.id
        WHERE rr.driver_id = ?
        ORDER BY e.start_date DESC
    `;

    try {
        const rows = db.prepare(query).all(driver_id);
        res.json(rows);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
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

    try {
        const rows = db.prepare(query).all();

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
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// POST /physical-events (Create)
router.post('/physical-events', requireAdmin, (req, res) => {
    const { title, startDate, endDate, location, description, status, championships } = req.body;
    const db = getDb();

    if (!title || !startDate) {
        return res.status(400).json({ error: "Title and startDate are required" });
    }

    const physicalId = 'pe_' + Date.now();

    try {
        db.prepare(
            `INSERT INTO physical_events (id, title, start_date, end_date, location, description, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).run(physicalId, title, startDate, endDate || startDate, location || '', description || '', status || 'upcoming');

        // Add championship events if provided
        if (championships && Array.isArray(championships)) {
            const insertChampStmt = db.prepare(
                `INSERT INTO championship_events (id, physical_event_id, championship_id, has_results)
                 VALUES (?, ?, ?, ?)`
            );

            championships.forEach((champ) => {
                const ceId = 'ce_' + Date.now() + '_' + Math.round(Math.random() * 1000);
                insertChampStmt.run(ceId, physicalId, champ.championshipId, champ.hasResults ? 1 : 0);
            });
        }

        res.json({
            message: "Event created successfully",
            eventId: physicalId
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// PUT /physical-events/:id (Update)
router.put('/physical-events/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { title, startDate, endDate, location, description, status } = req.body;
    const db = getDb();

    try {
        const info = db.prepare(
            `UPDATE physical_events 
             SET title = ?, start_date = ?, end_date = ?, location = ?, description = ?, status = ?
             WHERE id = ?`
        ).run(title, startDate, endDate, location, description, status, id);

        if (info.changes === 0) return res.status(404).json({ error: "Event not found" });
        res.json({ message: "Event updated successfully" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// DELETE /physical-events/:id (Delete)
router.delete('/physical-events/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const db = getDb();

    try {
        // Check for results first
        const row = db.prepare(
            `SELECT COUNT(*) as count FROM race_results rr
             JOIN championship_events ce ON rr.championship_event_id = ce.id
             WHERE ce.physical_event_id = ?`
        ).get(id);

        if (row.count > 0) {
            return res.status(400).json({
                error: "Cannot delete event with existing results",
                resultCount: row.count
            });
        }

        // Delete championship_events first, then physical_event
        db.prepare(`DELETE FROM championship_events WHERE physical_event_id = ?`).run(id);
        db.prepare(`DELETE FROM physical_events WHERE id = ?`).run(id);

        res.json({ message: "Event deleted successfully" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// POST /championship-events (Add championship to event)
router.post('/championship-events', requireAdmin, (req, res) => {
    const { physicalEventId, championshipId, hasResults } = req.body;
    const db = getDb();

    if (!physicalEventId || !championshipId) {
        return res.status(400).json({ error: "physicalEventId and championshipId are required" });
    }

    const ceId = 'ce_' + Date.now() + '_' + Math.round(Math.random() * 1000);

    try {
        db.prepare(
            `INSERT INTO championship_events (id, physical_event_id, championship_id, has_results)
             VALUES (?, ?, ?, ?)`
        ).run(ceId, physicalEventId, championshipId, hasResults ? 1 : 0);

        res.json({ message: "Championship added successfully", championshipEventId: ceId });
    } catch (err) {
        if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: "This championship is already attached to this event" });
        }
        return res.status(500).json({ error: err.message });
    }
});

// DELETE /championship-events/:id (Remove championship from event)
router.delete('/championship-events/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const db = getDb();

    try {
        const row = db.prepare(
            `SELECT COUNT(*) as count FROM race_results WHERE championship_event_id = ?`
        ).get(id);

        if (row.count > 0) {
            return res.status(400).json({
                error: "Cannot remove championship with existing results",
                resultCount: row.count
            });
        }

        db.prepare(`DELETE FROM championship_events WHERE id = ?`).run(id);
        res.json({ message: "Championship removed successfully" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// GET /championships (List)
router.get('/championships', (req, res) => {
    const db = getDb();
    try {
        const rows = db.prepare('SELECT * FROM championships ORDER BY name').all();
        res.json(rows);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Helper: Calculate championship points based on adjusted rank
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

// POST /recalculate-points (Recalculate points for an event/class)
router.post('/recalculate-points', requireAdmin, (req, res) => {
    const { event_id, class_id } = req.body;
    const db = getDb();

    if (!event_id || !class_id) {
        return res.status(400).json({ error: "Missing event_id or class_id" });
    }

    try {
        // 1. Fetch all results for this event/class
        const rows = db.prepare(`
            SELECT id, rank, license_type, class_id
            FROM race_results
            WHERE event_id = ? AND class_id = ?
            ORDER BY rank ASC
        `).all(event_id, class_id);

        if (rows.length === 0) {
            return res.json({ message: "No results to recalculate" });
        }

        const isLangstrecke = rows[0].class_id.includes('_lang') || rows[0].class_id.includes('langstrecke'); // lenient check

        // 2. Identify distinct groups (non-DQ/TL vs DQ/TL)
        // Only DRCV (or NULL/Empty treated as DRCV) get points
        const validDrivers = rows.filter(r => {
            const type = (r.license_type || 'DRCV').trim();
            return type !== 'TL' && type !== 'DQ';
        });

        // 3. Prepare updates
        const updates = [];

        // Assign points to valid drivers based on their relative order
        validDrivers.forEach((r, index) => {
            const adjustedRank = index + 1;
            const points = getChampPointsForRank(adjustedRank, isLangstrecke);
            updates.push({ id: r.id, points, champPoints: points });
        });

        // Assign 0 to invalid drivers
        rows.filter(r => {
            const type = (r.license_type || 'DRCV').trim();
            return type === 'TL' || type === 'DQ';
        }).forEach(r => {
            updates.push({ id: r.id, points: 0, champPoints: 0 }); // Usually 0 points for DQ? Or keep event points? Let's say 0 champ points.
        });

        // 4. Batch Update
        const updateStmt = db.prepare(`
            UPDATE race_results 
            SET championship_points = ? 
            WHERE id = ?
        `);

        const transaction = db.transaction((items) => {
            let changed = 0;
            for (const item of items) {
                updateStmt.run(item.champPoints, item.id);
                // Note: We are currently NOT updating the 'points' (event points) column, only 'championship_points'.
                // If DQ should have 0 event points too, we should update that. 
                // For now, let's assume this is mostly for Championship calculation.
                // But usually DQ means 0 everywhere. Let's update championship_points only for safety first unless user asked otherwise.
                changed++;
            }
            return changed;
        });

        transaction(updates);

        res.json({ message: "Points recalculation complete", updated: updates.length });

    } catch (err) {
        console.error("Recalculation error:", err);
        return res.status(500).json({ error: err.message });
    }
});

export default router;
