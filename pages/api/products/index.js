import { getDbPublic } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let db;
    try { db = getDbPublic(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyin.' }); }

    const { category, featured, limit = 50, page = 1 } = req.query;
    const safeLimit = parseInt(limit) || 50;
    const from = (parseInt(page) - 1) * safeLimit;
    const to = from + safeLimit - 1;

    let query = db.from('products').select('*', { count: 'exact' }).eq('is_active', true);

    if (category) query = query.eq('category', category);
    if (featured === 'true') query = query.eq('is_featured', true);

    const { data: products, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    const mapped = (products || []).map(p => ({
      _id: p.id,
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      discountedPrice: p.discounted_price,
      category: p.category,
      images: p.images || [],
      stock: p.stock,
      isActive: p.is_active,
      isFeatured: p.is_featured,
      karat: p.karat,
      weight: p.weight,
      material: p.material,
      discountPercent: p.discount_percent,
      discountType: p.discount_type,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    res.status(200).json({
      products: mapped,
      total: count || 0,
      page: parseInt(page),
      pages: Math.ceil((count || 0) / safeLimit),
    });
  } catch (error) {
    console.error('Products API error:', error);
    res.status(500).json({ error: 'Ürünler yüklenirken hata oluştu' });
  }
}
