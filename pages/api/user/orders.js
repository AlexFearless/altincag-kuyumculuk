import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Oturum açmanız gerekiyor' });
    }

    let email;
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
      const User = (await import('@/models/User')).default;
      await dbConnect();
      const user = await User.findById(decoded.id).select('email isActive');
      if (!user || user.isActive === false) {
        return res.status(401).json({ error: 'Hesap bulunamadı veya pasif' });
      }
      email = user.email;
    } catch {
      return res.status(401).json({ error: 'Geçersiz oturum' });
    }

    await dbConnect();
    const orders = await Order.find({ 'customerInfo.email': email })
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 });
    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ error: 'Siparişler yüklenemedi' });
  }
}
