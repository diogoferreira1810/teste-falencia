// src/pages/CartPage.jsx
//
// Displays all items in the cart with quantity controls.
// The cart lives entirely in CartContext (no API call needed here).
// The "Checkout" button navigates to CheckoutPage.

import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, itemCount } = useCart();
  const { user }    = useAuth();
  const navigate    = useNavigate();

  const shipping    = subtotal >= 50 ? 0 : 3.99;
  const total       = subtotal + shipping;

  if (itemCount === 0) {
    return (
      <div style={styles.empty}>
        <p style={{ fontSize: '3rem' }}>🛒</p>
        <h2>Your cart is empty</h2>
        <p style={{ color: '#888780' }}>Add some plants to get started.</p>
        <Link to="/products" style={styles.shopBtn}>Browse the Shop</Link>
      </div>
    );
  }

  function handleCheckout() {
    // If the user is not logged in, send them to login first,
    // then redirect back to checkout after login
    if (!user) {
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  }

  return (
    <div style={styles.layout}>

      {/* ── Item list ── */}
      <div style={{ flex: 1 }}>
        <h1 style={styles.title}>Your Cart ({itemCount} item{itemCount !== 1 ? 's' : ''})</h1>

        {items.map(item => (
          <div key={item.variantId} style={styles.row}>
            {/* Thumbnail */}
            <div style={styles.thumb}>
              {item.image
                ? <img src={item.image} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '1.8rem' }}>🌱</span>
              }
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <p style={styles.productName}>{item.productName}</p>
              <p style={styles.variantName}>{item.variantName}</p>
              <p style={styles.itemPrice}>€{item.price.toFixed(2)} each</p>
            </div>

            {/* Quantity stepper */}
            <div style={styles.stepper}>
              <button style={styles.stepBtn}
                onClick={() => updateQuantity(item.variantId, item.quantity - 1)}>
                −
              </button>
              <span style={styles.qty}>{item.quantity}</span>
              <button style={styles.stepBtn}
                onClick={() => updateQuantity(item.variantId, item.quantity + 1)}>
                +
              </button>
            </div>

            {/* Line total */}
            <p style={styles.lineTotal}>
              €{(item.price * item.quantity).toFixed(2)}
            </p>

            {/* Remove */}
            <button style={styles.removeBtn}
              onClick={() => removeItem(item.variantId)}
              title="Remove item">
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* ── Order summary ── */}
      <div style={styles.summary}>
        <h2 style={styles.summaryTitle}>Order Summary</h2>

        <div style={styles.summaryRow}>
          <span>Subtotal</span>
          <span>€{subtotal.toFixed(2)}</span>
        </div>
        <div style={styles.summaryRow}>
          <span>Shipping</span>
          <span>{shipping === 0 ? <span style={{ color: '#1D9E75' }}>Free</span> : `€${shipping.toFixed(2)}`}</span>
        </div>
        {shipping > 0 && (
          <p style={styles.shippingNote}>
            Add €{(50 - subtotal).toFixed(2)} more for free shipping
          </p>
        )}

        <div style={styles.divider} />

        <div style={{ ...styles.summaryRow, fontWeight: 700, fontSize: '1.1rem' }}>
          <span>Total</span>
          <span>€{total.toFixed(2)}</span>
        </div>

        <button onClick={handleCheckout} style={styles.checkoutBtn}>
          Proceed to Checkout →
        </button>

        <Link to="/products" style={styles.continueLink}>
          ← Continue Shopping
        </Link>
      </div>
    </div>
  );
}

const styles = {
  layout:       { display: 'flex', gap: '2.5rem', alignItems: 'flex-start' },
  title:        { fontSize: '1.6rem', marginBottom: '1.5rem', color: '#2C2C2A' },
  empty:        { textAlign: 'center', padding: '4rem 0' },
  shopBtn:      { display: 'inline-block', marginTop: 16, padding: '10px 24px', background: '#1D9E75', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600 },
  row:          { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid #E1F5EE' },
  thumb:        { width: 72, height: 72, borderRadius: 8, background: '#F8F7F4', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  productName:  { fontWeight: 600, margin: 0, color: '#2C2C2A' },
  variantName:  { color: '#888780', fontSize: '0.85rem', margin: '2px 0 0' },
  itemPrice:    { color: '#5F5E5A', fontSize: '0.9rem', margin: '4px 0 0' },
  stepper:      { display: 'flex', alignItems: 'center', gap: 8 },
  stepBtn:      { width: 28, height: 28, border: '1px solid #D3D1C7', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  qty:          { minWidth: 24, textAlign: 'center', fontWeight: 600 },
  lineTotal:    { fontWeight: 700, color: '#0F6E56', minWidth: 64, textAlign: 'right' },
  removeBtn:    { background: 'none', border: 'none', cursor: 'pointer', color: '#B4B2A9', fontSize: '1rem', padding: 4 },
  summary:      { width: 300, flexShrink: 0, background: '#F8F7F4', borderRadius: 12, padding: '1.5rem', position: 'sticky', top: 80 },
  summaryTitle: { fontSize: '1.1rem', marginBottom: '1rem', color: '#2C2C2A' },
  summaryRow:   { display: 'flex', justifyContent: 'space-between', marginBottom: 10, color: '#5F5E5A', fontSize: '0.95rem' },
  shippingNote: { fontSize: '0.8rem', color: '#BA7517', margin: '-4px 0 10px' },
  divider:      { borderTop: '1px solid #D3D1C7', margin: '12px 0' },
  checkoutBtn:  { width: '100%', padding: '13px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '1rem', cursor: 'pointer', marginTop: 12 },
  continueLink: { display: 'block', textAlign: 'center', marginTop: 12, color: '#1D9E75', fontSize: '0.9rem', textDecoration: 'none' },
};
