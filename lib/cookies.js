import { parseCookies } from './cookieUtils';

const isProd = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax',
  path: '/',
};

// User info cookie - NOT HttpOnly so client JS can read it
const USER_COOKIE_OPTIONS = {
  httpOnly: false,
  secure: isProd,
  sameSite: 'lax',
  path: '/',
  maxAge: 24 * 60 * 60, // 24 hours
};

export function setTokenCookies(res, accessToken, refreshToken, userInfo = null) {
  const refreshMaxAge = 365 * 24 * 60 * 60;
  const cookies = [
    `access_token=${accessToken}; ${serializeOptions({ ...COOKIE_OPTIONS, maxAge: 900 })}`,
    `refresh_token=${refreshToken}; ${serializeOptions({ ...COOKIE_OPTIONS, maxAge: refreshMaxAge })}`,
  ];

  if (userInfo) {
    const safeInfo = { name: userInfo.name, email: userInfo.email };
    const encoded = encodeURIComponent(JSON.stringify(safeInfo));
    cookies.push(`user_info=${encoded}; ${serializeOptions(USER_COOKIE_OPTIONS)}`);
  }

  res.setHeader('Set-Cookie', cookies);
}

export function clearTokenCookies(res) {
  const secure = isProd ? '; Secure' : '';
  res.setHeader('Set-Cookie', [
    `access_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`,
    `refresh_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`,
    `user_info=; Path=/; Max-Age=0; SameSite=Lax${secure}`,
  ]);
}

export function getRefreshTokenFromRequest(req) {
  const cookies = parseCookies(req);
  return cookies.refresh_token || null;
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
