import { supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { createLog } from '@/pages/api/admin/logs';
import { sanitize } from '@/lib/sanitize';

async function handler(req, res) {
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
    const safeLimit = parseInt(limit) || 50;
    const from = (parseInt(page) - 1) * safeLimit;
    const to = from + safeLimit - 1;

    let query = supabaseAdmin.from('products').select('*', { count: 'exact' });

    if (category) query = query.eq('category', category);
    if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);

    const { data: products, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    const total = count || 0;
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

    res.status(200).json({ products: mapped, total, page: parseInt(page), pages: Math.ceil(total / safeLimit) });
  } catch (error) {
    console.error('Admin products GET error:', error);
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

    const filteredImages = Array.isArray(images) ? images.filter(img => typeof img === 'string' && img.length < 2000).slice(0, 10) : [];

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert({
        name: sanitize(name.trim()),
        description: sanitize(description || ''),
        price: Number(price),
        category,
        images: filteredImages,
        stock: Number(stock) || 0,
        karat: karat || '',
        weight: Number(weight) || 0,
        material: sanitize(material || ''),
        is_featured: !!isFeatured,
        discount_percent: Number(discountPercent) || 0,
        discount_type: discountType || '',
      })
      .select()
      .single();

    if (error) throw error;

    createLog({ action: 'Ürün eklendi', adminEmail: req.admin?.email || 'admin', targetType: 'product', targetId: product.id, details: { name: product.name, price: product.price, category }, req });
    res.status(201).json({ success: true, product: { ...product, _id: product.id, discountedPrice: product.discounted_price, isActive: product.is_active, isFeatured: product.is_featured, discountPercent: product.discount_percent, discountType: product.discount_type, createdAt: product.created_at } });
  } catch (error) {
    console.error('Admin products POST error:', error);
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
    if (isFeatured !== undefined) updateData.is_featured = !!isFeatured;
    if (discountPercent !== undefined) updateData.discount_percent = Math.min(100, Math.max(0, Number(discountPercent) || 0));
    if (discountType !== undefined) updateData.discount_type = ['real', 'fake', ''].includes(discountType) ? discountType : '';
    if (isActive !== undefined) updateData.is_active = !!isActive;

    if (Object.keys(updateData).length === 0) return res.status(400).json({ error: 'Güncellenecek alan belirtilmedi' });

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !product) return res.status(404).json({ error: 'Ürün bulunamadı' });

    createLog({ action: 'Ürün güncellendi', adminEmail: req.admin?.email || 'admin', targetType: 'product', targetId: id, details: { name: product.name }, req });
    res.status(200).json({ success: true, product: { ...product, _id: product.id, discountedPrice: product.discounted_price, isActive: product.is_active, isFeatured: product.is_featured, discountPercent: product.discount_percent, discountType: product.discount_type, createdAt: product.created_at } });
  } catch (error) {
    console.error('Admin products PUT error:', error);
    res.status(500).json({ error: 'Ürün güncellenirken hata oluştu' });
  }
}

async function handleDelete(req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Ürün ID zorunludur' });

    const { data: product } = await supabaseAdmin.from('products').select('name').eq('id', id).single();
    if (!product) return res.status(404).json({ error: 'Ürün bulunamadı' });

    await supabaseAdmin.from('products').delete().eq('id', id);

    createLog({ action: 'Ürün silindi', adminEmail: req.admin?.email || 'admin', targetType: 'product', targetId: id, details: { name: product.name }, req });
    res.status(200).json({ success: true, message: 'Ürün başarıyla silindi' });
  } catch (error) {
    console.error('Admin products DELETE error:', error);
    res.status(500).json({ error: 'Ürün silinirken hata oluştu' });
  }
}

export default withAuth(handler);
