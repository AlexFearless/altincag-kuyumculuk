import { getDb } from '@/lib/supabase';
import { sanitize } from '@/lib/sanitize';
import { rateLimit } from '@/lib/rateLimit';
import { sendOrderStatusEmail } from '@/lib/orderEmails';

const orderLimiter = rateLimit({ windowMs: 60000, max: 5, message: 'Çok fazla sipariş denemesi. 1 dakika bekleyin.' });

function generateOrderNumber() {
  const now = new Date();
  const y = String(now.getFullYear()).slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const r = String(Math.floor(1000 + Math.random() * 9000));
  return `AC${y}${m}${d}${r}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!orderLimiter(req, res)) return;

  try {
    let db;
    try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyin.' }); }

    const { guestId, userId, customerInfo, specialInstructions, items, paymentMethod, couponCode, discountAmount } = req.body;

    if (!customerInfo || !items || items.length === 0) {
      return res.status(400).json({ error: 'Sipariş bilgileri eksik' });
    }
    if (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.email || !customerInfo.phone || !customerInfo.address) {
      return res.status(400).json({ error: 'Müşteri bilgileri eksik' });
    }
    if (typeof customerInfo.firstName !== 'string' || typeof customerInfo.lastName !== 'string') {
      return res.status(400).json({ error: 'Geçersiz müşteri bilgisi' });
    }
    if (customerInfo.firstName.length > 50 || customerInfo.lastName.length > 50) {
      return res.status(400).json({ error: 'İsim çok uzun' });
    }
    if (customerInfo.address.length > 500) {
      return res.status(400).json({ error: 'Adres çok uzun' });
    }
    if (items.length > 50) {
      return res.status(400).json({ error: 'Tek seferde en fazla 50 ürün sipariş edebilirsiniz' });
    }

    let subtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      if (!item.product) continue;
      const { data: dbProduct } = await db.from('products').select('*').eq('id', item.product).single();
      if (!dbProduct || !dbProduct.is_active) {
        return res.status(400).json({ error: `Ürün bulunamadı veya pasif: ${item.name || item.product}` });
      }
      const qty = Math.min(Math.max(Number(item.quantity) || 1, 1), 100);
      if (dbProduct.stock < qty) {
        return res.status(400).json({ error: `"${dbProduct.name}" stokta yetersiz (mevcut: ${dbProduct.stock})` });
      }
      const price = dbProduct.discount_type === 'real' && dbProduct.discounted_price > 0
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

    const shippingCost = 0;
    const totalAmount = Math.max(0, subtotal + shippingCost - (Number(discountAmount) || 0));
    const orderNumber = generateOrderNumber();

    const { data: order, error: orderError } = await db
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_first_name: sanitize(String(customerInfo.firstName).trim()),
        customer_last_name: sanitize(String(customerInfo.lastName).trim()),
        customer_email: String(customerInfo.email).toLowerCase().trim(),
        customer_phone: sanitize(String(customerInfo.phone)),
        customer_address: sanitize(String(customerInfo.address)),
        customer_city: sanitize(String(customerInfo.city || 'İstanbul')),
        customer_district: sanitize(String(customerInfo.district || '')),
        customer_zip_code: customerInfo.zipCode || '',
        special_instructions: sanitize(String(specialInstructions || '').substring(0, 500)),
        subtotal,
        shipping_cost: shippingCost,
        discount_amount: Number(discountAmount) || 0,
        coupon_code: sanitize(String(couponCode || '')),
        total_amount: totalAmount,
        payment_method: ['paytr', 'havale', 'kapida'].includes(paymentMethod) ? paymentMethod : 'paytr',
        guest_id: String(guestId || ''),
        ip_address: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || '',
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
        if (newStock <= 3) {
          await db.from('notifications').insert({
            type: 'low_stock',
            title: 'Düşük Stok Uyarısı',
            message: `${p.name} ürününün stokunda ${newStock} adet kaldı`,
            is_read: false,
            target_id: vi.product_id,
          });
        }
      }
    }

    if (couponCode && discountAmount > 0) {
      const { data: coupon } = await db.from('coupons').select('id, used_count').ilike('code', couponCode).single();
      if (coupon) {
        await db.from('coupons').update({ used_count: (coupon.used_count || 0) + 1 }).eq('id', coupon.id);
      }
    }

    if (guestId) {
      const { data: cart } = await db.from('carts').select('id').eq('guest_id', String(guestId)).single();
      if (cart) {
        await db.from('cart_items').delete().eq('cart_id', cart.id);
        await db.from('carts').delete().eq('id', cart.id);
      }
    }

    sendOrderStatusEmail(order, 'pending').catch(() => {});

    res.status(201).json({
      success: true,
      order: { orderNumber: order.order_number, totalAmount: order.total_amount },
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Sipariş oluşturulurken hata oluştu' });
  }
}
