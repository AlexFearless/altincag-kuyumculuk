import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, error: 'Token gerekli' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    await dbConnect();
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) {
      return res.status(401).json({ success: false, error: 'Admin bulunamadı' });
    }

    if (!admin.isActive) {
      return res.status(403).json({ success: false, error: 'Hesabınız devre dışı' });
    }

    res.status(200).json({ success: true, admin: { id: admin._id, name: admin.name, email: admin.email } });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Geçersiz token' });
  }
}
