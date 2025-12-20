import express from 'express';
import bcrypt from 'bcrypt';
import { getDb } from '../config/db.js';

const router = express.Router();

// POST /login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const db = getDb();

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    try {
        const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (match) {
            req.session.user = {
                id: user.id,
                email: user.email,
                role: user.role,
                driverId: user.driver_id // Map DB column to session property
            };
            res.json({ message: "Login successful", user: req.session.user });
        } else {
            res.status(401).json({ error: "Invalid email or password" });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
    }
});

// POST /logout
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: "Could not log out" });
        }
        res.clearCookie('connect.sid');
        res.json({ message: "Logout successful" });
    });
});

// POST /register
router.post('/register', async (req, res) => {
    const { email, password, passwordConfirm } = req.body;
    const db = getDb();

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    if (password !== passwordConfirm) {
        return res.status(400).json({ error: "Passwords do not match" });
    }

    try {
        const existingUser = db.prepare("SELECT id FROM users WHERE email = ?").get(email);

        if (existingUser) {
            return res.status(409).json({ error: "Email already registered" });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const userId = 'user_' + Date.now();

        db.prepare(
            "INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)"
        ).run(userId, email, passwordHash, 'USER', new Date().toISOString());

        req.session.user = {
            id: userId,
            email: email,
            role: 'USER'
        };

        res.status(201).json({
            message: "Registration successful",
            user: req.session.user
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to process registration" });
    }
});

// GET /me
router.get('/me', (req, res) => {
    if (req.session && req.session.user) {
        // Refresh from DB to get latest role/driverId
        const db = getDb();
        try {
            const user = db.prepare("SELECT id, email, role, driver_id FROM users WHERE id = ?").get(req.session.user.id);
            if (user) {
                // Update session
                req.session.user = {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    driverId: user.driver_id
                };
            }
        } catch (err) {
            console.error("Session refresh error:", err);
            // Ignore error and use existing session
        }
        // Return (potentially updated) session user
        res.json({ authenticated: true, user: req.session.user });
    } else {
        res.json({ authenticated: false, user: null });
    }
});

export default router;
