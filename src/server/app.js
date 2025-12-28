import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import path from 'path';

import authRoutes from './routes/authRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import photoRoutes from './routes/photoRoutes.js';
import resultRoutes from './routes/resultRoutes.js';
import miscRoutes from './routes/miscRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import participationRoutes from './routes/participationRoutes.js';
import statusRoutes from './routes/statusRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import partnerRoutes from './routes/partnerRoutes.js';

const app = express();

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Allow localhost and local network IPs
        // You might want to be more specific for security in production,
        // but for local dev, allowing all is often easiest or checking regex
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());
app.use(cookieParser());

// Session Configuration
app.use(session({
    secret: 'autoxstats_secret_key_change_in_prod', // INSECURE: Move to env var in prod
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Serve Static Files (Build)
app.use(express.static(path.resolve('dist')));

// Serve Static Files (Uploads)
app.use('/uploads', express.static(path.resolve('uploads')));

// Routes
// /api/auth/*
app.use('/api/auth', authRoutes);

// /api/drivers/*
app.use('/api/drivers', driverRoutes);

// /api/events/*
app.use('/api/events', eventRoutes);

// /api/admin/*
app.use('/api/admin', adminRoutes);

// /api/profile/*
app.use('/api/profile', profileRoutes);

// /api/* (photos, race-results, misc, participation)
app.use('/api', photoRoutes);
app.use('/api', resultRoutes);
app.use('/api', miscRoutes);
app.use('/api', participationRoutes);

// /api/status/*
app.use('/api/status', statusRoutes);

// /api/requests/*
app.use('/api/requests', requestRoutes);

// /api/partners/*
app.use('/api/partners', partnerRoutes);


// Catch-all for SPA (must be last)
app.get(/.*/, (req, res) => {
    res.sendFile(path.resolve('dist', 'index.html'));
});

export default app;
