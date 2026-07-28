import { getDb } from '@/lib/supabase';
import { withAdminRole } from '@/lib/auth';
import { createLog } from '@/pages/api/admin/logs';
import { rateLimit } from '@/lib/rateLimit';

const discountLimiter = rateLimit({ windowMs: 60000, max: 10, message: 'Çok fazla indirim işlemi. 1 dakika bekleyin.' });

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await discountLimiter(req, res))) return;

  try {
    let db;
    try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyin.' }); }

    const { category, discountPercent, discountType, productIds } = req.body;

    if (discountPercent === undefined || isNaN(Number(discountPercent))) {
      return res.status(400).json({ error: 'İndirim yüzdesi gerekli' });
    }
    if (Number(discountPercent) < 0 || Number(discountPercent) > 100) {
      return res.status(400).json({ error: 'İndirim yüzdesi 0-100 arasında olmalıdır' });
    }

    const type = 'real';
    let query = db.from('products').select('id, price');

    if (productIds && Array.isArray(productIds) && productIds.length > 0) {
      if (productIds.length > 100) return res.status(400).json({ error: 'En fazla 100 ürün seçilebilir' });
      const safeIds = productIds.filter(id => typeof id === 'string' && id.length > 0 && id.length < 100);
      if (safeIds.length === 0) return res.status(400).json({ error: 'Geçersiz ürün listesi' });
      query = query.in('id', safeIds);
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
      return db
        .from('products')
        .update({
          discount_percent: Number(discountPercent),
          discount_type: type,
          discounted_price: discountedPrice,
        })
        .eq('id', p.id);
    });

    await Promise.all(updates);

    const action = `%${discountPercent} indirim uygulandı`; 

    createLog(db, { action, adminEmail: req.admin?.email || 'admin', targetType: 'discount', details: { category, count: products.length }, req });
    res.status(200).json({ success: true, message: `${products.length} ürüne %${discountPercent} indirim uygulandı`, modifiedCount: products.length });
  } catch (error) {
    console.error('Discount error');
    res.status(500).json({ error: 'İndirim uygulanırken hata oluştu' });
  }
}

export default withAdminRole()(handler);
