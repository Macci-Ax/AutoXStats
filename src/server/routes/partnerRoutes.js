import express from 'express';
import { getDb } from '../config/db.js';
import crypto from 'crypto';

const router = express.Router();
const db = getDb();

// Helper to get links for a partner
const getLinks = (partnerId) => {
    return db.prepare('SELECT * FROM partner_links WHERE partner_id = ?').all(partnerId);
};

// GET /api/partners - List all partners
router.get('/', (req, res) => {
    try {
        const partners = db.prepare('SELECT * FROM partners ORDER BY created_at DESC').all();
        const partnersWithLinks = partners.map(partner => ({
            ...partner,
            links: getLinks(partner.id)
        }));
        res.json(partnersWithLinks);
    } catch (error) {
        console.error('Error fetching partners:', error);
        res.status(500).json({ error: 'Failed to fetch partners' });
    }
});

// POST /api/partners - Add new partner
// Protected: In a real app, you'd add middleware to check for ADMIN role here
router.post('/', (req, res) => {
    const { name, description, links, type } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }

    try {
        const id = crypto.randomUUID();
        const stmt = db.prepare('INSERT INTO partners (id, name, description, type) VALUES (?, ?, ?, ?)');
        stmt.run(id, name, description || '', type || 'MEDIA');

        if (Array.isArray(links)) {
            const linkStmt = db.prepare('INSERT INTO partner_links (id, partner_id, url, type) VALUES (?, ?, ?, ?)');
            for (const link of links) {
                linkStmt.run(crypto.randomUUID(), id, link.url, link.type);
            }
        }

        res.status(201).json({ message: 'Partner created', id });
    } catch (error) {
        console.error('Error creating partner:', error);
        res.status(500).json({ error: 'Failed to create partner' });
    }
});

// PUT /api/partners/:id - Update partner
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { name, description, links, type } = req.body;

    try {
        const updateStmt = db.prepare('UPDATE partners SET name = ?, description = ?, type = ? WHERE id = ?');
        const result = updateStmt.run(name, description || '', type || 'MEDIA', id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Partner not found' });
        }

        // Delete existing links and re-add them (simple replacement strategy)
        db.prepare('DELETE FROM partner_links WHERE partner_id = ?').run(id);

        if (Array.isArray(links)) {
            const linkStmt = db.prepare('INSERT INTO partner_links (id, partner_id, url, type) VALUES (?, ?, ?, ?)');
            for (const link of links) {
                linkStmt.run(crypto.randomUUID(), id, link.url, link.type);
            }
        }

        res.json({ message: 'Partner updated' });
    } catch (error) {
        console.error('Error updating partner:', error);
        res.status(500).json({ error: 'Failed to update partner' });
    }
});

// DELETE /api/partners/:id - Delete partner
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    try {
        // Cascade delete should handle links, but we can be explicit if needed.
        // Since we defined ON DELETE CASCADE in db.js, deleting partner is enough.
        const result = db.prepare('DELETE FROM partners WHERE id = ?').run(id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Partner not found' });
        }

        res.json({ message: 'Partner deleted' });
    } catch (error) {
        console.error('Error deleting partner:', error);
        res.status(500).json({ error: 'Failed to delete partner' });
    }
});

export default router;
