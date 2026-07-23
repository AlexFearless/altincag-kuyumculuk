'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, getTotal, clearCart, loading } = useCart();
  const { user } = useAuth();
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [checkoutStep, setCheckoutStep] = useState(0); // 0=sepet, 1=adres/odeme, 2=kart bilgileri
  const [customerInfo, setCustomerInfo] = useState({
    email: '',
    phone: '',
    address: '',
    city: 'İstanbul',
    district: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('paytr');
  const [testMode, setTestMode] = useState(false);
  const [cardInfo, setCardInfo] = useState({
    cardName: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
  });

  useEffect(() => {
    if (user) {
      setCustomerInfo({
        email: user.email || '',
        phone: user.phone || '',
        address: user.address?.street || user.address || '',
        city: user.address?.city || 'İstanbul',
        district: user.address?.district || '',
      });
    }
  }, [user]);

  const shippingCost = 0;
  const totalAmount = getTotal() + shippingCost;

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleCheckout = async (e, overridePaymentMethod) => {
    e.preventDefault();
    setSubmitting(true);

    const finalPaymentMethod = overridePaymentMethod || paymentMethod;
    const isTestMode = overridePaymentMethod === 'havale' && testMode;

    const finalCustomerInfo = {
      firstName: user?.name?.split(' ')[0] || 'Deneme',
      lastName: user?.name?.split(' ').slice(1).join(' ') || 'Kullanıcı',
      email: customerInfo.email || user?.email || '',
      phone: customerInfo.phone || user?.phone || '05550000000',
      address: customerInfo.address || user?.address || 'Test Adres',
      city: customerInfo.city || 'İstanbul',
      district: customerInfo.district || 'Kadıköy',
    };

    try {
      const orderItems = items.map((item) => ({
        product: item.product?._id,
        name: item.product?.name,
        price: item.product?.discountedPrice > 0
          ? item.product.discountedPrice
          : item.product?.price,
        quantity: item.quantity,
        image: item.product?.images?.[0] || '',
      }));

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: localStorage.getItem('altincag_guest_id'),
          customerInfo: finalCustomerInfo,
          specialInstructions,
          items: orderItems,
          subtotal: getTotal(),
          shippingCost,
          totalAmount,
          paymentMethod: finalPaymentMethod,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setOrderSuccess(data.order);
        clearCart();
      }
    } catch (error) {
      console.error('Sipariş hatası:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckIcon className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-earth-800 mb-2">
            Siparişiniz Alındı!
          </h2>
          <p className="text-earth-500 mb-4">
            Sipariş numaranız: <span className="font-semibold">{orderSuccess.orderNumber}</span>
          </p>
          <p className="text-sm text-earth-400 mb-6">
            Toplam: {orderSuccess.totalAmount.toLocaleString('tr-TR')} TL
          </p>
          {paymentMethod === 'havale' && (
            <div className="bg-gold-50 border border-gold-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm font-semibold text-earth-800 mb-2">Havale Bilgileri:</p>
              <p className="text-xs text-earth-600">Garanti Bankası TR12 3456 7890 1234 5678 9012 34</p>
              <p className="text-xs text-earth-500 mt-1">Açıklama: Sipariş #{orderSuccess.orderNumber}</p>
            </div>
          )}
          <Link
            href="/"
            className="inline-block bg-gold-500 text-white px-6 py-3 rounded-sm font-medium
                       hover:bg-gold-600 transition-colors"
          >
            Alışverişe Devam Et
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
        <div className="text-center">
          <CartIcon className="w-16 h-16 text-earth-200 mx-auto mb-4" />
          <h2 className="font-serif text-2xl text-earth-600 mb-2">Sepetiniz boş</h2>
          <p className="text-earth-400 mb-6">
            Henüz sepetinize ürün eklemediniz.
          </p>
          <Link
            href="/"
            className="inline-block bg-gold-500 text-white px-6 py-3 rounded-sm font-medium
                       hover:bg-gold-600 transition-colors"
          >
            Alışverişe Başla
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl font-bold text-earth-800 mb-8">Alışveriş Sepeti</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const product = item.product;
              if (!product) return null;

              const price = product.discountedPrice > 0
                ? product.discountedPrice
                : product.price;

              return (
                <div
                  key={item._id}
                  className="bg-white rounded-lg p-4 lg:p-6 flex gap-4"
                >
                  <Link
                    href={`/urun/${product.slug}`}
                    className="flex-shrink-0 w-24 h-24 lg:w-32 lg:h-32 bg-earth-50 rounded-sm overflow-hidden"
                  >
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-earth-300 text-xs">Görsel yok</span>
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/urun/${product.slug}`}
                      className="font-serif text-sm lg:text-base font-semibold text-earth-800 hover:text-gold-600 transition-colors line-clamp-2"
                    >
                      {product.name}
                    </Link>

                    <div className="flex items-center space-x-2 mt-1">
                      {product.discountedPrice > 0 ? (
                        <>
                          <span className="text-gold-600 font-semibold">
                            {price.toLocaleString('tr-TR')} TL
                          </span>
                          <span className="text-earth-400 text-sm line-through">
                            {product.price.toLocaleString('tr-TR')} TL
                          </span>
                        </>
                      ) : (
                        <span className="text-earth-700 font-semibold">
                          {price.toLocaleString('tr-TR')} TL
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-earth-200 rounded-sm">
                        <button
                          onClick={() => handleQuantityChange(product._id, item.quantity - 1)}
                          className="px-3 py-1.5 text-earth-600 hover:text-gold-600 transition-colors"
                        >
                          -
                        </button>
                        <span className="px-3 py-1.5 text-earth-800 font-medium min-w-[2.5rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(product._id, item.quantity + 1)}
                          className="px-3 py-1.5 text-earth-600 hover:text-gold-600 transition-colors"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex items-center space-x-4">
                        <span className="font-semibold text-earth-800">
                          {(price * item.quantity).toLocaleString('tr-TR')} TL
                        </span>
                        <button
                          onClick={() => removeFromCart(product._id)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="bg-white rounded-lg p-4 lg:p-6">
              <label className="block text-sm font-medium text-earth-700 mb-2">
                Siparişe Özel Talimatlar
              </label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Kargo notu, hediye paketi talebi gibi özel isteklerinizi yazabilirsiniz..."
                className="w-full px-4 py-3 border border-earth-200 rounded-sm resize-none h-24
                           focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500
                           text-sm text-earth-700 placeholder-earth-400"
                maxLength={500}
              />
              <p className="text-xs text-earth-400 mt-1">
                {specialInstructions.length}/500 karakter
              </p>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 sticky top-24">
              <h3 className="font-serif text-lg font-semibold text-earth-800 mb-4">
                Sipariş Özeti
              </h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-earth-500">Ara Toplam</span>
                  <span className="text-earth-700">
                    {getTotal().toLocaleString('tr-TR')} TL
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-earth-500">Kargo</span>
                  <span className="text-green-600">Ücretsiz Kargo</span>
                </div>
                <div className="border-t border-earth-200 pt-3 flex justify-between">
                  <span className="font-semibold text-earth-800">Toplam</span>
                  <span className="font-bold text-lg text-gold-600">
                    {totalAmount.toLocaleString('tr-TR')} TL
                  </span>
                </div>
              </div>

              {checkoutStep === 0 && (
                !user ? (
                  <div className="text-center py-4">
                    <p className="text-earth-600 mb-3">Sipariş verebilmek için giriş yapmalısınız</p>
                    <Link
                      href="/giris"
                      className="inline-block bg-gold-500 text-white px-6 py-2 rounded-sm font-medium hover:bg-gold-600 transition-colors"
                    >
                      Giriş Yap
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={() => setCheckoutStep(1)}
                    className="w-full bg-gold-500 text-white py-3 rounded-sm font-medium
                               hover:bg-gold-600 active:scale-[0.98] transition-all duration-150"
                  >
                    Siparişi Tamamla
                  </button>
                )
              )}

              {checkoutStep === 1 && (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (testMode) {
                    handleCheckout(e, 'havale');
                  } else {
                    setCheckoutStep(2);
                  }
                }} className="space-y-4" noValidate={testMode}>
                  <button type="button" onClick={() => setCheckoutStep(0)} className="text-xs text-earth-400 hover:text-earth-600 mb-2">
                    ← Geri Dön
                  </button>
                  <div className="bg-earth-50 p-3 rounded-sm">
                    <p className="text-xs text-earth-400">E-posta: <span className="text-earth-700 font-medium">{user.email}</span></p>
                  </div>
                  <input
                    type="tel"
                    placeholder="Telefon"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    className="input-field text-sm"
                    required
                  />
                  <textarea
                    placeholder="Açık Adres (Mahalle, Cadde, Bina No, Daire No)"
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                    className="input-field text-sm resize-none h-24"
                    required
                  />
                  <input
                    type="text"
                    placeholder="İlçe"
                    value={customerInfo.district}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, district: e.target.value })}
                    className="input-field text-sm"
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-earth-700 mb-2">Ödeme Yöntemi</label>
                    <div className="space-y-2">
                      <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'paytr' ? 'border-gold-500 bg-gold-50' : 'border-earth-200 hover:border-gold-500'}`}>
                        <input
                          type="radio"
                          name="payment"
                          value="paytr"
                          checked={paymentMethod === 'paytr'}
                          onChange={() => setPaymentMethod('paytr')}
                          className="text-gold-500 focus:ring-gold-500"
                        />
                        <div className="ml-2">
                          <span className="text-sm text-earth-700 font-medium">Kredi Kartı / Banka Kartı</span>
                          <p className="text-xs text-earth-400">Güvenli online ödeme</p>
                        </div>
                      </label>
                      <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'havale' ? 'border-gold-500 bg-gold-50' : 'border-earth-200 hover:border-gold-500'}`}>
                        <input
                          type="radio"
                          name="payment"
                          value="havale"
                          checked={paymentMethod === 'havale'}
                          onChange={() => setPaymentMethod('havale')}
                          className="text-gold-500 focus:ring-gold-500"
                        />
                        <div className="ml-2">
                          <span className="text-sm text-earth-700 font-medium">Havale / EFT</span>
                          <p className="text-xs text-earth-400">Banka hesabına transfer</p>
                        </div>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center p-3 border border-dashed border-orange-300 bg-orange-50 rounded-lg cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={testMode}
                        onChange={(e) => {
                          setTestMode(e.target.checked);
                          if (e.target.checked) setPaymentMethod('havale');
                        }}
                        className="text-orange-500 focus:ring-orange-500"
                      />
                      <div className="ml-2">
                        <span className="text-sm text-orange-700 font-medium">Deneme Siparişi</span>
                        <p className="text-xs text-orange-500">Kart bilgisi girmeden havale ile sipariş ver</p>
                      </div>
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gold-500 text-white py-3 rounded-sm font-medium
                               hover:bg-gold-600 transition-colors"
                  >
                    {testMode ? 'Siparişi Onayla (Deneme)' : (paymentMethod === 'paytr' ? 'Kart Bilgilerine Geç' : 'Siparişi Onayla')}
                  </button>
                </form>
              )}

              {checkoutStep === 2 && paymentMethod === 'paytr' && (
                <div className="space-y-4">
                  <button type="button" onClick={() => setCheckoutStep(1)} className="text-xs text-earth-400 hover:text-earth-600">
                    ← Geri Dön
                  </button>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                       <span className="text-xs text-blue-700 font-medium">256-bit SSL ile güvenli ödeme</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-earth-700 mb-1">Kart Üzerindeki İsim</label>
                    <input
                      type="text"
                      placeholder="Ad Soyad"
                      value={cardInfo.cardName}
                      onChange={(e) => setCardInfo({ ...cardInfo, cardName: e.target.value })}
                      className="input-field text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-earth-700 mb-1">Kart Numarası</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="0000 0000 0000 0000"
                      value={cardInfo.cardNumber}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '').substring(0, 16);
                        val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
                        setCardInfo({ ...cardInfo, cardNumber: val });
                      }}
                      className="input-field text-sm"
                      maxLength={19}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-earth-700 mb-1">Ay</label>
                      <select
                        value={cardInfo.expiryMonth}
                        onChange={(e) => setCardInfo({ ...cardInfo, expiryMonth: e.target.value })}
                        className="input-field text-sm"
                        required
                      >
                        <option value="">Ay</option>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                            {String(i + 1).padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-earth-700 mb-1">Yıl</label>
                      <select
                        value={cardInfo.expiryYear}
                        onChange={(e) => setCardInfo({ ...cardInfo, expiryYear: e.target.value })}
                        className="input-field text-sm"
                        required
                      >
                        <option value="">Yıl</option>
                        {Array.from({ length: 10 }, (_, i) => (
                          <option key={i} value={String(2025 + i).slice(-2)}>
                            {2025 + i}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-earth-700 mb-1">CVV</label>
                      <input
                        type="password"
                        placeholder="•••"
                        value={cardInfo.cvv}
                        onChange={(e) => setCardInfo({ ...cardInfo, cvv: e.target.value.replace(/\D/g, '').substring(0, 4) })}
                        className="input-field text-sm"
                        maxLength={4}
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-earth-50 rounded-lg p-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-earth-500">Toplam</span>
                      <span className="font-bold text-gold-600">{totalAmount.toLocaleString('tr-TR')} TL</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={submitting}
                    className="w-full bg-gold-500 text-white py-3 rounded-sm font-medium
                               hover:bg-gold-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>İşleniyor...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        <span>{totalAmount.toLocaleString('tr-TR')} TL Öde</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center space-x-4 pt-2">
                    <div className="flex items-center space-x-1 text-earth-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                      <span className="text-xs">Güvenli</span>
                    </div>
                  </div>
                </div>
              )}

              {checkoutStep === 2 && paymentMethod === 'havale' && (
                <div className="space-y-4">
                  <button type="button" onClick={() => setCheckoutStep(1)} className="text-xs text-earth-400 hover:text-earth-600">
                    ← Geri Dön
                  </button>
                  <div className="bg-gold-50 border border-gold-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-earth-800 mb-2">Havale / EFT Bilgileri</p>
                    <div className="space-y-1 text-xs text-earth-600">
                      <p><span className="font-medium">Banka:</span> Garanti Bankası</p>
                      <p><span className="font-medium">Hesap Adı:</span> AltınÇağ Kuyumculuk</p>
                      <p><span className="font-medium">IBAN:</span> TR12 3456 7890 1234 5678 9012 34</p>
                      <p><span className="font-medium">Açıklama:</span> Sipariş numaranızı yazmayı unutmayın</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCheckout}
                    disabled={submitting}
                    className="w-full bg-gold-500 text-white py-3 rounded-sm font-medium
                               hover:bg-gold-600 active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
                  >
                    {submitting ? 'İşleniyor...' : 'Siparişi Onayla'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
    </svg>
  );
}

function TrashIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
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
