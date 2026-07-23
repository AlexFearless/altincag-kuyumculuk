import jwt from 'jsonwebtoken';
import { supabaseAdmin } from './supabase';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET;

export function generateToken(adminId) {
  return jwt.sign({ id: adminId }, JWT_SECRET, { expiresIn: '5y' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function getAdminFromToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) return null;

  const { data: admin } = await supabaseAdmin
    .from('admins')
    .select('id, email, name, role, is_active')
    .eq('id', decoded.id)
    .single();

  if (!admin || !admin.is_active) return null;

  return {
    _id: admin.id,
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    isActive: admin.is_active,
  };
}

export function withAuth(handler) {
  return async (req, res) => {
    const admin = await getAdminFromToken(req);
    if (!admin) {
      return res.status(401).json({ error: 'Yetkilendirme başarısız' });
    }
    req.admin = admin;
    return handler(req, res);
  };
}
