// src/routes/orders.js
//
// All order-related endpoints. All routes are protected (require login).
//
// POST /api/orders          — place a new order (checkout)
// GET  /api/orders          — list the current user's orders
// GET  /api/orders/:id      — single order detail

import { Router } from 'express';
import { query, getClient } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All routes in this file require the user to be logged in
router.use(requireAuth);

// ── Place an order (checkout) ─────────────────────────────────────────────────
//
// Expected request body:
// {
//   address_id: "uuid",
//   coupon_code: "SPRING5",   // optional
//   items: [
//     { variant_id: "uuid", quantity: 2 },
//     ...
//   ]
// }
router.post('/', async (req, res) => {
  const { address_id, coupon_code, items } = req.body;

  if (!address_id || !items?.length) {
    return res.status(400).json({ error: 'address_id and items are required' });
  }

  // We use a database TRANSACTION here.
  // A transaction groups multiple queries so they either ALL succeed or
  // ALL fail together — critical for orders (we never want to charge
  // someone without creating the order, or reserve stock without an order).
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // 1. Verify the address belongs to this user
    const { rows: addrs } = await client.query(
      'SELECT id FROM addresses WHERE id = $1 AND user_id = $2',
      [address_id, req.user.id]
    );
    if (!addrs.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid address' });
    }

    // 2. Resolve coupon (if provided)
    let couponId = null;
    let discount = 0;

    if (coupon_code) {
      const { rows: coupons } = await client.query(
        `SELECT id, type, value FROM coupons
         WHERE code = $1
           AND (expires_at IS NULL OR expires_at > NOW())`,
        [coupon_code.toUpperCase()]
      );
      if (!coupons.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Invalid or expired coupon' });
      }
      couponId = coupons[0].id;
      // We'll apply the discount after calculating the subtotal below
      discount = coupons[0]; // { type, value }
    }

    // 3. Validate stock and fetch current prices for each item
    let subtotal = 0;
    const resolvedItems = [];

    for (const item of items) {
      const { rows: variants } = await client.query(
        `SELECT pv.id, pv.price, i.quantity, i.reserved
         FROM product_variants pv
         JOIN inventory i ON i.variant_id = pv.id
         WHERE pv.id = $1
         FOR UPDATE`, // Lock the row so no concurrent order can grab the same stock
        [item.variant_id]
      );

      if (!variants.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Variant ${item.variant_id} not found` });
      }

      const v = variants[0];
      const available = v.quantity - v.reserved;

      if (available < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: `Not enough stock for variant ${item.variant_id}. Available: ${available}`
        });
      }

      subtotal += v.price * item.quantity;
      resolvedItems.push({ variant_id: item.variant_id, quantity: item.quantity, unit_price: v.price });
    }

    // 4. Apply coupon discount
    let discountAmount = 0;
    if (discount && discount.type) {
      discountAmount = discount.type === 'percent'
        ? subtotal * (discount.value / 100)
        : Math.min(Number(discount.value), subtotal);
    }

    // Free shipping over €50 (before discount)
    const shipping = subtotal >= 50 ? 0 : 3.99;
    const total = Math.max(0, subtotal - discountAmount) + shipping;

    // 5. Insert the order
    const { rows: [order] } = await client.query(
      `INSERT INTO orders (user_id, address_id, coupon_id, status, subtotal, shipping, total)
       VALUES ($1, $2, $3, 'pending', $4, $5, $6)
       RETURNING id`,
      [req.user.id, address_id, couponId, subtotal.toFixed(2), shipping.toFixed(2), total.toFixed(2)]
    );

    // 6. Insert order items and update reserved stock
    for (const item of resolvedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, variant_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [order.id, item.variant_id, item.quantity, item.unit_price]
      );

      // Increment reserved so the stock counter updates immediately
      await client.query(
        `UPDATE inventory SET reserved = reserved + $1, updated_at = NOW()
         WHERE variant_id = $2`,
        [item.quantity, item.variant_id]
      );
    }

    // All good — commit the transaction
    await client.query('COMMIT');

    res.status(201).json({ order_id: order.id, total: total.toFixed(2) });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[orders/create]', err.message);
    res.status(500).json({ error: 'Order failed' });
  } finally {
    // Always release the client back to the pool
    client.release();
  }
});

// ── List user's orders ────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const orders = await query(`
      SELECT
        o.id, o.status, o.subtotal, o.shipping, o.total, o.placed_at,
        COUNT(oi.id) AS item_count
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.placed_at DESC
    `, [req.user.id]);

    res.json(orders);
  } catch (err) {
    console.error('[orders/list]', err.message);
    res.status(500).json({ error: 'Could not fetch orders' });
  }
});

// ── Single order detail ───────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    // Fetch the order (only if it belongs to this user)
    const [order] = await query(`
      SELECT
        o.id, o.status, o.subtotal, o.shipping, o.total, o.placed_at,
        a.line1, a.city, a.postal_code, a.country,
        cp.code AS coupon_code
      FROM orders o
      JOIN addresses a ON a.id = o.address_id
      LEFT JOIN coupons cp ON cp.id = o.coupon_id
      WHERE o.id = $1 AND o.user_id = $2
    `, [req.params.id, req.user.id]);

    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Fetch line items with product info
    const items = await query(`
      SELECT
        oi.quantity, oi.unit_price,
        pv.name  AS variant_name,
        pv.sku,
        p.name   AS product_name,
        p.slug   AS product_slug,
        (SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) AS image
      FROM order_items oi
      JOIN product_variants pv ON pv.id = oi.variant_id
      JOIN products p          ON p.id  = pv.product_id
      WHERE oi.order_id = $1
    `, [order.id]);

    res.json({ ...order, items });
  } catch (err) {
    console.error('[orders/detail]', err.message);
    res.status(500).json({ error: 'Could not fetch order' });
  }
});

export default router;
