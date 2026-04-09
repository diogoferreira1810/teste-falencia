// src/pages/OrdersPage.jsx
//
// Shows the logged-in user's order history.
// Clicking an order expands it to show the line items.
// Protected — redirects to login if not authenticated.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ordersApi } from '../api/client.js';

// Colour-coded status badges
const STATUS_STYLES = {
  pending:   { background: '#FFF8ED', color: '#BA7517', border: '1px solid #FAC775' },
  paid:      { background: '#E6F1FB', color: '#185FA5', border: '1px solid #85B7EB' },
  shipped:   { background: '#EEEDFE', color: '#534AB7', border: '1px solid #AFA9EC' },
  delivered: { background: '#E1F5EE', color: '#0F6E56', border: '1px solid #5DCAA5' },
  cancelled: { background: '#FCEBEB', color: '#A32D2D', border: '1px solid #F09595' },
};

export default function OrdersPage() {
  const { user }                       = useAuth();
  const navigate                       = useNavigate();
  const [orders,   setOrders]          = useState([]);
  const [loading,  setLoading]         = useState(true);
  const [error,    setError]           = useState(null);
  // Track which order is expanded (to show detail)
  const [expanded, setExpanded]        = useState(null);
  const [detail,   setDetail]          = useState({});  // { [orderId]: detailData }

  useEffect(() => {
    if (!user) { navigate('/login?redirect=/orders'); return; }

    ordersApi.list()
      .then(setOrders)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  async function toggleOrder(orderId) {
    if (expanded === orderId) {
      setExpanded(null);
      return;
    }
    setExpanded(orderId);
    // Only fetch detail once per order
    if (!detail[orderId]) {
      try {
        const d = await ordersApi.detail(orderId);
        setDetail(prev => ({ ...prev, [orderId]: d }));
      } catch {
        // silently fail — the header info is still shown
      }
    }
  }

  if (loading) return <p>Loading your orders...</p>;
  if (error)   return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: '1.6rem', marginBottom: '1.5rem', color: '#2C2C2A' }}>
        My Orders
      </h1>

      {orders.length === 0 ? (
        <div style={styles.empty}>
          <p style={{ fontSize: '2.5rem' }}>📦</p>
          <p style={{ color: '#888780' }}>You haven't placed any orders yet.</p>
          <button onClick={() => navigate('/products')} style={styles.shopBtn}>
            Start Shopping
          </button>
        </div>
      ) : (
        orders.map(order => {
          const isOpen  = expanded === order.id;
          const d       = detail[order.id];
          const badge   = STATUS_STYLES[order.status] || STATUS_STYLES.pending;

          return (
            <div key={order.id} style={styles.card}>
              {/* ── Order header (always visible) ── */}
              <div style={styles.header} onClick={() => toggleOrder(order.id)}>
                <div>
                  <p style={styles.orderId}>
                    Order #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p style={styles.orderMeta}>
                    {new Date(order.placed_at).toLocaleDateString('pt-PT', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                    {' · '}{order.item_count} item{order.item_count !== '1' ? 's' : ''}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontWeight: 700, color: '#0F6E56' }}>
                    €{Number(order.total).toFixed(2)}
                  </span>
                  <span style={{ ...styles.badge, ...badge }}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <span style={{ color: '#888780', fontSize: '0.9rem' }}>
                    {isOpen ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {/* ── Order detail (expanded) ── */}
              {isOpen && (
                <div style={styles.detail}>
                  {!d ? (
                    <p style={{ color: '#888780', fontSize: '0.9rem' }}>Loading...</p>
                  ) : (
                    <>
                      {/* Line items */}
                      {d.items.map((item, i) => (
                        <div key={i} style={styles.lineItem}>
                          <div style={styles.lineThumb}>
                            {item.image
                              ? <img src={item.image} alt={item.product_name}
                                     style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <span>🌱</span>
                            }
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontWeight: 600, color: '#2C2C2A' }}>{item.product_name}</p>
                            <p style={{ margin: '2px 0 0', color: '#888780', fontSize: '0.85rem' }}>
                              {item.variant_name} · SKU: {item.sku}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: 0, color: '#5F5E5A', fontSize: '0.9rem' }}>
                              {item.quantity} × €{Number(item.unit_price).toFixed(2)}
                            </p>
                            <p style={{ margin: '2px 0 0', fontWeight: 600, color: '#0F6E56' }}>
                              €{(item.quantity * Number(item.unit_price)).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* Totals & address */}
                      <div style={styles.detailFooter}>
                        <div>
                          <p style={styles.addrLabel}>Delivered to:</p>
                          <p style={styles.addrText}>{d.line1}, {d.city} {d.postal_code}</p>
                          {d.coupon_code && (
                            <p style={styles.addrText}>Coupon: <strong>{d.coupon_code}</strong></p>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={styles.totalRow}>Subtotal: €{Number(d.subtotal).toFixed(2)}</p>
                          <p style={styles.totalRow}>Shipping: {Number(d.shipping) === 0 ? 'Free' : `€${Number(d.shipping).toFixed(2)}`}</p>
                          <p style={{ ...styles.totalRow, fontWeight: 700, color: '#0F6E56', fontSize: '1rem' }}>
                            Total: €{Number(d.total).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

const styles = {
  empty:       { textAlign: 'center', padding: '3rem 0' },
  shopBtn:     { marginTop: 16, padding: '10px 24px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' },
  card:        { border: '1px solid #E1F5EE', borderRadius: 12, marginBottom: '1rem', overflow: 'hidden', background: '#fff' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', cursor: 'pointer' },
  orderId:     { fontWeight: 700, color: '#2C2C2A', margin: 0, fontFamily: 'monospace', fontSize: '0.95rem' },
  orderMeta:   { color: '#888780', fontSize: '0.82rem', margin: '3px 0 0' },
  badge:       { fontSize: '0.75rem', padding: '3px 10px', borderRadius: 20, fontWeight: 600 },
  detail:      { borderTop: '1px solid #E1F5EE', padding: '1rem 1.25rem', background: '#FAFAF8' },
  lineItem:    { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #E1F5EE' },
  lineThumb:   { width: 52, height: 52, borderRadius: 8, background: '#F8F7F4', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  detailFooter:{ display: 'flex', justifyContent: 'space-between', marginTop: 16, gap: 16 },
  addrLabel:   { fontWeight: 600, color: '#2C2C2A', margin: 0, fontSize: '0.85rem' },
  addrText:    { color: '#5F5E5A', fontSize: '0.85rem', margin: '3px 0 0' },
  totalRow:    { margin: '3px 0', color: '#5F5E5A', fontSize: '0.9rem' },
};
