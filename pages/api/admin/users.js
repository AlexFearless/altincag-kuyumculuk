import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Admin from '@/models/Admin';
import { createLog } from '@/pages/api/admin/logs';
import { sanitize } from '@/lib/sanitize';
import { validateEmail, validatePhone } from '@/lib/sanitize';

async function verifyAdminActive(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await dbConnect();
    const admin = await Admin.findById(decoded.id).select('isActive email');
    if (!admin || !admin.isActive) return null;
    return { id: decoded.id, email: admin.email };
  } catch { return null; }
}

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Yetki gerekli' });
  }
  const adminData = await verifyAdminActive(authHeader.split(' ')[1]);
  if (!adminData) return res.status(401).json({ error: 'Geçersiz veya pasif hesap' });

  await dbConnect();

  if (req.method === 'GET') {
    try {
      const users = await User.find({}).select('-password').sort({ createdAt: -1 });
      res.status(200).json({ success: true, users, total: users.length });
    } catch (error) {
      res.status(500).json({ error: 'Kullanıcılar yüklenemedi' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, name, email, phone, password, isActive } = req.body;
      if (!id) return res.status(400).json({ error: 'Kullanıcı ID gerekli' });

      const updateData = {};
      if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length < 2 || name.length > 100) {
          return res.status(400).json({ error: 'Geçersiz isim' });
        }
        updateData.name = sanitize(name.trim());
      }
      if (email !== undefined) {
        if (!validateEmail(email)) return res.status(400).json({ error: 'Geçersiz e-posta' });
        updateData.email = String(email).toLowerCase().trim();
      }
      if (phone !== undefined) {
        if (phone && !validatePhone(phone)) return res.status(400).json({ error: 'Geçersiz telefon' });
        updateData.phone = sanitize(String(phone));
      }
      if (password !== undefined && String(password).trim()) {
        if (String(password).length < 6) return res.status(400).json({ error: 'Şifre en az 6 karakter olmalı' });
        updateData.password = String(password);
      }
      if (isActive !== undefined) updateData.isActive = !!isActive;

      const user = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
      if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });

      const action = isActive === false ? 'Kullanıcı pasifleştirildi' : 'Kullanıcı güncellendi';
      createLog({ action, adminEmail: adminData.email, targetType: 'user', targetId: id, details: { name: user.name, email: user.email }, req });

      res.status(200).json({ success: true, user });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ error: 'Bu e-posta adresi zaten kullanımda' });
      }
      res.status(500).json({ error: 'Kullanıcı güncellenemedi' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Kullanıcı ID gerekli' });

      const user = await User.findById(id).select('-password');
      await User.findByIdAndDelete(id);

      createLog({ action: 'Kullanıcı silindi', adminEmail: adminData.email, targetType: 'user', targetId: id, details: { name: user?.name, email: user?.email }, req });

      res.status(200).json({ success: true, message: 'Kullanıcı silindi' });
    } catch (error) {
      res.status(500).json({ error: 'Kullanıcı silinemedi' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
