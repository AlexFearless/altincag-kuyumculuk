import { getDb } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { sanitize } from '@/lib/sanitize';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let db;
  try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı.' }); }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Oturum açmanız gerekiyor' });
    }

    let userEmail;
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
      const { data: user } = await db.from('users').select('email, is_active').eq('id', decoded.id).single();
      if (!user || !user.is_active) {
        return res.status(401).json({ error: 'Hesap bulunamadı veya pasif' });
      }
      userEmail = user.email;
    } catch {
      return res.status(401).json({ error: 'Geçersiz oturum' });
    }

    if (req.method === 'GET') {
      const { data: messages } = await db
        .from('messages')
        .select('*, message_replies(*)')
        .eq('email', userEmail)
        .order('created_at', { ascending: false });

      const fixed = (messages || []).map(m => ({
        _id: m.id,
        id: m.id,
        name: m.name,
        email: m.email,
        phone: m.phone,
        subject: m.subject,
        message: m.message,
        isRead: m.is_read,
        status: m.status || 'open',
        replies: (m.message_replies || []).map(r => ({
          sender: r.sender,
          senderName: r.sender_name,
          text: r.text,
          createdAt: r.created_at,
        })),
        createdAt: m.created_at,
      }));

      return res.status(200).json({ messages: fixed });
    }

    if (req.method === 'PUT') {
      const { id, reply, senderName } = req.body;
      if (!id || !reply || !String(reply).trim()) {
        return res.status(400).json({ error: 'Mesaj ve ID gerekli' });
      }
      if (String(reply).length > 2000) {
        return res.status(400).json({ error: 'Mesaj 2000 karakterden uzun olamaz' });
      }

      const { data: message } = await db.from('messages').select('*').eq('id', id).single();
      if (!message) return res.status(404).json({ error: 'Mesaj bulunamadı' });

      if (userEmail !== message.email) {
        return res.status(403).json({ error: 'Bu mesaja yanıt verme yetkiniz yok' });
      }

      await db.from('message_replies').insert({
        message_id: id,
        sender: 'user',
        sender_name: sanitize(senderName || message.name),
        text: sanitize(String(reply).trim()),
      });

      await db.from('messages').update({ status: 'open' }).eq('id', id);

      return res.status(200).json({ success: true });
    }
  } catch (error) {
    console.error('User messages error:', error);
    res.status(500).json({ error: 'İşlem başarısız' });
  }
}
