import { NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mjyghchbqlwqxorfgkvj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_qU1cUequqxCCLRZChd-UDA_m81hZc8b';

const ALLOWED_ORIGINS = [SITE_URL].filter(Boolean);
const STATE_CHANGING_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];
const CSP_EVAL = process.env.NODE_ENV === 'production' ? "" : " 'unsafe-eval'";
const CSP_SCRIPT_INLINE = process.env.NODE_ENV === 'production' ? "" : " 'unsafe-inline'";

function generateNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

function constantTimeCompare(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

const SECURITY_HEADERS_BASE = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
};

function buildCspHeaders(nonce) {
  return {
    ...SECURITY_HEADERS_BASE,
    'Content-Security-Policy': [
      "default-src 'self'",
      `script-src 'self'${CSP_EVAL}${CSP_SCRIPT_INLINE} 'nonce-${nonce}' https://www.google.com https://www.gstatic.com https://maps.googleapis.com`,
      `style-src 'self' 'unsafe-inline' 'nonce-${nonce}' https://fonts.googleapis.com`,
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://mjyghchbqlwqxorfgkvj.supabase.co wss://mjyghchbqlwqxorfgkvj.supabase.co",
      "frame-src https://www.google.com https://maps.google.com",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  };
}

const CSRF_EXEMPT_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-email',
  '/api/auth/send-verification',
  '/api/admin/login',
  '/api/admin/verify',
  '/api/products',
  '/api/search',
  '/api/track',
  '/api/announcements',
  '/api/messages',
];

function getJwtSecret() {
  return new TextEncoder().encode(JWT_SECRET);
}

function parseCookies(cookieHeader) {
  const cookies = {};
  cookieHeader.split(';').forEach(c => {
    const [key, ...val] = c.split('=');
    if (key) cookies[key.trim()] = val.join('=');
  });
  return cookies;
}

function generateCsrfToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

function verifyCsrfToken(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = parseCookies(cookieHeader);
  const cookieToken = cookies.csrf_token;
  const headerToken = request.headers.get('x-csrf-token');
  if (!cookieToken || !headerToken) return false;
  return constantTimeCompare(cookieToken, headerToken);
}

function isCsrfExempt(pathname) {
  return CSRF_EXEMPT_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
}

function ensureCsrfCookie(response) {
  const existing = response.headers.get('set-cookie') || '';
  if (existing.includes('csrf_token')) return response;
  const token = generateCsrfToken();
  const isProd = process.env.NODE_ENV === 'production';
  const secureFlag = isProd ? '; Secure' : '';
  const cookie = `csrf_token=${token}; Path=/; Max-Age=${24 * 60 * 60}; SameSite=Lax${secureFlag}`;
  if (Array.isArray(response.headers.get('set-cookie'))) {
    response.headers.append('Set-Cookie', cookie);
  } else {
    response.headers.set('Set-Cookie', cookie);
  }
  return response;
}

async function supabaseQuery(table, query) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });
  if (!res.ok) return null;
  return res.json();
}

async function supabaseUpdate(table, query, body) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(body),
  });
  return res.ok;
}

async function supabaseInsert(table, body) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return res.ok;
}

async function supabaseDelete(table, query) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });
  return res.ok;
}

async function hashToken(token) {
  const data = new TextEncoder().encode(token);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function refreshAccessToken(refreshToken) {
  if (!refreshToken || typeof refreshToken !== 'string') return null;
  const tokenHash = await hashToken(refreshToken);
  const tokens = await supabaseQuery('refresh_tokens', `token_hash=eq.${tokenHash}&revoked=eq.false&order=expires_at.desc&limit=1`);
  if (!tokens || tokens.length === 0) return null;
  const tokenRow = tokens[0];
  if (new Date(tokenRow.expires_at) < new Date()) {
    await supabaseDelete('refresh_tokens', `id=eq.${tokenRow.id}`);
    return null;
  }
  const secret = getJwtSecret();
  const newAccessToken = await new SignJWT({ id: tokenRow.user_id, userType: tokenRow.user_type })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .setJti(crypto.randomUUID())
    .sign(secret);
  const newRefreshToken = Array.from(crypto.getRandomValues(new Uint8Array(40))).map(b => b.toString(16).padStart(2, '0')).join('');
  const newTokenHash = await hashToken(newRefreshToken);
  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const revoked = await supabaseUpdate('refresh_tokens', `id=eq.${tokenRow.id}&revoked=eq.false`, { revoked: true });
  if (!revoked) return null;
  const inserted = await supabaseInsert('refresh_tokens', {
    user_id: tokenRow.user_id,
    user_type: tokenRow.user_type,
    token_hash: newTokenHash,
    expires_at: newExpiresAt,
  });
  if (!inserted) {
    await supabaseUpdate('refresh_tokens', `id=eq.${tokenRow.id}`, { revoked: false });
    return null;
  }
  return { accessToken: newAccessToken, newRefreshToken };
}

async function tryVerifyAndRefresh(request, response, userType) {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = parseCookies(cookieHeader);
  const accessToken = cookies.access_token;
  const refreshToken = cookies.refresh_token;

  if (accessToken) {
    try {
      const { payload } = await jwtVerify(accessToken, getJwtSecret(), { algorithms: ['HS256'] });
      if (userType === 'admin' && payload.userType !== 'admin') return null;
      if (userType === 'user' && payload.userType !== 'user') return null;
      return payload;
    } catch {}
  }

  if (refreshToken) {
    const result = await refreshAccessToken(refreshToken);
    if (result) {
      const isProd = process.env.NODE_ENV === 'production';
      const secureFlag = isProd ? '; Secure' : '';
      const cookie = `access_token=${result.accessToken}; Path=/; Max-Age=900; HttpOnly; SameSite=Lax${secureFlag}`;
      response.headers.append('Set-Cookie', cookie);
      const refreshCookie = `refresh_token=${result.newRefreshToken}; Path=/; Max-Age=604800; HttpOnly; SameSite=Lax${secureFlag}`;
      response.headers.append('Set-Cookie', refreshCookie);
      try {
        const { payload } = await jwtVerify(result.accessToken, getJwtSecret(), { algorithms: ['HS256'] });
        return payload;
      } catch {}
    }
  }

  return null;
}

export async function middleware(request) {
  const nonce = generateNonce();
  const SECURITY_HEADERS = buildCspHeaders(nonce);
  const response = NextResponse.next();
  const headers = response.headers;

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }
  headers.set('X-Content-Security-Policy-Nonce', nonce);

  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const payload = await tryVerifyAndRefresh(request, response, 'admin');
    if (!payload) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith('/api/')) {
    if (pathname.startsWith('/api/admin/') && pathname !== '/api/admin/login' && pathname !== '/api/admin/verify') {
      const payload = await tryVerifyAndRefresh(request, response, 'admin');
      if (!payload) {
        return NextResponse.json({ error: 'Yetkilendirme başarısız' }, { status: 401 });
      }
      request.admin = payload;
    }

    if (!pathname.startsWith('/api/admin/') && pathname.startsWith('/api/user/')) {
      const payload = await tryVerifyAndRefresh(request, response, 'user');
      if (payload) {
        request.user = payload;
      }
    }

    const origin = request.headers.get('origin');
    if (ALLOWED_ORIGINS.length > 0 && origin && ALLOWED_ORIGINS.includes(origin)) {
      headers.set('Access-Control-Allow-Origin', origin);
    }
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.set('Access-Control-Max-Age', '86400');

    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers });
    }

    if (STATE_CHANGING_METHODS.includes(request.method) && !isCsrfExempt(pathname)) {
      const requestOrigin = request.headers.get('origin');
      const referer = request.headers.get('referer');
      if (!requestOrigin && !referer) {
        return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
      }
      if (requestOrigin && ALLOWED_ORIGINS.length > 0) {
        const allowed = ALLOWED_ORIGINS.some(a => {
          try {
            const aUrl = new URL(a);
            const oUrl = new URL(requestOrigin);
            return aUrl.protocol === oUrl.protocol && aUrl.hostname === oUrl.hostname;
          } catch { return false; }
        });
        if (!allowed) {
          return NextResponse.json({ error: 'Geçersiz istek kaynağı' }, { status: 403 });
        }
      }
      if (!verifyCsrfToken(request)) {
        return NextResponse.json({ error: 'CSRF token doğrulanamadı' }, { status: 403 });
      }
    }

    ensureCsrfCookie(response);
  }

  if (!pathname.startsWith('/api/') && !pathname.startsWith('/_next/')) {
    ensureCsrfCookie(response);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png).*)'],
};
