import { clearTokenCookies } from '@/lib/cookies';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  clearTokenCookies(res);

  res.status(200).json({ success: true });
}
