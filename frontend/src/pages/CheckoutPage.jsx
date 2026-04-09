// src/pages/CheckoutPage.jsx
//
// Collects the delivery address and coupon code, then calls POST /api/orders.
// Protected — redirects to login if the user isn't signed in.
// After a successful order the cart is cleared and the user sees a confirmation.
//
// Key concept: we send the cart items (variantId + quantity) to the backend.
// The backend re-fetches the current prices from the DB — we never trust
// the frontend price for the final total (security best practice).

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { ordersApi, api } from '../api/client.js';

export default function CheckoutPage() {
  const { user }                         = useAuth();
  const { items, subtotal, clearCart }   = useCart();
  const navigate                         = useNavigate();

  const [addresses,   setAddresses]   = useState([]);
  const [addressId,   setAddressId]   = useState('');
  const [couponCode,  setCouponCode]  = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState(null);
  const [confirmed,   setConfirmed]   = useState(null); // holds the order_id after success

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) navigate('/login?redirect=/checkout');
  }, [user, navigate]);

  // Fetch the user's saved addresses so they can pick one
  useEffect(() => {
    if (!user) return;
    api.get('/auth/me')
      .then(() => {}) // just confirms token is valid
      .catch(() => navigate('/login'));

    // Fetch addresses (we'll add this endpoint inline for now)
    fetch('/api/users/addresses', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAddresses(data);
          const def = data.find(a => a.is_default) || data[0];
          if (def) setAddressId(def.id);
        }
      })
      .catch(() => {});
  }, [user, navigate]);

  const shipping = subtotal >= 50 ? 0 : 3.99;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!addressId) return setError('Please select a delivery address');
    if (items.length === 0) return setError('Your cart is empty');

    setSubmitting(true);
    setError(null);

    try {
      // Send cart items to the backend.
      // The backend validates stock and prices — we only send variant IDs.
      const result = await ordersApi.place({
        address_id:  addressId,
        coupon_code: couponCode.trim().toUpperCase() || undefined,
        items: items.map(i => ({
          variant_id: i.variantId,
          quantity:   i.quantity,
        })),
      });

      // Success — clear the cart and show confirmation
      clearCart();
      setConfirmed(result.order_id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Order confirmed screen ──────────────────────────────────────────────────
  if (confirmed) {
    return (
      <div style={styles.confirmed}>
        <p style={{ fontSize: '3rem' }}>✅</p>
        <h1>Order Placed!</h1>
        <p style={{ color: '#5F5E5A' }}>
          Your order <strong>#{confirmed.slice(0, 8).toUpperCase()}</strong> has been received.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
          <button onClick={() => navigate('/orders')} style={styles.btnPrimary}>
            View My Orders
          </button>
          <button onClick={() => navigate('/products')} style={styles.btnSecondary}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.layout}>

      {/* ── Checkout form ── */}
      <form onSubmit={handleSubmit} style={{ flex: 1 }}>
        <h1 style={styles.title}>Checkout</h1>

        {/* Delivery address */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Delivery Address</h2>

          {addresses.length === 0 ? (
            <p style={styles.noAddress}>
              No saved addresses found. Please{' '}
              <span style={{ color: '#1D9E75', cursor: 'pointer' }}
                onClick={() => navigate('/account')}>
                add an address
              </span>{' '}
              to your account first.
            </p>
          ) : (
            addresses.map(addr => (
              <label key={addr.id} style={styles.addressCard}>
                <input
                  type="radio"
                  name="address"
                  value={addr.id}
                  checked={addressId === addr.id}
                  onChange={() => setAddressId(addr.id)}
                  style={{ marginRight: 10 }}
                />
                <div>
                  <p style={styles.addrLine}>{addr.line1}</p>
                  <p style={styles.addrLine}>{addr.city}, {addr.postal_code} · {addr.country}</p>
                  {addr.is_default && <span style={styles.defaultBadge}>Default</span>}
                </div>
              </label>
            ))
          )}
        </section>

        {/* Coupon code */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Coupon Code (optional)</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={couponCode}
              onChange={e => setCouponCode(e.target.value.toUpperCase())}
              placeholder="e.g. WELCOME10"
              style={styles.input}
            />
          </div>
          <p style={styles.hint}>Try: WELCOME10 (10% off) · SPRING5 (€5 off) · GARDEN20 (20% off)</p>
        </section>

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" disabled={submitting || addresses.length === 0} style={styles.submitBtn}>
          {submitting ? 'Placing order...' : `Place Order — €${(subtotal + shipping).toFixed(2)}`}
        </button>
      </form>

      {/* ── Order summary sidebar ── */}
      <div style={styles.summary}>
        <h2 style={styles.summaryTitle}>Your Order</h2>
        {items.map(item => (
          <div key={item.variantId} style={styles.summaryItem}>
            <span style={{ flex: 1 }}>{item.productName} <span style={{ color: '#888780' }}>× {item.quantity}</span></span>
            <span>€{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div style={styles.divider} />
        <div style={styles.summaryRow}>
          <span>Subtotal</span><span>€{subtotal.toFixed(2)}</span>
        </div>
        <div style={styles.summaryRow}>
          <span>Shipping</span>
          <span>{shipping === 0 ? <span style={{ color: '#1D9E75' }}>Free</span> : `€${shipping.toFixed(2)}`}</span>
        </div>
        <div style={{ ...styles.summaryRow, fontWeight: 700, fontSize: '1.05rem', marginTop: 8 }}>
          <span>Total</span><span>€{(subtotal + shipping).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  layout:        { display: 'flex', gap: '3rem', alignItems: 'flex-start' },
  title:         { fontSize: '1.6rem', marginBottom: '1.5rem', color: '#2C2C2A' },
  section:       { marginBottom: '2rem' },
  sectionTitle:  { fontSize: '1rem', fontWeight: 700, marginBottom: 12, color: '#2C2C2A', borderBottom: '1px solid #E1F5EE', paddingBottom: 8 },
  addressCard:   { display: 'flex', alignItems: 'flex-start', padding: '12px 14px', border: '1px solid #D3D1C7', borderRadius: 10, marginBottom: 10, cursor: 'pointer', background: '#fff' },
  addrLine:      { margin: '1px 0', color: '#5F5E5A', fontSize: '0.9rem' },
  defaultBadge:  { background: '#E1F5EE', color: '#0F6E56', fontSize: '0.7rem', padding: '2px 8px', borderRadius: 20, marginTop: 4, display: 'inline-block' },
  noAddress:     { color: '#5F5E5A', background: '#FFF8ED', border: '1px solid #FAC775', borderRadius: 8, padding: 12 },
  input:         { flex: 1, padding: '10px 14px', border: '1px solid #D3D1C7', borderRadius: 8, fontSize: '0.95rem' },
  hint:          { fontSize: '0.78rem', color: '#888780', marginTop: 6 },
  error:         { background: '#FCEBEB', color: '#A32D2D', border: '1px solid #F09595', borderRadius: 8, padding: '10px 14px', marginBottom: 16 },
  submitBtn:     { width: '100%', padding: 14, background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '1rem', cursor: 'pointer' },
  summary:       { width: 300, flexShrink: 0, background: '#F8F7F4', borderRadius: 12, padding: '1.5rem', position: 'sticky', top: 80 },
  summaryTitle:  { fontSize: '1rem', fontWeight: 700, marginBottom: 12, color: '#2C2C2A' },
  summaryItem:   { display: 'flex', gap: 8, fontSize: '0.9rem', color: '#5F5E5A', marginBottom: 8 },
  divider:       { borderTop: '1px solid #D3D1C7', margin: '12px 0' },
  summaryRow:    { display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#5F5E5A', marginBottom: 8 },
  confirmed:     { textAlign: 'center', padding: '4rem 0' },
  btnPrimary:    { padding: '11px 24px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' },
  btnSecondary:  { padding: '11px 24px', background: '#fff', color: '#1D9E75', border: '1px solid #1D9E75', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' },
};
