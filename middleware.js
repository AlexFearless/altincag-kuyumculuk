import { NextResponse } from 'next/server';

const SITE_URL = 'http://localhost:3000';
const ALLOWED_ORIGINS = [SITE_URL].filter(Boolean);
const STATE_CHANGING_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];
const CSP_EVAL = process.env.NODE_ENV === 'production' ? "" : " 'unsafe-eval'";
const CSP_SCRIPT_INLINE = process.env.NODE_ENV === 'production' ? "" : " 'unsafe-inline'";

function generateNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
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
      "connect-src 'self' https://*.supabase.co http://localhost:8787",
      "frame-src https://www.google.com https://maps.google.com",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  };
}

function generateCsrfToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

function parseCookies(cookieHeader) {
  const cookies = {};
  cookieHeader.split(';').forEach(c => {
    const [key, ...val] = c.split('=');
    if (key) cookies[key.trim()] = val.join('=');
  });
  return cookies;
}

function verifyCsrfToken(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = parseCookies(cookieHeader);
  const cookieToken = cookies.csrf_token;
  const headerToken = request.headers.get('x-csrf-token');
  if (!cookieToken || !headerToken) return false;
  if (cookieToken.length !== headerToken.length) return false;
  let result = 0;
  for (let i = 0; i < cookieToken.length; i++) {
    result |= cookieToken.charCodeAt(i) ^ headerToken.charCodeAt(i);
  }
  return result === 0;
}

const CSRF_EXEMPT_PATHS = [
  '/api/auth/login', '/api/auth/register', '/api/auth/verify-email',
  '/api/auth/send-verification', '/api/admin/login', '/api/admin/verify',
  '/api/products', '/api/search', '/api/track', '/api/announcements', '/api/messages',
];

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

export async function middleware(request) {
  const nonce = generateNonce();
  const SECURITY_HEADERS = buildCspHeaders(nonce);
  const response = NextResponse.next();
  const headers = response.headers;

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }
  headers.set('X-Nonce', nonce);

  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const cookieHeader = request.headers.get('cookie') || '';
    if (!cookieHeader.includes('access_token=')) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith('/api/')) {
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
