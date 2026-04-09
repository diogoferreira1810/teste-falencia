// src/api/client.js
//
// A thin wrapper around fetch() that:
//   - Always sends/receives JSON
//   - Automatically attaches the JWT token from localStorage to every request
//   - Throws an error with the server's message if the response is not OK
//
// Every component that needs data imports from here rather than
// calling fetch() directly — this keeps all API logic in one place.

const BASE = '/api'; // proxied to http://localhost:3001 by Vite in dev

async function request(path, options = {}) {
  // Retrieve the token saved at login time
  const token = localStorage.getItem('token');

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // If we have a token, include it in every request
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // Parse the JSON body regardless of status code
  const data = await res.json();

  // If the server returned an error status, throw so callers can catch it
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

// Convenience methods
export const api = {
  get:    (path)         => request(path),
  post:   (path, body)   => request(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (path, body)   => request(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: (path)         => request(path, { method: 'DELETE' }),
};

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data)  => api.post('/auth/register', data),
  login:    (data)  => api.post('/auth/login', data),
  me:       ()      => api.get('/auth/me'),
};

// ── Products ──────────────────────────────────────────────────────────────────
export const productsApi = {
  list:       (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/products${qs ? '?' + qs : ''}`);
  },
  detail:     (slug)        => api.get(`/products/${slug}`),
  categories: ()            => api.get('/products/categories'),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const ordersApi = {
  place:  (data) => api.post('/orders', data),
  list:   ()     => api.get('/orders'),
  detail: (id)   => api.get(`/orders/${id}`),
};
