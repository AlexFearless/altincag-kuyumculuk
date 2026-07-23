import jwt from 'jsonwebtoken';
import { getDb } from '@/lib/supabase';

async function verifyAdminActive(db, token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { data: admin } = await db
      .from('admins')
      .select('id, is_active')
      .eq('id', decoded.id)
      .single();
    if (!admin || !admin.is_active) return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function createLog(db, { action, adminEmail, targetType, targetId, details, req }) {
  try {
    const ip = req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || '';
    await db.from('logs').insert({
      action,
      admin_email: adminEmail,
      target_type: targetType,
      target_id: targetId,
      details: details || {},
      ip,
    });
  } catch (e) {
    console.error('Log creation error:', e);
  }
}

export default async function handler(req, res) {
  let db;
  try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyin.' }); }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Yetki gerekli' });
  }
  const decoded = await verifyAdminActive(db, authHeader.split(' ')[1]);
  if (!decoded) return res.status(401).json({ error: 'Geçersiz veya pasif hesap' });

  if (req.method === 'GET') {
    try {
      const { page = 1, limit = 50 } = req.query;
      const safeLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
      const from = (Math.max(parseInt(page) || 1, 1) - 1) * safeLimit;
      const to = from + safeLimit - 1;

      const { data: logs, count } = await db
        .from('logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      const total = count || 0;
      res.status(200).json({ logs: logs || [], total, page: parseInt(page), pages: Math.ceil(total / safeLimit) });
    } catch (error) {
      console.error('Logs error:', error);
      res.status(500).json({ error: 'Loglar yüklenemedi' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
