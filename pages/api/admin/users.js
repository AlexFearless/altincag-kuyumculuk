import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { createLog } from '@/pages/api/admin/logs';
import { sanitize, validateEmail, validatePhone } from '@/lib/sanitize';

async function verifyAdminActive(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { data: admin } = await supabaseAdmin
      .from('admins')
      .select('id, is_active, email')
      .eq('id', decoded.id)
      .single();
    if (!admin || !admin.is_active) return null;
    return { id: decoded.id, email: admin.email };
  } catch {
    return null;
  }
}

function mapUser(u) {
  return {
    _id: u.id,
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    address: u.address,
    isActive: u.is_active,
    emailVerified: u.email_verified,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
  };
}

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Yetki gerekli' });
  }
  const adminData = await verifyAdminActive(authHeader.split(' ')[1]);
  if (!adminData) return res.status(401).json({ error: 'Geçersiz veya pasif hesap' });

  if (req.method === 'GET') {
    try {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, name, email, phone, address, is_active, email_verified, created_at, updated_at')
        .order('created_at', { ascending: false });

      res.status(200).json({ success: true, users: (users || []).map(mapUser), total: (users || []).length });
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
        updateData.password = await bcrypt.hash(String(password), 12);
      }
      if (isActive !== undefined) updateData.is_active = !!isActive;

      if (Object.keys(updateData).length === 0) return res.status(400).json({ error: 'Güncellenecek alan yok' });

      const { data: user, error } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select('id, name, email, phone, address, is_active, email_verified, created_at, updated_at')
        .single();

      if (error) {
        if (error.code === '23505') return res.status(400).json({ error: 'Bu e-posta adresi zaten kullanımda' });
        return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      }

      const action = isActive === false ? 'Kullanıcı pasifleştirildi' : 'Kullanıcı güncellendi';
      createLog({ action, adminEmail: adminData.email, targetType: 'user', targetId: id, details: { name: user.name, email: user.email }, req });

      res.status(200).json({ success: true, user: mapUser(user) });
    } catch (error) {
      res.status(500).json({ error: 'Kullanıcı güncellenemedi' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Kullanıcı ID gerekli' });

      const { data: user } = await supabaseAdmin
        .from('users')
        .select('name, email')
        .eq('id', id)
        .single();

      await supabaseAdmin.from('users').delete().eq('id', id);

      createLog({ action: 'Kullanıcı silindi', adminEmail: adminData.email, targetType: 'user', targetId: id, details: { name: user?.name, email: user?.email }, req });
      res.status(200).json({ success: true, message: 'Kullanıcı silindi' });
    } catch (error) {
      res.status(500).json({ error: 'Kullanıcı silinemedi' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
