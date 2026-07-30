import { getDb } from '@/lib/supabase';
import { sanitize, validateEmail } from '@/lib/sanitize';
import { rateLimit } from '@/lib/rateLimit';
import { sendOrderStatusEmail } from '@/lib/orderEmails';
import { applyCampaignDiscounts } from '@/lib/campaignDiscounts';
import crypto from 'crypto';
import { getClientIp } from '@/lib/getClientIp';

const orderLimiter = rateLimit({ windowMs: 60000, max: 5, message: 'Çok fazla sipariş denemesi. 1 dakika bekleyin.' });

function generateOrderNumber() {
  const now = new Date();
  const y = String(now.getFullYear()).slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const r = String(crypto.randomInt(10000, 99999));
  return `AC${y}${m}${d}${r}`;
}

async function retryStockDecrement(db, productId, quantity, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const { data: p, error: readErr } = await db
      .from('products').select('stock, name').eq('id', productId).single();
    if (readErr || !p) return { ok: false, error: 'ürün bulunamadı' };
    if (p.stock < quantity) return { ok: false, error: `stok yetersiz (mevcut: ${p.stock})`, name: p.name };

    const newStock = p.stock - quantity;
    const { data: updated, error: updateErr } = await db
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId)
      .eq('stock', p.stock)
      .select('stock');
    if (updateErr) return { ok: false, error: updateErr.message };
    if (updated && updated.length > 0) return { ok: true, newStock, name: p.name };
  }
  return { ok: false, error: 'stok güncellenemedi (eşzamanlı erişim)' };
}

async function retryCouponIncrement(db, couponId, currentCount, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const { data: c, error: readErr } = await db
      .from('coupons').select('used_count, max_uses').eq('id', couponId).single();
    if (readErr || !c) return { ok: false };
    const count = c.used_count || 0;
    if (c.max_uses && count >= c.max_uses) return { ok: false, exceeded: true };

    const { data: updated, error } = await db
      .from('coupons')
      .update({ used_count: count + 1 })
      .eq('id', couponId)
      .eq('used_count', count)
      .select('used_count');
    if (error) return { ok: false };
    if (updated && updated.length > 0) return { ok: true, newCount: count + 1 };
  }
  return { ok: false };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await orderLimiter(req, res))) return;

  let step = 'init';
  try {
    let db;
    try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı.' }); }

    step = 'validate';
    const { guestId, userId, customerInfo, specialInstructions, items, paymentMethod, couponCode } = req.body;

    let validUserId = null;
    if (userId && typeof userId === 'string') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(userId)) {
        const { data: userExists } = await db.from('users').select('id').eq('id', userId).single();
        if (userExists) validUserId = userId;
      }
    }

    if (!customerInfo || !items || items.length === 0) {
      return res.status(400).json({ error: 'Sipariş bilgileri eksik' });
    }
    if (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.email || !customerInfo.phone || !customerInfo.address) {
      return res.status(400).json({ error: 'Müşteri bilgileri eksik (ad, soyad, e-posta, telefon, adres zorunlu)' });
    }
    if (!validateEmail(customerInfo.email)) {
      return res.status(400).json({ error: 'Geçersiz e-posta adresi' });
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

    step = 'verify_products';
    let subtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      if (!item.product) continue;
      const { data: dbProduct, error: prodErr } = await db.from('products').select('*').eq('id', item.product).single();
      if (prodErr || !dbProduct || !dbProduct.is_active) {
        return res.status(400).json({ error: `Ürün bulunamadı veya pasif: ${item.name || item.product}` });
      }
      const qty = Math.min(Math.max(Number(item.quantity) || 1, 1), 100);
      if (dbProduct.stock < qty) {
        return res.status(400).json({ error: `"${dbProduct.name}" stokta yetersiz (mevcut: ${dbProduct.stock})` });
      }

      let price = dbProduct.discount_type === 'real' && dbProduct.discounted_price > 0
        ? dbProduct.discounted_price
        : dbProduct.price;

      const [discountedProduct] = await applyCampaignDiscounts(db, [{
        ...dbProduct,
        _id: dbProduct.id,
        discountedPrice: dbProduct.discounted_price,
        discountType: dbProduct.discount_type,
        discountPercent: dbProduct.discount_percent,
      }]);
      if (discountedProduct && discountedProduct.campaignDiscount > 0) {
        price = discountedProduct.discountedPrice;
      }

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

    step = 'calculate_discount';
    const shippingCost = 0;
    let discountAmount = 0;
    let couponId = null;
    let couponUsedCount = 0;
    let couponMaxUses = null;

    if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
      try {
        const { data: coupon } = await db
          .from('coupons')
          .select('*')
          .eq('code', couponCode.trim().toUpperCase())
          .eq('is_active', true)
          .single();

        if (coupon) {
          const now = new Date();
          const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null;
          const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

          if ((!validFrom || now >= validFrom) && (!validUntil || now <= validUntil)) {
            if (!coupon.min_order_amount || subtotal >= coupon.min_order_amount) {
              if (coupon.discount_type === 'percent') {
                discountAmount = Math.min(subtotal * (coupon.discount_value / 100), coupon.max_discount || Infinity);
              } else {
                discountAmount = Math.min(coupon.discount_value, subtotal);
              }
              couponId = coupon.id;
              couponUsedCount = coupon.used_count || 0;
              couponMaxUses = coupon.max_uses;
            }
          }
        }
      } catch (e) {}
    }

    step = 'generate_order_number';
    const totalAmount = Math.max(0, subtotal + shippingCost - discountAmount);
    let orderNumber;
    let attempts = 0;
    do {
      orderNumber = generateOrderNumber();
      const { data: existing } = await db.from('orders').select('id').eq('order_number', orderNumber).single();
      if (!existing) break;
      attempts++;
    } while (attempts < 5);

    step = 'insert_order';
    const orderData = {
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
      payment_method: 'havale',
      payment_status: 'havale_bekliyor',
      order_status: 'pending',
      guest_id: String(guestId || ''),
      user_id: validUserId,
      ip_address: getClientIp(req),
    };

    let orderInsert = await db.from('orders').insert(orderData).select().single();

    if (orderInsert.error) {
      const err = orderInsert.error;
      console.error('Order insert error:', err.code);

      if (err.code === '23514' || err.code === '23503') {
        delete orderData.discount_amount;
        delete orderData.coupon_code;
        orderData.total_amount = totalAmount;
        orderData.user_id = null;
        orderInsert = await db.from('orders').insert(orderData).select().single();
        if (orderInsert.error) {
          console.error('Order insert fallback error:', orderInsert.error.code);
          return res.status(500).json({ error: 'Sipariş oluşturulamadı.' });
        }
      } else if (err.code === '23505') {
        return res.status(500).json({ error: 'Sipariş numarası çakışması. Lütfen tekrar deneyin.' });
      } else {
        return res.status(500).json({ error: 'Sipariş oluşturulamadı.' });
      }
    }
    const order = orderInsert.data;

    step = 'insert_order_items';
    const orderItems = verifiedItems.map(vi => ({
      order_id: order.id,
      product_id: vi.product_id,
      name: vi.name,
      price: vi.price,
      quantity: vi.quantity,
      image: vi.image,
    }));
    const { error: itemsError } = await db.from('order_items').insert(orderItems);
    if (itemsError) console.error('Order items insert error:', itemsError.code);

    step = 'update_stock';
    const stockErrors = [];
    for (const vi of verifiedItems) {
      const result = await retryStockDecrement(db, vi.product_id, vi.quantity);
      if (!result.ok) {
        stockErrors.push(`${vi.name}: ${result.error}`);
      } else if (result.newStock === 0) {
        db.from('notifications').insert({
          type: 'low_stock', title: 'Düşük Stok Uyarısı',
          message: `${vi.name} ürününün stokunda ${result.newStock} adet kaldı`,
          is_read: false, target_id: vi.product_id,
        }).catch(() => {});
      }
    }
    if (stockErrors.length > 0) {
      console.error('Stock update issues:', stockErrors);
    }

    step = 'update_coupon';
    if (couponId && discountAmount > 0) {
      if (couponMaxUses && couponUsedCount >= couponMaxUses) {
        await db.from('orders').update({
          discount_amount: 0, coupon_code: '', total_amount: totalAmount + discountAmount,
        }).eq('id', order.id);
      } else {
        const couponResult = await retryCouponIncrement(db, couponId, couponUsedCount);
        if (!couponResult.ok) {
          await db.from('orders').update({
            discount_amount: 0, coupon_code: '', total_amount: totalAmount + discountAmount,
          }).eq('id', order.id);
        }
      }
    }

    step = 'clear_cart';
    if (guestId) {
      const { data: cart } = await db.from('carts').select('id').eq('guest_id', String(guestId)).single();
      if (cart) {
        await db.from('cart_items').delete().eq('cart_id', cart.id);
        await db.from('carts').delete().eq('id', cart.id);
      }
    }

    step = 'send_email';
    sendOrderStatusEmail(order, 'pending').catch(() => {});

    res.status(201).json({
      success: true,
      order: { orderNumber: order.order_number, totalAmount: order.total_amount },
    });
  } catch (error) {
    console.error(`Order creation error at step "${step}":`, error?.message || error);
    res.status(500).json({ error: 'Sipariş oluşturulurken bir hata oluştu.' });
  }
}
