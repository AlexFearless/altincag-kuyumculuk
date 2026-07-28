'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminFetch } from '@/lib/adminApi';

export default function AdminSettings() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [twoFAStatus, setTwoFAStatus] = useState('loading');
  const [setupData, setSetupData] = useState(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const res = await fetch('/api/admin/verify', { method: 'POST', credentials: 'include' });
        const data = await res.json();
        if (data.success && data.admin) {
          setAdmin(data.admin);
        } else {
          router.push('/admin/login');
        }
      } catch {
        router.push('/admin/login');
      }
    };
    verifyAdmin();
    check2FAStatus();
  }, []);

  const check2FAStatus = async () => {
    try {
      const res = await fetch('/api/admin/2fa-status', { credentials: 'include' });
      if (res.status === 401) { router.push('/admin/login'); return; }
      const data = await res.json();
      if (data.missingColumns) {
        setTwoFAStatus('error');
      } else {
        setTwoFAStatus(data.enabled ? 'enabled' : 'disabled');
      }
    } catch {
      setTwoFAStatus('unknown');
    }
  };

  const handleSetup = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await adminFetch('/api/admin/2fa-setup', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSetupData(data);
      setMessage('Authenticator uygulamanıza QR kodu ekleyin, sonra doğrulama kodunu girin.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verifyCode.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      const res = await adminFetch('/api/admin/2fa-verify', {
        method: 'POST',
        body: JSON.stringify({ code: verifyCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage('2FA başarıyla aktif edildi!');
      setSetupData(null);
      setVerifyCode('');
      setTwoFAStatus('enabled');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (disableCode.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      const res = await adminFetch('/api/admin/2fa-disable', {
        method: 'POST',
        body: JSON.stringify({ code: disableCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage('2FA devre dışı bırakıldı.');
      setDisableCode('');
      setTwoFAStatus('disabled');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const qrUrl = setupData?.qrUri
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.qrUri)}`
    : '';

  return (
    <div className="min-h-screen bg-earth-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-earth-500 hover:text-earth-700 text-sm">
                ← Geri
              </Link>
              <span className="font-serif text-lg font-bold text-earth-800">Güvenlik Ayarları</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="font-serif text-xl font-bold text-earth-800 mb-2">İki Faktörlü Doğrulama (2FA)</h2>
          <p className="text-sm text-earth-500 mb-6">
            Hesabınıza ekstra güvenlik katmanı ekleyin. Google Authenticator veya benzeri bir uygulama kullanın.
          </p>

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-lg mb-4">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {twoFAStatus === 'loading' && (
            <div className="flex items-center space-x-2 text-earth-500">
              <div className="w-5 h-5 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Durum kontrol ediliyor...</span>
            </div>
          )}

          {twoFAStatus === 'error' && (
            <div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="font-medium text-red-800 mb-2">Veritabanı Sütunları Eksik</p>
                <p className="text-sm text-red-600 mb-3">
                  2FA özelliğini kullanmak için Supabase veritabanına sütun eklemeniz gerekiyor.
                </p>
                <p className="text-xs text-red-500 mb-2">Supabase Dashboard &gt; SQL Editor'a gidip bu SQL'i çalıştırın:</p>
                <div className="bg-white border border-red-200 rounded-lg p-3 relative">
                  <pre className="text-xs text-earth-700 whitespace-pre-wrap font-mono leading-relaxed">
{`ALTER TABLE admins ADD COLUMN IF NOT EXISTS totp_secret TEXT;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS last_totp_verify TIMESTAMPTZ;`}
                  </pre>
                  <button
                    onClick={() => navigator.clipboard.writeText(`ALTER TABLE admins ADD COLUMN IF NOT EXISTS totp_secret TEXT;\nALTER TABLE admins ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT FALSE;\nALTER TABLE admins ADD COLUMN IF NOT EXISTS last_totp_verify TIMESTAMPTZ;`)}
                    className="absolute top-2 right-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 transition-colors"
                  >
                    Kopyala
                  </button>
                </div>
                <button
                  onClick={check2FAStatus}
                  className="mt-3 text-sm text-red-700 font-medium hover:text-red-800 transition-colors"
                >
                  SQL'i çalıştırdım, tekrar kontrol et →
                </button>
              </div>
            </div>
          )}

          {twoFAStatus === 'enabled' && !setupData && (
            <div>
              <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                <div>
                  <p className="font-medium text-green-800">2FA Aktif</p>
                  <p className="text-xs text-green-600">Hesabınız iki faktörlü doğrulama ile korunuyor.</p>
                </div>
              </div>

              <div className="border-t border-earth-200 pt-6">
                <h3 className="font-semibold text-earth-800 mb-3">2FA'yı Devre Dışı Bırak</h3>
                <p className="text-sm text-earth-500 mb-4">
                  Devre dışı bırakmak için Authenticator uygulamanızdaki 6 haneli kodu girin.
                </p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="flex-1 px-4 py-3 border border-earth-200 rounded-lg text-center text-lg tracking-widest font-mono focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  />
                  <button
                    onClick={handleDisable}
                    disabled={loading || disableCode.length !== 6}
                    className="px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'İşleniyor...' : 'Devre Dışı Bırak'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {(twoFAStatus === 'disabled' || twoFAStatus === 'unknown') && !setupData && (
            <div>
              <div className="flex items-center space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <div>
                  <p className="font-medium text-yellow-800">2FA Devre Dışı</p>
                  <p className="text-xs text-yellow-600">Hesabınız şu anda ekstra güvenlik katmanı ile korunmuyor.</p>
                </div>
              </div>

              <button
                onClick={handleSetup}
                disabled={loading}
                className="w-full bg-gold-500 text-white py-3 rounded-lg font-medium hover:bg-gold-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Kuruluyor...' : '2FA Kurulumunu Başlat'}
              </button>
            </div>
          )}

          {setupData && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-earth-600 mb-4">
                  Authenticator uygulamanızla bu QR kodunu taratın:
                </p>
                <div className="inline-block p-4 bg-white border-2 border-earth-200 rounded-xl">
                  <img src={qrUrl} alt="2FA QR Kod" width={200} height={200} className="rounded-lg" />
                </div>
              </div>

              <div>
                <p className="text-sm text-earth-500 mb-2">QR kodu taratamıyorsanız, bu anahtarı girin:</p>
                <div className="flex items-center gap-2 bg-earth-50 p-3 rounded-lg">
                  <code className="flex-1 text-sm font-mono text-earth-800 break-all select-all">{setupData.secret}</code>
                  <button
                    onClick={() => { navigator.clipboard.writeText(setupData.secret); }}
                    className="text-gold-600 hover:text-gold-700 text-xs font-medium whitespace-nowrap"
                  >
                    Kopyala
                  </button>
                </div>
              </div>

              <div className="border-t border-earth-200 pt-4">
                <p className="text-sm font-medium text-earth-700 mb-2">Doğrulama Kodu</p>
                <p className="text-xs text-earth-500 mb-3">
                  Uygulamada görünen 6 haneli kodu girin:
                </p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="flex-1 px-4 py-3 border border-earth-200 rounded-lg text-center text-lg tracking-widest font-mono focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                  />
                  <button
                    onClick={handleVerify}
                    disabled={loading || verifyCode.length !== 6}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Doğrulanıyor...' : 'Aktif Et'}
                  </button>
                </div>
              </div>

              <button
                onClick={() => { setSetupData(null); setVerifyCode(''); setError(''); setMessage(''); }}
                className="w-full text-earth-500 text-sm hover:text-earth-700 transition-colors py-2"
              >
                İptal
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
