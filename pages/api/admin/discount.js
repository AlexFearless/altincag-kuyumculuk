import { supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { createLog } from '@/pages/api/admin/logs';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { category, discountPercent, discountType, productIds } = req.body;

    if (discountPercent === undefined || isNaN(Number(discountPercent))) {
      return res.status(400).json({ error: 'İndirim yüzdesi gerekli' });
    }
    if (Number(discountPercent) < 0 || Number(discountPercent) > 100) {
      return res.status(400).json({ error: 'İndirim yüzdesi 0-100 arasında olmalıdır' });
    }

    const type = discountType === 'fake' ? 'fake' : 'real';
    let query = supabaseAdmin.from('products').select('id, price');

    if (productIds && Array.isArray(productIds) && productIds.length > 0) {
      if (productIds.length > 100) return res.status(400).json({ error: 'En fazla 100 ürün seçilebilir' });
      query = query.in('id', productIds);
    } else if (category && typeof category === 'string') {
      query = query.eq('category', category);
    } else {
      return res.status(400).json({ error: 'Kategori veya ürün listesi gerekli' });
    }

    const { data: products } = await query;
    if (!products || products.length === 0) {
      return res.status(200).json({ success: true, message: 'Eşleşen ürün bulunamadı', modifiedCount: 0 });
    }

    const updates = products.map(p => {
      const discountedPrice = type === 'real' && discountPercent > 0
        ? Math.round(p.price * (1 - discountPercent / 100) * 100) / 100
        : 0;
      return supabaseAdmin
        .from('products')
        .update({
          discount_percent: Number(discountPercent),
          discount_type: type,
          discounted_price: discountedPrice,
        })
        .eq('id', p.id);
    });

    await Promise.all(updates);

    const action = type === 'real'
      ? `%${discountPercent} gerçek indirim uygulandı`
      : `%${discountPercent} sahte indirim uygulandı`;

    createLog({ action, adminEmail: req.admin?.email || 'admin', targetType: 'discount', details: { category, count: products.length }, req });
    res.status(200).json({ success: true, message: `${products.length} ürüne %${discountPercent} ${type === 'real' ? 'gerçek' : 'sahte'} indirim uygulandı`, modifiedCount: products.length });
  } catch (error) {
    console.error('Discount error:', error);
    res.status(500).json({ error: 'İndirim uygulanırken hata oluştu' });
  }
}

export default withAuth(handler);
