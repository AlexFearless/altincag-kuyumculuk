'use client';

import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/components/Toast';
import Link from 'next/link';
import { useState } from 'react';

export default function BegeniPage() {
  const { items, removeItem } = useWishlist();
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const [addingId, setAddingId] = useState(null);

  const handleAddToCart = async (product) => {
    setAddingId(product._id);
    const success = await addToCart(product._id, 1);
    setAddingId(null);
    if (success) {
      addToast(`${product.name} sepete eklendi!`, 'success');
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <svg className="w-20 h-20 text-earth-200 mb-6" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
        <h1 className="font-serif text-2xl font-bold text-earth-800 mb-2">Beğenileriniz boş</h1>
        <p className="text-earth-500 mb-6 text-center">Beğendiğiniz ürünleri burada görebilirsiniz.</p>
        <Link href="/" className="bg-gold-500 text-white px-8 py-3 rounded-sm font-medium hover:bg-gold-600 transition-colors">
          Alışverişe Başla
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <h1 className="font-serif text-2xl lg:text-3xl font-bold text-earth-800 mb-8">
        Beğenilerim ({items.length})
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
        {items.map((product) => (
          <div key={product._id} className="bg-white rounded-lg overflow-hidden group">
            <div className="relative aspect-square bg-earth-50 overflow-hidden">
              <Link href={`/urun/${product.slug}`}>
                {product.images && product.images[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-earth-300 text-sm">Görsel yok</span>
                  </div>
                )}
              </Link>

              <button
                onClick={() => removeItem(product._id)}
                className="absolute top-3 right-3 p-2 bg-white/90 rounded-full text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </button>

              {product.discountType === 'real' && product.discountPercent > 0 && (
                <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-sm">
                  %{product.discountPercent} İndirim
                </div>
              )}
            </div>

            <div className="p-4">
              <Link href={`/urun/${product.slug}`}>
                <h3 className="font-serif text-sm font-semibold text-earth-800 hover:text-gold-600 transition-colors line-clamp-2 mb-2">
                  {product.name}
                </h3>
              </Link>

              <div className="flex items-center space-x-2 mb-3">
                {product.discountType === 'real' && product.discountedPrice > 0 ? (
                  <>
                    <span className="text-lg font-bold text-gold-600">
                      {product.discountedPrice.toLocaleString('tr-TR')} TL
                    </span>
                    <span className="text-sm text-earth-400 line-through">
                      {product.price.toLocaleString('tr-TR')} TL
                    </span>
                  </>
                ) : (
                  <span className="text-lg font-bold text-earth-800">
                    {product.price.toLocaleString('tr-TR')} TL
                  </span>
                )}
              </div>

              <button
                onClick={() => handleAddToCart(product)}
                disabled={addingId === product._id}
                className="w-full bg-gold-500 text-white py-2.5 rounded-sm text-sm font-medium hover:bg-gold-600 transition-colors disabled:opacity-50"
              >
                {addingId === product._id ? 'Ekleniyor...' : 'Sepete Ekle'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
