import { getDb } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { sanitize } from '@/lib/sanitize';
import { getJwtSecret } from '@/lib/secrets';
import { rateLimit } from '@/lib/rateLimit';
import { parseCookies } from '@/lib/cookieUtils';

const messagesLimiter = rateLimit({ windowMs: 60000, max: 20, message: 'Çok fazla istek. 1 dakika bekleyin.' });

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
  if (!(await messagesLimiter(req, res))) return;

  let db;
  try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı.' }); }

  const JWT_SECRET = getJwtSecret();

  try {
    const authHeader = req.headers.authorization;
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      const cookies = parseCookies(req);
      token = cookies.access_token || null;
    }
    if (!token) return res.status(401).json({ error: 'Oturum açmanız gerekiyor' });

    let userEmail;
    let userId;
    try {
      const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
      userId = decoded.id;
      const { data: user, error: userErr } = await db.from('users').select('email, is_active').eq('id', decoded.id).single();
      if (userErr) return res.status(500).json({ error: 'Kullanıcı sorgulanamadı' });
      if (!user) return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
      if (!user.is_active) return res.status(401).json({ error: 'Hesap pasif' });
      userEmail = user.email;
    } catch (e) {
      return res.status(401).json({ error: 'Geçersiz oturum: ' + (e.message || 'bilinmeyen hata') });
    }

    if (req.method === 'GET') {
      const normalizedEmail = String(userEmail).toLowerCase().trim();
      console.log('[user/messages] userId:', userId, 'email:', normalizedEmail);
      let { data: messages, error: msgErr } = await db.from('messages').select('*, message_replies(*)').eq('email', normalizedEmail).order('created_at', { ascending: false });
      if (msgErr) console.error('[user/messages] query error:', msgErr);
      console.log('[user/messages] found by email:', (messages || []).length);
      if ((!messages || messages.length === 0) && userId) {
        const { data: byUserId } = await db.from('messages').select('*, message_replies(*)').eq('user_id', userId).order('created_at', { ascending: false });
        console.log('[user/messages] found by user_id:', (byUserId || []).length);
        if (byUserId && byUserId.length > 0) messages = byUserId;
      }
      const fixed = (messages || []).map(m => ({
        _id: m.id, id: m.id, name: m.name, email: m.email, phone: m.phone, subject: m.subject,
        message: m.message, isRead: m.is_read, status: m.status || 'open',
        replies: (m.message_replies || []).map(r => ({ sender: r.sender, senderName: r.sender_name, text: r.text, createdAt: r.created_at })),
        createdAt: m.created_at,
      }));
      return res.status(200).json({ messages: fixed, userEmail: normalizedEmail });
    }

    if (req.method === 'PUT') {
      const { id, reply, senderName } = req.body;
      if (!id || !reply || !String(reply).trim()) return res.status(400).json({ error: 'Mesaj ve ID gerekli' });
      if (String(reply).length > 2000) return res.status(400).json({ error: 'Mesaj 2000 karakterden uzun olamaz' });

      const { data: message } = await db.from('messages').select('*, message_replies(*)').eq('id', id).single();
      if (!message) return res.status(404).json({ error: 'Mesaj bulunamadı' });
      if (String(userEmail).toLowerCase().trim() !== String(message.email).toLowerCase().trim()) return res.status(403).json({ error: 'Bu mesaja yanıt verme yetkiniz yok' });

      await db.from('message_replies').insert({ message_id: id, sender: 'user', sender_name: sanitize(senderName || message.name), text: sanitize(String(reply).trim()) });
      await db.from('messages').update({ status: 'open' }).eq('id', id);

      const { data: updatedMessage } = await db.from('messages').select('*, message_replies(*)').eq('id', id).single();
      return res.status(200).json({
        success: true,
        message: {
          _id: updatedMessage.id, id: updatedMessage.id, name: updatedMessage.name, email: updatedMessage.email, phone: updatedMessage.phone,
          subject: updatedMessage.subject, message: updatedMessage.message, isRead: updatedMessage.is_read,
          status: updatedMessage.status || 'open',
          replies: (updatedMessage.message_replies || []).map(r => ({ sender: r.sender, senderName: r.sender_name, text: r.text, createdAt: r.created_at })),
          createdAt: updatedMessage.created_at,
        },
      });
    }
  } catch {
    res.status(500).json({ error: 'İşlem başarısız' });
  }
}
