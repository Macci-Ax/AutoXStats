import express from 'express';
import { getDb } from '../config/db.js';
import { requireAdmin } from '../middleware/admin.js';

const router = express.Router();

// GET /race-results (Get results for event/class)
router.get('/race-results', (req, res) => {
    const { event_id, class_id } = req.query;
    const db = getDb();

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

// PUT /results/:id (Update race result)
router.put('/results/:id', requireAdmin, (req, res) => {
    const resultId = req.params.id;
    const { rank, points, championship_points, car, start_number } = req.body;
    const db = getDb();

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

export default router;
