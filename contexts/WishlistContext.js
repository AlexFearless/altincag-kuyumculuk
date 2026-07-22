'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('wishlist') || '[]');
      setItems(stored);
    } catch {
      setItems([]);
    }
    setLoaded(true);
  }, []);

  const persist = (newItems) => {
    setItems(newItems);
    localStorage.setItem('wishlist', JSON.stringify(newItems));
  };

  const toggleItem = useCallback((product) => {
    setItems((prev) => {
      const exists = prev.find((p) => p._id === product._id);
      let next;
      if (exists) {
        next = prev.filter((p) => p._id !== product._id);
      } else {
        next = [...prev, {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          discountedPrice: product.discountedPrice,
          discountType: product.discountType,
          discountPercent: product.discountPercent,
          images: product.images,
          category: product.category,
          karat: product.karat,
          weight: product.weight,
        }];
      }
      localStorage.setItem('wishlist', JSON.stringify(next));
      return next;
    });
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((prev) => {
      const next = prev.filter((p) => p._id !== productId);
      localStorage.setItem('wishlist', JSON.stringify(next));
      return next;
    });
  }, []);

  const isLiked = useCallback((productId) => {
    return items.some((p) => p._id === productId);
  }, [items]);

  const getCount = useCallback(() => {
    return items.length;
  }, [items]);

  return (
    <WishlistContext.Provider value={{ items, toggleItem, removeItem, isLiked, getCount, loaded }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
