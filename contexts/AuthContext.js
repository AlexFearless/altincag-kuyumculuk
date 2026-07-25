'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef(null);

  const scheduleRefresh = useCallback((expiresIn) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const refreshAt = (expiresIn - 120) * 1000;
    if (refreshAt > 0) {
      refreshTimerRef.current = setTimeout(async () => {
        try {
          const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
          if (!refreshToken) return;
          const res = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          const data = await res.json();
          if (res.ok && data.token) {
            const storage = localStorage.getItem('user_token') ? localStorage : sessionStorage;
            storage.setItem('user_token', data.token);
            setToken(data.token);
            scheduleRefresh(data.expiresIn);
          } else {
            logout();
          }
        } catch {
          logout();
        }
      }, refreshAt);
    }
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem('user_token') || sessionStorage.getItem('user_token');
    const savedUser = localStorage.getItem('user_info') || sessionStorage.getItem('user_info');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      scheduleRefresh(900);
    }
    setLoading(false);
    return () => { if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current); };
  }, [scheduleRefresh]);

  const login = useCallback(async (email, password, rememberMe = false) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    localStorage.removeItem('user_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user_token');
    sessionStorage.removeItem('user_info');
    sessionStorage.removeItem('refresh_token');

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('user_token', data.token);
    storage.setItem('user_info', JSON.stringify(data.user));
    if (data.refreshToken) storage.setItem('refresh_token', data.refreshToken);

    setToken(data.token);
    setUser(data.user);
    scheduleRefresh(data.expiresIn || 900);
    return data;
  }, [scheduleRefresh]);

  const register = useCallback(async (name, email, password, phone) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    localStorage.setItem('user_token', data.token);
    localStorage.setItem('user_info', JSON.stringify(data.user));
    if (data.refreshToken) localStorage.setItem('refresh_token', data.refreshToken);
    setToken(data.token);
    setUser(data.user);
    if (data.expiresIn) scheduleRefresh(data.expiresIn);
    return data;
  }, [scheduleRefresh]);

  const logout = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user_token');
    sessionStorage.removeItem('user_info');
    sessionStorage.removeItem('refresh_token');
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setToken('');
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.error === 'Hesabınız devre dışı' || data.error === 'Geçersiz oturum') {
          logout();
          window.location.href = '/giris?reason=deactivated';
        } else if (data.user) {
          setUser(data.user);
          const storage = localStorage.getItem('user_token') ? localStorage : sessionStorage;
          storage.setItem('user_info', JSON.stringify(data.user));
        }
      } catch {}
    }, 60000);
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
