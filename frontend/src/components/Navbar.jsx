// src/components/Navbar.jsx
//
// The top navigation bar. Uses:
//   - useAuth() to show login/logout and the user's name
//   - useCart() to show the item count badge
//   - <Link> from react-router-dom for client-side navigation (no page reload)

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount }    = useCart();
  const navigate         = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {/* Logo */}
        <Link to="/" style={styles.logo}>🌿 GreenThumb</Link>

        <div style={styles.links}>
          <Link to="/products" style={styles.link}>Shop</Link>

          {/* Cart with item count badge */}
          <Link to="/cart" style={styles.link}>
            🛒 Cart
            {itemCount > 0 && (
              <span style={styles.badge}>{itemCount}</span>
            )}
          </Link>

          {user ? (
            <>
              <Link to="/orders" style={styles.link}>My Orders</Link>
              <span style={styles.greeting}>Hi, {user.full_name.split(' ')[0]}</span>
              <button onClick={handleLogout} style={styles.btn}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login"    style={styles.link}>Login</Link>
              <Link to="/register" style={{ ...styles.link, ...styles.btnPrimary }}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav:      { background: '#1D9E75', padding: '0 1rem', position: 'sticky', top: 0, zIndex: 100 },
  inner:    { maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 },
  logo:     { color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '1.2rem' },
  links:    { display: 'flex', alignItems: 'center', gap: '1rem' },
  link:     { color: '#fff', textDecoration: 'none', fontSize: '0.95rem', position: 'relative' },
  badge:    { background: '#BA7517', color: '#fff', borderRadius: '50%', padding: '1px 6px', fontSize: '0.7rem', marginLeft: 4, fontWeight: 700 },
  greeting: { color: '#e1f5ee', fontSize: '0.9rem' },
  btn:      { background: 'transparent', border: '1px solid #fff', color: '#fff', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: '0.9rem' },
  btnPrimary: { background: '#0F6E56', padding: '4px 12px', borderRadius: 6 },
};
