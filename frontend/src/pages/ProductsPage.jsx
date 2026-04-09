// src/pages/ProductsPage.jsx
//
// The main shop page. Fetches and displays all products.
// Demonstrates: useEffect for data fetching, useState for filters,
// and conditional rendering for loading/error states.

import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productsApi } from '../api/client.js';

export default function ProductsPage() {
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  // useSearchParams reads/writes ?category=&sort= in the URL
  // This means filters are shareable via URL
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const sort     = searchParams.get('sort')     || 'newest';
  const search   = searchParams.get('search')   || '';

  // Fetch products whenever filters change
  useEffect(() => {
    setLoading(true);
    setError(null);

    // Build params object, only include truthy values
    const params = {};
    if (category) params.category = category;
    if (sort)     params.sort     = sort;
    if (search)   params.search   = search;

    productsApi.list(params)
      .then(setProducts)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [category, sort, search]); // Re-run when any of these change

  // Fetch categories once on mount (for the sidebar filter)
  useEffect(() => {
    productsApi.categories().then(setCategories).catch(() => {});
  }, []);

  function setFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  return (
    <div style={{ display: 'flex', gap: '2rem' }}>

      {/* ── Sidebar filters ── */}
      <aside style={styles.sidebar}>
        <h3 style={styles.sideTitle}>Categories</h3>
        <button style={category === '' ? styles.filterActive : styles.filterBtn}
          onClick={() => setFilter('category', '')}>
          All Plants
        </button>

        {/* Render root categories with their children indented */}
        {categories.map(cat => (
          <div key={cat.id}>
            <button
              style={category === cat.slug ? styles.filterActive : styles.filterBtn}
              onClick={() => setFilter('category', cat.slug)}>
              {cat.name}
            </button>
            {cat.children?.map(child => (
              <button key={child.id}
                style={{ ...(category === child.slug ? styles.filterActive : styles.filterBtn), paddingLeft: 24 }}
                onClick={() => setFilter('category', child.slug)}>
                ↳ {child.name}
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* ── Main content ── */}
      <div style={{ flex: 1 }}>
        {/* Search + sort bar */}
        <div style={styles.toolbar}>
          <input
            placeholder="Search plants..."
            defaultValue={search}
            style={styles.searchInput}
            onKeyDown={e => { if (e.key === 'Enter') setFilter('search', e.target.value); }}
          />
          <select value={sort} onChange={e => setFilter('sort', e.target.value)} style={styles.select}>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>

        {loading && <p>Loading products...</p>}
        {error   && <p style={{ color: 'red' }}>{error}</p>}

        {!loading && products.length === 0 && (
          <p>No products found.</p>
        )}

        {/* Product grid */}
        <div style={styles.grid}>
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ product }) {
  return (
    // Link wraps the entire card — clicking anywhere navigates to the detail page
    <Link to={`/products/${product.slug}`} style={styles.cardLink}>
      <div style={styles.card}>
        <div style={styles.imageBox}>
          {product.image
            ? <img src={product.image} alt={product.name} style={styles.image} />
            : <div style={styles.imagePlaceholder}>🌱</div>
          }
        </div>
        <div style={styles.cardBody}>
          <p style={styles.cardCategory}>{product.category}</p>
          <h3 style={styles.cardName}>{product.name}</h3>

          {/* Star rating */}
          {product.avg_rating && (
            <p style={styles.rating}>
              {'★'.repeat(Math.round(product.avg_rating))}
              {'☆'.repeat(5 - Math.round(product.avg_rating))}
              <span style={styles.ratingCount}> ({product.review_count})</span>
            </p>
          )}

          <p style={styles.price}>From €{Number(product.price).toFixed(2)}</p>

          {/* Tag badges */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
            {product.tags?.slice(0, 3).map(tag => (
              <span key={tag} style={styles.tag}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}

const styles = {
  sidebar:       { width: 200, flexShrink: 0 },
  sideTitle:     { marginBottom: 8, color: '#2C2C2A' },
  filterBtn:     { display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px', marginBottom: 4, background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 6, color: '#5F5E5A' },
  filterActive:  { display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px', marginBottom: 4, background: '#E1F5EE', border: 'none', cursor: 'pointer', borderRadius: 6, color: '#0F6E56', fontWeight: 600 },
  toolbar:       { display: 'flex', gap: 8, marginBottom: '1.5rem' },
  searchInput:   { flex: 1, padding: '8px 12px', border: '1px solid #D3D1C7', borderRadius: 8, fontSize: '0.95rem' },
  select:        { padding: '8px 12px', border: '1px solid #D3D1C7', borderRadius: 8, fontSize: '0.95rem', background: '#fff' },
  grid:          { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' },
  cardLink:      { textDecoration: 'none', color: 'inherit' },
  card:          { border: '1px solid #E1F5EE', borderRadius: 12, overflow: 'hidden', background: '#fff', transition: 'box-shadow 0.2s', cursor: 'pointer' },
  imageBox:      { height: 180, background: '#F8F7F4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  image:         { width: '100%', height: '100%', objectFit: 'cover' },
  imagePlaceholder: { fontSize: '3rem' },
  cardBody:      { padding: '0.75rem 1rem 1rem' },
  cardCategory:  { fontSize: '0.75rem', color: '#888780', margin: 0, textTransform: 'uppercase', letterSpacing: 1 },
  cardName:      { margin: '4px 0', fontSize: '1rem', color: '#2C2C2A' },
  rating:        { color: '#BA7517', fontSize: '0.85rem', margin: '4px 0' },
  ratingCount:   { color: '#888780' },
  price:         { color: '#0F6E56', fontWeight: 700, fontSize: '1rem', margin: '4px 0 0' },
  tag:           { background: '#E1F5EE', color: '#0F6E56', fontSize: '0.7rem', padding: '2px 7px', borderRadius: 20, fontWeight: 500 },
};
