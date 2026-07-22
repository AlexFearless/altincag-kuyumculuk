import dbConnect from '@/lib/mongodb';
import Message from '@/models/Message';
import jwt from 'jsonwebtoken';
import { sanitize } from '@/lib/sanitize';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Oturum açmanız gerekiyor' });
    }

    let userEmail;
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
      const User = (await import('@/models/User')).default;
      const user = await User.findById(decoded.id).select('email isActive');
      if (!user || user.isActive === false) {
        return res.status(401).json({ error: 'Hesap bulunamadı veya pasif' });
      }
      userEmail = user.email;
    } catch {
      return res.status(401).json({ error: 'Geçersiz oturum' });
    }

    if (req.method === 'GET') {
      const messages = await Message.find({ email: userEmail }).sort({ createdAt: -1 });
      const fixed = messages.map(m => {
        const obj = m.toObject();
        if (!Array.isArray(obj.replies)) obj.replies = [];
        if (!obj.status) obj.status = 'open';
        return obj;
      });
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

      const message = await Message.findById(id);
      if (!message) return res.status(404).json({ error: 'Mesaj bulunamadı' });

      if (userEmail !== message.email) {
        return res.status(403).json({ error: 'Bu mesaja yanıt verme yetkiniz yok' });
      }

      if (!Array.isArray(message.replies)) message.replies = [];
      message.replies.push({
        sender: 'user',
        senderName: sanitize(senderName || message.name),
        text: sanitize(String(reply).trim()),
        createdAt: new Date(),
      });
      message.status = 'open';
      await message.save();

      return res.status(200).json({ success: true, message });
    }
  } catch (error) {
    res.status(500).json({ error: 'İşlem başarısız' });
  }
}
