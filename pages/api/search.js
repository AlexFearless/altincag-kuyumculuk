import { supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { q, limit = 10 } = req.query;

    if (typeof q !== 'string') {
      return res.status(200).json({ products: [] });
    }

    const trimmed = q.trim();
    if (trimmed.length < 2 || trimmed.length > 100) {
      return res.status(200).json({ products: [] });
    }

    const { data: products } = await supabase
      .from('products')
      .select('name, slug, price, discounted_price, images, category, discount_percent, discount_type')
      .eq('is_active', true)
      .or(`name.ilike.%${trimmed}%,description.ilike.%${trimmed}%,category.ilike.%${trimmed}%,material.ilike.%${trimmed}%`)
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
