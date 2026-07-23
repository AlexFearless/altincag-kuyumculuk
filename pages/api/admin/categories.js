import { getDb } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { createLog } from '@/pages/api/admin/logs';

function generateSlug(name) {
  const charMap = { 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ı': 'i', 'ö': 'o', 'ç': 'c', 'Ğ': 'g', 'Ü': 'u', 'Ş': 's', 'İ': 'i', 'Ö': 'o', 'Ç': 'c' };
  return name
    .trim()
    .split('')
    .map(c => charMap[c] || c)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function handler(req, res) {
  let db;
  try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyin.' }); }

  switch (req.method) {
    case 'GET': return handleGet(db, req, res);
    case 'POST': return handlePost(db, req, res);
    case 'PUT': return handlePut(db, req, res);
    case 'DELETE': return handleDelete(db, req, res);
    default: return res.status(405).json({ error: 'Method not allowed' });
  }
}

function mapCategory(c) {
  return {
    _id: c.id,
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    image: c.image,
    sortOrder: c.sort_order,
    isActive: c.is_active,
  };
}

async function handleGet(db, req, res) {
  try {
    const { data: categories } = await db
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    res.status(200).json({ categories: (categories || []).map(mapCategory), total: (categories || []).length });
  } catch (error) {
    console.error('Admin categories GET error:', error);
    res.status(500).json({ error: 'Kategoriler yüklenirken hata oluştu' });
  }
}

async function handlePost(db, req, res) {
  try {
    const { name, slug, description, image, sortOrder, isActive } = req.body;
    if (!name) return res.status(400).json({ error: 'Kategori adı zorunludur' });

    const finalSlug = slug || generateSlug(name);
    const { data: existing } = await db.from('categories').select('id').eq('slug', finalSlug).single();
    if (existing) return res.status(400).json({ error: 'Bu slug zaten kullanımda' });

    const { data: category, error } = await db
      .from('categories')
      .insert({
        name: name.trim(),
        slug: finalSlug,
        description: description || '',
        image: image || '',
        sort_order: Number(sortOrder) || 0,
        is_active: isActive !== false,
      })
      .select()
      .single();

    if (error) throw error;

    createLog(db, { action: `Kategori oluşturuldu: ${category.name}`, adminEmail: req.admin?.email || 'admin', targetType: 'category', targetId: category.id, details: { name: category.name, slug: category.slug }, req });
    res.status(201).json({ success: true, category: mapCategory(category) });
  } catch (error) {
    console.error('Admin categories POST error:', error);
    res.status(500).json({ error: 'Kategori eklenirken hata oluştu' });
  }
}

async function handlePut(db, req, res) {
  try {
    const { id, name, slug, description, image, sortOrder, isActive } = req.body;
    if (!id) return res.status(400).json({ error: 'Kategori ID zorunludur' });

    const updateData = {};
    if (name !== undefined) {
      updateData.name = String(name).trim();
      if (!slug) updateData.slug = generateSlug(String(name).trim());
    }
    if (slug !== undefined) updateData.slug = String(slug).trim();
    if (description !== undefined) updateData.description = String(description);
    if (image !== undefined) updateData.image = String(image);
    if (sortOrder !== undefined) updateData.sort_order = Number(sortOrder) || 0;
    if (isActive !== undefined) updateData.is_active = !!isActive;

    if (Object.keys(updateData).length === 0) return res.status(400).json({ error: 'Güncellenecek alan belirtilmedi' });

    if (updateData.slug) {
      const { data: existing } = await db.from('categories').select('id').eq('slug', updateData.slug).neq('id', id).single();
      if (existing) return res.status(400).json({ error: 'Bu slug zaten kullanımda' });
    }

    const { data: category, error } = await db
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !category) return res.status(404).json({ error: 'Kategori bulunamadı' });

    createLog(db, { action: `Kategori güncellendi: ${category.name}`, adminEmail: req.admin?.email || 'admin', targetType: 'category', targetId: id, details: { name: category.name }, req });
    res.status(200).json({ success: true, category: mapCategory(category) });
  } catch (error) {
    console.error('Admin categories PUT error:', error);
    res.status(500).json({ error: 'Kategori güncellenirken hata oluştu' });
  }
}

async function handleDelete(db, req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Kategori ID zorunludur' });

    const { data: category } = await db.from('categories').select('name').eq('id', id).single();
    if (!category) return res.status(404).json({ error: 'Kategori bulunamadı' });

    await db.from('categories').delete().eq('id', id);

    createLog(db, { action: `Kategori silindi: ${category.name}`, adminEmail: req.admin?.email || 'admin', targetType: 'category', targetId: id, details: { name: category.name }, req });
    res.status(200).json({ success: true, message: 'Kategori başarıyla silindi' });
  } catch (error) {
    console.error('Admin categories DELETE error:', error);
    res.status(500).json({ error: 'Kategori silinirken hata oluştu' });
  }
}

export default withAuth(handler);
