'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Beni Hatırla: localStorage'dan, değilse sessionStorage'dan oku
    const savedToken = localStorage.getItem('user_token') || sessionStorage.getItem('user_token');
    const savedUser = localStorage.getItem('user_info') || sessionStorage.getItem('user_info');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password, rememberMe = false) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    // Önceki kayıtları temizle
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_info');
    sessionStorage.removeItem('user_token');
    sessionStorage.removeItem('user_info');

    if (rememberMe) {
      localStorage.setItem('user_token', data.token);
      localStorage.setItem('user_info', JSON.stringify(data.user));
    } else {
      sessionStorage.setItem('user_token', data.token);
      sessionStorage.setItem('user_info', JSON.stringify(data.user));
    }
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (name, email, password, phone) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    // Kayıt sonrası varsayılan olarak beni hatırla
    localStorage.setItem('user_token', data.token);
    localStorage.setItem('user_info', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_info');
    sessionStorage.removeItem('user_token');
    sessionStorage.removeItem('user_info');
    setToken('');
    setUser(null);
  }, []);

  // Periyodik hesap aktiflik kontrolu (her 5 dakikada)
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok && data.error === 'Hesabınız devre dışı') {
          logout();
          window.location.href = '/giris?reason=deactivated';
        }
      } catch {}
    }, 300000);
    return () => clearInterval(interval);
  }, [token, logout]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
