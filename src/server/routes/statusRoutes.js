import express from 'express';
import { getDb } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Configuration
const MAX_CONTENT_LENGTH = 280;
const URL_REGEX = /(https?:\/\/|www\.)/i;
const HTML_REGEX = /<[^>]*>/g;

/**
 * Validate status update content
 * @param {string} content - The content to validate
 * @returns {{valid: boolean, error?: string}}
 */
function validateContent(content) {
    if (!content || typeof content !== 'string') {
        return { valid: false, error: "Content is required" };
    }

    const trimmed = content.trim();

    if (trimmed.length === 0) {
        return { valid: false, error: "Content cannot be empty" };
    }

    if (trimmed.length > MAX_CONTENT_LENGTH) {
        return { valid: false, error: `Content exceeds maximum length of ${MAX_CONTENT_LENGTH} characters` };
    }

    if (URL_REGEX.test(trimmed)) {
        return { valid: false, error: "URLs are not allowed in status updates" };
    }

    if (HTML_REGEX.test(trimmed)) {
        return { valid: false, error: "HTML is not allowed in status updates" };
    }

    return { valid: true };
}

/**
 * POST /api/status
 * Create a new status update (requires authentication)
 */
router.post('/', requireAuth, (req, res) => {
    const { content } = req.body;
    const userId = req.session.user.id;
    const db = getDb();

    // Validate content
    const validation = validateContent(content);
    if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
    }

    const trimmedContent = content.trim();

    try {
        // Check if user has a linked driver
        const user = db.prepare("SELECT driver_id FROM users WHERE id = ?").get(userId);

        const driverId = user?.driver_id || null;
        const statusId = 'status_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        db.prepare(
            `INSERT INTO status_updates (id, user_id, driver_id, content, created_at) 
             VALUES (?, ?, ?, ?, ?)`
        ).run(statusId, userId, driverId, trimmedContent, new Date().toISOString());

        res.status(201).json({
            message: "Status update created",
            statusUpdate: {
                id: statusId,
                userId,
                driverId,
                content: trimmedContent,
                createdAt: new Date().toISOString()
            }
        });
    } catch (err) {
        console.error("Error creating status update:", err);
        return res.status(500).json({ error: "Failed to create status update" });
    }
});

/**
 * GET /api/status/user/:userId
 * Get status updates for a specific user (public, chronological order)
 */
router.get('/user/:userId', (req, res) => {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const db = getDb();

    try {
        const rows = db.prepare(
            `SELECT s.id, s.user_id as userId, s.driver_id as driverId, s.content, s.created_at as createdAt,
                    u.email as authorEmail
             FROM status_updates s
             LEFT JOIN users u ON s.user_id = u.id
             WHERE s.user_id = ?
             ORDER BY s.created_at DESC
             LIMIT ? OFFSET ?`
        ).all(userId, limit, offset);

        res.json({ statusUpdates: rows || [] });
    } catch (err) {
        console.error("Error fetching status updates:", err);
        return res.status(500).json({ error: "Database error" });
    }
});

/**
 * GET /api/status/driver/:driverId
 * Get status updates for a specific driver (public, chronological order)
 */
router.get('/driver/:driverId', (req, res) => {
    const { driverId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const db = getDb();

    try {
        const rows = db.prepare(
            `SELECT s.id, s.user_id as userId, s.driver_id as driverId, s.content, s.created_at as createdAt,
                    u.email as authorEmail
             FROM status_updates s
             LEFT JOIN users u ON s.user_id = u.id
             WHERE s.driver_id = ?
             ORDER BY s.created_at DESC
             LIMIT ? OFFSET ?`
        ).all(driverId, limit, offset);

        res.json({ statusUpdates: rows || [] });
    } catch (err) {
        console.error("Error fetching status updates:", err);
        return res.status(500).json({ error: "Database error" });
    }
});

/**
 * DELETE /api/status/:id
 * Delete a status update (only owner can delete)
 */
router.delete('/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const userId = req.session.user.id;
    const isAdmin = req.session.user.role === 'ADMIN';
    const db = getDb();

    try {
        // First check if the status update exists and belongs to the user
        const statusUpdate = db.prepare("SELECT user_id FROM status_updates WHERE id = ?").get(id);

        if (!statusUpdate) {
            return res.status(404).json({ error: "Status update not found" });
        }

        // Only owner or admin can delete
        if (statusUpdate.user_id !== userId && !isAdmin) {
            return res.status(403).json({ error: "You can only delete your own status updates" });
        }

        db.prepare("DELETE FROM status_updates WHERE id = ?").run(id);

        res.json({ message: "Status update deleted" });
    } catch (err) {
        console.error("Error deleting status update:", err);
        return res.status(500).json({ error: "Failed to delete status update" });
    }
});

export default router;
