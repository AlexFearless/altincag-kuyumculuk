import { getDb } from '@/lib/supabase';
import { rateLimit } from '@/lib/rateLimit';
import { applyCampaignDiscounts } from '@/lib/campaignDiscounts';
import crypto from 'crypto';

const cartLimiter = rateLimit({ windowMs: 60000, max: 30, message: 'Çok fazla sepet işlemi. 1 dakika bekleyin.' });

function generateGuestId() {
  return 'guest_' + crypto.randomBytes(16).toString('hex');
}

function parseCookie(req) {
  const cookieHeader = req.headers.cookie || '';
  const cookies = {};
  cookieHeader.split(';').forEach(c => {
    const [key, ...val] = c.split('=');
    if (key) cookies[key.trim()] = decodeURIComponent(val.join('='));
  });
  return cookies;
}

function getGuestIdFromRequest(req) {
  const cookies = parseCookie(req);
  if (cookies.guest_id && typeof cookies.guest_id === 'string' && cookies.guest_id.startsWith('guest_') && cookies.guest_id.length <= 100) {
    return cookies.guest_id;
  }
  return null;
}

function setGuestIdCookie(res, guestId) {
  const existing = res.getHeader('Set-Cookie') || [];
  const cookieStr = `guest_id=${guestId}; Path=/; Max-Age=${90 * 24 * 60 * 60}; SameSite=Lax; HttpOnly`;
  if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing, cookieStr]);
  } else {
    res.setHeader('Set-Cookie', cookieStr);
  }
}

async function getCartWithProducts(db, guestId) {
  const { data: cart } = await db.from('carts').select('id').eq('guest_id', guestId).single();
  if (!cart) return [];

  const { data: cartItems } = await db
    .from('cart_items')
    .select('*, products(*)')
    .eq('cart_id', cart.id);

  if (!cartItems) return [];

  let products = cartItems.map(ci => ({
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
      discountType: ci.products.discount_type,
      discountPercent: ci.products.discount_percent,
    } : null,
    quantity: ci.quantity,
  })).filter(ci => ci.product);

  const innerProducts = products.map(ci => ({ ...ci.product, _id: ci.product.id }));
  const discounted = await applyCampaignDiscounts(db, innerProducts);
  const discountedMap = {};
  discounted.forEach(d => { discountedMap[d.id] = d; });

  return products.map(ci => ({
    ...ci,
    product: discountedMap[ci.product.id] || ci.product,
  }));
}

export default async function handler(req, res) {
  let db;
  try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı.' }); }

  // Rate limit all methods including GET to prevent DoS
  if (!(await cartLimiter(req, res))) return;

  try {
    let guestId = getGuestIdFromRequest(req);
    let isNewGuest = false;

    if (!guestId) {
      guestId = generateGuestId();
      isNewGuest = true;
    }

    switch (req.method) {
      case 'GET': {
        const items = await getCartWithProducts(db, guestId);
        if (isNewGuest) setGuestIdCookie(res, guestId);
        return res.status(200).json({ items, guestId });
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
            .insert({ guest_id: guestId })
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
        if (isNewGuest) setGuestIdCookie(res, guestId);
        return res.status(200).json({ items, guestId });
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
        return res.status(200).json({ items, guestId });
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
        return res.status(200).json({ items, guestId });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Cart API error');
    res.status(500).json({ error: 'Sepet işlemi sırasında hata oluştu' });
  }
}
