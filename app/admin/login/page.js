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
  const router = useRouter();

  useEffect(() => {
    // Beni Hatırla: localStorage'dan, değilse sessionStorage'dan oku
    const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
    const adminInfo = localStorage.getItem('admin_info') || sessionStorage.getItem('admin_info');
    if (token && adminInfo) {
      // Token varsa ve geçerli mi kontrol et (IP tabanlı)
      fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            router.push('/admin');
          } else {
            // Token geçersiz, temizle
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_info');
            sessionStorage.removeItem('admin_token');
            sessionStorage.removeItem('admin_info');
            setCheckingAuth(false);
          }
        })
        .catch(() => setCheckingAuth(false));
    } else {
      setCheckingAuth(false);
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Giriş başarısız');
      }

      // Önceki kayıtları temizle
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_info');
      sessionStorage.removeItem('admin_token');
      sessionStorage.removeItem('admin_info');

      if (rememberMe) {
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_info', JSON.stringify(data.admin));
      } else {
        sessionStorage.setItem('admin_token', data.token);
        sessionStorage.setItem('admin_info', JSON.stringify(data.admin));
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
          <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain mx-auto mb-4" />
          <h1 className="font-serif text-2xl font-bold text-earth-800">Admin Paneli</h1>
          <p className="text-earth-500 text-sm mt-1">AltınÇağ Kuyumculuk Yönetim</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1">
              E-posta
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1">
              Şifre
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-gold-500 border-earth-300 rounded focus:ring-gold-500"
            />
            <label htmlFor="rememberMe" className="ml-2 text-sm text-earth-600 cursor-pointer">
              Beni Hatırla
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
      </div>
    </div>
  );
}
