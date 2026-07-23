import { getDb } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { createLog } from '@/pages/api/admin/logs';

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

function mapBanner(b) {
  return {
    _id: b.id,
    id: b.id,
    title: b.title,
    subtitle: b.subtitle,
    link: b.link,
    image: b.image,
    sortOrder: b.sort_order,
    isActive: b.is_active,
    createdAt: b.created_at,
  };
}

async function handleGet(db, req, res) {
  try {
    const { data: banners } = await db
      .from('banners')
      .select('*')
      .order('sort_order', { ascending: true });

    res.status(200).json({ banners: (banners || []).map(mapBanner), total: (banners || []).length });
  } catch (error) {
    console.error('Admin banners GET error:', error);
    res.status(500).json({ error: 'Bannerlar yüklenirken hata oluştu' });
  }
}

async function handlePost(db, req, res) {
  try {
    const { title, subtitle, link, image, sortOrder, isActive } = req.body;
    if (!title || !image) return res.status(400).json({ error: 'Banner başlığı ve görseli zorunludur' });

    const { data: banner, error } = await db
      .from('banners')
      .insert({
        title: title.trim(),
        subtitle: subtitle || '',
        link: link || '',
        image,
        sort_order: Number(sortOrder) || 0,
        is_active: isActive !== false,
      })
      .select()
      .single();

    if (error) throw error;

    createLog(db, { action: `Banner oluşturuldu: ${banner.title}`, adminEmail: req.admin?.email || 'admin', targetType: 'banner', targetId: banner.id, details: { title: banner.title }, req });
    res.status(201).json({ success: true, banner: mapBanner(banner) });
  } catch (error) {
    console.error('Admin banners POST error:', error);
    res.status(500).json({ error: 'Banner eklenirken hata oluştu' });
  }
}

async function handlePut(db, req, res) {
  try {
    const { id, title, subtitle, link, image, sortOrder, isActive } = req.body;
    if (!id) return res.status(400).json({ error: 'Banner ID zorunludur' });

    const updateData = {};
    if (title !== undefined) updateData.title = String(title).trim();
    if (subtitle !== undefined) updateData.subtitle = String(subtitle);
    if (link !== undefined) updateData.link = String(link);
    if (image !== undefined) updateData.image = String(image);
    if (sortOrder !== undefined) updateData.sort_order = Number(sortOrder) || 0;
    if (isActive !== undefined) updateData.is_active = !!isActive;

    if (Object.keys(updateData).length === 0) return res.status(400).json({ error: 'Güncellenecek alan belirtilmedi' });

    const { data: banner, error } = await db
      .from('banners')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !banner) return res.status(404).json({ error: 'Banner bulunamadı' });

    createLog(db, { action: `Banner güncellendi: ${banner.title}`, adminEmail: req.admin?.email || 'admin', targetType: 'banner', targetId: id, details: { title: banner.title }, req });
    res.status(200).json({ success: true, banner: mapBanner(banner) });
  } catch (error) {
    console.error('Admin banners PUT error:', error);
    res.status(500).json({ error: 'Banner güncellenirken hata oluştu' });
  }
}

async function handleDelete(db, req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Banner ID zorunludur' });

    const { data: banner } = await db.from('banners').select('title').eq('id', id).single();
    if (!banner) return res.status(404).json({ error: 'Banner bulunamadı' });

    await db.from('banners').delete().eq('id', id);

    createLog(db, { action: `Banner silindi: ${banner.title}`, adminEmail: req.admin?.email || 'admin', targetType: 'banner', targetId: id, details: { title: banner.title }, req });
    res.status(200).json({ success: true, message: 'Banner başarıyla silindi' });
  } catch (error) {
    console.error('Admin banners DELETE error:', error);
    res.status(500).json({ error: 'Banner silinirken hata oluştu' });
  }
}

export default withAuth(handler);
