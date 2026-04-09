// src/db/pool.js
//
// We use the 'pg' library (node-postgres) to talk to PostgreSQL.
// A "pool" keeps multiple connections open and reuses them across requests —
// much faster than opening a new connection on every request.

import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// Pool reads connection settings from environment variables (.env file).
// In production, set these variables on your hosting platform instead.
const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // Keep up to 10 connections open at once
  max: 10,
  // If a connection sits idle for 30s, close it
  idleTimeoutMillis: 30_000,
});

// Log when a new physical connection is made (helpful during development) pipipip
pool.on('connect', () => {
  console.log('[db] new client connected');
});

// Log any pool-level errors (e.g. DB went down)
pool.on('error', (err) => {
  console.error('[db] unexpected pool error', err.message);
});

// Helper: run a query and always return rows.
// Usage: const rows = await query('SELECT * FROM products WHERE id = $1', [id])
export async function query(sql, params) {
  const result = await pool.query(sql, params);
  return result.rows;
}

// Helper: get a single client for transactions.
// Remember to call client.release() when done.
export async function getClient() {
  return pool.connect();
}

export default pool;
