// src/main.jsx
//
// The very first file React loads.
// It mounts the App component into the #root div in index.html
// and wraps it in all the global context providers.

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import App from './App.jsx';
import './index.css';

// Provider order matters — outer providers are available to inner ones.
// BrowserRouter enables client-side routing (react-router-dom)
// AuthProvider holds the logged-in user
// CartProvider holds the shopping cart
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
