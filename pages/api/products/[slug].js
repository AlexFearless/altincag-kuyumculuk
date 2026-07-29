import { getDbPublic } from '@/lib/supabase';
import { applyCampaignDiscounts } from '@/lib/campaignDiscounts';
import { rateLimit } from '@/lib/rateLimit';

const productLimiter = rateLimit({ windowMs: 60000, max: 30, message: 'Çok fazla istek. 1 dakika bekleyin.' });

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await productLimiter(req, res))) return;

  try {
    let db;
    try { db = getDbPublic(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı' }); }

    const { slug } = req.query;
    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ error: 'Geçersiz ürün' });
    }

    const { data: product } = await db
      .from('products')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (!product) {
      return res.status(404).json({ error: 'Ürün bulunamadı' });
    }

    let mapped = [{
      _id: product.id,
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      discountedPrice: product.discounted_price,
      category: product.category,
      images: product.images || [],
      stock: product.stock,
      isActive: product.is_active,
      isFeatured: product.is_featured,
      karat: product.karat,
      weight: product.weight,
      material: product.material,
      discountPercent: product.discount_percent,
      discountType: product.discount_type,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    }];

    const [discounted] = await applyCampaignDiscounts(db, mapped);
    const p = discounted;

    res.status(200).json({ product: p });
  } catch (error) {
    console.error('Product detail error');
    res.status(500).json({ error: 'Ürün yüklenirken hata oluştu' });
  }
}
