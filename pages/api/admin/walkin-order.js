import { getDb } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { createLog } from '@/pages/api/admin/logs';
import { sanitize } from '@/lib/sanitize';

function generateOrderNumber() {
  const now = new Date();
  const y = String(now.getFullYear()).slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const r = String(Math.floor(1000 + Math.random() * 9000));
  return `AC${y}${m}${d}${r}`;
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let db;
  try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı' }); }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Yetki gerekli' });
  }

  try {
    const { customerName, customerPhone, items, paymentMethod, notes } = req.body;

    if (!customerName || !items || items.length === 0) {
      return res.status(400).json({ error: 'Müşteri adı ve en az bir ürün gerekli' });
    }

    let subtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      if (!item.productId) continue;
      const { data: dbProduct } = await db.from('products').select('*').eq('id', item.productId).single();
      if (!dbProduct || !dbProduct.is_active) {
        return res.status(400).json({ error: `Ürün bulunamadı: ${item.name || item.productId}` });
      }
      const qty = Math.min(Math.max(Number(item.quantity) || 1, 1), 100);
      if (dbProduct.stock < qty) {
        return res.status(400).json({ error: `"${dbProduct.name}" stokta yetersiz (mevcut: ${dbProduct.stock})` });
      }

      let price = dbProduct.discount_type === 'real' && dbProduct.discounted_price > 0
        ? dbProduct.discounted_price
        : dbProduct.price;

      subtotal += price * qty;
      verifiedItems.push({
        product_id: dbProduct.id,
        name: dbProduct.name,
        price,
        quantity: qty,
        image: dbProduct.images?.[0] || '',
      });
    }

    if (verifiedItems.length === 0) {
      return res.status(400).json({ error: 'Geçerli ürün bulunamadı' });
    }

    const totalAmount = subtotal;
    const orderNumber = generateOrderNumber();

    const { data: order, error: orderError } = await db
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_first_name: sanitize(String(customerName).trim()),
        customer_last_name: '',
        customer_email: '',
        customer_phone: sanitize(String(customerPhone || '')),
        customer_address: 'Mağaza İçi Satış',
        customer_city: 'İstanbul',
        customer_district: '',
        special_instructions: sanitize(String(notes || '')),
        subtotal,
        shipping_cost: 0,
        total_amount: totalAmount,
        payment_method: ['nakit', 'kredi_karti', 'havale'].includes(paymentMethod) ? paymentMethod : 'nakit',
        is_walkin: true,
        walkin_notes: sanitize(String(notes || '')),
        order_status: 'delivered',
        payment_status: 'paid',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    const orderItems = verifiedItems.map(vi => ({
      order_id: order.id,
      product_id: vi.product_id,
      name: vi.name,
      price: vi.price,
      quantity: vi.quantity,
      image: vi.image,
    }));

    await db.from('order_items').insert(orderItems);

    for (const vi of verifiedItems) {
      const { data: p } = await db.from('products').select('stock, name').eq('id', vi.product_id).single();
      if (p) {
        const newStock = Math.max(0, p.stock - vi.quantity);
        await db.from('products').update({ stock: newStock }).eq('id', vi.product_id);
      }
    }

    createLog(db, {
      action: 'Mağaza içi satış oluşturuldu',
      adminEmail: req.admin?.email || 'admin',
      targetType: 'order',
      targetId: order.id,
      details: { orderNumber, totalAmount, customerName, itemCount: verifiedItems.length },
      req,
    });

    res.status(201).json({
      success: true,
      order: { orderNumber: order.order_number, totalAmount: order.total_amount },
    });
  } catch (error) {
    console.error('Walk-in order error:', error);
    res.status(500).json({ error: 'Sipariş oluşturulurken hata oluştu' });
  }
}

export default withAuth(handler);
