import { getDb } from '@/lib/supabase';
import { sanitize, validateEmail, validatePhone } from '@/lib/sanitize';
import { getJwtSecret } from '@/lib/secrets';
import { rateLimit } from '@/lib/rateLimit';
import { parseCookies, getTokenFromRequest } from '@/lib/cookieUtils';
import { verifyToken } from '@/lib/auth';

const profileLimiter = rateLimit({ windowMs: 60000, max: 20, message: 'Çok fazla istek. 1 dakika bekleyin.' });

export default async function handler(req, res) {
  if (!(await profileLimiter(req, res))) return;

  let db;
  try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı.' }); }

  if (req.method === 'GET') {
    try {
      const token = getTokenFromRequest(req);
      if (!token) return res.status(401).json({ error: 'Oturum açmanız gerekiyor' });
      const decoded = await verifyToken(token);
      if (!decoded) return res.status(401).json({ error: 'Geçersiz oturum' });

      const table = decoded.userType === 'admin' ? 'admins' : 'users';
      const { data: user } = await db.from(table).select('id, name, email, phone, address, is_active').eq('id', decoded.id).single();
      if (!user) return res.status(404).json({ error: 'Hesap bulunamadı' });
      if (!user.is_active) return res.status(403).json({ error: 'Hesabınız devre dışı' });

      return res.status(200).json({ success: true, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, address: user.address } });
    } catch (error) {
      return res.status(500).json({ error: 'Doğrulama hatası' });
    }
  }

  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const token = getTokenFromRequest(req);
    if (!token) return res.status(401).json({ error: 'Oturum açmanız gerekiyor' });
    const decoded = await verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Geçersiz oturum' });

    const table = decoded.userType === 'admin' ? 'admins' : 'users';

    const { name, phone, email, address } = req.body;
    const updateData = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2 || name.length > 100) return res.status(400).json({ error: 'Geçersiz isim' });
      updateData.name = sanitize(name.trim());
    }
    if (phone !== undefined) {
      if (phone && !validatePhone(phone)) return res.status(400).json({ error: 'Geçersiz telefon numarası' });
      updateData.phone = sanitize(String(phone));
    }
    if (email !== undefined) {
      return res.status(400).json({ error: 'E-posta değişikliği için müşteri hizmetleri ile iletişime geçin' });
    }
    if (address !== undefined) {
      const addr = typeof address === 'object' ? address : String(address || '');
      if (typeof addr === 'string' && addr.length > 500) return res.status(400).json({ error: 'Adres 500 karakterden uzun olamaz' });
      updateData.address = typeof address === 'object' ? address : sanitize(addr);
    }

    if (Object.keys(updateData).length === 0) return res.status(400).json({ error: 'Güncellenecek alan yok' });

    const { data: user, error } = await db.from(table).update(updateData).eq('id', decoded.id).select('id, name, email, phone, address').single();
    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: 'Bu e-posta adresi zaten kullanımda' });
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    res.status(200).json({ success: true, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, address: user.address } });
  } catch (error) {
    res.status(500).json({ error: 'Profil güncellenirken hata oluştu' });
  }
}
