'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [guestId, setGuestId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let id = localStorage.getItem('altincag_guest_id');
    if (!id) {
      id = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('altincag_guest_id', id);
    }
    setGuestId(id);
  }, []);

  useEffect(() => {
    if (guestId) {
      fetchCart();
    }
  }, [guestId]);

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart', {
        headers: { 'x-guest-id': guestId },
      });
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Sepet yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = useCallback(async (productId, quantity = 1) => {
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId,
        },
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await res.json();
      setItems(data.items || []);
      return true;
    } catch (error) {
      console.error('Sepete eklenemedi:', error);
      return false;
    }
  }, [guestId]);

  const updateQuantity = useCallback(async (productId, quantity) => {
    try {
      const res = await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId,
        },
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Miktar güncellenemedi:', error);
    }
  }, [guestId]);

  const removeFromCart = useCallback(async (productId) => {
    try {
      const res = await fetch('/api/cart', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId,
        },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Ürün silinemedi:', error);
    }
  }, [guestId]);

  const clearCart = useCallback(async () => {
    try {
      await fetch('/api/cart', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId,
        },
      });
      setItems([]);
    } catch (error) {
      console.error('Sepet temizlenemedi:', error);
    }
  }, [guestId]);

  const getTotal = useCallback(() => {
    return items.reduce((total, item) => {
      const price = item.product?.discountedPrice > 0
        ? item.product.discountedPrice
        : item.product?.price || 0;
      return total + price * item.quantity;
    }, 0);
  }, [items]);

  const getItemCount = useCallback(() => {
    return items.reduce((count, item) => count + item.quantity, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getTotal,
        getItemCount,
        guestId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
