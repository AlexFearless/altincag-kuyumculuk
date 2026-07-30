import { getDb } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/secrets';
import { parseCookies } from '@/lib/cookieUtils';
import { rateLimit } from '@/lib/rateLimit';
import { isTokenBlacklisted } from '@/lib/auth';

const ordersLimiter = rateLimit({ windowMs: 60000, max: 20, message: 'Çok fazla istek. 1 dakika bekleyin.' });

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!(await ordersLimiter(req, res))) return;

  let db;
  try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'DB error' }); }

  const JWT_SECRET = getJwtSecret();
  const token = (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null) || parseCookies(req).access_token;
  if (!token) return res.status(401).json({ error: 'Oturum açmanız gerekiyor' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });

    if (decoded.jti && await isTokenBlacklisted(decoded.jti)) {
      return res.status(401).json({ error: 'Oturum açmanız gerekiyor' });
    }

    const { data: user } = await db.from('users').select('id, email, name, is_active').eq('id', decoded.id).single();
    if (!user) return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
    if (!user.is_active) return res.status(403).json({ error: 'Hesabınız devre dışı' });

    const email = user.email;
    const { data: emailOrders } = await db.from('orders').select('*').eq('customer_email', email).order('created_at', { ascending: false });
    const { data: userIdOrders } = await db.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });

    const ordersMap = new Map();
    for (const o of [...(emailOrders || []), ...(userIdOrders || [])]) {
      ordersMap.set(o.id, o);
    }
    const orders = Array.from(ordersMap.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    for (const o of orders) {
      const { data: items } = await db.from('order_items').select('*, products(name, images)').eq('order_id', o.id);
      o.order_items = items || [];
    }

    const mapped = orders.map(o => ({
      _id: o.id, id: o.id, orderNumber: o.order_number,
      customerInfo: { firstName: o.customer_first_name, lastName: o.customer_last_name, email: o.customer_email, phone: o.customer_phone, address: o.customer_address, city: o.customer_city, district: o.customer_district },
      items: (o.order_items || []).map(oi => ({ _id: oi.id, product: oi.products ? { name: oi.products.name, images: oi.products.images } : { name: oi.name }, name: oi.name, price: oi.price, quantity: oi.quantity })),
      subtotal: o.subtotal, shippingCost: o.shipping_cost, discountAmount: o.discount_amount || 0, couponCode: o.coupon_code || '',
      totalAmount: o.total_amount, paymentMethod: o.payment_method, paymentStatus: o.payment_status, orderStatus: o.order_status,
      trackingNumber: o.tracking_number, specialInstructions: o.special_instructions, createdAt: o.created_at, updatedAt: o.updated_at,
    }));

    res.status(200).json({ orders: mapped });
  } catch {
    res.status(500).json({ error: 'Siparişler yüklenemedi' });
  }
}
