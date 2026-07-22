import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { slug } = req.query;
    const product = await Product.findOne({
      slug,
      isActive: true,
    }).select('-__v');

    if (!product) {
      return res.status(404).json({ error: 'Ürün bulunamadı' });
    }

    res.status(200).json({ product });
  } catch (error) {
    console.error('Product detail error:', error);
    res.status(500).json({ error: 'Ürün yüklenirken hata oluştu' });
  }
}
