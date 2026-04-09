// src/routes/products.js
//
// All public product-related endpoints.
//
// GET /api/products              — list all active products (with filters)
// GET /api/products/:slug        — single product detail + variants + reviews
// GET /api/products/categories   — list all categories (for nav/filters)

import { Router } from 'express';
import { query } from '../db/pool.js';

const router = Router();

// ── List products ─────────────────────────────────────────────────────────────
// Supports optional query params:
//   ?category=indoor-plants   filter by category slug
//   ?tag=pet-friendly         filter by tag slug
//   ?search=monstera          search in name/description
//   ?sort=price_asc|price_desc|newest
router.get('/', async (req, res) => {
  const { category, tag, search, sort } = req.query;

  // We build the query dynamically based on which filters are active.
  // $1, $2... are placeholders — pg replaces them safely (prevents SQL injection)
  const params = [];
  const conditions = ['p.is_active = true'];

  if (category) {
    params.push(category);
    // $1 — match by category slug
    conditions.push(`c.slug = $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    // $N — case-insensitive search in name and description
    conditions.push(`(p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`);
  }

  // Determine ORDER BY
  const orderMap = {
    price_asc:  'MIN(pv.price) ASC',
    price_desc: 'MIN(pv.price) DESC',
    newest:     'p.created_at DESC',
  };
  const orderBy = orderMap[sort] || 'p.created_at DESC';

  // If filtering by tag we need an extra JOIN
  const tagJoin = tag
    ? `JOIN product_tags pt2 ON pt2.product_id = p.id
       JOIN tags t2 ON t2.id = pt2.tag_id AND t2.slug = '${tag.replace(/'/g,"''")}' `
    : '';

  const sql = `
    SELECT
      p.id,
      p.name,
      p.slug,
      p.description,
      c.name          AS category,
      c.slug          AS category_slug,
      -- Cheapest variant price (shown as the "from" price on listing cards)
      MIN(pv.price)   AS price,
      -- First image for the listing card thumbnail
      (SELECT url FROM product_images
       WHERE product_id = p.id ORDER BY sort_order LIMIT 1) AS image,
      -- Average rating
      ROUND(AVG(r.rating)::numeric, 1) AS avg_rating,
      COUNT(DISTINCT r.id)             AS review_count,
      -- Array of tag names for badge display
      ARRAY_AGG(DISTINCT tg.name) FILTER (WHERE tg.name IS NOT NULL) AS tags
    FROM products p
    JOIN categories c         ON c.id = p.category_id
    JOIN product_variants pv  ON pv.product_id = p.id
    LEFT JOIN reviews r       ON r.product_id = p.id
    LEFT JOIN product_tags pt ON pt.product_id = p.id
    LEFT JOIN tags tg         ON tg.id = pt.tag_id
    ${tagJoin}
    WHERE ${conditions.join(' AND ')}
    GROUP BY p.id, p.name, p.slug, p.description, c.name, c.slug
    ORDER BY ${orderBy}
  `;

  try {
    const products = await query(sql, params);
    res.json(products);
  } catch (err) {
    console.error('[products/list]', err.message);
    res.status(500).json({ error: 'Could not fetch products' });
  }
});

// ── Categories list ───────────────────────────────────────────────────────────
// Returns a tree: root categories with their children nested inside
router.get('/categories', async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        id, parent_id, name, slug, description,
        COUNT(p.id) AS product_count
      FROM categories cat
      LEFT JOIN products p ON p.category_id = cat.id AND p.is_active = true
      GROUP BY cat.id
      ORDER BY cat.parent_id NULLS FIRST, cat.name
    `);

    // Build a nested tree from the flat list
    const map = {};
    rows.forEach(r => { map[r.id] = { ...r, children: [] }; });

    const tree = [];
    rows.forEach(r => {
      if (r.parent_id) {
        map[r.parent_id]?.children.push(map[r.id]);
      } else {
        tree.push(map[r.id]);
      }
    });

    res.json(tree);
  } catch (err) {
    console.error('[products/categories]', err.message);
    res.status(500).json({ error: 'Could not fetch categories' });
  }
});

// ── Single product by slug ────────────────────────────────────────────────────
// Returns full product info: variants, images, tags, reviews
router.get('/:slug', async (req, res) => {
  try {
    // 1. Core product data
    const [product] = await query(`
      SELECT
        p.id, p.name, p.slug, p.description, p.created_at,
        c.name AS category, c.slug AS category_slug
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE p.slug = $1 AND p.is_active = true
    `, [req.params.slug]);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // 2. All variants for this product (size, price, stock)
    const variants = await query(`
      SELECT
        pv.id, pv.sku, pv.name, pv.price, pv.compare_price, pv.is_default,
        -- Available stock = total minus reserved orders
        COALESCE(i.quantity - i.reserved, 0) AS stock
      FROM product_variants pv
      LEFT JOIN inventory i ON i.variant_id = pv.id
      WHERE pv.product_id = $1
      ORDER BY pv.price ASC
    `, [product.id]);

    // 3. Image gallery
    const images = await query(`
      SELECT id, url, alt_text, sort_order
      FROM product_images
      WHERE product_id = $1
      ORDER BY sort_order
    `, [product.id]);

    // 4. Tags
    const tags = await query(`
      SELECT t.id, t.name, t.slug
      FROM tags t
      JOIN product_tags pt ON pt.tag_id = t.id
      WHERE pt.product_id = $1
    `, [product.id]);

    // 5. Reviews with the reviewer's name
    const reviews = await query(`
      SELECT
        r.id, r.rating, r.body, r.created_at,
        u.full_name AS reviewer
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC
    `, [product.id]);

    res.json({ ...product, variants, images, tags, reviews });
  } catch (err) {
    console.error('[products/detail]', err.message);
    res.status(500).json({ error: 'Could not fetch product' });
  }
});

export default router;
