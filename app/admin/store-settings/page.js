'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminStoreSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const router = useRouter();

  const [settings, setSettings] = useState({
    storeName: '',
    phone: '',
    email: '',
    address: '',
    whatsapp: '',
    workingHours: '',
    closedDay: '',
    instagram: '',
    announcementText: '',
    announcementEnabled: false,
  });

  const getToken = () => localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchSettings(token);
  }, [router]);

  const fetchSettings = async (token) => {
    try {
      const res = await fetch('/api/admin/store-settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.settings) {
        setSettings({
          storeName: data.settings.storeName || '',
          phone: data.settings.phone || '',
          email: data.settings.email || '',
          address: data.settings.address || '',
          whatsapp: data.settings.whatsapp || '',
          workingHours: data.settings.workingHours || '',
          closedDay: data.settings.closedDay || '',
          instagram: data.settings.instagram || '',
          announcementText: data.settings.announcementText || '',
          announcementEnabled: data.settings.announcementEnabled || false,
        });
      }
    } catch (error) {
      console.error('Ayarlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ text: '', type: '' });
    const token = getToken();
    try {
      const entries = Object.entries(settings);
      for (const [key, value] of entries) {
        await fetch('/api/admin/store-settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ key, value }),
        });
      }
      setMessage({ text: 'Ayarlar kaydedildi', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      console.error('Ayarlar kaydedilemedi:', error);
      setMessage({ text: 'Kaydetme hatası', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_info');
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-earth-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-earth-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-earth-500 hover:text-earth-700">
                &larr; Dashboard
              </Link>
              <span className="font-serif text-lg font-bold text-earth-800">
                Mağaza Ayarları
              </span>
            </div>
            <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-600">
              Çıkış Yap
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message.text && (
          <div className={`mb-6 p-3 rounded-sm text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="font-serif text-lg font-bold text-earth-800 mb-4">Genel Bilgiler</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Mağaza Adı</label>
                <input
                  type="text"
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">Telefon</label>
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">E-posta</label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Adres</label>
                <textarea
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="input-field resize-none h-20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">WhatsApp Numarası</label>
                  <input
                    type="tel"
                    value={settings.whatsapp}
                    onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                    className="input-field"
                    placeholder="905XXXXXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">Çalışma Saatleri</label>
                  <input
                    type="text"
                    value={settings.workingHours}
                    onChange={(e) => setSettings({ ...settings, workingHours: e.target.value })}
                    className="input-field"
                    placeholder="09:00 - 18:00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Kapalı Gün</label>
                <input
                  type="text"
                  value={settings.closedDay}
                  onChange={(e) => setSettings({ ...settings, closedDay: e.target.value })}
                  className="input-field"
                  placeholder="Pazar"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="font-serif text-lg font-bold text-earth-800 mb-4">Sosyal Medya</h2>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">Instagram Kullanıcı Adı</label>
              <input
                type="text"
                value={settings.instagram}
                onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
                className="input-field"
                placeholder="@kullaniciadi"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="font-serif text-lg font-bold text-earth-800 mb-4">Duyuru</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="announcementEnabled"
                  checked={settings.announcementEnabled}
                  onChange={(e) => setSettings({ ...settings, announcementEnabled: e.target.checked })}
                  className="w-4 h-4 text-gold-500 rounded"
                />
                <label htmlFor="announcementEnabled" className="ml-2 text-sm text-earth-700">
                  Duyuruyu Aktif Et (Üst bar'da göster)
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Duyuru Metni</label>
                <input
                  type="text"
                  value={settings.announcementText}
                  onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
                  className="input-field"
                  placeholder="Kargo bedava! 500 TL ve üzeri alışverişlerde..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-gold-500 text-white rounded-sm font-medium hover:bg-gold-600 transition-colors disabled:opacity-50"
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
