import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Resend } from 'resend';
import { getDb } from '../config/db.js';

const router = express.Router();

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:5173';

// Helper function to send verification email
async function sendVerificationEmail(email, token) {
    const verificationLink = `${APP_BASE_URL}/verify-email?token=${token}`;

    console.log('=== SENDING VERIFICATION EMAIL ===');
    console.log('To:', email);
    console.log('Verification Link:', verificationLink);
    console.log('API Key present:', !!process.env.RESEND_API_KEY);

    try {
        const result = await resend.emails.send({
            from: 'AutoXStats <onboarding@resend.dev>',
            to: email,
            subject: 'Bestätige deine E-Mail-Adresse - AutoXStats',
            html: `
                <h2>Willkommen bei AutoXStats!</h2>
                <p>Bitte klicke auf den folgenden Link, um deine E-Mail-Adresse zu bestätigen:</p>
                <p><a href="${verificationLink}" style="display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px;">E-Mail bestätigen</a></p>
                <p>Oder kopiere diesen Link in deinen Browser:</p>
                <p>${verificationLink}</p>
                <p>Dieser Link ist 24 Stunden gültig.</p>
                <br>
                <p>Falls du dich nicht bei AutoXStats registriert hast, kannst du diese E-Mail ignorieren.</p>
            `
        });
        console.log('Resend API Response:', JSON.stringify(result, null, 2));
        return result;
    } catch (error) {
        console.error('Resend API Error:', error);
        throw error;
    }
}

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

        // Check if email is verified (skip for ADMIN users)
        if (user.role !== 'ADMIN' && !user.email_verified) {
            return res.status(401).json({ error: "Bitte verifiziere zuerst deine E-Mail-Adresse" });
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

        // Generate verification token
        const verificationToken = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

        // Insert user with email_verified = 0
        db.prepare(
            `INSERT INTO users (id, email, password_hash, role, created_at, email_verified, email_verification_token, email_verification_expires_at) 
             VALUES (?, ?, ?, ?, ?, 0, ?, ?)`
        ).run(userId, email, passwordHash, 'USER', new Date().toISOString(), verificationToken, expiresAt);

        // Send verification email
        try {
            await sendVerificationEmail(email, verificationToken);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Don't fail registration if email fails - user can request resend
        }

        // DO NOT auto-login - require email verification first
        res.status(201).json({
            message: "Registrierung erfolgreich! Bitte überprüfe deine E-Mails, um dein Konto zu aktivieren.",
            requiresVerification: true
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to process registration" });
    }
});

// GET /verify-email
router.get('/verify-email', async (req, res) => {
    const { token } = req.query;
    const db = getDb();

    if (!token) {
        return res.status(400).json({ error: "Verification token is required" });
    }

    try {
        const user = db.prepare(
            "SELECT * FROM users WHERE email_verification_token = ?"
        ).get(token);

        if (!user) {
            return res.status(400).json({ error: "Ungültiger oder bereits verwendeter Token" });
        }

        // Check if token is expired
        const expiresAt = new Date(user.email_verification_expires_at);
        if (expiresAt < new Date()) {
            return res.status(400).json({ error: "Token ist abgelaufen. Bitte registriere dich erneut." });
        }

        // Verify the email and clear the token
        db.prepare(
            `UPDATE users 
             SET email_verified = 1, 
                 email_verification_token = NULL, 
                 email_verification_expires_at = NULL 
             WHERE id = ?`
        ).run(user.id);

        res.json({
            success: true,
            message: "E-Mail erfolgreich verifiziert! Du kannst dich jetzt einloggen."
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Verification failed" });
    }
});

// POST /resend-verification
router.post('/resend-verification', async (req, res) => {
    const { email } = req.body;
    const db = getDb();

    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }

    try {
        const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

        if (!user) {
            // Don't reveal if email exists
            return res.json({ message: "Falls ein Konto existiert, wurde eine neue Verifizierungs-E-Mail gesendet." });
        }

        if (user.email_verified) {
            return res.status(400).json({ error: "E-Mail ist bereits verifiziert" });
        }

        // Generate new token
        const verificationToken = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        db.prepare(
            `UPDATE users SET email_verification_token = ?, email_verification_expires_at = ? WHERE id = ?`
        ).run(verificationToken, expiresAt, user.id);

        await sendVerificationEmail(email, verificationToken);

        res.json({ message: "Verifizierungs-E-Mail wurde erneut gesendet." });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to resend verification email" });
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
