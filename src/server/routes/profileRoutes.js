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

// GET /me - Get own profile
router.get('/me', requireAuth, (req, res) => {
    const userId = req.session.user.id;
    const db = getDb();

    try {
        const row = db.prepare(`
            SELECT 
                up.*,
                u.email,
                u.driver_id
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE u.id = ?
        `).get(userId);

        // Return profile data (or empty defaults if no profile exists yet)
        res.json({
            userId: userId,
            email: row?.email || req.session.user.email,
            driverId: row?.driver_id || null,
            displayName: row?.display_name || '',
            bio: row?.bio || '',
            avatarImageId: row?.avatar_image_id || null,
            socialInstagram: row?.social_instagram || '',
            socialFacebook: row?.social_facebook || '',
            socialYoutube: row?.social_youtube || '',
            isDisplayNamePublic: row?.is_display_name_public === 1,
            isBioPublic: row?.is_bio_public === 1,
            isSocialPublic: row?.is_social_public === 1
        });
    } catch (err) {
        console.error("Error fetching profile:", err.message);
        return res.status(500).json({ error: "Database error" });
    }
});

// PUT /me - Update own profile
router.put('/me', requireAuth, (req, res) => {
    const userId = req.session.user.id;
    const db = getDb();

    // Extract allowed fields only (ignore unknown fields, never accept user_id)
    const {
        displayName,
        bio,
        avatarImageId,
        socialInstagram,
        socialFacebook,
        socialYoutube,
        isDisplayNamePublic,
        isBioPublic,
        isSocialPublic
    } = req.body;

    // Upsert: INSERT OR REPLACE
    try {
        db.prepare(`
            INSERT INTO user_profiles (
                user_id, display_name, bio, avatar_image_id,
                social_instagram, social_facebook, social_youtube,
                is_display_name_public, is_bio_public, is_social_public,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
                display_name = excluded.display_name,
                bio = excluded.bio,
                avatar_image_id = excluded.avatar_image_id,
                social_instagram = excluded.social_instagram,
                social_facebook = excluded.social_facebook,
                social_youtube = excluded.social_youtube,
                is_display_name_public = excluded.is_display_name_public,
                is_bio_public = excluded.is_bio_public,
                is_social_public = excluded.is_social_public,
                updated_at = CURRENT_TIMESTAMP
        `).run(
            userId,
            displayName || '',
            bio || '',
            avatarImageId || null,
            socialInstagram || '',
            socialFacebook || '',
            socialYoutube || '',
            isDisplayNamePublic ? 1 : 0,
            isBioPublic ? 1 : 0,
            isSocialPublic ? 1 : 0
        );
        res.json({ message: "Profile updated successfully" });
    } catch (err) {
        console.error("Error updating profile:", err.message);
        return res.status(500).json({ error: "Failed to update profile" });
    }
});

// GET /:userId - Get public profile for any user
router.get('/:userId', (req, res) => {
    const targetUserId = req.params.userId;
    const db = getDb();

    try {
        const row = db.prepare(`
            SELECT up.*, u.id as user_id
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE u.id = ?
        `).get(targetUserId);

        if (!row) {
            return res.status(404).json({ error: "User not found" });
        }

        // Only return fields where visibility is TRUE
        // Never expose email, role, or internal IDs
        const publicProfile = {
            userId: row.user_id
        };

        if (row.is_display_name_public === 1 && row.display_name) {
            publicProfile.displayName = row.display_name;
        }

        if (row.is_bio_public === 1 && row.bio) {
            publicProfile.bio = row.bio;
        }

        if (row.is_social_public === 1) {
            if (row.social_instagram) publicProfile.socialInstagram = row.social_instagram;
            if (row.social_facebook) publicProfile.socialFacebook = row.social_facebook;
            if (row.social_youtube) publicProfile.socialYoutube = row.social_youtube;
        }

        res.json(publicProfile);
    } catch (err) {
        console.error("Error fetching public profile:", err.message);
        return res.status(500).json({ error: "Database error" });
    }
});

export default router;
