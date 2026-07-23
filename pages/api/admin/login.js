import { getDb } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

const loginLimiter = rateLimit({ windowMs: 60000, max: 10, message: 'Çok fazla deneme. 1 dakika bekleyin.' });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!loginLimiter(req, res)) return;

  try {
    let db;
    try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyin.' }); }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-posta ve şifre zorunludur' });
    }
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Geçersiz giriş bilgileri' });
    }

    const { data: admin } = await db
      .from('admins')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (!admin) {
      return res.status(401).json({ error: 'Geçersiz e-posta veya şifre' });
    }

    if (!admin.is_active) {
      return res.status(403).json({ error: 'Hesabınız devre dışı bırakılmış' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Geçersiz e-posta veya şifre' });
    }

    await db.from('admins').update({ last_login: new Date().toISOString() }).eq('id', admin.id);

    const token = generateToken(admin.id);

    res.status(200).json({
      success: true,
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Sunucu hatası oluştu' });
  }
}
