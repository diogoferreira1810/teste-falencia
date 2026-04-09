// src/pages/LoginPage.jsx
//
// Login form. After a successful login:
//   - Saves the JWT token via AuthContext.login()
//   - Redirects to ?redirect=... param if present, otherwise to /products
//
// Key concept: controlled inputs — React state drives the input values,
// not the DOM. This makes validation and submission straightforward.

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { login }                     = useAuth();
  const navigate                      = useNavigate();
  const [searchParams]                = useSearchParams();

  // Controlled form state
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [error,      setError]      = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = searchParams.get('redirect') || '/products';

  async function handleSubmit(e) {
    e.preventDefault(); // prevent browser from reloading the page
    setError(null);
    setSubmitting(true);

    try {
      // Call POST /api/auth/login
      const { token, user } = await authApi.login({ email, password });
      // Save token + user to context (and localStorage)
      login(token, user);
      // Navigate to the intended page
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>🌿 Welcome back</h1>
        <p style={styles.subtitle}>Sign in to your GreenThumb account</p>

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>
            Email address
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={styles.input}
              autoComplete="email"
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={styles.input}
              autoComplete="current-password"
            />
          </label>

          {/* Error message from the API */}
          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={submitting} style={styles.submitBtn}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={styles.footer}>
          Don't have an account?{' '}
          <Link to={`/register?redirect=${redirectTo}`} style={styles.link}>
            Create one
          </Link>
        </p>

        {/* Demo credentials hint */}
        <div style={styles.demoBox}>
          <p style={{ margin: 0, fontWeight: 600, color: '#5F5E5A', fontSize: '0.85rem' }}>Demo accounts:</p>
          <p style={styles.demoLine}>Customer: carlos@email.pt</p>
          <p style={styles.demoLine}>Admin: admin@greenthumb.pt</p>
          <p style={styles.demoLine}>Password: <em>(set your own when seeding)</em></p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper:   { display: 'flex', justifyContent: 'center', padding: '2rem 1rem' },
  card:      { width: '100%', maxWidth: 420, background: '#fff', border: '1px solid #E1F5EE', borderRadius: 16, padding: '2.5rem' },
  title:     { fontSize: '1.5rem', margin: '0 0 4px', color: '#2C2C2A', textAlign: 'center' },
  subtitle:  { color: '#888780', textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem' },
  label:     { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: '1.2rem', color: '#2C2C2A', fontSize: '0.9rem', fontWeight: 600 },
  input:     { padding: '10px 14px', border: '1px solid #D3D1C7', borderRadius: 8, fontSize: '0.95rem', fontWeight: 400, outline: 'none' },
  error:     { background: '#FCEBEB', color: '#A32D2D', border: '1px solid #F09595', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: '0.9rem' },
  submitBtn: { width: '100%', padding: 13, background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '1rem', cursor: 'pointer', marginTop: 4 },
  footer:    { textAlign: 'center', marginTop: '1.5rem', color: '#5F5E5A', fontSize: '0.9rem' },
  link:      { color: '#1D9E75', fontWeight: 600, textDecoration: 'none' },
  demoBox:   { marginTop: '1.5rem', background: '#F8F7F4', borderRadius: 8, padding: '12px 14px' },
  demoLine:  { margin: '3px 0 0', color: '#888780', fontSize: '0.8rem' },
};
