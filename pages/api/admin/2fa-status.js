import { withAdminRole } from '@/lib/auth';
import { getDb } from '@/lib/supabase';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let db;
    try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı' }); }

    const { data, error } = await db
      .from('admins')
      .select('totp_enabled')
      .eq('id', req.admin.id)
      .single();

    if (error) {
      const msg = error.message || '';
      if (msg.includes('totp_enabled') || msg.includes('column') || msg.includes('does not exist') || msg.includes('schema cache')) {
        return res.status(200).json({ success: true, enabled: false, missingColumns: true });
      }
      throw error;
    }

    res.status(200).json({
      success: true,
      enabled: data?.totp_enabled || false,
      missingColumns: false,
    });
  } catch (error) {
    console.error('2FA status error:', error);
    res.status(500).json({ error: 'Durum kontrol edilemedi' });
  }
}

export default withAdminRole()(handler);
