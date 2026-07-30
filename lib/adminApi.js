function getCsrfToken() {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match ? match[1] : '';
}

async function tryRefreshToken() {
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function adminFetch(url, options = {}) {
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    'X-CSRF-Token': getCsrfToken(),
  };

  let res = await fetch(url, { ...options, credentials: 'include', headers });

  if (res.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      headers['X-CSRF-Token'] = getCsrfToken();
      res = await fetch(url, { ...options, credentials: 'include', headers });
    }
    if (res.status === 401) {
      window.location.href = '/admin/login';
      throw new Error('Oturum süresi doldu');
    }
  }

  return res;
}

export function adminLogout() {
  fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
    headers: { 'X-CSRF-Token': getCsrfToken() },
  }).catch(() => {});
  window.location.href = '/admin/login';
}
