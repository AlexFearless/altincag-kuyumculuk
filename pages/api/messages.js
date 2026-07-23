import { getDb } from '@/lib/supabase';
import { sanitize, validateEmail } from '@/lib/sanitize';
import { rateLimit } from '@/lib/rateLimit';
import jwt from 'jsonwebtoken';

const msgLimiter = rateLimit({ windowMs: 60000, max: 10, message: 'Çok fazla mesaj. 1 dakika bekleyin.' });

async function verifyAdminToken(db, req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    const { data: admin } = await db.from('admins').select('id, name, is_active').eq('id', decoded.id).single();
    if (!admin || !admin.is_active) return null;
    return admin;
  } catch {
    return null;
  }
}

function mapMessage(m) {
  return {
    _id: m.id,
    id: m.id,
    name: m.name,
    email: m.email,
    phone: m.phone,
    subject: m.subject,
    message: m.message,
    isRead: m.is_read,
    status: m.status || 'open',
    replies: m.message_replies || [],
    createdAt: m.created_at,
    updatedAt: m.updated_at,
  };
}

export default async function handler(req, res) {
  let db;
  try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyin.' }); }

  switch (req.method) {
    case 'POST':
      if (!msgLimiter(req, res)) return;
      return handlePost(db, req, res);
    case 'GET': {
      const admin = await verifyAdminToken(db, req);
      if (!admin) return res.status(401).json({ error: 'Yetkilendirme başarısız' });
      return handleGet(db, req, res);
    }
    case 'PUT': {
      const admin = await verifyAdminToken(db, req);
      if (!admin) return res.status(401).json({ error: 'Yetkilendirme başarısız' });
      return handlePut(db, req, res, admin);
    }
    case 'DELETE': {
      const admin = await verifyAdminToken(db, req);
      if (!admin) return res.status(401).json({ error: 'Yetkilendirme başarısız' });
      return handleDelete(db, req, res);
    }
    default: return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handlePost(db, req, res) {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Zorunlu alanları doldurun' });
    }
    if (typeof name !== 'string' || name.trim().length < 2 || name.length > 100) {
      return res.status(400).json({ error: 'Geçersiz isim' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Geçersiz e-posta' });
    }
    if (typeof message !== 'string' || message.length > 5000) {
      return res.status(400).json({ error: 'Mesaj 5000 karakterden uzun olamaz' });
    }
    if (typeof subject !== 'string' || subject.length > 200) {
      return res.status(400).json({ error: 'Geçersiz konu' });
    }

    const { error } = await db.from('messages').insert({
      name: sanitize(name.trim()),
      email: String(email).toLowerCase().trim(),
      phone: sanitize(String(phone || '')),
      subject: sanitize(String(subject)),
      message: sanitize(String(message).trim()),
      status: 'open',
    });

    if (error) throw error;
    res.status(201).json({ success: true, message: 'Mesajınız başarıyla gönderildi' });
  } catch (error) {
    console.error('Message POST error:', error);
    res.status(500).json({ error: 'Mesaj gönderilemedi' });
  }
}

async function handleGet(db, req, res) {
  try {
    const { unread, email, category } = req.query;
    let query = db
      .from('messages')
      .select('*, message_replies(*)', { count: 'exact' });

    if (unread === 'true') query = query.eq('is_read', false);
    if (email) query = query.eq('email', String(email).toLowerCase().trim());
    if (category && category !== 'all') query = query.eq('subject', category);

    const { data: messages } = await query.order('created_at', { ascending: false });

    const { count: unreadCount } = await db
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    const fixed = (messages || []).map(m => {
      if (!m.message_replies) m.message_replies = [];
      if (!m.status) m.status = 'open';
      return mapMessage(m);
    });

    res.status(200).json({ messages: fixed, unreadCount: unreadCount || 0 });
  } catch (error) {
    console.error('Messages GET error:', error);
    res.status(500).json({ error: 'Mesajlar yüklenemedi' });
  }
}

async function handlePut(db, req, res, admin) {
  try {
    const { id, isRead, reply, senderName, status } = req.body;
    if (!id) return res.status(400).json({ error: 'Mesaj ID gerekli' });

    const { data: message } = await db.from('messages').select('*').eq('id', id).single();
    if (!message) return res.status(404).json({ error: 'Mesaj bulunamadı' });

    const updateData = {};
    if (isRead !== undefined) updateData.is_read = !!isRead;
    if (status !== undefined && ['open', 'answered', 'closed'].includes(status)) updateData.status = status;

    if (Object.keys(updateData).length > 0) {
      await db.from('messages').update(updateData).eq('id', id);
    }

    if (reply !== undefined && String(reply).trim()) {
      if (String(reply).length > 5000) return res.status(400).json({ error: 'Yanıt çok uzun' });
      await db.from('message_replies').insert({
        message_id: id,
        sender: 'admin',
        sender_name: sanitize(admin.name || 'Admin'),
        text: sanitize(String(reply).trim()),
      });
      await db.from('messages').update({ status: 'answered' }).eq('id', id);
    }

    const { data: updatedMessage } = await db
      .from('messages')
      .select('*, message_replies(*)')
      .eq('id', id)
      .single();

    res.status(200).json({ success: true, message: mapMessage(updatedMessage) });
  } catch (error) {
    console.error('Message PUT error:', error);
    res.status(500).json({ error: 'Mesaj güncellenemedi' });
  }
}

async function handleDelete(db, req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Mesaj ID gerekli' });
    await db.from('message_replies').delete().eq('message_id', id);
    await db.from('messages').delete().eq('id', id);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Message DELETE error:', error);
    res.status(500).json({ error: 'Mesaj silinemedi' });
  }
}
