import { refreshAccessToken } from '@/lib/auth';
import { getRefreshTokenFromRequest, setTokenCookies } from '@/lib/cookies';
import { rateLimit } from '@/lib/rateLimit';
import { parseCookies } from '@/lib/cookieUtils';

const limiter = rateLimit({ windowMs: 60000, max: 20, message: 'Çok fazla deneme. 1 dakika bekleyin.' });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await limiter(req, res))) return;

  try {
    const refreshToken = getRefreshTokenFromRequest(req);

    if (!refreshToken) {
      return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş refresh token' });
    }

    const result = await refreshAccessToken(refreshToken);

    if (!result) {
      return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş refresh token' });
    }

    // Preserve existing user_info cookie
    const cookies = parseCookies(req);
    const existingUserInfo = cookies.user_info ? decodeURIComponent(cookies.user_info) : null;
    let userInfo = null;
    if (existingUserInfo) {
      try { userInfo = JSON.parse(existingUserInfo); } catch {}
    }

    setTokenCookies(res, result.accessToken, result.newRefreshToken, userInfo);

    res.status(200).json({
      success: true,
      expiresIn: 900,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Token yenileme sırasında hata oluştu' });
  }
}
