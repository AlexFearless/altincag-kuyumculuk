import { getDb } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { createLog } from '@/pages/api/admin/logs';
import { sendOrderStatusEmail } from '@/lib/orderEmails';

async function handler(req, res) {
  let db;
  try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyin.' }); }

  switch (req.method) {
    case 'GET': return handleGet(db, req, res);
    case 'PUT': return handlePut(db, req, res);
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

    let query = db.from('orders').select('*, order_items(*, products(name, images))', { count: 'exact' });
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

    const { data: order } = await db.from('orders').select('*').eq('id', id).single();
    if (!order) return res.status(404).json({ error: 'Sipariş bulunamadı' });

    const oldStatus = order.order_status;

    if (orderStatus === 'cancelled' && oldStatus !== 'cancelled') {
      const { data: items } = await db.from('order_items').select('*').eq('order_id', id);
      for (const item of (items || [])) {
        if (item.product_id) {
          const { data: product } = await db.from('products').select('stock').eq('id', item.product_id).single();
          if (product) {
            await db.from('products').update({ stock: product.stock + item.quantity }).eq('id', item.product_id);
          }
        }
      }
    }

    const updateData = {};
    if (orderStatus) updateData.order_status = orderStatus;
    if (trackingNumber !== undefined) updateData.tracking_number = trackingNumber;
    if (notes !== undefined) updateData.notes = notes;

    const { data: updated } = await db
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    createLog(db, { action: `Sipariş durumu güncellendi: ${oldStatus} → ${orderStatus || 'tracking'}`, adminEmail: req.admin?.email || 'admin', targetType: 'order', targetId: id, details: { orderNumber: order.order_number, oldStatus, newStatus: orderStatus }, req });

    if (orderStatus && orderStatus !== oldStatus) {
      sendOrderStatusEmail(order, orderStatus).catch(() => {});
    }

    res.status(200).json({ success: true, order: mapOrder(updated) });
  } catch (error) {
    console.error('Admin orders PUT error:', error);
    res.status(500).json({ error: 'Sipariş güncellenirken hata oluştu' });
  }
}

async function handleDelete(db, req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Sipariş ID zorunludur' });

    const { data: order } = await db.from('orders').select('*').eq('id', id).single();
    if (!order) return res.status(404).json({ error: 'Sipariş bulunamadı' });

    if (order.order_status !== 'cancelled') {
      const { data: items } = await db.from('order_items').select('*').eq('order_id', id);
      for (const item of (items || [])) {
        if (item.product_id) {
          const { data: product } = await db.from('products').select('stock').eq('id', item.product_id).single();
          if (product) {
            await db.from('products').update({ stock: product.stock + item.quantity }).eq('id', item.product_id);
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

export default withAuth(handler);
