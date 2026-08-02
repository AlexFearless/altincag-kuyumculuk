'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { csrfFetch } from '@/lib/csrf';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef(null);
  const refreshFailuresRef = useRef(0);

  const scheduleRefresh = useCallback((expiresIn) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const refreshAt = (expiresIn - 120) * 1000;
    if (refreshAt > 0) {
      refreshTimerRef.current = setTimeout(async () => {
        try {
          const res = await csrfFetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          if (!res.ok) {
            refreshFailuresRef.current += 1;
            const retryDelay = Math.min(refreshFailuresRef.current * 30000, 300000);
            refreshTimerRef.current = setTimeout(() => scheduleRefresh(60), retryDelay);
            return;
          }
          refreshFailuresRef.current = 0;
          const data = await res.json();
          if (data.expiresIn) {
            scheduleRefresh(data.expiresIn);
          }
        } catch {
          refreshFailuresRef.current += 1;
          const retryDelay = Math.min(refreshFailuresRef.current * 30000, 300000);
          refreshTimerRef.current = setTimeout(() => scheduleRefresh(60), retryDelay);
        }
      }, refreshAt);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadUser() {
      try {
        const res = await csrfFetch('/api/user/profile');
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          if (data.user && !cancelled) {
            setUser(data.user);
            scheduleRefresh(900);
          }
        }
      } catch {}
      if (!cancelled) setLoading(false);
    }
    loadUser();
    return () => { cancelled = true; if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current); };
  }, [scheduleRefresh]);

  const login = useCallback(async (email, password) => {
    const res = await csrfFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    setUser(data.user);
    scheduleRefresh(data.expiresIn || 900);
    return data;
  }, [scheduleRefresh]);

  const register = useCallback(async (name, email, password, phone) => {
    const res = await csrfFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    setUser(data.user);
    if (data.expiresIn) scheduleRefresh(data.expiresIn);
    return data;
  }, [scheduleRefresh]);

  const logout = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    csrfFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
  }, []);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        const res = await csrfFetch('/api/user/profile');
        if (res.status === 401) {
          const data = await res.json().catch(() => ({}));
          if (data.error === 'Hesabınız devre dışı') {
            logout();
            window.location.href = '/giris?reason=deactivated';
          }
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        if (data.user) setUser(data.user);
      } catch {}
    }, 300000);
    return () => clearInterval(interval);
  }, [user, logout]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
