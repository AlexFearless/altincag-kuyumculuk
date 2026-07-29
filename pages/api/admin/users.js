import jwt from 'jsonwebtoken';
import { getDb } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { createLog } from '@/pages/api/admin/logs';
import { sanitize, validateEmail, validatePhone } from '@/lib/sanitize';
import { getJwtSecret } from '@/lib/secrets';
import { rateLimit } from '@/lib/rateLimit';
import { parseCookies, getTokenFromRequest } from '@/lib/cookieUtils';
import { revokeAllUserTokens } from '@/lib/auth';

const adminLimiter = rateLimit({ windowMs: 60000, max: 60, message: 'Çok fazla istek. 1 dakika bekleyin.' });

async function verifyAdminActive(db, token) {
  try {
    const JWT_SECRET = getJwtSecret();
    const decoded = jwt.verify(token, JWT_SECRET);
    const { data: admin } = await db
      .from('admins')
      .select('id, is_active, email, role')
      .eq('id', decoded.id)
      .single();
    if (!admin || !admin.is_active) return null;
    return { id: decoded.id, email: admin.email, role: admin.role };
  } catch {
    return null;
  }
}

function mapUser(u) {
  return {
    _id: u.id, id: u.id, name: u.name, email: u.email, phone: u.phone,
    address: u.address, isActive: u.is_active, emailVerified: u.email_verified,
    createdAt: u.created_at, updatedAt: u.updated_at,
  };
}

export default async function handler(req, res) {
  if (!(await adminLimiter(req, res))) return;

  let db;
  try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı.' }); }

  const token = getTokenFromRequest(req);
  if (!token) return res.status(401).json({ error: 'Yetki gerekli' });
  const adminData = await verifyAdminActive(db, token);
  if (!adminData) return res.status(401).json({ error: 'Geçersiz veya pasif hesap' });
  if (!adminData.role || !['super_admin', 'admin', 'superadmin'].includes(adminData.role)) {
    return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
  }

  if (req.method === 'GET') {
    try {
      const { data: users } = await db
        .from('users')
        .select('id, name, email, phone, address, is_active, email_verified, created_at, updated_at')
        .order('created_at', { ascending: false });
      res.status(200).json({ success: true, users: (users || []).map(mapUser), total: (users || []).length });
    } catch {
      res.status(500).json({ error: 'Kullanıcılar yüklenemedi' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, name, email, phone, password, isActive } = req.body;
      if (!id) return res.status(400).json({ error: 'Kullanıcı ID gerekli' });

      const updateData = {};
      if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length < 2 || name.length > 100) return res.status(400).json({ error: 'Geçersiz isim' });
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
        if (!req.body.currentPassword) return res.status(400).json({ error: 'Mevcut şifrenizi girmeniz gerekli' });
        const { data: targetUser } = await db.from('users').select('password').eq('id', id).single();
        if (!targetUser) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        const currentMatch = await bcrypt.compare(String(req.body.currentPassword), targetUser.password);
        if (!currentMatch) return res.status(403).json({ error: 'Mevcut şifre hatalı' });
        if (String(password).length < 8) return res.status(400).json({ error: 'Şifre en az 8 karakter olmalı' });
        if (!/[A-Z]/.test(String(password)) || !/[a-z]/.test(String(password)) || !/[0-9]/.test(String(password))) {
          return res.status(400).json({ error: 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir' });
        }
        updateData.password = await bcrypt.hash(String(password), 14);
      }
      if (isActive !== undefined) updateData.is_active = !!isActive;

      if (Object.keys(updateData).length === 0) return res.status(400).json({ error: 'Güncellenecek alan yok' });

      const { data: user, error } = await db.from('users').update(updateData).eq('id', id)
        .select('id, name, email, phone, address, is_active, email_verified, created_at, updated_at').single();
      if (error) {
        if (error.code === '23505') return res.status(400).json({ error: 'Bu e-posta adresi zaten kullanımda' });
        return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      }

      createLog(db, { action: isActive === false ? 'Kullanıcı pasifleştirildi' : 'Kullanıcı güncellendi', adminEmail: adminData.email, targetType: 'user', targetId: id, details: { name: user.name, email: user.email }, req });
      if (updateData.password) await revokeAllUserTokens(id, 'user').catch(() => {});
      res.status(200).json({ success: true, user: mapUser(user) });
    } catch {
      res.status(500).json({ error: 'Kullanıcı güncellenemedi' });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, email, password, phone } = req.body;
      if (!name || !email || !password) return res.status(400).json({ error: 'Ad, e-posta ve şifre zorunludur' });
      if (typeof name !== 'string' || name.trim().length < 2 || name.length > 100) return res.status(400).json({ error: 'Geçersiz isim' });
      if (!validateEmail(email)) return res.status(400).json({ error: 'Geçersiz e-posta' });
      if (typeof password !== 'string' || password.length < 8) return res.status(400).json({ error: 'Şifre en az 8 karakter olmalı' });
      if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) return res.status(400).json({ error: 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir' });
      if (phone && !validatePhone(phone)) return res.status(400).json({ error: 'Geçersiz telefon' });

      const cleanEmail = email.toLowerCase().trim();
      const { data: existing } = await db.from('users').select('id').eq('email', cleanEmail).single();
      if (existing) return res.status(409).json({ error: 'Bu e-posta adresi zaten kayıtlı' });

      const hashedPassword = await bcrypt.hash(password, 14);
      const { data: user, error: insertError } = await db
        .from('users')
        .insert({ name: sanitize(name.trim()), email: cleanEmail, password: hashedPassword, phone: sanitize(phone || ''), is_active: true, email_verified: true })
        .select('id, name, email, phone, address, is_active, email_verified, created_at, updated_at').single();
      if (insertError) {
        if (insertError.code === '23505') return res.status(409).json({ error: 'Bu e-posta adresi zaten kayıtlı' });
        throw insertError;
      }
      createLog(db, { action: 'Kullanıcı oluşturuldu', adminEmail: adminData.email, targetType: 'user', targetId: user.id, details: { name: user.name, email: user.email }, req });
      res.status(201).json({ success: true, user: mapUser(user) });
    } catch {
      res.status(500).json({ error: 'Kullanıcı oluşturulamadı' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Kullanıcı ID gerekli' });
      const { data: user } = await db.from('users').select('name, email').eq('id', id).single();
      await db.from('users').delete().eq('id', id);
      createLog(db, { action: 'Kullanıcı silindi', adminEmail: adminData.email, targetType: 'user', targetId: id, details: { name: user?.name, email: user?.email }, req });
      res.status(200).json({ success: true, message: 'Kullanıcı silindi' });
    } catch {
      res.status(500).json({ error: 'Kullanıcı silinemedi' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
