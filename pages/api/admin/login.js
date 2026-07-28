import { getDb } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { rateLimit } from '@/lib/rateLimit';
import { generateTokenPair, checkAccountLockout, recordFailedAttempt, clearFailedAttempts } from '@/lib/auth';
import { setTokenCookies } from '@/lib/cookies';
import { verifyTOTP } from '@/lib/totp';
import { getJwtSecret } from '@/lib/secrets';

const JWT_SECRET = getJwtSecret();
const TEMP_TOKEN_EXPIRY = '5m';

const loginLimiter = rateLimit({ windowMs: 60000, max: 10, message: 'Çok fazla deneme. 1 dakika bekleyin.' });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await loginLimiter(req, res))) return;

  try {
    let db;
    try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyin.' }); }

    const { email, password, tempToken, totpCode } = req.body;

    // 2FA verification flow
    if (tempToken && totpCode) {
      if (typeof tempToken !== 'string' || typeof totpCode !== 'string') {
        return res.status(400).json({ error: 'Geçersiz istek parametreleri' });
      }

      let decoded;
      try {
        decoded = jwt.verify(tempToken, JWT_SECRET);
      } catch {
        return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş doğrulama kodu' });
      }

      if (decoded.purpose !== '2fa') {
        return res.status(401).json({ error: 'Geçersiz token' });
      }

      const { data: admin } = await db
        .from('admins')
        .select('id, email, name, role, is_active, totp_secret, totp_enabled')
        .eq('id', decoded.adminId)
        .single();

      if (!admin || !admin.is_active) {
        return res.status(401).json({ error: 'Geçersiz veya devre dışı hesap' });
      }

      if (!admin.totp_enabled || !admin.totp_secret) {
        return res.status(400).json({ error: '2FA aktif değil' });
      }

      if (!verifyTOTP(admin.totp_secret, totpCode.trim())) {
        return res.status(401).json({ error: 'Geçersiz doğrulama kodu' });
      }

      await db.from('admins').update({ last_login: new Date().toISOString() }).eq('id', admin.id);

      const { accessToken, refreshToken, expiresIn } = await generateTokenPair(admin.id, 'admin');

      setTokenCookies(res, accessToken, refreshToken, {
        id: admin.id, email: admin.email, name: admin.name, role: admin.role,
      });

      res.status(200).json({
        success: true,
        expiresIn,
        admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
      });
      return;
    }

    // Password login flow
    if (!email || !password) {
      return res.status(400).json({ error: 'E-posta ve şifre zorunludur' });
    }
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Geçersiz giriş bilgileri' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const identifier = `admin:${cleanEmail}`;

    const lockout = await checkAccountLockout(identifier);
    if (lockout.locked) {
      return res.status(423).json({
        error: `Hesabınız kilitlendi. ${lockout.remainingSeconds} saniye sonra tekrar deneyin.`,
        lockedUntil: lockout.remainingSeconds,
      });
    }

    const { data: admin } = await db
      .from('admins')
      .select('id, email, name, role, is_active, password, totp_enabled, totp_secret')
      .eq('email', cleanEmail)
      .single();

    if (!admin) {
      await recordFailedAttempt(identifier);
      return res.status(401).json({ error: 'Geçersiz e-posta veya şifre' });
    }

    if (!admin.is_active) {
      return res.status(403).json({ error: 'Hesabınız devre dışı bırakılmış' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      const result = await recordFailedAttempt(identifier);
      if (result.locked) {
        return res.status(423).json({
          error: 'Çok fazla başarısız deneme. Hesabınız 15 dakika kilitlendi.',
          lockedUntil: 900,
        });
      }
      return res.status(401).json({ error: 'Geçersiz e-posta veya şifre' });
    }

    await clearFailedAttempts(identifier);

    if (admin.totp_enabled) {
      const tempToken = jwt.sign(
        { adminId: admin.id, purpose: '2fa' },
        JWT_SECRET,
        { expiresIn: TEMP_TOKEN_EXPIRY, algorithm: 'HS256' }
      );
      return res.status(200).json({
        success: false,
        requires2FA: true,
        tempToken,
        admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
      });
    }

    await db.from('admins').update({ last_login: new Date().toISOString() }).eq('id', admin.id);

    const { accessToken, refreshToken, expiresIn } = await generateTokenPair(admin.id, 'admin');

    setTokenCookies(res, accessToken, refreshToken, {
      id: admin.id, email: admin.email, name: admin.name, role: admin.role,
    });

    res.status(200).json({
      success: true,
      expiresIn,
      admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Sunucu hatası oluştu' });
  }
}
