import { getDb } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let db;
    try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyin.' }); }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Oturum açmanız gerekiyor' });
    }

    let email;
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'altincag_jwt_secret_2024_very_long_and_secure_key_here');
      const { data: user } = await db
        .from('users')
        .select('email, is_active')
        .eq('id', decoded.id)
        .single();
      if (!user || !user.is_active) {
        return res.status(401).json({ error: 'Hesap bulunamadı veya pasif' });
      }
      email = user.email;
    } catch {
      return res.status(401).json({ error: 'Geçersiz oturum' });
    }

    const { data: orders } = await db
      .from('orders')
      .select('*, order_items(*, products(name, images))')
      .eq('customer_email', email)
      .order('created_at', { ascending: false });

    const mapped = (orders || []).map(o => ({
      _id: o.id,
      id: o.id,
      orderNumber: o.order_number,
      customerInfo: {
        firstName: o.customer_first_name,
        lastName: o.customer_last_name,
        email: o.customer_email,
        phone: o.customer_phone,
        address: o.customer_address,
        city: o.customer_city,
        district: o.customer_district,
      },
      items: (o.order_items || []).map(oi => ({
        _id: oi.id,
        product: oi.products ? { name: oi.products.name, images: oi.products.images } : { name: oi.name },
        name: oi.name,
        price: oi.price,
        quantity: oi.quantity,
      })),
      subtotal: o.subtotal,
      shippingCost: o.shipping_cost,
      totalAmount: o.total_amount,
      paymentMethod: o.payment_method,
      paymentStatus: o.payment_status,
      orderStatus: o.order_status,
      trackingNumber: o.tracking_number,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
    }));

    res.status(200).json({ orders: mapped });
  } catch (error) {
    console.error('User orders error:', error);
    res.status(500).json({ error: 'Siparişler yüklenemedi' });
  }
}
