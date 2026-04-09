// src/routes/auth.js
//
// Handles user registration and login.
//
// POST /api/auth/register  — create a new account
// POST /api/auth/login     — get a JWT token
// GET  /api/auth/me        — get the logged-in user's profile (protected)

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ── Register ──────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { email, full_name, password } = req.body;

  // Basic validation
  if (!email || !full_name || !password) {
    return res.status(400).json({ error: 'email, full_name and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    // Check if email is already taken
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // bcrypt hashes the password with a salt (cost factor 12).
    // We NEVER store plain-text passwords.
    const password_hash = await bcrypt.hash(password, 12);

    // Insert the new user and return their id + role
    const [user] = await query(
      `INSERT INTO users (email, full_name, password_hash, role)
       VALUES ($1, $2, $3, 'customer')
       RETURNING id, email, full_name, role, created_at`,
      [email.toLowerCase().trim(), full_name.trim(), password_hash]
    );

    // Sign a JWT so the user is immediately logged in after registration
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('[auth/register]', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    // Fetch the user by email
    const [user] = await query(
      'SELECT id, email, full_name, role, password_hash FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    // Use a generic error message so attackers can't tell whether the
    // email exists or just the password was wrong
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // bcrypt.compare checks the plain password against the stored hash
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Sign the token — we exclude password_hash from the payload
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('[auth/login]', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ── Me (get current user) ─────────────────────────────────────────────────────
// requireAuth middleware runs first and sets req.user
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [user] = await query(
      'SELECT id, email, full_name, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('[auth/me]', err.message);
    res.status(500).json({ error: 'Could not fetch profile' });
  }
});

export default router;
