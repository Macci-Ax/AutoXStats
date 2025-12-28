import express from 'express';
import { getDb } from '../config/db.js';
import { upload } from '../middleware/upload.js';
import { requireAdmin } from '../middleware/admin.js';

const router = express.Router();

// GET /gallery/events
// Returns physical events that have photos
router.get('/gallery/events', (req, res) => {
    const db = getDb();
    const query = `
        SELECT 
            pe.id, 
            pe.title as name, 
            pe.start_date as date, 
            COUNT(p.id) as photo_count,
            (SELECT storage_path FROM photos p2 WHERE p2.physical_event_id = pe.id ORDER BY p2.created_at DESC LIMIT 1) as cover_url
        FROM physical_events pe
        JOIN photos p ON pe.id = p.physical_event_id
        GROUP BY pe.id
        ORDER BY pe.start_date DESC
    `;

    try {
        const rows = db.prepare(query).all();
        res.json(rows);
    } catch (err) {
        console.error("Error fetching gallery events:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /photos (List photos)
router.get('/photos', (req, res) => {
    const { eventId } = req.query;
    const db = getDb();
    let query = `
        SELECT 
            p.*,
            GROUP_CONCAT(pt.id || '::' || pt.driver_id || '::' || IFNULL(d.name, 'Unknown'), '||') as tags_raw
        FROM photos p
        LEFT JOIN photo_tags pt ON p.id = pt.photo_id
        LEFT JOIN drivers d ON pt.driver_id = d.id
    `;
    const params = [];
    if (eventId) {
        query += " WHERE p.physical_event_id = ?";
        params.push(eventId);
    }
    query += " GROUP BY p.id ORDER BY p.created_at DESC";

    try {
        const rows = db.prepare(query).all(params);

        const photos = rows.map(r => {
            const tags = [];
            if (r.tags_raw) {
                r.tags_raw.split('||').forEach(t => {
                    const parts = t.split('::');
                    if (parts.length === 3) {
                        tags.push({ id: parts[0], driverId: parts[1], name: parts[2] });
                    }
                });
            }
            return {
                id: r.id,
                url: r.storage_path,
                eventId: r.physical_event_id,
                photographer: r.photographer || 'Gast',
                uploadDate: r.created_at,
                highResAvailable: true,
                tags: tags
            };
        });
        res.json(photos);
    } catch (err) {
        console.error("Error fetching photos:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// POST /photos (Upload photos)
router.post('/photos', upload.array('photos'), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
    }

    const { eventId, photographer } = req.body;
    const finalPhotographer = photographer || 'Unknown';
    const uploadedPhotos = [];
    const db = getDb();

    const stmt = db.prepare(`
        INSERT INTO photos (id, event_id, physical_event_id, storage_path, photographer, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const errors = [];
    req.files.forEach(file => {
        const fileUrl = `/uploads/${file.filename}`;
        const photoId = 'p_' + Date.now() + '_' + Math.round(Math.random() * 1000);

        try {
            stmt.run(photoId, eventId || 'e_general', eventId || 'e_general', fileUrl, finalPhotographer);
            uploadedPhotos.push({
                id: photoId,
                url: fileUrl,
                eventId: eventId,
                photographer: finalPhotographer,
                uploadDate: new Date().toISOString()
            });
        } catch (err) {
            console.error("Error saving photo:", err.message);
            errors.push(err.message);
        }
    });

    if (uploadedPhotos.length === 0 && errors.length > 0) {
        return res.status(500).json({ error: "Failed to save photos", details: errors });
    }

    res.json({
        message: `${uploadedPhotos.length} photos uploaded successfully`,
        photos: uploadedPhotos,
        errors: errors.length > 0 ? errors : undefined
    });
});

// POST /photos/:id/tags (Add tag)
router.post('/photos/:id/tags', requireAdmin, (req, res) => {
    const photoId = req.params.id;
    const { driverId } = req.body;
    const db = getDb();

    if (!driverId) return res.status(400).json({ error: "Driver ID required" });

    const tagId = 'tag_' + Date.now() + '_' + Math.round(Math.random() * 1000);
    try {
        db.prepare(
            "INSERT INTO photo_tags (id, photo_id, driver_id) VALUES (?, ?, ?)"
        ).run(tagId, photoId, driverId);
        res.json({ message: "Tag added", tag: { id: tagId, driverId } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /photos/:id/tags/:tagId (Remove tag)
router.delete('/photos/:id/tags/:tagId', requireAdmin, (req, res) => {
    const { tagId } = req.params;
    const db = getDb();
    try {
        db.prepare("DELETE FROM photo_tags WHERE id = ?").run(tagId);
        res.json({ message: "Tag removed" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /drivers/:id/photos (Get driver photos)
router.get('/drivers/:id/photos', (req, res) => {
    const driverId = req.params.id;
    const db = getDb();
    const query = `
        SELECT p.* 
        FROM photos p
        JOIN photo_tags pt ON p.id = pt.photo_id
        WHERE pt.driver_id = ?
        ORDER BY p.created_at DESC
    `;
    try {
        const rows = db.prepare(query).all(driverId);
        const photos = rows.map(r => ({
            id: r.id,
            url: r.storage_path,
            eventId: r.physical_event_id,
            photographer: r.photographer || 'Gast',
            uploadDate: r.created_at,
            highResAvailable: true
        }));
        res.json(photos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
