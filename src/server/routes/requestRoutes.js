import express from 'express';
import { getDb } from '../config/db.js';

const router = express.Router();

// User: Request to link a driver profile
router.post('/link', (req, res) => {
    // Check if user is logged in
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.session.user.id;
    const { driverId } = req.body;

    if (!driverId) {
        return res.status(400).json({ error: "Driver ID is required" });
    }

    const db = getDb();

    // Check if user already has a pending request or is already linked
    // (Optional: allow re-request if rejected, but block if PENDING)

    // Also check if user is ALREADY linked? Logic implies they shouldn't request if allowed.
    // Let's check for pending requests.
    const pending = db.prepare('SELECT id FROM driver_requests WHERE user_id = ? AND status = ?').get(userId, 'PENDING');
    if (pending) {
        return res.status(400).json({ error: "You already have a pending request." });
    }

    try {
        db.prepare('INSERT INTO driver_requests (user_id, driver_id) VALUES (?, ?)').run(userId, driverId);
        res.json({ message: "Request sent successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// Admin: Get all requests
router.get('/admin', (req, res) => {
    // Check admin role
    if (!req.session || !req.session.user || req.session.user.role !== 'ADMIN') {
        return res.status(403).json({ error: "Forbidden" });
    }

    const db = getDb();
    try {
        const requests = db.prepare(`
            SELECT r.id, r.created_at, r.status, 
                   u.email as user_email, u.id as user_id,
                   d.name as driver_name, d.id as driver_id
            FROM driver_requests r
            JOIN users u ON r.user_id = u.id
            JOIN drivers d ON r.driver_id = d.id
            ORDER BY r.created_at DESC
        `).all();
        res.json(requests);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// Admin: Approve Request
router.put('/:id/approve', (req, res) => {
    if (!req.session || !req.session.user || req.session.user.role !== 'ADMIN') {
        return res.status(403).json({ error: "Forbidden" });
    }

    const requestId = req.params.id;
    const db = getDb();

    try {
        const request = db.prepare('SELECT * FROM driver_requests WHERE id = ?').get(requestId);
        if (!request) return res.status(404).json({ error: "Request not found" });

        // Update User
        db.prepare('UPDATE users SET driver_id = ? WHERE id = ?').run(request.driver_id, request.user_id);

        // Update Request Status
        db.prepare('UPDATE driver_requests SET status = ? WHERE id = ?').run('APPROVED', requestId);

        res.json({ message: "Request approved and user linked." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// Admin: Reject Request
router.put('/:id/reject', (req, res) => {
    if (!req.session || !req.session.user || req.session.user.role !== 'ADMIN') {
        return res.status(403).json({ error: "Forbidden" });
    }

    const requestId = req.params.id;
    const db = getDb();

    try {
        db.prepare('UPDATE driver_requests SET status = ? WHERE id = ?').run('REJECTED', requestId);
        res.json({ message: "Request rejected." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

export default router;
