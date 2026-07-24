'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function WalkInOrderPage() {
  const [products, setProducts] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('nakit');
  const [notes, setNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
    if (!token) { router.push('/admin/login'); return; }
    fetchProducts(token);
  }, [router]);

  const getToken = () => localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');

  const fetchProducts = async (token) => {
    try {
      const res = await fetch('/api/admin/products', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) {
        setProducts((data.products || []).filter(p => p.is_active !== false && p.stock > 0));
      }
    } catch (e) {
      console.error('Products fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addItem = (product) => {
    const existing = selectedItems.find(i => i.productId === product._id);
    if (existing) {
      if (existing.quantity >= product.stock) return;
      setSelectedItems(selectedItems.map(i => i.productId === product._id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setSelectedItems([...selectedItems, {
        productId: product._id,
        name: product.name,
        price: product.discountType === 'real' && product.discountedPrice > 0 ? product.discountedPrice : product.price,
        originalPrice: product.price,
        quantity: 1,
        maxStock: product.stock,
        image: product.images?.[0] || '',
      }]);
    }
  };

  const updateQuantity = (productId, qty) => {
    if (qty <= 0) {
      setSelectedItems(selectedItems.filter(i => i.productId !== productId));
    } else {
      setSelectedItems(selectedItems.map(i => i.productId === productId ? { ...i, quantity: Math.min(qty, i.maxStock) } : i));
    }
  };

  const totalAmount = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = async () => {
    if (!customerName.trim()) { setError('Müşteri adı gerekli'); return; }
    if (selectedItems.length === 0) { setError('En az bir ürün seçin'); return; }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/admin/walkin-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          items: selectedItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
          paymentMethod,
          notes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.order);
        setCustomerName('');
        setCustomerPhone('');
        setSelectedItems([]);
        setNotes('');
        fetchProducts(getToken());
      } else {
        setError(data.error || 'Sipariş oluşturulamadı');
      }
    } catch (e) {
      setError('Bağlantı hatası');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-cream-50 py-8">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl font-bold text-earth-800 mb-2">Satış Tamamlandı!</h2>
            <p className="text-earth-500 mb-4">Sipariş numarası: <strong>{success.orderNumber}</strong></p>
            <p className="text-2xl font-bold text-gold-600 mb-6">{success.totalAmount.toLocaleString('tr-TR')} TL</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setSuccess(null)} className="px-6 py-2 bg-gold-500 text-white rounded-sm hover:bg-gold-600 transition-colors">
                Yeni Satış
              </button>
              <Link href="/admin/orders" className="px-6 py-2 bg-earth-200 text-earth-700 rounded-sm hover:bg-earth-300 transition-colors">
                Siparişleri Gör
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin" className="text-gold-600 hover:text-gold-700 text-sm mb-2 inline-block">&larr; Dashboard</Link>
            <h1 className="font-serif text-3xl font-bold text-earth-800">Mağaza İçi Satış</h1>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="font-serif text-lg font-semibold text-earth-800 mb-4">Müşteri Bilgisi</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">Müşteri Adı *</label>
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Ad Soyad" className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">Telefon</label>
                  <input type="text" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="05XX XXX XX XX" className="input-field w-full" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="font-serif text-lg font-semibold text-earth-800 mb-4">Ürün Seç</h2>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ürün ara..."
                className="input-field w-full mb-4"
              />
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredProducts.map(product => (
                  <div
                    key={product._id}
                    onClick={() => addItem(product)}
                    className="flex items-center justify-between p-3 bg-earth-50 rounded-lg cursor-pointer hover:bg-gold-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-earth-200 rounded" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-earth-800">{product.name}</p>
                        <p className="text-xs text-earth-400">Stok: {product.stock}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gold-600">{product.price.toLocaleString('tr-TR')} TL</span>
                  </div>
                ))}
                {filteredProducts.length === 0 && (
                  <p className="text-center text-earth-400 text-sm py-4">Ürün bulunamadı</p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="font-serif text-lg font-semibold text-earth-800 mb-4">Sepet ({selectedItems.length})</h2>

              {selectedItems.length === 0 ? (
                <p className="text-center text-earth-400 text-sm py-4">Ürün ekleyin</p>
              ) : (
                <div className="space-y-3 mb-4">
                  {selectedItems.map(item => (
                    <div key={item.productId} className="flex items-center justify-between text-sm">
                      <div className="flex-1">
                        <p className="font-medium text-earth-800 line-clamp-1">{item.name}</p>
                        <p className="text-earth-400">{item.price.toLocaleString('tr-TR')} TL</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="w-6 h-6 rounded bg-earth-100 text-earth-600 hover:bg-earth-200 text-xs">-</button>
                        <span className="w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-6 h-6 rounded bg-earth-100 text-earth-600 hover:bg-earth-200 text-xs">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-earth-100 pt-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-earth-700">Toplam</span>
                  <span className="text-xl font-bold text-gold-600">{totalAmount.toLocaleString('tr-TR')} TL</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-earth-700 mb-1">Ödeme Yöntemi</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="input-field w-full">
                  <option value="nakit">Nakit</option>
                  <option value="kredi_karti">Kredi Kartı</option>
                  <option value="havale">Havale/EFT</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-earth-700 mb-1">Notlar</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opsiyonel not..." className="input-field w-full" rows={2} />
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || selectedItems.length === 0 || !customerName.trim()}
                className="w-full py-3 bg-gold-500 text-white rounded-sm hover:bg-gold-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'İşleniyor...' : 'Satışı Tamamla'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
