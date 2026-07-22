import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string' || code.trim().length < 3) {
      return res.status(400).json({ error: 'Geçerli bir sipariş veya kargo kodu girin' });
    }

    await dbConnect();

    const query = {
      $or: [
        { orderNumber: code.trim().toUpperCase() },
        { trackingNumber: code.trim().toUpperCase() },
        { trackingNumber: code.trim() },
      ],
    };

    const order = await Order.findOne(query)
      .select('orderNumber trackingNumber orderStatus paymentMethod totalAmount items createdAt updatedAt shippingCost')
      .populate('items.product', 'name images');

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
    const currentIdx = statusOrder.indexOf(order.orderStatus);
    const isCancelled = order.orderStatus === 'cancelled';

    const stepsWithStatus = steps.map((step, idx) => ({
      ...step,
      status: isCancelled ? 'cancelled' : idx < currentIdx ? 'done' : idx === currentIdx ? 'active' : 'waiting',
    }));

    res.status(200).json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        trackingNumber: order.trackingNumber || null,
        status: order.orderStatus,
        paymentMethod: order.paymentMethod,
        totalAmount: order.totalAmount,
        itemCount: order.items.length,
        items: order.items.map(i => ({ name: i.product?.name || i.name, quantity: i.quantity, price: i.price })),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
      steps: stepsWithStatus,
      isCancelled,
    });
  } catch (error) {
    console.error('Track error');
    res.status(500).json({ error: 'Kargo takip hatası oluştu' });
  }
}
