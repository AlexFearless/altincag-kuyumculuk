import { withAdminRole } from '@/lib/auth';
import { generateSecret, getProvisioningURI } from '@/lib/totp';
import { getDb } from '@/lib/supabase';
import { rateLimit } from '@/lib/rateLimit';

const setupLimiter = rateLimit({ windowMs: 300000, max: 3, message: 'Çok fazla 2FA kurulum denemesi. 5 dakika bekleyin.' });

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await setupLimiter(req, res))) return;

  try {
    let db;
    try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı' }); }

    const adminId = req.admin.id;
    const secret = generateSecret();

    const { error } = await db
      .from('admins')
      .update({ totp_secret: secret, totp_enabled: false })
      .eq('id', adminId);

    if (error) {
      const msg = error.message || '';
      if (msg.includes('totp_secret') || msg.includes('column') || msg.includes('does not exist') || msg.includes('relation') || msg.includes('schema cache')) {
        return res.status(500).json({
          error: '2FA sütunları eksik. Veritabanı yöneticisi ile iletişime geçin.',
        });
      }
      throw error;
    }

    const { data: admin } = await db
      .from('admins')
      .select('email')
      .eq('id', adminId)
      .single();

    const uri = getProvisioningURI(secret, admin.email);

    res.status(200).json({
      success: true,
      secret,
      qrUri: uri,
    });
  } catch (error) {
    console.error('2FA setup error');
    res.status(500).json({ error: '2FA kurulumu sırasında hata oluştu' });
  }
}

export default withAdminRole()(handler);
