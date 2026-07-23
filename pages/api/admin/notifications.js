import { getDb } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { createLog } from '@/pages/api/admin/logs';

async function handler(req, res) {
  let db;
  try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyin.' }); }

  switch (req.method) {
    case 'GET': return handleGet(db, req, res);
    case 'PUT': return handlePut(db, req, res);
    case 'DELETE': return handleDelete(db, req, res);
    default: return res.status(405).json({ error: 'Method not allowed' });
  }
}

function mapNotification(n) {
  return {
    _id: n.id,
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    isRead: n.is_read,
    targetId: n.target_id,
    createdAt: n.created_at,
  };
}

async function handleGet(db, req, res) {
  try {
    const { unread, page = 1, limit = 50 } = req.query;
    const safeLimit = parseInt(limit) || 50;
    const from = (parseInt(page) - 1) * safeLimit;
    const to = from + safeLimit - 1;

    let query = db.from('notifications').select('*', { count: 'exact' });
    if (unread === 'true') query = query.eq('is_read', false);

    const { data: notifications, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    const total = count || 0;
    res.status(200).json({ notifications: (notifications || []).map(mapNotification), total, page: parseInt(page), pages: Math.ceil(total / safeLimit) });
  } catch (error) {
    console.error('Admin notifications GET error:', error);
    res.status(500).json({ error: 'Bildirimler yüklenirken hata oluştu' });
  }
}

async function handlePut(db, req, res) {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Bildirim ID zorunludur' });

    const { data: notification } = await db.from('notifications').select('*').eq('id', id).single();
    if (!notification) return res.status(404).json({ error: 'Bildirim bulunamadı' });

    if (notification.is_read) {
      return res.status(200).json({ success: true, notification: mapNotification(notification) });
    }

    const { data: updated, error } = await db
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    createLog(db, { action: 'Bildirim okundu olarak işaretlendi', adminEmail: req.admin?.email || 'admin', targetType: 'notification', targetId: id, details: { type: notification.type, title: notification.title }, req });
    res.status(200).json({ success: true, notification: mapNotification(updated) });
  } catch (error) {
    console.error('Admin notifications PUT error:', error);
    res.status(500).json({ error: 'Bildirim güncellenirken hata oluştu' });
  }
}

async function handleDelete(db, req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Bildirim ID zorunludur' });

    const { data: notification } = await db.from('notifications').select('title').eq('id', id).single();
    if (!notification) return res.status(404).json({ error: 'Bildirim bulunamadı' });

    await db.from('notifications').delete().eq('id', id);

    createLog(db, { action: 'Bildirim silindi', adminEmail: req.admin?.email || 'admin', targetType: 'notification', targetId: id, details: { title: notification.title }, req });
    res.status(200).json({ success: true, message: 'Bildirim başarıyla silindi' });
  } catch (error) {
    console.error('Admin notifications DELETE error:', error);
    res.status(500).json({ error: 'Bildirim silinirken hata oluştu' });
  }
}

export default withAuth(handler);
