import jwt from 'jsonwebtoken';
import dbConnect from './mongodb';
import Admin from '@/models/Admin';

const JWT_SECRET = process.env.JWT_SECRET;

export function generateToken(adminId) {
  return jwt.sign({ id: adminId }, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function getAdminFromToken(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return null;
  }

  await dbConnect();
  const admin = await Admin.findById(decoded.id).select('-password');

  if (!admin || !admin.isActive) {
    return null;
  }

  return admin;
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
