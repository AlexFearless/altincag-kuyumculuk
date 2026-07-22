import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { rateLimit } from '@/lib/rateLimit';
import { validateEmail, validatePhone, sanitize } from '@/lib/sanitize';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const limiter = rateLimit({ windowMs: 60000, max: 5, message: 'Çok fazla kayıt denemesi. 1 dakika bekleyin.' });

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email, name, code) {
  await sgMail.send({
    from: process.env.SENDGRID_FROM_EMAIL,
    to: email,
    subject: 'AltınÇağ Kuyumculuk - E-posta Doğrulama Kodu',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background-color: #f9f6f1; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #8B6914; font-size: 24px; margin: 0;">AltınÇağ Kuyumculuk</h1>
        </div>
        <div style="background: white; border-radius: 8px; padding: 30px; text-align: center;">
          <h2 style="color: #3d3024; font-size: 20px; margin-bottom: 10px;">E-posta Doğrulama</h2>
          <p style="color: #666; font-size: 14px; margin-bottom: 25px;">Merhaba ${name}, hesabınızı doğrulamak için aşağıdaki kodu kullanın:</p>
          <div style="background: #f9f6f1; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <span style="font-size: 36px; font-weight: bold; color: #8B6914; letter-spacing: 8px;">${code}</span>
          </div>
          <p style="color: #999; font-size: 12px;">Bu kod 10 dakika geçerlidir.</p>
          <p style="color: #999; font-size: 12px;">E-posta sizin tarafınızdan oluşturulmadıysa, bu mesajı görmezden gelin.</p>
        </div>
      </div>
    `,
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!limiter(req, res)) return;

  try {
    await dbConnect();
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: 'Ad, e-posta, telefon ve şifre zorunludur' });
    }

    if (typeof name !== 'string' || name.trim().length < 2 || name.length > 100) {
      return res.status(400).json({ error: 'Geçersiz isim' });
    }
    if (!validateEmail(String(email))) {
      return res.status(400).json({ error: 'Geçersiz e-posta adresi' });
    }
    if (typeof password !== 'string' || password.length < 6 || password.length > 100) {
      return res.status(400).json({ error: 'Şifre 6-100 karakter olmalıdır' });
    }
    if (!validatePhone(String(phone))) {
      return res.status(400).json({ error: 'Geçersiz telefon numarası' });
    }

    const existingUser = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ error: 'Bu e-posta adresi zaten kayıtlı' });
    }

    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
    const verificationCode = generateCode();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 dakika

    const user = new User({
      name: sanitize(name.trim()),
      email: email.toLowerCase().trim(),
      password,
      phone: sanitize(phone),
      ipAddress: ip,
      lastLoginIp: ip,
      isActive: false,
      emailVerified: false,
      verificationCode,
      verificationExpires,
    });
    await user.save();

    let emailSent = false;
    let emailError = null;
    try {
      await sendVerificationEmail(email.toLowerCase().trim(), name.trim(), verificationCode);
      emailSent = true;
    } catch (err) {
      console.error('Email send failed:', err.message);
      emailError = err.message;
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    res.status(201).json({
      success: true,
      requiresVerification: true,
      email: email.toLowerCase().trim(),
      emailSent,
      emailError,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('Register error');
    res.status(500).json({ error: 'Kayıt sırasında hata oluştu' });
  }
}
