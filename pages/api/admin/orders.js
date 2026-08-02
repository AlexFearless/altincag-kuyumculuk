import { getDb } from '@/lib/supabase';
import { withAdminRole } from '@/lib/auth';
import { createLog } from '@/pages/api/admin/logs';
import { sendOrderStatusEmail } from '@/lib/orderEmails';
import { rateLimit } from '@/lib/rateLimit';
import { sanitize } from '@/lib/sanitize';

const adminLimiter = rateLimit({ windowMs: 60000, max: 60, message: 'Çok fazla istek. 1 dakika bekleyin.' });

async function handler(req, res) {
  if (!(await adminLimiter(req, res))) return;

  let db;
  try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyin.' }); }

  switch (req.method) {
    case 'GET': return handleGet(db, req, res);
    case 'PUT': return handlePut(db, req, res);
    case 'PATCH': return handlePatch(db, req, res);
    case 'DELETE': return handleDelete(db, req, res);
    default: return res.status(405).json({ error: 'Method not allowed' });
  }
}

function mapOrder(o) {
  return {
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
      zipCode: o.customer_zip_code,
    },
    specialInstructions: o.special_instructions,
    subtotal: o.subtotal,
    shippingCost: o.shipping_cost,
    discountAmount: o.discount_amount || 0,
    couponCode: o.coupon_code || '',
    totalAmount: o.total_amount,
    paymentMethod: o.payment_method,
    paymentStatus: o.payment_status,
    orderStatus: o.order_status,
    guestId: o.guest_id,
    userId: o.user_id,
    trackingNumber: o.tracking_number,
    notes: o.notes,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
    items: o.order_items || [],
  };
}

async function handleGet(db, req, res) {
  try {
    const { status, userId, page = 1, limit = 20 } = req.query;
    const safeLimit = parseInt(limit) || 20;
    const from = (parseInt(page) - 1) * safeLimit;
    const to = from + safeLimit - 1;

    let query = db.from('orders').select('id, order_number, customer_first_name, customer_last_name, customer_email, customer_phone, customer_address, customer_city, customer_district, customer_zip_code, special_instructions, subtotal, shipping_cost, discount_amount, coupon_code, total_amount, payment_method, payment_status, order_status, guest_id, user_id, tracking_number, notes, created_at, updated_at, order_items(id, product_id, name, price, quantity, image, products(name, images))', { count: 'exact' });
    if (status) query = query.eq('order_status', status);
    if (userId) {
      const { data: user } = await db.from('users').select('email').eq('id', userId).single();
      if (user) query = query.eq('customer_email', user.email);
    }

    const { data: orders, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    const total = count || 0;
    const mapped = (orders || []).map(o => {
      const m = mapOrder(o);
      m.items = (o.order_items || []).map(oi => ({
        _id: oi.id,
        product: oi.products ? { name: oi.products.name, images: oi.products.images } : { name: oi.name, images: oi.image ? [oi.image] : [] },
        name: oi.name,
        price: oi.price,
        quantity: oi.quantity,
        image: oi.image,
      }));
      return m;
    });

    res.status(200).json({ orders: mapped, total, page: parseInt(page), pages: Math.ceil(total / safeLimit) });
  } catch (error) {
    console.error('Admin orders GET error:', error);
    res.status(500).json({ error: 'Siparişler yüklenirken hata oluştu' });
  }
}

async function handlePut(db, req, res) {
  try {
    const { id, orderStatus, trackingNumber, notes } = req.body;
    if (!id) return res.status(400).json({ error: 'Sipariş ID zorunludur' });

    const { data: order } = await db.from('orders').select('id, order_number, order_status, payment_status, payment_method, total_amount, user_id, guest_id, ip_address, created_at').eq('id', id).single();
    if (!order) return res.status(404).json({ error: 'Sipariş bulunamadı' });

    const oldStatus = order.order_status;

    // Allow flexible status transitions (admin can move backward/forward)
    const allowedTransitions = {
      pending: ['processing', 'shipped', 'delivered', 'cancelled'],
      processing: ['pending', 'shipped', 'delivered', 'cancelled'],
      shipped: ['pending', 'processing', 'delivered', 'cancelled'],
      delivered: ['shipped', 'processing', 'pending', 'refunded'],
      cancelled: ['pending', 'processing'],
      refunded: [],
    };
    if (orderStatus && orderStatus !== oldStatus) {
      const allowed = allowedTransitions[oldStatus] || [];
      if (!allowed.includes(orderStatus)) {
        return res.status(400).json({ error: `"${oldStatus}" durumundan "${orderStatus}" durumuna geçiş yapılamaz` });
      }
    }

    if (orderStatus === 'cancelled' && oldStatus !== 'cancelled') {
      if (order.payment_status === 'odendi' || order.payment_status === 'paid') {
        const { data: items } = await db.from('order_items').select('product_id, quantity').eq('order_id', id);
        for (const item of (items || [])) {
          if (item.product_id) {
            for (let attempt = 0; attempt < 3; attempt++) {
              const { data: p } = await db.from('products').select('stock').eq('id', item.product_id).single();
              if (!p) break;
              const { data: restored } = await db.from('products').update({ stock: p.stock + item.quantity }).eq('id', item.product_id).eq('stock', p.stock).select('stock');
              if (restored && restored.length > 0) break;
            }
          }
        }
      }
    }

    const updateData = {};
    if (orderStatus) {
      updateData.order_status = orderStatus;
      if ((orderStatus === 'pending') && order.payment_status === 'odendi') {
        updateData.payment_status = 'havale_bekliyor';
      }
    }
    if (trackingNumber !== undefined) updateData.tracking_number = sanitize(String(trackingNumber).substring(0, 100));
    if (notes !== undefined) updateData.notes = sanitize(String(notes).substring(0, 500));

    const { data: updated } = await db
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    createLog(db, { action: `Sipariş durumu güncellendi: ${oldStatus} → ${orderStatus || 'tracking'}`, adminEmail: req.admin?.email || 'admin', targetType: 'order', targetId: id, details: { orderNumber: order.order_number, oldStatus, newStatus: orderStatus }, req });

      let whatsappUrl = null;
    if (orderStatus && orderStatus !== oldStatus && order.customer_phone) {
      const statusTexts = {
        pending: 'siparişiniz onay bekliyor',
        processing: 'siparişiniz hazırlanmaya başlanmıştır',
        shipped: 'siparişiniz kargoya verilmiştir',
        delivered: 'siparişiniz başarıyla teslim edilmiştir',
        cancelled: 'siparişiniz iptal edilmiştir',
        refunded: 'siparişiniz iade edilmiştir',
      };
      const statusText = statusTexts[orderStatus] || 'sipariş durumunuz güncellenmiştir';
      const msg = `Sayın ${order.customer_first_name}, siparişiniz (#${order.order_number}) hakkında bilgilendirme: ${statusText}. AltınÇağ Kuyumculuk${trackingNumber ? ` Kargo takip: ${trackingNumber}` : ''}`;
      const phone = order.customer_phone.replace(/[^0-9]/g, '');
      whatsappUrl = `https://wa.me/90${phone.startsWith('0') ? phone.slice(1) : phone}?text=${encodeURIComponent(msg)}`;
    }

    res.status(200).json({ success: true, order: mapOrder(updated), whatsappUrl });
  } catch (error) {
    console.error('Admin orders PUT error:', error);
    res.status(500).json({ error: 'Sipariş güncellenirken hata oluştu' });
  }
}

async function handlePatch(db, req, res) {
  try {
    const { id, paymentStatus, reason: rawReason } = req.body;
    const reason = rawReason ? sanitize(String(rawReason).substring(0, 500)) : '';
    if (!id) return res.status(400).json({ error: 'Sipariş ID zorunludur' });

    const { data: order } = await db.from('orders').select('id, order_number, order_status, payment_status, payment_method, total_amount, customer_first_name, customer_email, customer_phone').eq('id', id).single();
    if (!order) return res.status(404).json({ error: 'Sipariş bulunamadı' });

    const allowedPaymentStatuses = ['havale_bekliyor', 'odendi', 'iptal'];
    if (!paymentStatus || !allowedPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({ error: 'Geçersiz ödeme durumu. İzin verilenler: havale_bekliyor, odendi, iptal' });
    }

    const oldPaymentStatus = order.payment_status;

    if (paymentStatus === oldPaymentStatus) {
      return res.status(200).json({ success: true, order: mapOrder(order), message: 'Zaten bu durumda' });
    }

    if (paymentStatus === 'odendi' && oldPaymentStatus !== 'odendi') {
      const updateData = { payment_status: 'odendi' };
      if (order.order_status === 'pending' || order.order_status === 'havale_bekliyor') {
        updateData.order_status = 'processing';
      }

      const { data: items } = await db.from('order_items').select('product_id, quantity, name').eq('order_id', id);
      const stockErrors = [];
      for (const item of (items || [])) {
        if (!item.product_id) continue;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const { data: p } = await db.from('products').select('stock').eq('id', item.product_id).single();
            if (!p) { stockErrors.push(item.name); break; }
            const newStock = p.stock - item.quantity;
            if (newStock < 0) { stockErrors.push(`${item.name}: stok yetersiz`); break; }
            const { data: updatedProd } = await db.from('products').update({ stock: newStock }).eq('id', item.product_id).eq('stock', p.stock).select('stock');
            if (updatedProd && updatedProd.length > 0) break;
          } catch (stockErr) {
            console.error('[PATCH] stock deduction error for item:', item.name, stockErr.message);
            stockErrors.push(`${item.name}: ${stockErr.message}`);
            break;
          }
        }
      }
      if (stockErrors.length > 0) console.error('[PATCH] Stock deduction issues:', stockErrors);

      const { data: updated, error: updateErr } = await db
        .from('orders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateErr) {
        console.error('[PATCH] order update error:', updateErr);
        return res.status(500).json({ error: 'Ödeme durumu güncellenemedi' });
      }
      if (!updated) {
        console.error('[PATCH] order update returned null. id:', id, 'updateData:', updateData);
        return res.status(500).json({ error: 'Sipariş bulunamadı veya güncellenemedi' });
      }

      createLog(db, { action: `Ödeme onaylandı: ${oldPaymentStatus} → odendi`, adminEmail: req.admin?.email || 'admin', targetType: 'order', targetId: id, details: { orderNumber: order.order_number }, req });

      let whatsappUrl = null;
      if (order.customer_phone) {
        const msg = `Sayın ${order.customer_first_name}, siparişiniz (#${order.order_number}) hakkında bilgilendirme: ödemesi onaylanmıştır, siparişiniz hazırlanmaya başlanmıştır. AltınÇağ Kuyumculuk`;
        const phone = order.customer_phone.replace(/[^0-9]/g, '');
        whatsappUrl = `https://wa.me/90${phone.startsWith('0') ? phone.slice(1) : phone}?text=${encodeURIComponent(msg)}`;
      }

      sendOrderStatusEmail({ ...updated, customer_first_name: order.customer_first_name, customer_email: order.customer_email, order_number: order.order_number }, 'processing').catch(() => {});

      return res.status(200).json({ success: true, order: mapOrder(updated), whatsappUrl });
    }

    if (paymentStatus === 'iptal' && oldPaymentStatus !== 'iptal') {
      const { error: updateError } = await db
        .from('orders')
        .update({ payment_status: 'iptal', order_status: 'cancelled' })
        .eq('id', id);

      if (updateError) throw updateError;

      if (oldPaymentStatus === 'odendi' || oldPaymentStatus === 'paid') {
        const { data: items } = await db.from('order_items').select('product_id, quantity').eq('order_id', id);
        for (const item of (items || [])) {
          if (item.product_id) {
            for (let attempt = 0; attempt < 3; attempt++) {
              const { data: p } = await db.from('products').select('stock').eq('id', item.product_id).single();
              if (!p) break;
              const { data: restored } = await db.from('products').update({ stock: p.stock + item.quantity }).eq('id', item.product_id).eq('stock', p.stock).select('stock');
              if (restored && restored.length > 0) break;
            }
          }
        }
      }

      createLog(db, { action: `Ödeme iptal edildi: ${oldPaymentStatus} → iptal. Sebep: ${reason || 'Belirtilmedi'}`, adminEmail: req.admin?.email || 'admin', targetType: 'order', targetId: id, details: { orderNumber: order.order_number, reason }, req });

      let whatsappUrl = null;
      if (order.customer_phone) {
        const msg = `Sayın ${order.customer_first_name}, siparişiniz (#${order.order_number}) hakkında bilgilendirme: ödemesi iptal edilmiştir.${reason ? ` Sebep: ${reason}` : ''} AltınÇağ Kuyumculuk`;
        const phone = order.customer_phone.replace(/[^0-9]/g, '');
        whatsappUrl = `https://wa.me/90${phone.startsWith('0') ? phone.slice(1) : phone}?text=${encodeURIComponent(msg)}`;
      }

      return res.status(200).json({ success: true, whatsappUrl });
    }

    if (paymentStatus === 'havale_bekliyor' && oldPaymentStatus !== 'havale_bekliyor') {
      const { data: updated } = await db
        .from('orders')
        .update({ payment_status: 'havale_bekliyor' })
        .eq('id', id)
        .select()
        .single();
      createLog(db, { action: `Ödeme durumu güncellendi: ${oldPaymentStatus} → havale_bekliyor`, adminEmail: req.admin?.email || 'admin', targetType: 'order', targetId: id, details: { orderNumber: order.order_number }, req });
      return res.status(200).json({ success: true, order: mapOrder(updated) });
    }

    res.status(200).json({ success: true, order: mapOrder(order) });
  } catch (error) {
    console.error('Admin orders PATCH error:', error);
    res.status(500).json({ error: 'Ödeme durumu güncellenirken hata oluştu' });
  }
}

async function handleDelete(db, req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Sipariş ID zorunludur' });

    const { data: order } = await db.from('orders').select('id, order_number, order_status, payment_status, total_amount').eq('id', id).single();
    if (!order) return res.status(404).json({ error: 'Sipariş bulunamadı' });

    if (order.order_status !== 'cancelled' && (order.payment_status === 'odendi' || order.payment_status === 'paid')) {
      const { data: items } = await db.from('order_items').select('product_id, quantity').eq('order_id', id);
      for (const item of (items || [])) {
        if (item.product_id) {
          for (let attempt = 0; attempt < 3; attempt++) {
            const { data: p } = await db.from('products').select('stock').eq('id', item.product_id).single();
            if (!p) break;
            const { data: updated } = await db.from('products').update({ stock: p.stock + item.quantity }).eq('id', item.product_id).eq('stock', p.stock).select('stock');
            if (updated && updated.length > 0) break;
          }
        }
      }
    }

    await db.from('order_items').delete().eq('order_id', id);
    await db.from('orders').delete().eq('id', id);

    createLog(db, { action: 'Sipariş silindi', adminEmail: req.admin?.email || 'admin', targetType: 'order', targetId: id, details: { orderNumber: order.order_number, totalAmount: order.total_amount }, req });
    res.status(200).json({ success: true, message: 'Sipariş silindi ve stoklar iade edildi' });
  } catch (error) {
    console.error('Admin orders DELETE error:', error);
    res.status(500).json({ error: 'Sipariş silinirken hata oluştu' });
  }
}

export default withAdminRole()(handler);
