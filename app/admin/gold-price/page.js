'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function GoldPricePage() {
  const [settings, setSettings] = useState({ autoUpdate: false, apiKey: '', lastPrice: 0, lastUpdate: null, source: 'manual' });
  const [currentPrice, setCurrentPrice] = useState(null);
  const [manualPrice, setManualPrice] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
    if (!token) { router.push('/admin/login'); return; }
    fetchSettings(token);
  }, [router]);

  const getToken = () => localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');

  const fetchSettings = async (token) => {
    try {
      const res = await fetch('/api/admin/gold-price', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) {
        setSettings(data.settings);
        setCurrentPrice(data.currentPrice);
        setApiKeyInput(data.settings.apiKey || '');
        setManualPrice(data.settings.lastPrice ? String(data.settings.lastPrice) : '');
      }
    } catch (e) {
      console.error('Gold price fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/gold-price', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ autoUpdate: settings.autoUpdate, apiKey: apiKeyInput, manualPrice: settings.autoUpdate ? undefined : Number(manualPrice) }),
      });
      const data = await res.json();
      if (res.ok) {
        setSettings(data.settings);
        setMessage('Ayarlar kaydedildi');
      } else {
        setMessage(data.error || 'Kaydetme hatası');
      }
    } catch (e) {
      setMessage('Bağlantı hatası');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/gold-price', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentPrice(data.price);
        setMessage(`Fiyat yenilendi: ${data.price.bid} TL/gram`);
        fetchSettings(getToken());
      } else {
        setMessage(data.error || 'Yenileme hatası');
      }
    } catch (e) {
      setMessage('Bağlantı hatası');
    } finally {
      setRefreshing(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin" className="text-gold-600 hover:text-gold-700 text-sm mb-2 inline-block">&larr; Dashboard</Link>
            <h1 className="font-serif text-3xl font-bold text-earth-800">Altın Fiyatı Takibi</h1>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${message.includes('hata') || message.includes('Hata') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="font-serif text-xl font-semibold text-earth-800 mb-4">Mevcut Altın Fiyatı</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gold-50 rounded-lg p-4 text-center">
              <p className="text-sm text-earth-500 mb-1">Alış Fiyatı</p>
              <p className="text-3xl font-bold text-gold-600">
                {currentPrice ? `${currentPrice.bid} TL` : settings.lastPrice ? `${settings.lastPrice} TL` : '-'}
              </p>
            </div>
            <div className="bg-gold-50 rounded-lg p-4 text-center">
              <p className="text-sm text-earth-500 mb-1">Satış Fiyatı</p>
              <p className="text-3xl font-bold text-gold-600">
                {currentPrice ? `${currentPrice.ask} TL` : '-'}
              </p>
            </div>
          </div>
          {settings.lastUpdate && (
            <p className="text-xs text-earth-400 mt-3 text-center">
              Son güncelleme: {new Date(settings.lastUpdate).toLocaleString('tr-TR')} ({settings.source === 'api' ? 'API' : 'Manuel'})
            </p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="font-serif text-xl font-semibold text-earth-800 mb-4">Ayarlar</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-earth-50 rounded-lg">
              <div>
                <p className="font-medium text-earth-800">Otomatik Güncelleme</p>
                <p className="text-sm text-earth-500">Altın fiyatını API'den otomatik çek</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, autoUpdate: !settings.autoUpdate })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.autoUpdate ? 'bg-gold-500' : 'bg-earth-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.autoUpdate ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {settings.autoUpdate && (
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">API Anahtarı (altinapi.com)</label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="hapi_..."
                  className="input-field w-full"
                />
                <p className="text-xs text-earth-400 mt-1">
                  Ücretsiz deneme için <a href="https://altinapi.com/register" target="_blank" rel="noopener" className="text-gold-600 hover:underline">altinapi.com</a>'a kayıt olun
                </p>
              </div>
            )}

            {!settings.autoUpdate && (
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Manuel Altın Fiyatı (TL/gram)</label>
                <input
                  type="number"
                  value={manualPrice}
                  onChange={(e) => setManualPrice(e.target.value)}
                  placeholder="Örn: 3200"
                  className="input-field w-full"
                  step="0.01"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-gold-500 text-white rounded-sm hover:bg-gold-600 transition-colors disabled:opacity-50"
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>

              {settings.autoUpdate && settings.apiKey && (
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="px-6 py-2 bg-earth-200 text-earth-700 rounded-sm hover:bg-earth-300 transition-colors disabled:opacity-50"
                >
                  {refreshing ? 'Yenileniyor...' : 'Şimdi Yenile'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">Nasıl Çalışır?</h2>
          <div className="space-y-2 text-sm text-earth-600">
            <p><strong>Otomatik Mod:</strong> altinapi.com API anahtarınızı girin. Gram altın fiyatı her istekte çekilir.</p>
            <p><strong>Manuel Mod:</strong> Altın fiyatını kendiniz girersiniz. Otomatik güncelleme yapılmaz.</p>
            <p><strong>Fiyat Kullanımı:</strong> Bu fiyat ürün fiyatlarında referans olarak kullanılabilir veya sadece bilgi amaçlı takip edilebilir.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
