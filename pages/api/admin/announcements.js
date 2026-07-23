import { getDb } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { sanitize } from '@/lib/sanitize';

async function handler(req, res) {
  let db;
  try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı.' }); }

  switch (req.method) {
    case 'GET': return handleGet(db, res);
    case 'POST': return handlePost(db, req, res);
    case 'PUT': return handlePut(db, req, res);
    case 'DELETE': return handleDelete(db, req, res);
    default: return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(db, res) {
  try {
    const { data: announcements } = await db
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    res.status(200).json({ announcements: (announcements || []).map(a => ({
      _id: a.id, id: a.id, title: a.title, message: a.message,
      bgColor: a.bg_color, textColor: a.text_color, isActive: a.is_active, createdAt: a.created_at,
    })) });
  } catch {
    res.status(500).json({ error: 'Duyurular yüklenemedi' });
  }
}

async function handlePost(db, req, res) {
  try {
    const { title, message, bgColor = '#B8860B', textColor = '#FFFFFF', isActive = true } = req.body;
    if (!title?.trim() || !message?.trim()) return res.status(400).json({ error: 'Başlık ve mesaj gerekli' });

    if (isActive) {
      await db.from('announcements').update({ is_active: false }).eq('is_active', true);
    }

    const { data, error } = await db.from('announcements').insert({
      title: sanitize(title.trim()),
      message: sanitize(message.trim()),
      bg_color: bgColor,
      text_color: textColor,
      is_active: isActive,
      created_by: req.admin?.email || 'admin',
    }).select().single();

    if (error) throw error;
    res.status(201).json({ success: true, announcement: { _id: data.id, id: data.id, title: data.title, message: data.message, bgColor: data.bg_color, textColor: data.text_color, isActive: data.is_active } });
  } catch {
    res.status(500).json({ error: 'Duyuru eklenemedi' });
  }
}

async function handlePut(db, req, res) {
  try {
    const { id, title, message, bgColor, textColor, isActive } = req.body;
    if (!id) return res.status(400).json({ error: 'ID gerekli' });

    if (isActive) {
      await db.from('announcements').update({ is_active: false }).neq('id', id);
    }

    const updates = {};
    if (title !== undefined) updates.title = sanitize(title.trim());
    if (message !== undefined) updates.message = sanitize(message.trim());
    if (bgColor !== undefined) updates.bg_color = bgColor;
    if (textColor !== undefined) updates.text_color = textColor;
    if (isActive !== undefined) updates.is_active = isActive;

    const { error } = await db.from('announcements').update(updates).eq('id', id);
    if (error) throw error;
    res.status(200).json({ success: true });
  } catch {
    res.status(500).json({ error: 'Duyuru güncellenemedi' });
  }
}

async function handleDelete(db, req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID gerekli' });
    await db.from('announcements').delete().eq('id', id);
    res.status(200).json({ success: true });
  } catch {
    res.status(500).json({ error: 'Duyuru silinemedi' });
  }
}

export default withAuth(handler);
