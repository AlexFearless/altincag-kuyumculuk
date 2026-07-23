import { getDb } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { sanitize } from '@/lib/sanitize';

async function handler(req, res) {
  let db;
  try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı.' }); }

  switch (req.method) {
    case 'GET': return handleGet(db, req, res);
    case 'POST': return handlePost(db, req, res);
    case 'DELETE': return handleDelete(db, req, res);
    default: return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(db, req, res) {
  try {
    const { orderId } = req.query;
    if (!orderId) return res.status(400).json({ error: 'Sipariş ID gerekli' });

    const { data: notes } = await db
      .from('order_notes')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    res.status(200).json({ notes: (notes || []).map(n => ({
      _id: n.id, id: n.id, orderId: n.order_id, adminEmail: n.admin_email,
      note: n.note, isInternal: n.is_internal, createdAt: n.created_at,
    })) });
  } catch (error) {
    res.status(500).json({ error: 'Notlar yüklenemedi' });
  }
}

async function handlePost(db, req, res) {
  try {
    const { orderId, note, isInternal = true } = req.body;
    if (!orderId || !note) return res.status(400).json({ error: 'Sipariş ID ve not gerekli' });
    if (note.length > 2000) return res.status(400).json({ error: 'Not 2000 karakterden uzun olamaz' });

    const { data, error } = await db.from('order_notes').insert({
      order_id: orderId,
      admin_email: req.admin?.email || 'admin',
      note: sanitize(note),
      is_internal: isInternal,
    }).select().single();

    if (error) throw error;
    res.status(201).json({ success: true, note: { _id: data.id, id: data.id, note: data.note, isInternal: data.is_internal, adminEmail: data.admin_email, createdAt: data.created_at } });
  } catch (error) {
    res.status(500).json({ error: 'Not eklenemedi' });
  }
}

async function handleDelete(db, req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Not ID gerekli' });
    await db.from('order_notes').delete().eq('id', id);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Not silinemedi' });
  }
}

export default withAuth(handler);
