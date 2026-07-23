import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { rateLimit } from '@/lib/rateLimit';

const limiter = rateLimit({ windowMs: 60000, max: 10, message: 'Çok fazla deneme. 1 dakika bekleyin.' });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!limiter(req, res)) return;

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-posta ve şifre zorunludur' });
    }
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Geçersiz giriş bilgileri' });
    }

    const cleanEmail = email.toLowerCase().trim();

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', cleanEmail)
      .single();

    if (!user) {
      return res.status(401).json({ error: 'Geçersiz e-posta veya şifre' });
    }

    if (!user.is_active && !user.email_verified) {
      return res.status(403).json({
        error: 'E-posta adresiniz henüz doğrulanmamış. Lütfen e-posta gelen kutunuzu kontrol edin.',
        needsVerification: true,
        email: user.email,
      });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Hesabınız devre dışı' });
    }

    const isMatch = await bcrypt.compare(String(password), user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Geçersiz e-posta veya şifre' });
    }

    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || '';
    await supabaseAdmin.from('users').update({ last_login_ip: ip }).eq('id', user.id);

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      success: true,
      token,
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
