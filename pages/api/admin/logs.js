import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Log from '@/models/Log';
import Admin from '@/models/Admin';

async function verifyAdminActive(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await dbConnect();
    const admin = await Admin.findById(decoded.id).select('isActive');
    if (!admin || !admin.isActive) return null;
    return decoded;
  } catch { return null; }
}

export async function createLog({ action, adminEmail, targetType, targetId, details, req }) {
  try {
    await dbConnect();
    const ip = req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || req?.socket?.remoteAddress || '';
    await Log.create({ action, adminEmail, targetType, targetId, details, ip });
  } catch (e) {
    console.error('Log creation error');
  }
}

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Yetki gerekli' });
  }
  const decoded = await verifyAdminActive(authHeader.split(' ')[1]);
  if (!decoded) return res.status(401).json({ error: 'Geçersiz veya pasif hesap' });

  await dbConnect();

  if (req.method === 'GET') {
    try {
      const { page = 1, limit = 50 } = req.query;
      const safeLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
      const skip = (Math.max(parseInt(page) || 1, 1) - 1) * safeLimit;
      const logs = await Log.find({}).sort({ createdAt: -1 }).skip(skip).limit(safeLimit);
      const total = await Log.countDocuments({});
      res.status(200).json({ logs, total, page: parseInt(page), pages: Math.ceil(total / safeLimit) });
    } catch (error) {
      res.status(500).json({ error: 'Loglar yüklenemedi' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
