import { getDbPublic } from '@/lib/supabase';
import { rateLimit } from '@/lib/rateLimit';
import { sanitizeForOrFilter } from '@/lib/sanitize';

const searchLimiter = rateLimit({ windowMs: 60000, max: 30, message: 'Çok fazla arama. 1 dakika bekleyin.' });

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await searchLimiter(req, res))) return;

  try {
    let db;
    try { db = getDbPublic(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyin.' }); }

    const { q, limit = 10 } = req.query;

    if (typeof q !== 'string') {
      return res.status(200).json({ products: [] });
    }

    const trimmed = q.trim();
    if (trimmed.length < 2 || trimmed.length > 100) {
      return res.status(200).json({ products: [] });
    }

    const safe = sanitizeForOrFilter(trimmed);

    const { data: products } = await db
      .from('products')
      .select('name, slug, barcode, price, discounted_price, images, category, discount_percent, discount_type')
      .eq('is_active', true)
      .or(`name.ilike.%${safe}%,description.ilike.%${safe}%,category.ilike.%${safe}%,material.ilike.%${safe}%,barcode.ilike.%${safe}%`)
      .limit(Math.min(parseInt(limit) || 10, 50));

    const mapped = (products || []).map(p => ({
      name: p.name,
      slug: p.slug,
      price: p.price,
      discountedPrice: p.discounted_price,
      images: p.images || [],
      category: p.category,
      discountPercent: p.discount_percent,
      discountType: p.discount_type,
    }));

    res.status(200).json({ products: mapped });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Arama yapılırken hata oluştu' });
  }
}
