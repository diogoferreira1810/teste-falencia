// src/context/CartContext.jsx
//
// Manages the shopping cart entirely on the frontend (in memory + localStorage).
// The cart only hits the backend when the user places an order.
//
// Cart item shape:
// {
//   variantId:   "uuid",
//   productName: "Monstera Deliciosa",
//   variantName: "19cm pot",
//   price:       24.99,
//   image:       "/images/monstera-1.jpg",
//   quantity:    2
// }

import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  // Initialise cart from localStorage so it survives a page refresh
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cart') || '[]');
    } catch {
      return [];
    }
  });

  // Persist to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  // Add an item or increase its quantity if already in the cart
  function addItem(item) {
    setItems(prev => {
      const existing = prev.find(i => i.variantId === item.variantId);
      if (existing) {
        return prev.map(i =>
          i.variantId === item.variantId
            ? { ...i, quantity: i.quantity + (item.quantity || 1) }
            : i
        );
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });
  }

  // Remove an item entirely
  function removeItem(variantId) {
    setItems(prev => prev.filter(i => i.variantId !== variantId));
  }

  // Change the quantity of a specific item
  function updateQuantity(variantId, quantity) {
    if (quantity < 1) return removeItem(variantId);
    setItems(prev =>
      prev.map(i => i.variantId === variantId ? { ...i, quantity } : i)
    );
  }

  // Empty the cart (called after a successful order)
  function clearCart() {
    setItems([]);
  }

  // Derived values
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal  = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, clearCart,
      itemCount, subtotal,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
