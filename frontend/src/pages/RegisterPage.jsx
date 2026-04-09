// src/pages/RegisterPage.jsx
//
// Registration form. Validates passwords match client-side before
// hitting the API. On success, the user is immediately logged in.

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function RegisterPage() {
  const { login }                   = useAuth();
  const navigate                    = useNavigate();
  const [searchParams]              = useSearchParams();

  const [fullName,   setFullName]   = useState('');
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [confirm,    setConfirm]    = useState('');
  const [error,      setError]      = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = searchParams.get('redirect') || '/products';

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    // Client-side validation before touching the network
    if (password !== confirm) {
      return setError('Passwords do not match');
    }
    if (password.length < 8) {
      return setError('Password must be at least 8 characters');
    }

    setSubmitting(true);
    try {
      const { token, user } = await authApi.register({
        full_name: fullName.trim(),
        email:     email.trim(),
        password,
      });
      login(token, user);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Simple password strength indicator
  function strength(pw) {
    if (!pw) return null;
    if (pw.length < 8) return { label: 'Too short', color: '#E24B4A' };
    if (pw.length < 12 || !/\d/.test(pw)) return { label: 'Fair', color: '#BA7517' };
    return { label: 'Strong', color: '#1D9E75' };
  }
  const pwStrength = strength(password);

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>🌿 Create account</h1>
        <p style={styles.subtitle}>Join GreenThumb and start growing</p>

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>
            Full name
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Ana Silva"
              required
              style={styles.input}
              autoComplete="name"
            />
          </label>

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
              placeholder="At least 8 characters"
              required
              style={styles.input}
              autoComplete="new-password"
            />
            {/* Live password strength indicator */}
            {pwStrength && (
              <span style={{ fontSize: '0.78rem', color: pwStrength.color, fontWeight: 600 }}>
                {pwStrength.label}
              </span>
            )}
          </label>

          <label style={styles.label}>
            Confirm password
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat your password"
              required
              style={{
                ...styles.input,
                // Highlight if passwords don't match yet
                ...(confirm && confirm !== password
                  ? { borderColor: '#E24B4A' } : {}),
              }}
              autoComplete="new-password"
            />
          </label>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={submitting} style={styles.submitBtn}>
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{' '}
          <Link to={`/login?redirect=${redirectTo}`} style={styles.link}>
            Sign in
          </Link>
        </p>
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
};
