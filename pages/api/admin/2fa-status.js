import { withAdminRole } from '@/lib/auth';
import { getDb } from '@/lib/supabase';
import { rateLimit } from '@/lib/rateLimit';

const statusLimiter = rateLimit({ windowMs: 300000, max: 5, message: 'Çok fazla istek. 5 dakika bekleyin.' });

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await statusLimiter(req, res))) return;

  try {
    let db;
    try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı' }); }

    const { data, error } = await db
      .from('admins')
      .select('totp_enabled')
      .eq('id', req.admin.id)
      .single();

    if (error) {
      console.error('2FA status error:', error.code);
      return res.status(500).json({ error: 'Durum kontrol edilemedi' });
    }

    res.status(200).json({
      success: true,
      enabled: data?.totp_enabled || false,
    });
  } catch (error) {
    console.error('2FA status error:', error.code);
    res.status(500).json({ error: 'Durum kontrol edilemedi' });
  }
}

export default withAdminRole()(handler);
