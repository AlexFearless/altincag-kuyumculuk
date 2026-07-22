import dbConnect from '@/lib/mongodb';
import Message from '@/models/Message';
import { sanitize, validateEmail } from '@/lib/sanitize';
import { rateLimit } from '@/lib/rateLimit';
import jwt from 'jsonwebtoken';
import Admin from '@/models/Admin';

const msgLimiter = rateLimit({ windowMs: 60000, max: 10, message: 'Çok fazla mesaj. 1 dakika bekleyin.' });

async function verifyAdminToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    await dbConnect();
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin || !admin.isActive) return null;
    return admin;
  } catch { return null; }
}

export default async function handler(req, res) {
  await dbConnect();
  switch (req.method) {
    case 'POST':
      if (!msgLimiter(req, res)) return;
      return handlePost(req, res);
    case 'GET': {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Yetkilendirme başarısız' });
      return handleGet(req, res);
    }
    case 'PUT': {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Yetkilendirme başarısız' });
      return handlePut(req, res, admin);
    }
    case 'DELETE': {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Yetkilendirme başarısız' });
      return handleDelete(req, res);
    }
    default: return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handlePost(req, res) {
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
    await Message.create({
      name: sanitize(name.trim()),
      email: String(email).toLowerCase().trim(),
      phone: sanitize(String(phone || '')),
      subject: sanitize(String(subject)),
      message: sanitize(String(message).trim()),
      replies: [],
      status: 'open',
    });
    res.status(201).json({ success: true, message: 'Mesajınız başarıyla gönderildi' });
  } catch (error) {
    res.status(500).json({ error: 'Mesaj gönderilemedi' });
  }
}

async function handleGet(req, res) {
  try {
    const { unread, email, category } = req.query;
    const query = {};
    if (unread === 'true') query.isRead = false;
    if (email) query.email = String(email).toLowerCase().trim();
    if (category && category !== 'all') query.subject = category;
    const messages = await Message.find(query).sort({ createdAt: -1 });
    const fixed = messages.map(m => {
      const obj = m.toObject();
      if (!Array.isArray(obj.replies)) obj.replies = [];
      if (!obj.status) obj.status = 'open';
      return obj;
    });
    const unreadCount = await Message.countDocuments({ isRead: false });
    res.status(200).json({ messages: fixed, unreadCount });
  } catch (error) {
    res.status(500).json({ error: 'Mesajlar yüklenemedi' });
  }
}

async function handlePut(req, res, admin) {
  try {
    const { id, isRead, reply, senderName, status } = req.body;
    if (!id) return res.status(400).json({ error: 'Mesaj ID gerekli' });
    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ error: 'Mesaj bulunamadı' });

    if (isRead !== undefined) message.isRead = !!isRead;
    if (status !== undefined && ['open', 'answered', 'closed'].includes(status)) message.status = status;

    if (reply !== undefined && String(reply).trim()) {
      if (String(reply).length > 5000) return res.status(400).json({ error: 'Yanıt çok uzun' });
      if (!Array.isArray(message.replies)) message.replies = [];
      message.replies.push({
        sender: 'admin',
        senderName: sanitize(admin.name || 'Admin'),
        text: sanitize(String(reply).trim()),
        createdAt: new Date(),
      });
      message.status = 'answered';
    }

    await message.save();
    res.status(200).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ error: 'Mesaj güncellenemedi' });
  }
}

async function handleDelete(req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Mesaj ID gerekli' });
    await Message.findByIdAndDelete(id);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Mesaj silinemedi' });
  }
}
