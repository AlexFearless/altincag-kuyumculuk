'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { csrfFetch } from '@/lib/csrf';

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
  const [paymentMethod, setPaymentMethod] = useState('havale');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [bankAccounts, setBankAccounts] = useState([]);
  const [orderError, setOrderError] = useState('');

  useEffect(() => {
    if (user) {
      const addr = user.address;
      const street = typeof addr === 'string' ? addr : (addr?.street || addr?.address || '');
      const city = typeof addr === 'object' ? (addr?.city || 'İstanbul') : 'İstanbul';
      const district = typeof addr === 'object' ? (addr?.district || '') : '';
      setCustomerInfo({
        email: user.email || '',
        phone: user.phone || '',
        address: street,
        city,
        district,
      });
    }
  }, [user]);

  const shippingCost = 0;
  const discountAmount = couponDiscount?.discount || 0;
  const totalAmount = Math.max(0, getTotal() + shippingCost - discountAmount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    setCouponDiscount(null);
    try {
      const res = await csrfFetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, orderAmount: getTotal(), cartCategories: [...new Set(items.map(i => i.product?.category).filter(Boolean))] }),
      });
      const data = await res.json();
      if (res.ok) {
        setCouponDiscount(data.coupon);
      } else {
        setCouponError(data.error || 'Geçersiz kupon');
      }
    } catch {
      setCouponError('Kupon doğrulanamadı');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponDiscount(null);
    setCouponError('');
  };

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setOrderError('');

    const userAddr = user?.address;
    const userStreet = typeof userAddr === 'string' ? userAddr : (userAddr?.street || userAddr?.address || '');

    const finalCustomerInfo = {
      firstName: user?.name?.split(' ')[0] || 'Deneme',
      lastName: user?.name?.split(' ').slice(1).join(' ') || 'Kullanıcı',
      email: customerInfo.email || user?.email || '',
      phone: customerInfo.phone || user?.phone || '05550000000',
      address: customerInfo.address || userStreet || 'Test Adres',
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

      const res = await csrfFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: typeof localStorage !== 'undefined' ? localStorage.getItem('altincag_guest_id') : '',
          userId: user?.id,
          customerInfo: finalCustomerInfo,
          specialInstructions,
          items: orderItems,
          subtotal: getTotal(),
          shippingCost,
          totalAmount,
          paymentMethod: 'havale',
          couponCode: couponDiscount?.code || '',
          discountAmount: discountAmount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setOrderError(data.error || 'Sipariş oluşturulurken hata oluştu');
        return;
      }

      if (data.success) {
        const bankRes = await fetch('/api/payment/havale');
        const bankData = await bankRes.json();
        setBankAccounts(bankData.accounts || []);
        setOrderSuccess(data.order);
        clearCart();
      } else {
        setOrderError(data.error || 'Sipariş oluşturulamadı');
      }
    } catch (error) {
      console.error('Sipariş hatası:', error);
      setOrderError('Sipariş sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClockIcon className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-earth-800 mb-2">
            Havale Bekleniyor
          </h2>
          <p className="text-earth-500 mb-2">
            Sipariş numaranız: <span className="font-semibold">{orderSuccess.orderNumber}</span>
          </p>
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            Siparişiniz <strong>henüz onaylanmamıştır</strong>. Aşağıdaki banka hesaplarına havale/EFT yaptıktan sonra siparişiniz onaylanacaktır.
          </p>
          {couponDiscount && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-green-700 font-medium">
                Kupon: {couponDiscount.code}
              </p>
              <p className="text-xs text-green-600 mt-1">
                İndirim: -{discountAmount.toLocaleString('tr-TR')} TL
              </p>
            </div>
          )}
          <p className="text-sm text-earth-400 mb-4">
            Toplam: <span className="font-bold text-gold-600 text-lg">{orderSuccess.totalAmount.toLocaleString('tr-TR')} TL</span>
          </p>
          {paymentMethod === 'havale' && (
            <div className="bg-gold-50 border border-gold-200 rounded-lg p-4 mb-4 text-left">
              <p className="text-sm font-semibold text-earth-800 mb-2">Havale/EFT Bilgileri:</p>
              {bankAccounts.map((acc, i) => (
                <div key={i} className="mb-2 last:mb-0">
                  <p className="text-xs text-earth-600 font-medium">{acc.bankName}</p>
                  <p className="text-xs text-earth-600">Hesap: {acc.accountName}</p>
                  <p className="text-xs text-earth-600">IBAN: {acc.iban}</p>
                </div>
              ))}
              <p className="text-xs text-amber-700 font-semibold mt-2">Açıklama kısmına <span className="underline">Sipariş #{orderSuccess.orderNumber}</span> yazmayı unutmayın!</p>
            </div>
          )}
          <p className="text-xs text-earth-400 mb-4">
            Havale sonrası 1 iş günü içinde onay e-postası gönderilecektir.
          </p>
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

                <div className="border-t border-earth-200 pt-3">
                  {!couponDiscount ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Kupon kodu"
                        className="flex-1 px-3 py-2 border border-earth-200 rounded-sm text-sm focus:outline-none focus:border-gold-500"
                        onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-3 py-2 bg-earth-100 text-earth-700 rounded-sm text-sm font-medium hover:bg-earth-200 disabled:opacity-50"
                      >
                        {couponLoading ? '...' : 'Uygula'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-sm px-3 py-2">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        <span className="text-sm font-medium text-green-700">{couponDiscount.code}</span>
                        <span className="text-xs text-green-600">(-{discountAmount.toLocaleString('tr-TR')} TL)</span>
                      </div>
                      <button onClick={handleRemoveCoupon} className="text-green-600 hover:text-green-800">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                  {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
                </div>

                {couponDiscount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">İndirim</span>
                    <span className="text-green-600">-{discountAmount.toLocaleString('tr-TR')} TL</span>
                  </div>
                )}
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
                <form onSubmit={handleCheckout} className="space-y-4" noValidate>
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
                  <div className="bg-gold-50 border border-gold-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-earth-800 mb-1">Ödeme: Havale / EFT</p>
                    <p className="text-xs text-earth-500">Sipariş sonrası banka hesap bilgileriniz görüntülenecektir.</p>
                  </div>
                  {orderError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-700">{orderError}</p>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gold-500 text-white py-3 rounded-sm font-medium
                               hover:bg-gold-600 active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>İşleniyor...</span>
                      </span>
                    ) : (
                      'Siparişi Onayla'
                    )}
                  </button>
                </form>
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

function ClockIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
