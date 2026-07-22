import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Cart from '@/models/Cart';
import Product from '@/models/Product';
import { sanitize } from '@/lib/sanitize';
import { rateLimit } from '@/lib/rateLimit';

const orderLimiter = rateLimit({ windowMs: 60000, max: 5, message: 'Çok fazla sipariş denemesi. 1 dakika bekleyin.' });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!orderLimiter(req, res)) return;

  try {
    await dbConnect();
    const { guestId, customerInfo, specialInstructions, items, paymentMethod } = req.body;

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

    // Sunucu tarafında fiyat ve stok doğrulama
    let subtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      if (!item.product) continue;
      const dbProduct = await Product.findById(item.product);
      if (!dbProduct || !dbProduct.isActive) {
        return res.status(400).json({ error: `Ürün bulunamadı veya pasif: ${item.name || item.product}` });
      }
      const qty = Math.min(Math.max(Number(item.quantity) || 1, 1), 100);
      if (dbProduct.stock < qty) {
        return res.status(400).json({ error: `"${dbProduct.name}" stokta yetersiz (mevcut: ${dbProduct.stock})` });
      }
      const price = dbProduct.discountType === 'real' && dbProduct.discountedPrice > 0
        ? dbProduct.discountedPrice
        : dbProduct.price;
      subtotal += price * qty;
      verifiedItems.push({
        product: dbProduct._id,
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
    const totalAmount = subtotal + shippingCost;

    const order = new Order({
      guestId: String(guestId || ''),
      customerInfo: {
        firstName: sanitize(String(customerInfo.firstName).trim()),
        lastName: sanitize(String(customerInfo.lastName).trim()),
        email: String(customerInfo.email).toLowerCase().trim(),
        phone: sanitize(String(customerInfo.phone)),
        address: sanitize(String(customerInfo.address)),
        city: sanitize(String(customerInfo.city || 'İstanbul')),
        district: sanitize(String(customerInfo.district || '')),
      },
      specialInstructions: sanitize(String(specialInstructions || '').substring(0, 500)),
      items: verifiedItems,
      subtotal,
      shippingCost,
      totalAmount,
      paymentMethod: ['paytr', 'havale', 'kapida'].includes(paymentMethod) ? paymentMethod : 'paytr',
      ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '',
    });

    await order.save();

    // Stok düş (doğrulanmış miktarlarla)
    for (const item of verifiedItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } }, { new: true });
    }

    // Sepeti temizle
    if (guestId) {
      await Cart.deleteOne({ guestId: String(guestId) });
    }

    res.status(201).json({
      success: true,
      order: { orderNumber: order.orderNumber, totalAmount: order.totalAmount },
    });
  } catch (error) {
    console.error('Order creation error');
    res.status(500).json({ error: 'Sipariş oluşturulurken hata oluştu' });
  }
}
