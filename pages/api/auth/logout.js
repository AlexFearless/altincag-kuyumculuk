import { clearTokenCookies, getRefreshTokenFromRequest } from '@/lib/cookies';
import { revokeRefreshToken, blacklistToken, verifyTokenWithoutBlacklist } from '@/lib/auth';
import { getTokenFromRequest } from '@/lib/cookieUtils';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Blacklist the access token
    const accessToken = getTokenFromRequest(req);
    if (accessToken) {
      await blacklistToken(accessToken, 'logout');
    }

    // Revoke the refresh token
    const refreshToken = getRefreshTokenFromRequest(req);
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }
  } catch (e) {
    // Best effort - don't fail the logout
  }

  clearTokenCookies(res);

  res.status(200).json({ success: true });
}
