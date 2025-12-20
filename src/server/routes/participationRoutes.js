import express from 'express';
import { getDb } from '../config/db.js';

const router = express.Router();

// Middleware: Require Authentication
const requireAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    return res.status(401).json({ error: "Authentication required" });
};

// POST /events/:eventId/participation - Mark participation
router.post('/events/:eventId/participation', requireAuth, (req, res) => {
    const userId = req.session.user.id;
    const eventId = req.params.eventId;
    const db = getDb();

    // Check if event exists and is upcoming/running
    try {
        const event = db.prepare(`SELECT id, status FROM physical_events WHERE id = ?`).get(eventId);

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }
        if (event.status === 'finished') {
            return res.status(400).json({ error: "Cannot participate in finished events" });
        }

        const participationId = 'part_' + Date.now() + '_' + Math.round(Math.random() * 1000);

        db.prepare(`
            INSERT INTO event_participations (id, user_id, physical_event_id, is_public, created_at)
            VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)
        `).run(participationId, userId, eventId);

        res.status(201).json({ message: "Participation marked", participationId });
    } catch (err) {
        if (err.message.includes('UNIQUE')) {
            return res.status(409).json({ error: "Already participating in this event" });
        }
        return res.status(500).json({ error: "Failed to mark participation" });
    }
});

// PUT /events/:eventId/participation - Update visibility
router.put('/events/:eventId/participation', requireAuth, (req, res) => {
    const userId = req.session.user.id;
    const eventId = req.params.eventId;
    const { isPublic } = req.body;
    const db = getDb();

    try {
        const info = db.prepare(`
            UPDATE event_participations 
            SET is_public = ?
            WHERE user_id = ? AND physical_event_id = ?
        `).run(isPublic ? 1 : 0, userId, eventId);

        if (info.changes === 0) {
            return res.status(404).json({ error: "Participation not found" });
        }
        res.json({ message: "Visibility updated" });
    } catch (err) {
        return res.status(500).json({ error: "Failed to update visibility" });
    }
});

// DELETE /events/:eventId/participation - Remove participation
router.delete('/events/:eventId/participation', requireAuth, (req, res) => {
    const userId = req.session.user.id;
    const eventId = req.params.eventId;
    const db = getDb();

    try {
        const info = db.prepare(`
            DELETE FROM event_participations 
            WHERE user_id = ? AND physical_event_id = ?
        `).run(userId, eventId);

        if (info.changes === 0) {
            return res.status(404).json({ error: "Participation not found" });
        }
        res.json({ message: "Participation removed" });
    } catch (err) {
        return res.status(500).json({ error: "Failed to remove participation" });
    }
});

// GET /calendar/me - Get user's calendar
router.get('/calendar/me', requireAuth, (req, res) => {
    const userId = req.session.user.id;
    const db = getDb();

    try {
        const rows = db.prepare(`
            SELECT 
                ep.id as participation_id,
                ep.is_public,
                ep.created_at as joined_at,
                pe.id as event_id,
                pe.title,
                pe.start_date,
                pe.end_date,
                pe.location,
                pe.status
            FROM event_participations ep
            JOIN physical_events pe ON ep.physical_event_id = pe.id
            WHERE ep.user_id = ?
            ORDER BY pe.start_date ASC
        `).all(userId);
        res.json(rows || []);
    } catch (err) {
        return res.status(500).json({ error: "Database error" });
    }
});

// GET /events/:eventId/participation/status - Check if user is participating
router.get('/events/:eventId/participation/status', requireAuth, (req, res) => {
    const userId = req.session.user.id;
    const eventId = req.params.eventId;
    const db = getDb();

    try {
        const row = db.prepare(`
            SELECT id, is_public 
            FROM event_participations 
            WHERE user_id = ? AND physical_event_id = ?
        `).get(userId, eventId);

        res.json({
            participating: !!row,
            isPublic: row?.is_public === 1
        });
    } catch (err) {
        return res.status(500).json({ error: "Database error" });
    }
});

// GET /users/:userId/participations - Get public participations for a user
router.get('/users/:userId/participations', (req, res) => {
    const targetUserId = req.params.userId;
    const db = getDb();

    try {
        const rows = db.prepare(`
            SELECT 
                pe.id as event_id,
                pe.title,
                pe.start_date,
                pe.location
            FROM event_participations ep
            JOIN physical_events pe ON ep.physical_event_id = pe.id
            WHERE ep.user_id = ? AND ep.is_public = 1 AND pe.status != 'finished'
            ORDER BY pe.start_date ASC
        `).all(targetUserId);

        res.json(rows || []);
    } catch (err) {
        return res.status(500).json({ error: "Database error" });
    }
});

export default router;
