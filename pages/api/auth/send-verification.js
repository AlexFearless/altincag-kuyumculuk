import { getDb } from '@/lib/supabase';
import { rateLimit } from '@/lib/rateLimit';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const limiter = rateLimit({ windowMs: 60000, max: 3, message: 'Çok fazla deneme. 1 dakika bekleyin.' });

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!limiter(req, res)) return;

  try {
    let db;
    try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyin.' }); }

    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'E-posta adresi gerekli' });
    }

    const cleanEmail = email.toLowerCase().trim();

    const { data: user } = await db
      .from('users')
      .select('*')
      .eq('email', cleanEmail)
      .single();

    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    if (user.email_verified) {
      return res.status(400).json({ error: 'E-posta zaten doğrulanmış' });
    }

    const code = generateCode();
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await db
      .from('users')
      .update({ verification_code: code, verification_expires: expires })
      .eq('id', user.id);

    let emailSent = false;
    let emailError = null;
    try {
      await sgMail.send({
        from: process.env.SENDGRID_FROM_EMAIL,
        to: cleanEmail,
        subject: 'AltınÇağ Kuyumculuk - Yeni Doğrulama Kodu',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background-color: #f9f6f1; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #8B6914; font-size: 24px; margin: 0;">AltınÇağ Kuyumculuk</h1>
            </div>
            <div style="background: white; border-radius: 8px; padding: 30px; text-align: center;">
              <h2 style="color: #3d3024; font-size: 20px; margin-bottom: 10px;">E-posta Doğrulama</h2>
              <p style="color: #666; font-size: 14px; margin-bottom: 25px;">Merhaba ${user.name}, yeni doğrulama kodunuz:</p>
              <div style="background: #f9f6f1; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                <span style="font-size: 36px; font-weight: bold; color: #8B6914; letter-spacing: 8px;">${code}</span>
              </div>
              <p style="color: #999; font-size: 12px;">Bu kod 10 dakika geçerlidir.</p>
            </div>
          </div>
        `,
      });
      emailSent = true;
    } catch (err) {
      console.error('Email send failed:', err.message);
      emailError = err.message;
    }

    res.status(200).json({ success: true, message: 'Doğrulama kodu gönderildi', emailSent, emailError });
  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({ error: 'Kod gönderilemedi' });
  }
}
