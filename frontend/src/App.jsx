// src/App.jsx
//
// Defines all the client-side routes using react-router-dom.
// Each <Route> maps a URL path to a page component.
// The <Navbar> is rendered on every page because it's outside <Routes>.

import { Routes, Route } from 'react-router-dom';
import Navbar         from './components/Navbar.jsx';
import ProductsPage   from './pages/ProductsPage.jsx';
import ProductDetail  from './pages/ProductDetail.jsx';
import CartPage       from './pages/CartPage.jsx';
import CheckoutPage   from './pages/CheckoutPage.jsx';
import OrdersPage     from './pages/OrdersPage.jsx';
import LoginPage      from './pages/LoginPage.jsx';
import RegisterPage   from './pages/RegisterPage.jsx';

export default function App() {
  return (
    <>
      {/* Navbar is always visible */}
      <Navbar />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1rem' }}>
        {/*
          <Routes> renders the first <Route> that matches the current URL.
          The path prop uses the same syntax as Express routes.
        */}
        <Routes>
          <Route path="/"               element={<ProductsPage />} />
          <Route path="/products"       element={<ProductsPage />} />
          {/* :slug is a URL parameter — read in the component via useParams() */}
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/cart"           element={<CartPage />} />
          <Route path="/checkout"       element={<CheckoutPage />} />
          <Route path="/orders"         element={<OrdersPage />} />
          <Route path="/login"          element={<LoginPage />} />
          <Route path="/register"       element={<RegisterPage />} />
        </Routes>
      </main>
    </>
  );
}
