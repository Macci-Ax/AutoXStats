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

const app = express();

app.use(cors({
    origin: 'http://localhost:5173', // Vite default port
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

// Serve Static Files (Uploads) (Assuming run from project root)
app.use('/uploads', express.static(path.resolve('uploads')));

// Routes
// /api/auth/*
app.use('/api/auth', authRoutes);

// /api/drivers/*
app.use('/api/drivers', driverRoutes);

// /api/events/* and /api (if eventRoutes has /) - wait, eventRoutes has / and /:id/results
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


// Root route
app.get('/', (req, res) => {
    res.send('AutoXStats API Server is running. Access endpoints at /api/drivers or /api/events');
});

export default app;
