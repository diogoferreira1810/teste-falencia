// src/pages/ProductDetail.jsx
//
// Shows full product info: image gallery, variant selector, reviews, add to cart.
// Key concepts: useParams to read the URL, controlled form for variant selection.

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsApi } from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';

export default function ProductDetail() {
  const { slug }       = useParams(); // read :slug from the URL
  const navigate       = useNavigate();
  const { addItem }    = useCart();

  const [product,         setProduct]         = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImage,   setSelectedImage]   = useState(0);
  const [addedMsg,        setAddedMsg]        = useState('');

  useEffect(() => {
    setLoading(true);
    productsApi.detail(slug)
      .then(data => {
        setProduct(data);
        // Pre-select the default variant
        const def = data.variants.find(v => v.is_default) || data.variants[0];
        setSelectedVariant(def);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  function handleAddToCart() {
    if (!selectedVariant) return;
    addItem({
      variantId:   selectedVariant.id,
      productName: product.name,
      variantName: selectedVariant.name,
      price:       Number(selectedVariant.price),
      image:       product.images[0]?.url || '',
      quantity:    1,
    });
    setAddedMsg('Added to cart!');
    setTimeout(() => setAddedMsg(''), 2000);
  }

  if (loading) return <p>Loading...</p>;
  if (error)   return <p style={{ color: 'red' }}>{error}</p>;
  if (!product) return null;

  const outOfStock = selectedVariant && selectedVariant.stock === 0;

  return (
    <div>
      {/* Breadcrumb */}
      <p style={styles.breadcrumb}>
        <span onClick={() => navigate('/products')} style={styles.breadLink}>Shop</span>
        {' / '}
        <span onClick={() => navigate(`/products?category=${product.category_slug}`)} style={styles.breadLink}>
          {product.category}
        </span>
        {' / '}{product.name}
      </p>

      <div style={styles.layout}>
        {/* ── Image gallery ── */}
        <div style={styles.gallery}>
          <div style={styles.mainImage}>
            {product.images[selectedImage]
              ? <img src={product.images[selectedImage].url}
                     alt={product.images[selectedImage].alt_text}
                     style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={styles.imagePlaceholder}>🌱</div>
            }
          </div>
          {product.images.length > 1 && (
            <div style={styles.thumbnails}>
              {product.images.map((img, i) => (
                <img key={img.id} src={img.url} alt={img.alt_text}
                  onClick={() => setSelectedImage(i)}
                  style={{ ...styles.thumb, ...(i === selectedImage ? styles.thumbActive : {}) }}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Product info ── */}
        <div style={styles.info}>
          <p style={styles.category}>{product.category}</p>
          <h1 style={styles.title}>{product.name}</h1>

          {/* Tags */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {product.tags.map(t => (
              <span key={t.id} style={styles.tag}>{t.name}</span>
            ))}
          </div>

          <p style={styles.description}>{product.description}</p>

          {/* Variant selector */}
          <div style={{ marginBottom: 16 }}>
            <p style={styles.label}>Select size / option:</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {product.variants.map(v => (
                <button key={v.id}
                  onClick={() => setSelectedVariant(v)}
                  style={{
                    ...styles.variantBtn,
                    ...(selectedVariant?.id === v.id ? styles.variantActive : {}),
                    ...(v.stock === 0 ? styles.variantOos : {}),
                  }}>
                  {v.name}
                  {v.stock === 0 && ' (out of stock)'}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          {selectedVariant && (
            <div style={{ marginBottom: 20 }}>
              <span style={styles.price}>€{Number(selectedVariant.price).toFixed(2)}</span>
              {selectedVariant.compare_price && (
                <span style={styles.comparePrice}>
                  €{Number(selectedVariant.compare_price).toFixed(2)}
                </span>
              )}
              <span style={styles.stock}>
                {outOfStock ? '✗ Out of stock' : `✓ ${selectedVariant.stock} in stock`}
              </span>
            </div>
          )}

          {/* Add to cart */}
          <button
            onClick={handleAddToCart}
            disabled={!selectedVariant || outOfStock}
            style={{ ...styles.addBtn, ...(outOfStock ? styles.addBtnDisabled : {}) }}>
            {addedMsg || (outOfStock ? 'Out of Stock' : 'Add to Cart 🛒')}
          </button>
        </div>
      </div>

      {/* ── Reviews ── */}
      <div style={{ marginTop: '3rem' }}>
        <h2>Customer Reviews ({product.reviews.length})</h2>
        {product.reviews.length === 0
          ? <p style={{ color: '#888780' }}>No reviews yet. Be the first!</p>
          : product.reviews.map(r => (
            <div key={r.id} style={styles.review}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{r.reviewer}</strong>
                <span style={{ color: '#BA7517' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</span>
              </div>
              <p style={{ margin: '6px 0 0', color: '#5F5E5A' }}>{r.body}</p>
              <p style={{ fontSize: '0.8rem', color: '#888780', margin: '4px 0 0' }}>
                {new Date(r.created_at).toLocaleDateString('pt-PT')}
              </p>
            </div>
          ))
        }
      </div>
    </div>
  );
}

const styles = {
  breadcrumb:    { color: '#888780', fontSize: '0.85rem', marginBottom: '1.5rem' },
  breadLink:     { cursor: 'pointer', color: '#1D9E75' },
  layout:        { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' },
  gallery:       {},
  mainImage:     { height: 380, background: '#F8F7F4', borderRadius: 12, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  imagePlaceholder: { fontSize: '5rem' },
  thumbnails:    { display: 'flex', gap: 8, marginTop: 12 },
  thumb:         { width: 64, height: 64, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: '2px solid transparent' },
  thumbActive:   { border: '2px solid #1D9E75' },
  info:          {},
  category:      { color: '#888780', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 1, margin: 0 },
  title:         { fontSize: '1.8rem', color: '#2C2C2A', margin: '6px 0 12px' },
  tag:           { background: '#E1F5EE', color: '#0F6E56', fontSize: '0.75rem', padding: '3px 10px', borderRadius: 20 },
  description:   { color: '#5F5E5A', lineHeight: 1.7, marginBottom: 20 },
  label:         { fontWeight: 600, marginBottom: 8, color: '#2C2C2A' },
  variantBtn:    { padding: '8px 16px', border: '1px solid #D3D1C7', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: '0.9rem' },
  variantActive: { border: '2px solid #1D9E75', color: '#0F6E56', fontWeight: 600 },
  variantOos:    { opacity: 0.45, cursor: 'not-allowed' },
  price:         { fontSize: '1.8rem', fontWeight: 700, color: '#0F6E56' },
  comparePrice:  { fontSize: '1rem', color: '#888780', textDecoration: 'line-through', marginLeft: 10 },
  stock:         { fontSize: '0.85rem', color: '#5F5E5A', marginLeft: 12 },
  addBtn:        { width: '100%', padding: '14px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontSize: '1rem', fontWeight: 600, cursor: 'pointer' },
  addBtnDisabled:{ background: '#B4B2A9', cursor: 'not-allowed' },
  review:        { borderTop: '1px solid #E1F5EE', padding: '16px 0' },
};
