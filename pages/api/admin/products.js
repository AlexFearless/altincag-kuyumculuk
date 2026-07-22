import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { withAuth } from '@/lib/auth';
import { createLog } from '@/pages/api/admin/logs';
import { sanitize } from '@/lib/sanitize';

async function handler(req, res) {
  await dbConnect();
  switch (req.method) {
    case 'GET': return handleGet(req, res);
    case 'POST': return handlePost(req, res);
    case 'PUT': return handlePut(req, res);
    case 'DELETE': return handleDelete(req, res);
    default: return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(req, res) {
  try {
    const { category, search, page = 1, limit = 50 } = req.query;
    const query = {};
    if (category) query.category = category;
    if (search) query.$text = { $search: search };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const products = await Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    const total = await Product.countDocuments(query);
    res.status(200).json({ products, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ error: 'Ürünler yüklenirken hata oluştu' });
  }
}

async function handlePost(req, res) {
  try {
    const { name, description, price, category, images, stock, karat, weight, material, isFeatured, discountPercent, discountType } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Ürün adı, fiyat ve kategori zorunludur' });
    }
    if (typeof name !== 'string' || name.length > 200) {
      return res.status(400).json({ error: 'Geçersiz ürün adı' });
    }
    if (isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ error: 'Geçersiz fiyat' });
    }

    const product = new Product({
      name: sanitize(name.trim()),
      description: sanitize(description || ''),
      price: Number(price),
      category,
      images: Array.isArray(images) ? images.filter(img => typeof img === 'string' && img.length < 2000).slice(0, 10) : [],
      stock: Number(stock) || 0,
      karat: karat || '',
      weight: Number(weight) || 0,
      material: sanitize(material || ''),
      isFeatured: !!isFeatured,
      discountPercent: Number(discountPercent) || 0,
      discountType: discountType || '',
    });
    await product.save();

    createLog({ action: 'Ürün eklendi', adminEmail: req.admin?.email || 'admin', targetType: 'product', targetId: product._id.toString(), details: { name: product.name, price: product.price, category }, req });
    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ error: 'Ürün eklenirken hata oluştu' });
  }
}

async function handlePut(req, res) {
  try {
    const { id, name, description, price, category, images, stock, karat, weight, material, isFeatured, discountPercent, discountType, isActive } = req.body;
    if (!id) return res.status(400).json({ error: 'Ürün ID zorunludur' });

    const updateData = {};
    if (name !== undefined) { if (typeof name !== 'string' || name.length > 200) return res.status(400).json({ error: 'Geçersiz ürün adı' }); updateData.name = sanitize(name.trim()); }
    if (description !== undefined) updateData.description = sanitize(String(description));
    if (price !== undefined) { if (isNaN(Number(price)) || Number(price) < 0) return res.status(400).json({ error: 'Geçersiz fiyat' }); updateData.price = Number(price); }
    if (category !== undefined) updateData.category = category;
    if (images !== undefined) updateData.images = Array.isArray(images) ? images.filter(img => typeof img === 'string' && img.length < 2000).slice(0, 10) : [];
    if (stock !== undefined) updateData.stock = Math.max(0, Number(stock) || 0);
    if (karat !== undefined) updateData.karat = karat;
    if (weight !== undefined) updateData.weight = Number(weight) || 0;
    if (material !== undefined) updateData.material = sanitize(String(material));
    if (isFeatured !== undefined) updateData.isFeatured = !!isFeatured;
    if (discountPercent !== undefined) updateData.discountPercent = Math.min(100, Math.max(0, Number(discountPercent) || 0));
    if (discountType !== undefined) updateData.discountType = ['real', 'fake', ''].includes(discountType) ? discountType : '';
    if (isActive !== undefined) updateData.isActive = !!isActive;

    if (Object.keys(updateData).length === 0) return res.status(400).json({ error: 'Güncellenecek alan belirtilmedi' });

    const product = await Product.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ error: 'Ürün bulunamadı' });

    createLog({ action: 'Ürün güncellendi', adminEmail: req.admin?.email || 'admin', targetType: 'product', targetId: id, details: { name: product.name }, req });
    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ error: 'Ürün güncellenirken hata oluştu' });
  }
}

async function handleDelete(req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Ürün ID zorunludur' });
    const product = await Product.findByIdAndDelete(id);
    if (!product) return res.status(404).json({ error: 'Ürün bulunamadı' });

    createLog({ action: 'Ürün silindi', adminEmail: req.admin?.email || 'admin', targetType: 'product', targetId: id, details: { name: product.name }, req });
    res.status(200).json({ success: true, message: 'Ürün başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ error: 'Ürün silinirken hata oluştu' });
  }
}

export default withAuth(handler);
