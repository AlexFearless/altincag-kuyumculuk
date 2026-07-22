import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { q, limit = 10 } = req.query;

    if (typeof q !== 'string') {
      return res.status(200).json({ products: [] });
    }

    const trimmed = q.trim();
    if (trimmed.length < 2 || trimmed.length > 100) {
      return res.status(200).json({ products: [] });
    }

    const safeRegex = new RegExp(escapeRegex(trimmed), 'i');

    const products = await Product.find({
      isActive: true,
      $or: [
        { name: safeRegex },
        { description: safeRegex },
        { category: safeRegex },
        { material: safeRegex },
      ],
    })
      .select('name slug price discountedPrice images category discountPercent')
      .limit(Math.min(parseInt(limit) || 10, 50));

    res.status(200).json({ products });
  } catch (error) {
    console.error('Search error');
    res.status(500).json({ error: 'Arama yapılırken hata oluştu' });
  }
}
