'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import ProductCard from './ProductCard';

export default function ProductDetail({ product, relatedProducts = [] }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();

  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const [renderKey, setRenderKey] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastPinchDist = useRef(null);
  const imageContainerRef = useRef(null);

  const MIN_ZOOM = 1;
  const MAX_ZOOM = 4;

  const forceRender = () => setRenderKey(k => k + 1);

  const applyZoom = useCallback((newZoom, focusX, focusY) => {
    const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
    const oldZ = zoomRef.current;
    if (z === oldZ) return;
    if (z === 1) {
      zoomRef.current = 1;
      panRef.current = { x: 0, y: 0 };
    } else {
      const ratio = z / oldZ;
      panRef.current = {
        x: focusX - ratio * (focusX - panRef.current.x),
        y: focusY - ratio * (focusY - panRef.current.y),
      };
      zoomRef.current = z;
    }
    forceRender();
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const container = imageContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const focusX = e.clientX - rect.left - rect.width / 2;
    const focusY = e.clientY - rect.top - rect.height / 2;
    const delta = -e.deltaY * 0.005;
    applyZoom(zoomRef.current + delta, focusX, focusY);
  }, [applyZoom]);

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastPinchDist.current = dist;
    } else if (e.touches.length === 1 && zoomRef.current > 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - panRef.current.x,
        y: e.touches[0].clientY - panRef.current.y
      };
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && lastPinchDist.current !== null) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const container = imageContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left - rect.width / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top - rect.height / 2;
      const scale = dist / lastPinchDist.current;
      applyZoom(zoomRef.current * scale, midX, midY);
      lastPinchDist.current = dist;
    } else if (e.touches.length === 1 && isDragging && zoomRef.current > 1) {
      e.preventDefault();
      panRef.current = {
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y
      };
      forceRender();
    }
  }, [isDragging, applyZoom]);

  const handleTouchEnd = useCallback(() => {
    lastPinchDist.current = null;
    setIsDragging(false);
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (zoomRef.current > 1) {
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX - panRef.current.x, y: e.clientY - panRef.current.y };
    }
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (isDragging && zoomRef.current > 1) {
      panRef.current = {
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      };
      forceRender();
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDoubleClick = useCallback((e) => {
    const container = imageContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const focusX = e.clientX - rect.left - rect.width / 2;
    const focusY = e.clientY - rect.top - rect.height / 2;
    if (zoomRef.current > 1) {
      applyZoom(1, 0, 0);
    } else {
      applyZoom(2.5, focusX, focusY);
    }
  }, [applyZoom]);

  useEffect(() => {
    const el = imageContainerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  useEffect(() => {
    zoomRef.current = 1;
    panRef.current = { x: 0, y: 0 };
    forceRender();
  }, [selectedImage]);

  const resetZoom = () => {
    applyZoom(1, 0, 0);
  };

  const handleAddToCart = async () => {
    setIsAdding(true);
    const success = await addToCart(product._id, quantity);
    setIsAdding(false);
    if (success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  const isRealDiscount = product.discountType === 'real' && product.discountPercent > 0 && product.discountedPrice > 0;
  const isFakeDiscount = product.discountType === 'fake' && product.discountPercent > 0;
  const isCampaignDiscount = product.campaignDiscount > 0;

  const displayPrice = isCampaignDiscount
    ? product.discountedPrice
    : isRealDiscount ? product.discountedPrice : product.price;
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
    <div className="min-h-screen bg-cream-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-earth-600 hover:text-gold-600 transition-colors text-sm font-medium"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Ana Sayfa
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-4">
            <div
              ref={imageContainerRef}
              className="aspect-square bg-white rounded-lg overflow-hidden relative select-none"
              style={{ cursor: zoomRef.current > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in', touchAction: 'none' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onDoubleClick={handleDoubleClick}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {product.images && product.images[selectedImage] ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  style={{
                    transform: `scale(${zoomRef.current}) translate(${panRef.current.x / zoomRef.current}px, ${panRef.current.y / zoomRef.current}px)`,
                    transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                  }}
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-earth-50">
                  <div className="text-center">
                    <SunIcon className="w-24 h-24 text-earth-200 mx-auto" />
                    <p className="text-earth-400 mt-4">Görsel bulunamadı</p>
                  </div>
                </div>
              )}

              {zoomRef.current > 1 && (
                <button
                  onClick={resetZoom}
                  className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors z-10"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                  </svg>
                </button>
              )}

              {zoomRef.current > 1 && (
                <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full z-10">
                  %{Math.round(zoomRef.current * 100)}
                </div>
              )}
            </div>

            {product.images && product.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => { setSelectedImage(index); resetZoom(); }}
                    className={`flex-shrink-0 w-20 h-20 rounded-sm overflow-hidden border-2 transition-colors ${
                      selectedImage === index
                        ? 'border-gold-500'
                        : 'border-earth-200 hover:border-earth-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <span className="text-sm text-gold-600 font-medium uppercase tracking-wide">
                {categoryLabels[product.category] || product.category}
              </span>
              <h1 className="font-serif text-2xl lg:text-3xl font-bold text-earth-800 mt-2">
                {product.name}
              </h1>
            </div>

            <div className="flex items-baseline space-x-3">
              {isCampaignDiscount ? (
                <>
                  <span className="text-3xl font-bold text-green-600">
                    {displayPrice.toLocaleString('tr-TR')} TL
                  </span>
                  <span className="text-lg text-earth-400 line-through">
                    {product.price.toLocaleString('tr-TR')} TL
                  </span>
                  <span className="bg-green-100 text-green-600 text-sm px-2 py-1 rounded-sm">
                    Kampanya {product.campaignName}
                  </span>
                </>
              ) : isRealDiscount ? (
                <>
                  <span className="text-3xl font-bold text-gold-600">
                    {displayPrice.toLocaleString('tr-TR')} TL
                  </span>
                  <span className="text-lg text-earth-400 line-through">
                    {product.price.toLocaleString('tr-TR')} TL
                  </span>
                  <span className="bg-red-100 text-red-600 text-sm px-2 py-1 rounded-sm">
                    %{product.discountPercent} İndirim
                  </span>
                </>
              ) : isFakeDiscount ? (
                <>
                  <span className="text-3xl font-bold text-earth-800">
                    {product.price.toLocaleString('tr-TR')} TL
                  </span>
                  <span className="text-lg text-earth-400 line-through">
                    {fakeOriginalPrice.toLocaleString('tr-TR')} TL
                  </span>
                  <span className="bg-red-100 text-red-600 text-sm px-2 py-1 rounded-sm">
                    %{product.discountPercent} İndirim
                  </span>
                </>
              ) : (
                <span className="text-3xl font-bold text-earth-800">
                  {displayPrice.toLocaleString('tr-TR')} TL
                </span>
              )}
            </div>

            {product.description && (
              <p className="text-earth-600 leading-relaxed">
                {product.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4">
              {product.karat && (
                <div className="bg-earth-50 p-4 rounded-sm">
                  <p className="text-xs text-earth-400 uppercase tracking-wide">Ayar</p>
                  <p className="text-sm font-semibold text-earth-700 mt-1">
                    {product.karat} Ayar
                  </p>
                </div>
              )}
              {product.ring_size && (
                <div className="bg-earth-50 p-4 rounded-sm">
                  <p className="text-xs text-earth-400 uppercase tracking-wide">Beden</p>
                  <p className="text-sm font-semibold text-earth-700 mt-1">
                    {product.ring_size}
                  </p>
                </div>
              )}
              {product.weight > 0 && (
                <div className="bg-earth-50 p-4 rounded-sm">
                  <p className="text-xs text-earth-400 uppercase tracking-wide">Ağırlık</p>
                  <p className="text-sm font-semibold text-earth-700 mt-1">
                    {product.weight} gram
                  </p>
                </div>
              )}
              {product.material && (
                <div className="bg-earth-50 p-4 rounded-sm">
                  <p className="text-xs text-earth-400 uppercase tracking-wide">Malzeme</p>
                  <p className="text-sm font-semibold text-earth-700 mt-1">
                    {product.material}
                  </p>
                </div>
              )}
              <div className="bg-earth-50 p-4 rounded-sm">
                <p className="text-xs text-earth-400 uppercase tracking-wide">Stok</p>
                <p className={`text-sm font-semibold mt-1 ${
                  product.stock > 0 ? 'text-green-600' : 'text-red-500'
                }`}>
                  {product.stock > 0 ? `${product.stock} adet` : 'Stokta yok'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center border border-earth-200 rounded-sm">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 text-earth-600 hover:text-gold-600 transition-colors"
                >
                  -
                </button>
                <span className="px-4 py-3 text-earth-800 font-medium min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-3 text-earth-600 hover:text-gold-600 transition-colors"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={isAdding || product.stock === 0}
                className={`flex-1 py-3 px-6 rounded-sm font-medium transition-all duration-300 ${
                  added
                    ? 'bg-green-500 text-white'
                    : product.stock === 0
                    ? 'bg-earth-200 text-earth-400 cursor-not-allowed'
                    : 'bg-gold-500 text-white hover:bg-gold-600'
                }`}
              >
                {added
                  ? 'Sepete Eklendi!'
                  : isAdding
                  ? 'Ekleniyor...'
                  : product.stock === 0
                  ? 'Stokta Yok'
                  : 'Sepete Ekle'}
              </button>
            </div>

            {product.category === 'yuzuk' && (
              <div className="bg-amber-50 border border-amber-200 rounded-sm p-3 text-xs text-amber-700">
                ⚠️ Yüzük bedeninden kaynaklanan problemler iade kapsamı dışındadır. Lütfen bedeninizi doğru seçiniz.
              </div>
            )}

            <div className="border-t border-earth-200 pt-6 space-y-3">
              <div className="flex items-center space-x-3 text-sm text-earth-600">
                <ShieldIcon className="w-5 h-5 text-gold-500" />
                <span>14 gün içinde iade (yüzük bedeni hariç)</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-earth-600">
                <CertificateIcon className="w-5 h-5 text-gold-500" />
                <span>Sertifikalı ve garantili ürünler</span>
              </div>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="font-serif text-xl lg:text-2xl font-bold text-earth-800 mb-6">
              Benzer Ürünler
            </h2>
            <div className="relative group">
              <div
                id="related-scroll"
                className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
              >
                {relatedProducts.map((p) => (
                  <div key={p._id} className="flex-shrink-0 w-[260px] snap-start">
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  const el = document.getElementById('related-scroll');
                  if (el) el.scrollBy({ left: -300, behavior: 'smooth' });
                }}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 bg-red-600 shadow-lg rounded-full w-12 h-12 flex items-center justify-center text-white hover:bg-red-700 hover:shadow-xl transition-all z-10"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById('related-scroll');
                  if (el) el.scrollBy({ left: 300, behavior: 'smooth' });
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 bg-red-600 shadow-lg rounded-full w-12 h-12 flex items-center justify-center text-white hover:bg-red-700 hover:shadow-xl transition-all z-10"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
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

function ShieldIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function CertificateIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
    </svg>
  );
}
