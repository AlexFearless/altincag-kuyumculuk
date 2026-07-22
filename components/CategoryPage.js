'use client';

import { useState, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';

const categoryNames = {
  yuzuk: 'Yüzük',
  kolye: 'Kolye',
  bileklik: 'Bileklik',
  kelepce: 'Kelepçe',
  kupe: 'Küpe',
  zincir: 'Zincir',
  set: 'Set',
};

export default function CategoryPage({ category }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchProducts();
  }, [category, sortBy]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?category=${category}`);
      const data = await res.json();
      let sortedProducts = data.products || [];

      switch (sortBy) {
        case 'price-asc':
          sortedProducts.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          sortedProducts.sort((a, b) => b.price - a.price);
          break;
        case 'name':
          sortedProducts.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
          break;
        default:
          sortedProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      setProducts(sortedProducts);
    } catch (error) {
      console.error('Ürünler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="bg-earth-50 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-serif text-3xl lg:text-4xl font-bold text-earth-800 text-center">
            {categoryNames[category] || category}
          </h1>
          <p className="text-earth-500 text-center mt-2">
            {products.length} ürün bulundu
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <p className="text-sm text-earth-500">
            {products.length} ürün
          </p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-white border border-earth-200 rounded-sm text-sm text-earth-700
                       focus:outline-none focus:border-gold-500"
          >
            <option value="newest">En Yeni</option>
            <option value="price-asc">Fiyat: Düşükten Yükseğe</option>
            <option value="price-desc">Fiyat: Yüksekten Düşüğe</option>
            <option value="name">İsim (A-Z)</option>
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg overflow-hidden animate-pulse">
                <div className="aspect-square bg-earth-100" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-earth-100 rounded w-1/3" />
                  <div className="h-4 bg-earth-100 rounded w-2/3" />
                  <div className="h-5 bg-earth-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <SunIcon className="w-16 h-16 text-earth-200 mx-auto mb-4" />
            <h3 className="font-serif text-xl text-earth-600 mb-2">Ürün bulunamadı</h3>
            <p className="text-earth-400">
              Bu kategoride henüz ürün bulunmamaktadır.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SunIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="currentColor">
      <circle cx="20" cy="20" r="8" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <line
          key={angle}
          x1="20"
          y1="4"
          x2="20"
          y2="10"
          stroke="currentColor"
          strokeWidth="2"
          transform={`rotate(${angle} 20 20)`}
        />
      ))}
    </svg>
  );
}
