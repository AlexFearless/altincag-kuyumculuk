import { getDb } from '@/lib/supabase';
import { rateLimit } from '@/lib/rateLimit';

const cartLimiter = rateLimit({ windowMs: 60000, max: 30, message: 'Çok fazla sepet işlemi. 1 dakika bekleyin.' });

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
}

async function getCartWithProducts(db, guestId) {
  const { data: cart } = await db.from('carts').select('id').eq('guest_id', guestId).single();
  if (!cart) return [];

  const { data: cartItems } = await db
    .from('cart_items')
    .select('*, products(*)')
    .eq('cart_id', cart.id);

  if (!cartItems) return [];

  return cartItems.map(ci => ({
    _id: ci.id,
    product: ci.products ? {
      _id: ci.products.id,
      id: ci.products.id,
      name: ci.products.name,
      slug: ci.products.slug,
      price: ci.products.price,
      discountedPrice: ci.products.discounted_price,
      images: ci.products.images || [],
      category: ci.products.category,
      karat: ci.products.karat,
      weight: ci.products.weight,
      stock: ci.products.stock,
      isActive: ci.products.is_active,
    } : null,
    quantity: ci.quantity,
  })).filter(ci => ci.product);
}

export default async function handler(req, res) {
  let db;
  try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyin.' }); }

  if (req.method !== 'GET' && !cartLimiter(req, res)) return;

  try {
    const guestId = req.headers['x-guest-id'];
    const ipAddress = getClientIp(req);

    if (!guestId || typeof guestId !== 'string' || guestId.length > 100) {
      return res.status(400).json({ error: 'Geçersiz istek' });
    }

    switch (req.method) {
      case 'GET': {
        const items = await getCartWithProducts(db, guestId);
        return res.status(200).json({ items });
      }

      case 'POST': {
        const { productId, quantity = 1 } = req.body;
        if (!productId || typeof productId !== 'string') {
          return res.status(400).json({ error: 'Geçersiz ürün ID' });
        }
        const qty = Math.min(Math.max(Number(quantity) || 1, 1), 100);

        let { data: cart } = await db.from('carts').select('id').eq('guest_id', guestId).single();

        if (!cart) {
          const { data: newCart } = await db
            .from('carts')
            .insert({ guest_id: guestId, ip_address: ipAddress })
            .select('id')
            .single();
          cart = newCart;
        }

        const { data: existingItem } = await db
          .from('cart_items')
          .select('id, quantity')
          .eq('cart_id', cart.id)
          .eq('product_id', productId)
          .single();

        if (existingItem) {
          await db
            .from('cart_items')
            .update({ quantity: Math.min(existingItem.quantity + qty, 100) })
            .eq('id', existingItem.id);
        } else {
          const { count } = await db
            .from('cart_items')
            .select('*', { count: 'exact', head: true })
            .eq('cart_id', cart.id);

          if ((count || 0) >= 50) {
            return res.status(400).json({ error: 'Sepet çok dolu, en fazla 50 ürün ekleyebilirsiniz' });
          }
          await db.from('cart_items').insert({ cart_id: cart.id, product_id: productId, quantity: qty });
        }

        const items = await getCartWithProducts(db, guestId);
        return res.status(200).json({ items });
      }

      case 'PUT': {
        const { productId: updateProductId, quantity: newQuantity } = req.body;
        if (!updateProductId || typeof updateProductId !== 'string') {
          return res.status(400).json({ error: 'Geçersiz ürün ID' });
        }

        const { data: cart } = await db.from('carts').select('id').eq('guest_id', guestId).single();
        if (!cart) return res.status(404).json({ error: 'Sepet bulunamadı' });

        const qty = Number(newQuantity) || 0;
        if (qty <= 0) {
          await db.from('cart_items').delete().eq('cart_id', cart.id).eq('product_id', updateProductId);
        } else {
          await db
            .from('cart_items')
            .update({ quantity: Math.min(qty, 100) })
            .eq('cart_id', cart.id)
            .eq('product_id', updateProductId);
        }

        const items = await getCartWithProducts(db, guestId);
        return res.status(200).json({ items });
      }

      case 'DELETE': {
        const { productId: deleteProductId } = req.body;
        const { data: cart } = await db.from('carts').select('id').eq('guest_id', guestId).single();

        if (!cart) return res.status(404).json({ error: 'Sepet bulunamadı' });

        if (deleteProductId && typeof deleteProductId === 'string') {
          await db.from('cart_items').delete().eq('cart_id', cart.id).eq('product_id', deleteProductId);
        } else {
          await db.from('cart_items').delete().eq('cart_id', cart.id);
          await db.from('carts').delete().eq('id', cart.id);
        }

        const items = await getCartWithProducts(db, guestId);
        return res.status(200).json({ items });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Cart API error:', error);
    res.status(500).json({ error: 'Sepet işlemi sırasında hata oluştu' });
  }
}
