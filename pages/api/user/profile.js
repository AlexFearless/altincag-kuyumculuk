import { getDb } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { sanitize, validateEmail, validatePhone } from '@/lib/sanitize';

export default async function handler(req, res) {
  let db;
  try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyin.' }); }

  if (req.method === 'GET') {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Oturum açmanız gerekiyor' });
      }
      const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);

      const { data: user } = await db
        .from('users')
        .select('id, name, email, phone, address, is_active')
        .eq('id', decoded.id)
        .single();

      if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      if (!user.is_active) return res.status(403).json({ error: 'Hesabınız devre dışı' });

      return res.status(200).json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email, phone: user.phone, address: user.address },
      });
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Geçersiz oturum' });
      }
      return res.status(500).json({ error: 'Doğrulama hatası' });
    }
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Oturum açmanız gerekiyor' });
    }

    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);

    const { name, phone, email, address } = req.body;
    const updateData = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2 || name.length > 100) {
        return res.status(400).json({ error: 'Geçersiz isim' });
      }
      updateData.name = sanitize(name.trim());
    }
    if (phone !== undefined) {
      if (phone && !validatePhone(phone)) {
        return res.status(400).json({ error: 'Geçersiz telefon numarası' });
      }
      updateData.phone = sanitize(String(phone));
    }
    if (email !== undefined) {
      if (!validateEmail(email)) {
        return res.status(400).json({ error: 'Geçersiz e-posta adresi' });
      }
      updateData.email = String(email).toLowerCase().trim();
    }
    if (address !== undefined) updateData.address = typeof address === 'object' ? address : sanitize(String(address || ''));

    if (Object.keys(updateData).length === 0) return res.status(400).json({ error: 'Güncellenecek alan yok' });

    const { data: user, error } = await db
      .from('users')
      .update(updateData)
      .eq('id', decoded.id)
      .select('id, name, email, phone, address')
      .single();

    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: 'Bu e-posta adresi zaten kullanımda' });
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    res.status(200).json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, address: user.address },
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Geçersiz oturum' });
    res.status(500).json({ error: 'Profil güncellenirken hata oluştu' });
  }
}
