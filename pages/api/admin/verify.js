import jwt from 'jsonwebtoken';
import { getDb } from '@/lib/supabase';
import { getJwtSecret } from '@/lib/secrets';
import { parseCookies, getTokenFromRequest } from '@/lib/cookieUtils';
import { isTokenBlacklisted } from '@/lib/auth';

const JWT_SECRET = getJwtSecret();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let db;
    try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı' }); }

    const token = getTokenFromRequest(req);
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, error: 'Token gerekli' });
    }

    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });

    // Check blacklist
    if (decoded.jti && await isTokenBlacklisted(decoded.jti)) {
      return res.status(401).json({ success: false, error: 'Yetkilendirme başarısız' });
    }

    // Verify this is an admin token
    if (decoded.userType !== 'admin') {
      return res.status(403).json({ success: false, error: 'Yetkilendirme başarısız' });
    }

    const { data: admin } = await db
      .from('admins')
      .select('id, email, name, role, is_active')
      .eq('id', decoded.id)
      .single();

    if (!admin) {
      return res.status(401).json({ success: false, error: 'Yetkilendirme başarısız' });
    }

    if (!admin.is_active) {
      return res.status(403).json({ success: false, error: 'Hesabınız devre dışı' });
    }

    if (!admin.role || !['super_admin', 'admin'].includes(admin.role)) {
      return res.status(403).json({ success: false, error: 'Yetkilendirme başarısız' });
    }

    res.status(200).json({ success: true, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } });
  } catch {
    res.status(401).json({ success: false, error: 'Yetkilendirme başarısız' });
  }
}
