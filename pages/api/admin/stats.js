import { withAdminRole } from '@/lib/auth';
import { getDb } from '@/lib/supabase';
import { rateLimit } from '@/lib/rateLimit';

const adminLimiter = rateLimit({ windowMs: 60000, max: 60, message: 'Çok fazla istek. 1 dakika bekleyin.' });

async function handler(req, res) {
  if (!(await adminLimiter(req, res))) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = getDb();

    const [productsResult, ordersResult, usersResult, messagesResult, topSellingResult, costResult] = await Promise.allSettled([
      db.from('products').select('id, name, stock, is_active', { count: 'exact' }),
      db.from('orders').select('id, order_number, total_amount, subtotal, discount_amount, order_status, created_at, payment_status', { count: 'exact' }),
      db.from('users').select('id', { count: 'exact' }),
      db.from('messages').select('id, is_read', { count: 'exact' }),
      db.from('order_items').select('product_id, name, quantity, price, order_id, orders(subtotal, discount_amount)').limit(500),
      db.from('order_items').select('product_id, quantity, price, products(cost_price)').limit(1000),
    ]);

    const products = productsResult.status === 'fulfilled' ? productsResult.value : { data: [], count: 0 };
    const orders = ordersResult.status === 'fulfilled' ? ordersResult.value : { data: [], count: 0 };
    const users = usersResult.status === 'fulfilled' ? usersResult.value : { data: [], count: 0 };
    const messages = messagesResult.status === 'fulfilled' ? messagesResult.value : { data: [], count: 0 };
    const orderItems = topSellingResult.status === 'fulfilled' ? topSellingResult.value : { data: [] };

    const allProducts = products.data || [];
    const allOrders = orders.data || [];
    const allOrderItems = orderItems.data || [];
    const costItems = costResult.status === 'fulfilled' ? costResult.value : { data: [] };

    const revenue = allOrders
      .filter(o => o.payment_status === 'odendi' || o.payment_status === 'paid')
      .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

    let totalCost = 0;
    (costItems.data || []).forEach(item => {
      if (item.products?.cost_price) {
        totalCost += (Number(item.products.cost_price) || 0) * (item.quantity || 0);
      }
    });
    const totalProfit = revenue - totalCost;

    const lowStockProducts = allProducts
      .filter(p => p.stock === 0 && p.is_active)
      .map(p => ({ id: p.id, name: p.name, stock: p.stock }));

    const unreadMessages = (messages.data || []).filter(m => !m.is_read).length;

    const orderDiscountMap = {};
    allOrderItems.forEach(item => {
      const oid = item.order_id;
      if (!oid) return;
      if (!orderDiscountMap[oid]) {
        orderDiscountMap[oid] = { subtotal: Number(item.orders?.subtotal) || 0, discount: Number(item.orders?.discount_amount) || 0 };
      }
    });

    const productSales = {};
    allOrderItems.forEach(item => {
      const pid = item.product_id;
      if (!pid) return;
      if (!productSales[pid]) {
        productSales[pid] = {
          id: pid,
          name: item.products?.name || item.name,
          image: item.products?.images?.[0] || null,
          costPrice: Number(item.products?.cost_price) || 0,
          totalQuantity: 0,
          totalRevenue: 0,
        };
      }
      const qty = item.quantity || 0;
      const itemTotal = (Number(item.price) || 0) * qty;
      const orderInfo = orderDiscountMap[item.order_id];
      let discountedItemTotal = itemTotal;
      if (orderInfo && orderInfo.subtotal > 0 && orderInfo.discount > 0) {
        const proportion = itemTotal / orderInfo.subtotal;
        discountedItemTotal = itemTotal - (orderInfo.discount * proportion);
      }
      productSales[pid].totalQuantity += qty;
      productSales[pid].totalRevenue += discountedItemTotal;
    });

    const topSellingProducts = Object.values(productSales)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10)
      .map(p => ({
        ...p,
        totalCost: p.costPrice * p.totalQuantity,
        totalProfit: p.totalRevenue - (p.costPrice * p.totalQuantity),
      }));

    res.status(200).json({
      products: products.count || 0,
      orders: orders.count || 0,
      revenue,
      totalCost,
      totalProfit,
      users: users.count || 0,
      unreadMessages,
      lowStockProducts,
      topSellingProducts,
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'İstatistikler yüklenemedi' });
  }
}

export default withAdminRole()(handler);
