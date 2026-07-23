import { getDbPublic } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let db;
  try { db = getDbPublic(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı.' }); }

  try {
    const { code, orderAmount, cartCategories } = req.body;
    if (!code) return res.status(400).json({ error: 'Kupon kodu gerekli' });

    const { data: coupon } = await db
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('is_active', true)
      .single();

    if (!coupon) return res.status(404).json({ error: 'Geçersiz veya pasif kupon kodu' });

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Kupon süresi dolmuş' });
    }

    if (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses) {
      return res.status(400).json({ error: 'Kupon kullanım limiti dolmuş' });
    }

    if (orderAmount && coupon.min_order_amount > 0 && Number(orderAmount) < coupon.min_order_amount) {
      return res.status(400).json({ error: `Minimum sipariş tutarı ${coupon.min_order_amount} TL olmalıdır` });
    }

    if (coupon.applicable_categories && coupon.applicable_categories.length > 0 && cartCategories && cartCategories.length > 0) {
      const hasValidCategory = cartCategories.some(cat => coupon.applicable_categories.includes(cat));
      if (!hasValidCategory) {
        return res.status(400).json({ error: 'Bu kupon sepetteki ürünlerin kategorisi için geçerli değil' });
      }
    }

    let discount = 0;
    if (coupon.discount_type === 'percent') {
      discount = Math.round((Number(orderAmount) * coupon.discount_value) / 100);
    } else {
      discount = coupon.discount_value;
    }

    res.status(200).json({
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discount_type,
        discountValue: coupon.discount_value,
        discount,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Kupon doğrulanamadı' });
  }
}
