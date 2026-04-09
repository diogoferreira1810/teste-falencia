// src/middleware/auth.js
//
// Express middleware that protects routes requiring a logged-in user.
//
// How it works:
//   1. The frontend sends an Authorization header: "Bearer <token>"
//   2. We extract the token and verify it with our JWT_SECRET
//   3. If valid, we attach the decoded user payload to req.user
//   4. If invalid or missing, we respond with 401 Unauthorized
//
// Usage in a route:
//   import { requireAuth } from '../middleware/auth.js'
//   router.get('/profile', requireAuth, (req, res) => { ... })

import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  // The header looks like:  Authorization: Bearer eyJhbGci...
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = header.slice(7); // Remove "Bearer " prefix

  try {
    // jwt.verify throws if the token is expired or tampered with
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach user info to the request so route handlers can use it
    req.user = decoded; // { id, email, role, iat, exp }
    next(); // Continue to the route handler
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Optional: restrict to admin users only
export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}
