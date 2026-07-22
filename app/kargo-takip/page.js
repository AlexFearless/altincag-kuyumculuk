'use client';

import { useState } from 'react';
import Link from 'next/link';

const stepIcons = {
  order: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  ),
  prepare: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  ),
  cargo: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.142-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  ),
  delivered: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const statusLabels = {
  pending: 'Sipariş Alındı',
  processing: 'Hazırlanıyor',
  shipped: 'Kargoda',
  delivered: 'Teslim Edildi',
  cancelled: 'İptal Edildi',
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  processing: 'bg-blue-100 text-blue-700 border-blue-300',
  shipped: 'bg-purple-100 text-purple-700 border-purple-300',
  delivered: 'bg-green-100 text-green-700 border-green-300',
  cancelled: 'bg-red-100 text-red-700 border-red-300',
};

export default function KargoTakipPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`/api/track?code=${encodeURIComponent(code.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 py-8 lg:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gold-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gold-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.142-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </div>
          <h1 className="font-serif text-3xl font-bold text-earth-800 mb-2">Kargo Takip</h1>
          <p className="text-earth-500">Sipariş numaranızı veya kargo kodunuzu girin</p>
        </div>

        <form onSubmit={handleTrack} className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Sipariş numarası (ör: AC2607228721)"
              className="flex-1 px-4 py-3 border border-earth-200 rounded-sm text-sm focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="bg-gold-500 text-white px-6 py-3 rounded-sm font-medium hover:bg-gold-600 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              )}
              <span>Sorgula</span>
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 text-center">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-earth-400">Sipariş Numarası</p>
                  <p className="font-serif text-lg font-bold text-earth-800">#{result.order.orderNumber}</p>
                </div>
                <span className={`text-sm font-medium px-3 py-1 rounded-full border ${statusColors[result.order.status]}`}>
                  {statusLabels[result.order.status]}
                </span>
              </div>

              {result.order.trackingNumber && (
                <div className="bg-earth-50 rounded-lg p-3 mb-4">
                  <p className="text-xs text-earth-400">Kargo Takip Kodu</p>
                  <p className="text-sm font-mono font-semibold text-earth-700">{result.order.trackingNumber}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-earth-400">Ödeme Yöntemi</p>
                  <p className="text-earth-700 font-medium">{result.order.paymentMethod === 'havale' ? 'Havale / EFT' : result.order.paymentMethod === 'kapida' ? 'Kapıda Ödeme' : 'Kredi Kartı'}</p>
                </div>
                <div>
                  <p className="text-earth-400">Toplam Tutar</p>
                  <p className="text-earth-700 font-medium">{result.order.totalAmount?.toLocaleString('tr-TR')} TL</p>
                </div>
                <div>
                  <p className="text-earth-400">Sipariş Tarihi</p>
                  <p className="text-earth-700 font-medium">{new Date(result.order.createdAt).toLocaleDateString('tr-TR')}</p>
                </div>
                <div>
                  <p className="text-earth-400">Son Güncelleme</p>
                  <p className="text-earth-700 font-medium">{new Date(result.order.updatedAt).toLocaleDateString('tr-TR')}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-serif text-lg font-semibold text-earth-800 mb-6">Sipariş Durumu</h3>

              {result.isCancelled ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <p className="text-red-600 font-medium">Sipariş iptal edilmiştir</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute top-5 left-0 right-0 h-0.5 bg-earth-100" />
                  <div className="flex justify-between relative">
                    {result.steps.map((step, idx) => (
                      <div key={step.key} className="flex flex-col items-center z-10" style={{ width: '25%' }}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                          step.status === 'done' ? 'bg-gold-500 border-gold-500 text-white' :
                          step.status === 'active' ? 'bg-white border-gold-500 text-gold-600 ring-4 ring-gold-100' :
                          'bg-white border-earth-200 text-earth-300'
                        }`}>
                          {step.status === 'done' ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          ) : (
                            stepIcons[step.icon]
                          )}
                        </div>
                        <p className={`text-xs mt-2 text-center font-medium ${
                          step.status === 'active' ? 'text-gold-600' :
                          step.status === 'done' ? 'text-earth-700' :
                          'text-earth-300'
                        }`}>
                          {step.label}
                        </p>
                        {step.status === 'active' && (
                          <span className="text-[10px] text-gold-500 mt-0.5">Şu an burada</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {result.order.items.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-serif text-lg font-semibold text-earth-800 mb-4">Sipariş Detayları</h3>
                <div className="space-y-3">
                  {result.order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-earth-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-earth-700">{item.name}</p>
                        <p className="text-xs text-earth-400">{item.quantity} adet</p>
                      </div>
                      <p className="text-sm font-semibold text-earth-700">{(item.price * item.quantity).toLocaleString('tr-TR')} TL</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center">
              <Link href="/" className="text-sm text-gold-600 hover:text-gold-700 underline">
                Alışverişe Dön
              </Link>
            </div>
          </div>
        )}

        {!result && !error && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="w-16 h-16 text-earth-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.142-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
            <p className="text-earth-400 text-sm">Sipariş numaranızı yukarıya yazarak kargonuzu takip edebilirsiniz</p>
          </div>
        )}
      </div>
    </div>
  );
}
