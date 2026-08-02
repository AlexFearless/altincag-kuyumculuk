import { getDb } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { rateLimit } from '@/lib/rateLimit';
import { generateTokenPair, clearFailedAttempts } from '@/lib/auth';
import { setTokenCookies } from '@/lib/cookies';
import { getClientIp } from '@/lib/getClientIp';

const limiter = rateLimit({ windowMs: 60000, max: 10, message: 'Çok fazla deneme. 1 dakika bekleyin.' });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await limiter(req, res))) return;

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
    if (email.length > 254 || password.length > 128) {
      return res.status(400).json({ error: 'Geçersiz giriş bilgileri' });
    }

    const cleanEmail = email.toLowerCase().trim();

    const { data: user } = await db
      .from('users')
      .select('id, name, email, phone, address, password, is_active, email_verified')
      .eq('email', cleanEmail)
      .single();

    if (!user) {
      return res.status(401).json({ error: 'Geçersiz e-posta veya şifre' });
    }

    if (!user.is_active && !user.email_verified) {
      return res.status(401).json({ error: 'Geçersiz e-posta veya şifre' });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'Geçersiz e-posta veya şifre' });
    }

    const isMatch = await bcrypt.compare(String(password), user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Geçersiz e-posta veya şifre' });
    }

    await clearFailedAttempts(`user:${cleanEmail}`);

    const ip = getClientIp(req);
    await db.from('users').update({ last_login_ip: ip }).eq('id', user.id);

    const { accessToken, refreshToken, expiresIn } = await generateTokenPair(user.id, 'user');

    setTokenCookies(res, accessToken, refreshToken, {
      id: user.id, name: user.name, email: user.email, phone: user.phone, address: user.address,
    });

    res.status(200).json({
      success: true,
      expiresIn,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Giriş sırasında hata oluştu' });
  }
}
