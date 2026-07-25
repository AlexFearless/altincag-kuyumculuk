function getAdminToken() {
  return localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
}

function getAdminRefreshToken() {
  return localStorage.getItem('admin_refresh_token') || sessionStorage.getItem('admin_refresh_token');
}

function setAdminToken(token) {
  const storage = localStorage.getItem('admin_token') ? localStorage : sessionStorage;
  storage.setItem('admin_token', token);
}

function clearAdminTokens() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_info');
  localStorage.removeItem('admin_refresh_token');
  sessionStorage.removeItem('admin_token');
  sessionStorage.removeItem('admin_info');
  sessionStorage.removeItem('admin_refresh_token');
}

async function tryRefreshToken() {
  const refreshToken = getAdminRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await res.json();
    if (res.ok && data.token) {
      setAdminToken(data.token);
      return data.token;
    }
  } catch {}
  return null;
}

export async function adminFetch(url, options = {}) {
  let token = getAdminToken();
  if (!token) throw new Error('Oturum bulunamadı');

  const headers = { ...options.headers, Authorization: `Bearer ${token}` };

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      res = await fetch(url, { ...options, headers });
    } else {
      clearAdminTokens();
      window.location.href = '/admin/login';
      throw new Error('Oturum süresi doldu');
    }
  }

  return res;
}

export function adminLogout() {
  clearAdminTokens();
  window.location.href = '/admin/login';
}
