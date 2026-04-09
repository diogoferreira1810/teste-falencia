// src/context/AuthContext.jsx
//
// React Context lets us share state (the logged-in user) across the whole
// app without passing props through every component.
//
// Any component can call:
//   const { user, login, logout } = useAuth();
//
// How it works:
//   - AuthProvider wraps the whole app (see main.jsx)
//   - It stores the user object and JWT token in state
//   - On first load it checks localStorage for a saved token and re-fetches
//     the user profile so the session survives a page refresh

import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/client.js';

// Create the context object
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);   // null = not logged in
  const [loading, setLoading] = useState(true);   // true while checking saved session

  // On mount: if there's a token in localStorage, fetch the user profile
  // This restores the session after a page refresh
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authApi.me()
        .then(setUser)
        .catch(() => localStorage.removeItem('token')) // token expired/invalid
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Called after a successful login or register API call
  function login(token, userData) {
    localStorage.setItem('token', token); // persist across page refreshes
    setUser(userData);
  }

  // Clear everything on logout
  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  // Don't render children until we've checked for a saved session
  // (prevents a flash of "logged out" state on refresh)
  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook — cleaner to call useAuth() than useContext(AuthContext)
export function useAuth() {
  return useContext(AuthContext);
}
