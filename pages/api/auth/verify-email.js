import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { rateLimit } from '@/lib/rateLimit';

const limiter = rateLimit({ windowMs: 60000, max: 5, message: 'Çok fazla deneme. 1 dakika bekleyin.' });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!limiter(req, res)) return;

  try {
    await dbConnect();
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'E-posta ve doğrulama kodu gerekli' });
    }

    if (typeof email !== 'string' || typeof code !== 'string') {
      return res.status(400).json({ error: 'Geçersiz bilgiler' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'E-posta zaten doğrulanmış' });
    }

    if (!user.verificationCode || !user.verificationExpires) {
      return res.status(400).json({ error: 'Doğrulama kodu bulunamadı. Lütfen yeni bir kod isteyin.' });
    }

    if (new Date() > user.verificationExpires) {
      return res.status(400).json({ error: 'Doğrulama kodunun süresi dolmuş. Yeni bir kod isteyin.' });
    }

    if (user.verificationCode !== code.trim()) {
      return res.status(400).json({ error: 'Geçersiz doğrulama kodu' });
    }

    await User.findByIdAndUpdate(user._id, {
      emailVerified: true,
      isActive: true,
      verificationCode: null,
      verificationExpires: null,
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'E-posta başarıyla doğrulandı',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('Verify email error');
    res.status(500).json({ error: 'Doğrulama sırasında hata oluştu' });
  }
}
