import { getDb } from '@/lib/supabase';
import { withAdminRole } from '@/lib/auth';
import { createLog } from '@/pages/api/admin/logs';
import { rateLimit } from '@/lib/rateLimit';

const priceIncreaseLimiter = rateLimit({ windowMs: 60000, max: 10, message: 'Çok fazla fiyat işlemi. 1 dakika bekleyin.' });

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await priceIncreaseLimiter(req, res))) return;

  try {
    let db;
    try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyin.' }); }

    const { percent, category, productIds } = req.body;

    if (percent === undefined || isNaN(Number(percent))) {
      return res.status(400).json({ error: 'Yüzde değeri gerekli' });
    }
    if (Number(percent) <= 0 || Number(percent) > 500) {
      return res.status(400).json({ error: 'Yüzde değeri 0-500 arasında olmalıdır' });
    }

    let query = db.from('products').select('id, price, name').eq('is_active', true);

    if (productIds && Array.isArray(productIds) && productIds.length > 0) {
      if (productIds.length > 200) return res.status(400).json({ error: 'En fazla 200 ürün seçilebilir' });
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

    const multiplier = 1 + Number(percent) / 100;

    const updates = products.map(p => {
      const newPrice = Math.round(p.price * multiplier * 100) / 100;
      return db
        .from('products')
        .update({ price: newPrice })
        .eq('id', p.id);
    });

    await Promise.all(updates);

    const action = `Tüm fiyatlara %${percent} arttırma uygulandı`;
    createLog(db, { action, adminEmail: req.admin?.email || 'admin', targetType: 'price_increase', details: { category, percent, count: products.length }, req });

    res.status(200).json({
      success: true,
      message: `${products.length} ürünün fiyatına %${percent} arttırma uygulandı`,
      modifiedCount: products.length,
    });
  } catch (error) {
    console.error('Price increase error:', error);
    res.status(500).json({ error: 'Fiyat arttırma sırasında hata oluştu' });
  }
}

export default withAdminRole()(handler);
