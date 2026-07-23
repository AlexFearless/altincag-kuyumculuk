import { getDb } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { rateLimit } from '@/lib/rateLimit';

const limiter = rateLimit({ windowMs: 60000, max: 5, message: 'Çok fazla deneme. 1 dakika bekleyin.' });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!limiter(req, res)) return;

  try {
    let db;
    try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyin.' }); }

    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'E-posta ve doğrulama kodu gerekli' });
    }
    if (typeof email !== 'string' || typeof code !== 'string') {
      return res.status(400).json({ error: 'Geçersiz bilgiler' });
    }

    const { data: user } = await db
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    if (user.email_verified) {
      return res.status(400).json({ error: 'E-posta zaten doğrulanmış' });
    }

    if (!user.verification_code || !user.verification_expires) {
      return res.status(400).json({ error: 'Doğrulama kodu bulunamadı. Lütfen yeni bir kod isteyin.' });
    }

    if (new Date() > new Date(user.verification_expires)) {
      return res.status(400).json({ error: 'Doğrulama kodunun süresi dolmuş. Yeni bir kod isteyin.' });
    }

    if (user.verification_code !== code.trim()) {
      return res.status(400).json({ error: 'Geçersiz doğrulama kodu' });
    }

    await db
      .from('users')
      .update({
        email_verified: true,
        is_active: true,
        verification_code: null,
        verification_expires: null,
      })
      .eq('id', user.id);

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '5y' });

    res.status(200).json({
      success: true,
      message: 'E-posta başarıyla doğrulandı',
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Doğrulama sırasında hata oluştu' });
  }
}
