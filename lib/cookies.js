const isProd = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax',
  path: '/',
};

export function setTokenCookies(res, accessToken, refreshToken) {
  res.setHeader('Set-Cookie', [
    `access_token=${accessToken}; ${serializeOptions({ ...COOKIE_OPTIONS, maxAge: 900 })}`,
    `refresh_token=${refreshToken}; ${serializeOptions({ ...COOKIE_OPTIONS, maxAge: 365 * 24 * 60 * 60 })}`,
  ]);
}

export function clearTokenCookies(res) {
  res.setHeader('Set-Cookie', [
    'access_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax',
    'refresh_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax',
  ]);
}

export function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  const cookies = parseCookies(req);
  return cookies.access_token || null;
}

export function getRefreshTokenFromRequest(req) {
  const cookies = parseCookies(req);
  return cookies.refresh_token || null;
}

function parseCookies(req) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return {};
  const cookies = {};
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.split('=');
    cookies[name.trim()] = rest.join('=').trim();
  });
  return cookies;
}

function serializeOptions(opts) {
  return Object.entries(opts)
    .map(([key, value]) => {
      if (key === 'maxAge') return `Max-Age=${value}`;
      if (key === 'httpOnly' || key === 'secure') return value ? key : '';
      if (key === 'sameSite') return `SameSite=${value}`;
      if (key === 'path') return `Path=${value}`;
      return '';
    })
    .filter(Boolean)
    .join('; ');
}
