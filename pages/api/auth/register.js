import { getDb } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { rateLimit } from '@/lib/rateLimit';
import { validateEmail, validatePhone, sanitize } from '@/lib/sanitize';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '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');

const limiter = rateLimit({ windowMs: 60000, max: 5, message: 'Çok fazla kayıt denemesi. 1 dakika bekleyin.' });

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email, name, code) {
  await sgMail.send({
    from: process.env.SENDGRID_FROM_EMAIL || 'kuyumculukaltincag@gmail.com',
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
    let db;
    try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyin.' }); }

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

    const cleanEmail = email.toLowerCase().trim();

    const { data: existingUser } = await db
      .from('users')
      .select('id')
      .eq('email', cleanEmail)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'Bu e-posta adresi zaten kayıtlı' });
    }

    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || '';
    const verificationCode = generateCode();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const hashedPassword = await bcrypt.hash(password, 12);

    const { data: user, error: insertError } = await db
      .from('users')
      .insert({
        name: sanitize(name.trim()),
        email: cleanEmail,
        password: hashedPassword,
        phone: sanitize(phone),
        ip_address: ip,
        last_login_ip: ip,
        is_active: false,
        email_verified: false,
        verification_code: verificationCode,
        verification_expires: verificationExpires,
      })
      .select('id, name, email, phone')
      .single();

    if (insertError) {
      console.error('Register insert error:', insertError);
      return res.status(500).json({ error: 'Kayıt sırasında hata oluştu' });
    }

    let emailSent = false;
    let emailError = null;
    try {
      await sendVerificationEmail(cleanEmail, name.trim(), verificationCode);
      emailSent = true;
    } catch (err) {
      console.error('Email send failed:', err.message);
      emailError = err.message;
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'altincag_jwt_secret_2024_very_long_and_secure_key_here', { expiresIn: '10m' });

    res.status(201).json({
      success: true,
      requiresVerification: true,
      email: cleanEmail,
      emailSent,
      emailError,
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Kayıt sırasında hata oluştu' });
  }
}
