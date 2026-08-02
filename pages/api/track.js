import { getDb } from '@/lib/supabase';
import { rateLimit } from '@/lib/rateLimit';
import crypto from 'crypto';

const trackLimiter = rateLimit({ windowMs: 60000, max: 10, message: 'Çok fazla sorgu. 1 dakika bekleyin.' });

const TRACK_SECRET = process.env.TRACK_SECRET;

function generateTrackToken(orderId) {
  return crypto.createHmac('sha256', TRACK_SECRET).update(orderId).digest('hex').substring(0, 16);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await trackLimiter(req, res))) return;

  try {
    let db;
    try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı.' }); }

    const { code, token } = req.query;
    if (!code || typeof code !== 'string' || code.trim().length < 3) {
      return res.status(400).json({ error: 'Geçerli bir sipariş veya kargo kodu girin' });
    }

    const trimmedCode = code.trim().replace(/^#+/, '').toUpperCase();

    let { data: order } = await db
      .from('orders')
      .select('id, order_number, tracking_number, order_status, payment_method, total_amount, created_at, updated_at')
      .eq('order_number', trimmedCode)
      .single();

    if (!order) {
      const { data: order2 } = await db
        .from('orders')
        .select('id, order_number, tracking_number, order_status, payment_method, total_amount, created_at, updated_at')
        .eq('tracking_number', trimmedCode)
        .single();
      order = order2;
    }
    if (!order) {
      const { data: order3 } = await db
        .from('orders')
        .select('id, order_number, tracking_number, order_status, payment_method, total_amount, created_at, updated_at')
        .eq('tracking_number', code.trim().replace(/^#+/, ''))
        .single();
      order = order3;
    }

    if (!order) {
      return res.status(404).json({ error: 'Sipariş bulunamadı. Kodu kontrol edin.' });
    }

    if (TRACK_SECRET) {
      const expectedToken = generateTrackToken(order.id);
      if (!token || token !== expectedToken) {
        return res.status(200).json({ success: true, requiresToken: true });
      }
    }

    const { data: orderItems } = await db
      .from('order_items')
      .select('name, quantity, price')
      .eq('order_id', order.id);

    const steps = [
      { key: 'pending', label: 'Sipariş Alındı', icon: 'order' },
      { key: 'processing', label: 'Hazırlanıyor', icon: 'prepare' },
      { key: 'shipped', label: 'Kargoya Verildi', icon: 'cargo' },
      { key: 'delivered', label: 'Teslim Edildi', icon: 'delivered' },
    ];

    const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
    const currentIdx = statusOrder.indexOf(order.order_status);
    const isCancelled = order.order_status === 'cancelled';

    const stepsWithStatus = steps.map((step, idx) => ({
      ...step,
      status: isCancelled ? 'cancelled' : idx < currentIdx ? 'done' : idx === currentIdx ? 'active' : 'waiting',
    }));

    const items = (orderItems || []).map(i => ({
      name: i.name,
      price: i.price,
      quantity: i.quantity,
    }));

    res.status(200).json({
      success: true,
      order: {
        orderNumber: order.order_number,
        trackingNumber: order.tracking_number || null,
        status: order.order_status,
        paymentMethod: order.payment_method,
        totalAmount: order.total_amount,
        itemCount: items.length,
        items,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
      },
      steps: stepsWithStatus,
      isCancelled,
    });
  } catch (error) {
    console.error('Track error:', error);
    res.status(500).json({ error: 'Kargo takip hatası oluştu' });
  }
}
