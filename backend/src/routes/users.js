// src/routes/users.js
//
// User-specific data endpoints (all protected).
//
// GET  /api/users/addresses        — list addresses for current user
// POST /api/users/addresses        — add a new address
// PUT  /api/users/addresses/:id    — update an address
// DELETE /api/users/addresses/:id  — delete an address

import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth); // every route in this file requires login

// ── List addresses ────────────────────────────────────────────────────────────
router.get('/addresses', async (req, res) => {
  try {
    const addresses = await query(
      `SELECT id, line1, city, postal_code, country, is_default
       FROM addresses WHERE user_id = $1 ORDER BY is_default DESC`,
      [req.user.id]
    );
    res.json(addresses);
  } catch (err) {
    console.error('[users/addresses]', err.message);
    res.status(500).json({ error: 'Could not fetch addresses' });
  }
});

// ── Add address ───────────────────────────────────────────────────────────────
router.post('/addresses', async (req, res) => {
  const { line1, city, postal_code, country, is_default } = req.body;

  if (!line1 || !city || !postal_code || !country) {
    return res.status(400).json({ error: 'line1, city, postal_code and country are required' });
  }

  try {
    // If this is set as default, unset the previous default first
    if (is_default) {
      await query(
        'UPDATE addresses SET is_default = false WHERE user_id = $1',
        [req.user.id]
      );
    }

    const [address] = await query(
      `INSERT INTO addresses (user_id, line1, city, postal_code, country, is_default)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, line1, city, postal_code, country, is_default`,
      [req.user.id, line1, city, postal_code, country.toUpperCase(), !!is_default]
    );
    res.status(201).json(address);
  } catch (err) {
    console.error('[users/addresses/add]', err.message);
    res.status(500).json({ error: 'Could not add address' });
  }
});

// ── Update address ────────────────────────────────────────────────────────────
router.put('/addresses/:id', async (req, res) => {
  const { line1, city, postal_code, country, is_default } = req.body;
  try {
    if (is_default) {
      await query('UPDATE addresses SET is_default = false WHERE user_id = $1', [req.user.id]);
    }
    const [address] = await query(
      `UPDATE addresses
       SET line1=$1, city=$2, postal_code=$3, country=$4, is_default=$5
       WHERE id=$6 AND user_id=$7
       RETURNING id, line1, city, postal_code, country, is_default`,
      [line1, city, postal_code, country.toUpperCase(), !!is_default, req.params.id, req.user.id]
    );
    if (!address) return res.status(404).json({ error: 'Address not found' });
    res.json(address);
  } catch (err) {
    console.error('[users/addresses/update]', err.message);
    res.status(500).json({ error: 'Could not update address' });
  }
});

// ── Delete address ────────────────────────────────────────────────────────────
router.delete('/addresses/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM addresses WHERE id=$1 AND user_id=$2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.length) return res.status(404).json({ error: 'Address not found' });
    res.json({ deleted: true });
  } catch (err) {
    console.error('[users/addresses/delete]', err.message);
    res.status(500).json({ error: 'Could not delete address' });
  }
});

export default router;
