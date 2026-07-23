import { supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string' || code.trim().length < 3) {
      return res.status(400).json({ error: 'Geçerli bir sipariş veya kargo kodu girin' });
    }

    const trimmedCode = code.trim();

    let { data: order } = await supabase
      .from('orders')
      .select('*, order_items(*, products(name, images))')
      .eq('order_number', trimmedCode.toUpperCase())
      .single();

    if (!order) {
      const { data: order2 } = await supabase
        .from('orders')
        .select('*, order_items(*, products(name, images))')
        .eq('tracking_number', trimmedCode.toUpperCase())
        .single();
      order = order2;
    }
    if (!order) {
      const { data: order3 } = await supabase
        .from('orders')
        .select('*, order_items(*, products(name, images))')
        .eq('tracking_number', trimmedCode)
        .single();
      order = order3;
    }

    if (!order) {
      return res.status(404).json({ error: 'Sipariş bulunamadı. Kodu kontrol edin.' });
    }

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

    const items = (order.order_items || []).map(i => ({
      name: i.products?.name || i.name,
      quantity: i.quantity,
      price: i.price,
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
