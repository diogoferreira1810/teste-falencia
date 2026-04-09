import { Router } from 'express';
import pool, { testConnection } from '../db.js';

const router = Router();

const placeholderValues = new Set(['localhost', 'nome_da_bd', 'utilizador', 'password', '']);

router.get('/connection-status', async (_req, res) => {
  const connectionTest = await testConnection();
  res.json({
    ok: connectionTest.success,
    message: connectionTest.message,
  });
});

router.get('/dados', async (_req, res) => {
  const hasPlaceholderConfig =
    placeholderValues.has(process.env.DB_HOST ?? '') ||
    placeholderValues.has(process.env.DB_NAME ?? '') ||
    placeholderValues.has(process.env.DB_USER ?? '') ||
    placeholderValues.has(process.env.DB_PASSWORD ?? '');

  if (hasPlaceholderConfig) {
    res.json({
      ok: false,
      message: 'A base de dados ainda está a ser configurada',
      data: [],
    });

    return;
  }

  try {
    const result = await pool.query('SELECT 1 AS ok');
    res.json({
      ok: true,
      message: 'Ligação à base de dados bem sucedida',
      data: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(503).json({
      ok: false,
      message: 'A base de dados ainda não está disponível',
      data: [],
    });
  }
});

export default router;