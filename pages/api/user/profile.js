import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { sanitize, validateEmail, validatePhone } from '@/lib/sanitize';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Oturum açmanız gerekiyor' });
      }
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      await dbConnect();
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      if (user.isActive === false) return res.status(403).json({ error: 'Hesabınız devre dışı' });
      return res.status(200).json({
        success: true,
        user: { id: user._id, name: user.name, email: user.email, phone: user.phone, address: user.address },
      });
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Geçersiz oturum' });
      }
      return res.status(500).json({ error: 'Doğrulama hatası' });
    }
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Oturum açmanız gerekiyor' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await dbConnect();

    const { name, phone, email, address } = req.body;
    const updateData = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2 || name.length > 100) {
        return res.status(400).json({ error: 'Geçersiz isim' });
      }
      updateData.name = sanitize(name.trim());
    }
    if (phone !== undefined) {
      if (phone && !validatePhone(phone)) {
        return res.status(400).json({ error: 'Geçersiz telefon numarası' });
      }
      updateData.phone = sanitize(String(phone));
    }
    if (email !== undefined) {
      if (!validateEmail(email)) {
        return res.status(400).json({ error: 'Geçersiz e-posta adresi' });
      }
      updateData.email = String(email).toLowerCase().trim();
    }
    if (address !== undefined) updateData.address = sanitize(String(address || ''));

    const user = await User.findByIdAndUpdate(decoded.id, { $set: updateData }, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });

    res.status(200).json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, address: user.address },
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Geçersiz oturum' });
    if (error.code === 11000) return res.status(400).json({ error: 'Bu e-posta adresi zaten kullanımda' });
    res.status(500).json({ error: 'Profil güncellenirken hata oluştu' });
  }
}
