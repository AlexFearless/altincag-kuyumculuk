import { getDb } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { rateLimit } from '@/lib/rateLimit';
import { revokeAllUserTokens } from '@/lib/auth';

const limiter = rateLimit({ windowMs: 60000, max: 5, message: 'Çok fazla deneme. 1 dakika bekleyin.' });

export default withAuth(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!(await limiter(req, res))) return;

  let db;
  try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı.' }); }

  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mevcut ve yeni şifre zorunludur' });
    }
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return res.status(400).json({ error: 'Geçersiz parametreler' });
    }
    if (newPassword.length < 8 || newPassword.length > 100) {
      return res.status(400).json({ error: 'Yeni şifre 8-100 karakter olmalıdır' });
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return res.status(400).json({ error: 'Yeni şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'Yeni şifre eskisiyle aynı olamaz' });
    }

    const { data: user } = await db
      .from('users')
      .select('id, password, is_active')
      .eq('id', req.admin.id)
      .single();

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
    }

    const isMatch = await bcrypt.compare(String(currentPassword), user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Mevcut şifre hatalı' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 14);
    const { error } = await db
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', req.admin.id);

    if (error) throw error;

    await revokeAllUserTokens(user.id, 'user');

    res.status(200).json({ success: true, message: 'Şifreniz başarıyla güncellendi' });
  } catch (error) {
    console.error('Password change error:', error.code);
    res.status(500).json({ error: 'Şifre değiştirilemedi' });
  }
});
