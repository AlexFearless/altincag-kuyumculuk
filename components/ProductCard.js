'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useToast } from '@/components/Toast';

export default function ProductCard({ product }) {
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();
  const { isLiked, toggleItem } = useWishlist();
  const { addToast } = useToast();
  const liked = isLiked(product._id);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    const success = await addToCart(product._id, 1);
    setIsAdding(false);
    if (success) {
      addToast(`${product.name} sepete eklendi!`, 'success');
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(product);
    addToast(liked ? 'Beğenilerden çıkarıldı' : 'Beğenilere eklendi', 'info');
  };

  const isRealDiscount = product.discountType === 'real' && product.discountPercent > 0 && product.discountedPrice > 0;
  const isFakeDiscount = product.discountType === 'fake' && product.discountPercent > 0;
  const hasDiscount = isRealDiscount || isFakeDiscount;

  const displayPrice = isRealDiscount ? product.discountedPrice : product.price;
  const fakeOriginalPrice = isFakeDiscount
    ? Math.round(product.price * 100 / (100 - product.discountPercent))
    : 0;

  const categoryLabels = {
    yuzuk: 'Yüzük',
    kolye: 'Kolye',
    bileklik: 'Bileklik',
    kelepce: 'Kelepçe',
    kupe: 'Küpe',
    zincir: 'Zincir',
    set: 'Set',
  };

  return (
    <Link href={`/urun/${product.slug}`} className="group block">
      <div className="bg-white rounded-lg overflow-hidden card-hover">
        <div className="relative aspect-square bg-earth-50 overflow-hidden">
          {product.images && product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <SunIcon className="w-12 h-12 text-earth-200 mx-auto" />
                <p className="text-xs text-earth-300 mt-2">Görsel yok</p>
              </div>
            </div>
          )}

          {hasDiscount && (
            <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-sm">
              %{product.discountPercent} İndirim
            </div>
          )}

          <button
            onClick={handleToggleWishlist}
            className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-300 shadow-sm
              ${liked
                ? 'bg-red-50 text-red-500 hover:bg-red-100'
                : 'bg-white/90 text-earth-400 hover:text-red-500 hover:bg-white'
              }`}
          >
            <svg className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>

          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`absolute bottom-3 right-3 p-2.5 rounded-full transition-all duration-300
              ${added
                ? 'bg-green-500 text-white'
                : 'bg-white/90 text-earth-600 hover:bg-gold-500 hover:text-white shadow-sm'
              }`}
          >
            {added ? (
              <CheckIcon className="w-5 h-5" />
            ) : (
              <CartIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gold-600 font-medium uppercase tracking-wide">
              {categoryLabels[product.category] || product.category}
            </span>
            {product.karat && (
              <span className="text-xs text-earth-400">{product.karat} Ayar</span>
            )}
          </div>

          <h3 className="font-serif text-sm font-semibold text-earth-800 group-hover:text-gold-600 transition-colors line-clamp-2 mb-2">
            {product.name}
          </h3>

          <div className="flex items-center space-x-2">
            {isRealDiscount ? (
              <>
                <span className="text-lg font-bold text-gold-600">
                  {displayPrice.toLocaleString('tr-TR')} TL
                </span>
                <span className="text-sm text-earth-400 line-through">
                  {product.price.toLocaleString('tr-TR')} TL
                </span>
              </>
            ) : isFakeDiscount ? (
              <>
                <span className="text-lg font-bold text-earth-800">
                  {product.price.toLocaleString('tr-TR')} TL
                </span>
                <span className="text-sm text-earth-400 line-through">
                  {fakeOriginalPrice.toLocaleString('tr-TR')} TL
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-earth-800">
                {displayPrice.toLocaleString('tr-TR')} TL
              </span>
            )}
          </div>

          {product.weight > 0 && (
            <p className="text-xs text-earth-400 mt-1">
              {product.weight} gram
            </p>
          )}
        </div>
      </div>
    </Link>
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

function CartIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function CheckIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}
