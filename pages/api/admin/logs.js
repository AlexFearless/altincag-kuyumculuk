import { getDb } from '@/lib/supabase';
import { rateLimit } from '@/lib/rateLimit';
import { parseCookies, getTokenFromRequest } from '@/lib/cookieUtils';
import { verifyToken } from '@/lib/auth';
import { getClientIp } from '@/lib/getClientIp';

const adminLimiter = rateLimit({ windowMs: 60000, max: 30, message: 'Çok fazla istek. 1 dakika bekleyin.' });

async function verifyAdminActive(db, token) {
  const decoded = await verifyToken(token);
  if (!decoded || decoded.userType !== 'admin') return null;
  const { data: admin } = await db
    .from('admins')
    .select('id, is_active, role')
    .eq('id', decoded.id)
    .single();
  if (!admin || !admin.is_active) return null;
  return { decoded, role: admin.role };
}

export async function createLog(db, { action, adminEmail, targetType, targetId, details, req }) {
  try {
    const ip = getClientIp(req);
    await db.from('logs').insert({
      action,
      admin_email: adminEmail,
      target_type: targetType,
      target_id: targetId,
      details: details || {},
      ip,
    });
  } catch {}
}

export default async function handler(req, res) {
  if (!(await adminLimiter(req, res))) return;

  let db;
  try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı.' }); }

  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ error: 'Yetki gerekli' });
  }
  const adminResult = await verifyAdminActive(db, token);
  if (!adminResult) return res.status(401).json({ error: 'Geçersiz veya pasif hesap' });

  if (!adminResult.role || !['super_admin', 'admin'].includes(adminResult.role)) {
    return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
  }

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
      const mapped = (logs || []).map(l => ({
        _id: l.id,
        action: l.action,
        adminEmail: l.admin_email,
        targetType: l.target_type,
        targetId: l.target_id,
        details: l.details,
        ip: l.ip,
        createdAt: l.created_at,
      }));
      res.status(200).json({ logs: mapped, total, page: parseInt(page), pages: Math.ceil(total / safeLimit) });
    } catch {
      res.status(500).json({ error: 'Loglar yüklenemedi' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
