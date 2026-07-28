'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';


export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [adminInfo, setAdminInfo] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          window.location.href = '/admin';
        } else {
          setCheckingAuth(false);
        }
      })
      .catch(() => setCheckingAuth(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Giriş başarısız');
      }

      if (data.requires2FA) {
        setRequires2FA(true);
        setTempToken(data.tempToken);
        setAdminInfo(data.admin);
        return;
      }

      router.push('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, totpCode }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Doğrulama başarısız');
      }

      router.push('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-earth-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-earth-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain mx-auto mb-4" />
          <h1 className="font-serif text-2xl font-bold text-earth-800">Admin Panel</h1>
          <p className="text-earth-500 text-sm mt-1">Yönetim arayüzüne giriş yapın</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!requires2FA ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">E-posta</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="admin@email.com"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">Şifre</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-earth-300 text-gold-500 focus:ring-gold-500"
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-earth-600">
                Beni hatırla
              </label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold-500 text-white py-3 rounded-sm font-medium
                         hover:bg-gold-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        ) : (
          <form onSubmit={handle2FASubmit} className="space-y-4">
            <div className="bg-earth-50 p-3 rounded-sm">
              <p className="text-xs text-earth-400">Giriş: <span className="text-earth-700 font-medium">{adminInfo?.email}</span></p>
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">Doğrulama Kodu (TOTP)</label>
              <input
                type="text"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                className="input-field text-center text-lg tracking-[0.5em]"
                placeholder="000000"
                maxLength={6}
                required
                autoFocus
              />
              <p className="text-xs text-earth-400 mt-1">
                Authenticator uygulamanızdaki 6 haneli kodu girin
              </p>
            </div>
            <button
              type="submit"
              disabled={loading || totpCode.length !== 6}
              className="w-full bg-gold-500 text-white py-3 rounded-sm font-medium
                         hover:bg-gold-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Doğrulanıyor...' : 'Doğrula'}
            </button>
            <button
              type="button"
              onClick={() => { setRequires2FA(false); setTotpCode(''); setTempToken(''); }}
              className="w-full text-earth-500 text-sm hover:text-earth-700"
            >
              ← Giriş bilgilerine dön
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
