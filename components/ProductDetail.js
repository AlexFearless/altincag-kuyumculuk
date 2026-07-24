'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';

export default function ProductDetail({ product }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();

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
  const hasDiscount = isRealDiscount || isFakeDiscount || isCampaignDiscount;

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
    <div className="min-h-screen bg-cream-50 py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-lg overflow-hidden">
              {product.images && product.images[selectedImage] ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-earth-50">
                  <div className="text-center">
                    <SunIcon className="w-24 h-24 text-earth-200 mx-auto" />
                    <p className="text-earth-400 mt-4">Görsel bulunamadı</p>
                  </div>
                </div>
              )}
            </div>

            {product.images && product.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
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

            <div className="border-t border-earth-200 pt-6 space-y-3">

              <div className="flex items-center space-x-3 text-sm text-earth-600">
                <ShieldIcon className="w-5 h-5 text-gold-500" />
                <span>14 gün içinde koşulsuz iade</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-earth-600">
                <CertificateIcon className="w-5 h-5 text-gold-500" />
                <span>Sertifikalı ve garantili ürünler</span>
              </div>
            </div>
          </div>
        </div>
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

function TruckIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H18.75m-7.5-2.25h7.5m-7.5 0H9m7.5 0v-3.375c0-.621-.504-1.125-1.125-1.125H9.75v3.375c0 .621.504 1.125 1.125 1.125z" />
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
