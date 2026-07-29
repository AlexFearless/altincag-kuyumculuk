import { withAdminRole } from '@/lib/auth';
import { verifyTOTP } from '@/lib/totp';
import { getDb } from '@/lib/supabase';
import { rateLimit } from '@/lib/rateLimit';
import { revokeAllUserTokens } from '@/lib/auth';

const totpLimiter = rateLimit({ windowMs: 300000, max: 5, message: 'Çok fazla 2FA denemesi. 5 dakika bekleyin.' });

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await totpLimiter(req, res))) return;

  try {
    let db;
    try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı' }); }

    const adminId = req.admin.id;
    const { code } = req.body;

    if (!code || typeof code !== 'string' || code.trim().length !== 6) {
      return res.status(400).json({ error: '6 haneli doğrulama kodu gerekli' });
    }

    const { data: admin } = await db
      .from('admins')
      .select('totp_secret, totp_enabled')
      .eq('id', adminId)
      .single();

    if (!admin || !admin.totp_enabled) {
      return res.status(400).json({ error: '2FA aktif değil' });
    }

    if (!verifyTOTP(admin.totp_secret, code.trim())) {
      return res.status(400).json({ error: 'Geçersiz doğrulama kodu' });
    }

    const { error } = await db
      .from('admins')
      .update({ totp_enabled: false, totp_secret: null })
      .eq('id', adminId);

    if (error) throw error;

    // Revoke all refresh tokens for this admin
    await revokeAllUserTokens(adminId, 'admin');

    res.status(200).json({
      success: true,
      message: '2FA başarıyla devre dışı bırakıldı',
    });
  } catch (error) {
    console.error('2FA disable error');
    res.status(500).json({ error: '2FA devre dışı bırakma sırasında hata oluştu' });
  }
}

export default withAdminRole()(handler);
