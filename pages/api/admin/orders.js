import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { withAuth } from '@/lib/auth';
import { createLog } from '@/pages/api/admin/logs';

async function handler(req, res) {
  await dbConnect();

  switch (req.method) {
    case 'GET': return handleGet(req, res);
    case 'PUT': return handlePut(req, res);
    case 'DELETE': return handleDelete(req, res);
    default: return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(req, res) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.orderStatus = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const orders = await Order.find(query).populate('items.product', 'name images').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    const total = await Order.countDocuments(query);
    res.status(200).json({ orders, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ error: 'Siparişler yüklenirken hata oluştu' });
  }
}

async function handlePut(req, res) {
  try {
    const { id, orderStatus, trackingNumber, notes } = req.body;
    if (!id) return res.status(400).json({ error: 'Sipariş ID zorunludur' });
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: 'Sipariş bulunamadı' });

    const oldStatus = order.orderStatus;
    const updateData = {};
    if (orderStatus) updateData.orderStatus = orderStatus;
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    if (notes !== undefined) updateData.notes = notes;

    if (orderStatus === 'cancelled' && oldStatus !== 'cancelled') {
      for (const item of order.items) {
        if (item.product) {
          await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } }, { new: true });
        }
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(id, updateData, { new: true }).populate('items.product', 'name images');
    createLog({ action: `Sipariş durumu güncellendi: ${oldStatus} → ${orderStatus || 'tracking'}`, adminEmail: req.admin?.email || 'admin', targetType: 'order', targetId: id, details: { orderNumber: order.orderNumber, oldStatus, newStatus: orderStatus }, req });
    res.status(200).json({ success: true, order: updatedOrder });
  } catch (error) {
    res.status(500).json({ error: 'Sipariş güncellenirken hata oluştu' });
  }
}

async function handleDelete(req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Sipariş ID zorunludur' });
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: 'Sipariş bulunamadı' });

    if (order.orderStatus !== 'cancelled') {
      for (const item of order.items) {
        if (item.product) {
          await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } }, { new: true });
        }
      }
    }

    await Order.findByIdAndDelete(id);
    createLog({ action: 'Sipariş silindi', adminEmail: req.admin?.email || 'admin', targetType: 'order', targetId: id, details: { orderNumber: order.orderNumber, totalAmount: order.totalAmount }, req });
    res.status(200).json({ success: true, message: 'Sipariş silindi ve stoklar iade edildi' });
  } catch (error) {
    res.status(500).json({ error: 'Sipariş silinirken hata oluştu' });
  }
}

export default withAuth(handler);
