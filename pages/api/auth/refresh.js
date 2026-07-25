import { refreshAccessToken } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

const limiter = rateLimit({ windowMs: 60000, max: 20, message: 'Çok fazla deneme. 1 dakika bekleyin.' });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!limiter(req, res)) return;

  try {
    const { refreshToken } = req.body;

    if (!refreshToken || typeof refreshToken !== 'string') {
      return res.status(400).json({ error: 'Refresh token gerekli' });
    }

    const result = await refreshAccessToken(refreshToken);

    if (!result) {
      return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş refresh token' });
    }

    res.status(200).json({
      success: true,
      token: result.accessToken,
      expiresIn: 900,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Token yenileme sırasında hata oluştu' });
  }
}
