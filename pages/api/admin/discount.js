import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { withAuth } from '@/lib/auth';
import { createLog } from '@/pages/api/admin/logs';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const { category, discountPercent, discountType, productIds } = req.body;

    if (discountPercent === undefined || isNaN(Number(discountPercent))) {
      return res.status(400).json({ error: 'İndirim yüzdesi gerekli' });
    }
    if (Number(discountPercent) < 0 || Number(discountPercent) > 100) {
      return res.status(400).json({ error: 'İndirim yüzdesi 0-100 arasında olmalıdır' });
    }

    const type = discountType === 'fake' ? 'fake' : 'real';

    let query = {};
    if (productIds && Array.isArray(productIds) && productIds.length > 0) {
      if (productIds.length > 100) return res.status(400).json({ error: 'En fazla 100 ürün seçilebilir' });
      query._id = { $in: productIds };
    } else if (category && typeof category === 'string') {
      query.category = category;
    } else {
      return res.status(400).json({ error: 'Kategori veya ürün listesi gerekli' });
    }

    if (type === 'real' && discountPercent > 0) {
      const products = await Product.find(query);
      const bulkOps = products.map(p => ({
        updateOne: {
          filter: { _id: p._id },
          update: { $set: { discountPercent, discountType: type, discountedPrice: p.price * (1 - discountPercent / 100) } },
        },
      }));
      if (bulkOps.length > 0) await Product.bulkWrite(bulkOps);
      createLog({ action: `%${discountPercent} gerçek indirim uygulandı`, adminEmail: req.admin?.email || 'admin', targetType: 'discount', details: { category, count: bulkOps.length }, req });
      res.status(200).json({ success: true, message: `${bulkOps.length} ürüne %${discountPercent} gerçek indirim uygulandı`, modifiedCount: bulkOps.length });
    } else {
      const result = await Product.updateMany(query, { $set: { discountPercent, discountType: type, discountedPrice: 0 } });
      createLog({ action: `%${discountPercent} sahte indirim uygulandı`, adminEmail: req.admin?.email || 'admin', targetType: 'discount', details: { category, count: result.modifiedCount }, req });
      res.status(200).json({ success: true, message: `${result.modifiedCount} ürüne %${discountPercent} sahte indirim uygulandı`, modifiedCount: result.modifiedCount });
    }
  } catch (error) {
    res.status(500).json({ error: 'İndirim uygulanırken hata oluştu' });
  }
}

export default withAuth(handler);
