// src/index.js
//
// The main entry point for the Express server.
// This file wires everything together: middleware, routes, error handling.

import 'dotenv/config'; // Load .env variables FIRST, before anything else
import express from 'express';
import cors from 'cors';

import authRoutes     from './routes/auth.js';
import productRoutes  from './routes/products.js';
import orderRoutes    from './routes/orders.js';
import userRoutes     from './routes/users.js';

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Global Middleware ─────────────────────────────────────────────────────────

// CORS: allow requests from our React frontend (running on port 5173 in dev).
// In production, replace the origin with your real domain.
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Parse incoming JSON request bodies (req.body)
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
// Each group of routes is mounted under a prefix.
// e.g. POST /api/auth/login hits src/routes/auth.js → router.post('/login', ...)

app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/users',    userRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
// Useful to verify the server is running: GET http://localhost:3001/api/health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
// Catches any request that didn't match a route above
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ──────────────────────────────────────────────────────
// If any route calls next(err), it ends up here.
// The 4-argument signature is how Express recognises an error handler.
app.use((err, req, res, next) => {
  console.error('[server error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
