'use client';

import { useState } from 'react';

const steps = [
  { id: 1, title: 'Supabase Ayarları', description: 'Veritabanı bağlantısını yapılandırın' },
  { id: 2, title: 'Admin Hesabı', description: 'Yönetici hesabınızı oluşturun' },
  { id: 3, title: 'Tamamlandı', description: 'Kurulum başarıyla tamamlandı' },
];

export default function SetupPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    supabaseUrl: '',
    supabaseAnonKey: '',
    supabaseServiceKey: '',
    adminEmail: '',
    adminPassword: '',
    adminPasswordConfirm: '',
  });

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setError('');
  };

  const handleStep1 = () => {
    if (!form.supabaseUrl || !form.supabaseAnonKey || !form.supabaseServiceKey) {
      setError('Tüm Supabase alanlarını doldurun');
      return;
    }
    if (!form.supabaseUrl.startsWith('https://')) {
      setError('Supabase URL https:// ile başlamalıdır');
      return;
    }
    setStep(2);
  };

  const handleSetup = async () => {
    if (!form.adminEmail || !form.adminPassword) {
      setError('Admin e-posta ve şifresi zorunludur');
      return;
    }
    if (form.adminPassword.length < 8) {
      setError('Admin şifresi en az 8 karakter olmalıdır');
      return;
    }
    if (form.adminPassword !== form.adminPasswordConfirm) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseUrl: form.supabaseUrl.trim(),
          supabaseAnonKey: form.supabaseAnonKey.trim(),
          supabaseServiceKey: form.supabaseServiceKey.trim(),
          adminEmail: form.adminEmail.trim(),
          adminPassword: form.adminPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Kurulum başarısız');
        return;
      }
      setStep(3);
    } catch {
      setError('Bağlantı hatası oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-earth-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-earth-800 mb-2">AltınÇağ Kuyumculuk</h1>
          <p className="text-earth-500 text-sm">İlk kurulum sihirbazı</p>
        </div>

        <div className="flex items-center justify-center mb-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step > s.id ? 'bg-green-500 text-white' :
                step === s.id ? 'bg-gold-500 text-white' :
                'bg-earth-200 text-earth-500'
              }`}>
                {step > s.id ? '✓' : s.id}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 ${step > s.id ? 'bg-green-500' : 'bg-earth-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-earth-100 p-8">
          {step === 1 && (
            <div>
              <h2 className="font-serif text-xl font-bold text-earth-800 mb-1">Supabase Bağlantısı</h2>
              <p className="text-earth-500 text-sm mb-6">
                <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-gold-600 underline">Supabase</a>'de bir proje oluşturun ve bilgileri buraya girin.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">Supabase URL</label>
                  <input
                    type="url"
                    value={form.supabaseUrl}
                    onChange={e => updateForm('supabaseUrl', e.target.value)}
                    placeholder="https://xxxxx.supabase.co"
                    className="w-full px-4 py-2.5 border border-earth-200 rounded-lg text-sm focus:outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">Anon (Public) Key</label>
                  <input
                    type="text"
                    value={form.supabaseAnonKey}
                    onChange={e => updateForm('supabaseAnonKey', e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIs..."
                    className="w-full px-4 py-2.5 border border-earth-200 rounded-lg text-sm focus:outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">Service Role Key</label>
                  <input
                    type="text"
                    value={form.supabaseServiceKey}
                    onChange={e => updateForm('supabaseServiceKey', e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIs..."
                    className="w-full px-4 py-2.5 border border-earth-200 rounded-lg text-sm focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

              <button
                onClick={handleStep1}
                className="w-full mt-6 bg-gold-500 text-white py-2.5 rounded-lg font-medium hover:bg-gold-600 transition-colors"
              >
                Devam Et
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-serif text-xl font-bold text-earth-800 mb-1">Admin Hesabı</h2>
              <p className="text-earth-500 text-sm mb-6">Yönetici paneline giriş yapacağınız hesabı oluşturun.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">E-posta</label>
                  <input
                    type="email"
                    value={form.adminEmail}
                    onChange={e => updateForm('adminEmail', e.target.value)}
                    placeholder="admin@ornek.com"
                    className="w-full px-4 py-2.5 border border-earth-200 rounded-lg text-sm focus:outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">Şifre</label>
                  <input
                    type="password"
                    value={form.adminPassword}
                    onChange={e => updateForm('adminPassword', e.target.value)}
                    placeholder="En az 8 karakter"
                    className="w-full px-4 py-2.5 border border-earth-200 rounded-lg text-sm focus:outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">Şifre Tekrar</label>
                  <input
                    type="password"
                    value={form.adminPasswordConfirm}
                    onChange={e => updateForm('adminPasswordConfirm', e.target.value)}
                    placeholder="Şifrenizi tekrar girin"
                    className="w-full px-4 py-2.5 border border-earth-200 rounded-lg text-sm focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setStep(1); setError(''); }}
                  className="flex-1 border border-earth-300 text-earth-700 py-2.5 rounded-lg font-medium hover:border-gold-500 transition-colors"
                >
                  Geri
                </button>
                <button
                  onClick={handleSetup}
                  disabled={loading}
                  className="flex-1 bg-gold-500 text-white py-2.5 rounded-lg font-medium hover:bg-gold-600 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Kuruluyor...' : 'Kurulumu Tamamla'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <h2 className="font-serif text-xl font-bold text-earth-800 mb-2">Kurulum Tamamlandı!</h2>
              <p className="text-earth-500 text-sm mb-6">
                Artık siteyi kullanmaya başlayabilirsiniz. Admin paneline giriş yapmak için e-posta ve şifrenizi kullanın.
              </p>
              <div className="flex gap-3">
                <a
                  href="/admin/login"
                  className="flex-1 bg-gold-500 text-white py-2.5 rounded-lg font-medium hover:bg-gold-600 transition-colors text-center"
                >
                  Admin Girişi
                </a>
                <a
                  href="/"
                  className="flex-1 border border-earth-300 text-earth-700 py-2.5 rounded-lg font-medium hover:border-gold-500 transition-colors text-center"
                >
                  Ana Sayfa
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
