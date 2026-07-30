'use client';

function getCsrfToken() {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match ? match[1] : '';
}

export function csrfHeaders() {
  return { 'X-CSRF-Token': getCsrfToken() };
}

async function tryRefreshToken() {
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': getCsrfToken(),
      },
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function csrfFetch(url, options = {}) {
  const headers = {
    ...options.headers,
    ...csrfHeaders(),
  };
  let res = await fetch(url, { ...options, headers, credentials: 'include' });

  if (res.status === 401 && options.method !== 'POST') {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      headers['X-CSRF-Token'] = getCsrfToken();
      res = await fetch(url, { ...options, headers, credentials: 'include' });
    }
  }

  return res;
}
