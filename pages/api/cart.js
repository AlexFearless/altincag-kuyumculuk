import dbConnect from '@/lib/mongodb';
import Cart from '@/models/Cart';
import { rateLimit } from '@/lib/rateLimit';

const cartLimiter = rateLimit({ windowMs: 60000, max: 30, message: 'Çok fazla sepet işlemi. 1 dakika bekleyin.' });

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return forwarded
    ? forwarded.split(',')[0].trim()
    : req.socket.remoteAddress;
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && !cartLimiter(req, res)) return;

  try {
    await dbConnect();

    const guestId = req.headers['x-guest-id'];
    const ipAddress = getClientIp(req);

    if (!guestId || typeof guestId !== 'string' || guestId.length > 100) {
      return res.status(400).json({ error: 'Geçersiz istek' });
    }

    switch (req.method) {
      case 'GET':
        const cart = await Cart.findOne({ guestId }).populate('items.product');
        if (!cart) {
          return res.status(200).json({ items: [] });
        }
        return res.status(200).json({ items: cart.items });

      case 'POST': {
        const { productId, quantity = 1 } = req.body;
        if (!productId || typeof productId !== 'string') {
          return res.status(400).json({ error: 'Geçersiz ürün ID' });
        }
        const qty = Math.min(Math.max(Number(quantity) || 1, 1), 100);
        let existingCart = await Cart.findOne({ guestId });

        if (!existingCart) {
          existingCart = new Cart({
            guestId,
            ipAddress,
            items: [{ product: productId, quantity: qty }],
          });
        } else {
          if (existingCart.items.length >= 50) {
            return res.status(400).json({ error: 'Sepet çok dolu, en fazla 50 ürün ekleyebilirsiniz' });
          }
          const itemIndex = existingCart.items.findIndex(
            (item) => item.product.toString() === productId
          );

          if (itemIndex > -1) {
            existingCart.items[itemIndex].quantity = Math.min(existingCart.items[itemIndex].quantity + qty, 100);
          } else {
            existingCart.items.push({ product: productId, quantity: qty });
          }
          existingCart.lastUpdated = new Date();
        }

        await existingCart.save();
        const updatedCart = await Cart.findOne({ guestId }).populate('items.product');
        return res.status(200).json({ items: updatedCart.items });
      }

      case 'PUT': {
        const { productId: updateProductId, quantity: newQuantity } = req.body;
        if (!updateProductId || typeof updateProductId !== 'string') {
          return res.status(400).json({ error: 'Geçersiz ürün ID' });
        }
        const cartToUpdate = await Cart.findOne({ guestId });

        if (!cartToUpdate) {
          return res.status(404).json({ error: 'Sepet bulunamadı' });
        }

        const qty = Number(newQuantity) || 0;
        if (qty <= 0) {
          cartToUpdate.items = cartToUpdate.items.filter(
            (item) => item.product.toString() !== updateProductId
          );
        } else {
          const item = cartToUpdate.items.find(
            (item) => item.product.toString() === updateProductId
          );
          if (item) {
            item.quantity = Math.min(qty, 100);
          }
        }

        cartToUpdate.lastUpdated = new Date();
        await cartToUpdate.save();
        const refreshedCart = await Cart.findOne({ guestId }).populate('items.product');
        return res.status(200).json({ items: refreshedCart.items });
      }

      case 'DELETE': {
        const { productId: deleteProductId } = req.body;
        const cartToDelete = await Cart.findOne({ guestId });

        if (!cartToDelete) {
          return res.status(404).json({ error: 'Sepet bulunamadı' });
        }

        if (deleteProductId && typeof deleteProductId === 'string') {
          cartToDelete.items = cartToDelete.items.filter(
            (item) => item.product.toString() !== deleteProductId
          );
          cartToDelete.lastUpdated = new Date();
          await cartToDelete.save();
        } else {
          await Cart.deleteOne({ guestId });
        }

        const clearedCart = await Cart.findOne({ guestId }).populate('items.product');
        return res.status(200).json({ items: clearedCart ? clearedCart.items : [] });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Cart API error');
    res.status(500).json({ error: 'Sepet işlemi sırasında hata oluştu' });
  }
}
