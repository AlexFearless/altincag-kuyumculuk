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

function mapCampaign(c) {
  return {
    _id: c.id,
    id: c.id,
    name: c.name,
    discountType: c.discount_type,
    discountValue: c.discount_value,
    startDate: c.start_date,
    endDate: c.end_date,
    isActive: c.is_active,
    appliesTo: c.applies_to,
    targetCategory: c.target_category,
    targetProducts: c.target_products || [],
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}

async function handleGet(db, req, res) {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const safeLimit = parseInt(limit) || 50;
    const from = (parseInt(page) - 1) * safeLimit;
    const to = from + safeLimit - 1;

    let query = db.from('campaigns').select('*', { count: 'exact' });
    if (search) query = query.ilike('name', `%${search}%`);

    const { data: campaigns, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    const total = count || 0;
    res.status(200).json({ campaigns: (campaigns || []).map(mapCampaign), total, page: parseInt(page), pages: Math.ceil(total / safeLimit) });
  } catch (error) {
    console.error('Admin campaigns GET error:', error);
    res.status(500).json({ error: 'Kampanyalar yüklenirken hata oluştu' });
  }
}

async function handlePost(db, req, res) {
  try {
    const { name, discountType, discountValue, startDate, endDate, isActive, appliesTo, targetCategory, targetProducts } = req.body;
    if (!name || !discountType || discountValue === undefined || !startDate || !endDate) {
      return res.status(400).json({ error: 'Kampanya adı, indirim tipi, indirim değeri, başlangıç ve bitiş tarihi zorunludur' });
    }
    if (!['percent', 'fixed'].includes(discountType)) {
      return res.status(400).json({ error: 'İndirim tipi percent veya fixed olmalıdır' });
    }
    if (isNaN(Number(discountValue)) || Number(discountValue) < 0) {
      return res.status(400).json({ error: 'Geçersiz indirim değeri' });
    }
    if (!['all', 'category', 'specific_products'].includes(appliesTo || 'all')) {
      return res.status(400).json({ error: 'Geçersiz applies_to değeri' });
    }
    if ((appliesTo || 'all') === 'category' && (!targetCategory || !targetCategory.trim())) {
      return res.status(400).json({ error: 'Kategori kapsam seçildiğinde hedef kategori zorunludur' });
    }

    const { data: campaign, error } = await db
      .from('campaigns')
      .insert({
        name: name.trim(),
        discount_type: discountType,
        discount_value: Number(discountValue),
        start_date: startDate,
        end_date: endDate,
        is_active: isActive !== false,
        applies_to: appliesTo || 'all',
        target_category: (appliesTo || 'all') === 'category' ? targetCategory.trim() : null,
        target_products: targetProducts || [],
      })
      .select()
      .single();

    if (error) throw error;

    if (isActive !== false) {
      const categoryText = (appliesTo || 'all') === 'category' && targetCategory ? ` (${targetCategory})` : '';
      const discountText = discountType === 'percent' ? `%${discountValue}` : `${discountValue} TL`;
      try {
        await db.from('announcements').update({ is_active: false }).eq('is_active', true);
        await db.from('announcements').insert({
          title: `Kampanya: ${name.trim()}`,
          message: `${discountText} indirim${categoryText} - ${new Date(startDate).toLocaleDateString('tr-TR')} ile ${new Date(endDate).toLocaleDateString('tr-TR')} arası geçerli!`,
          bg_color: '#C8A96E',
          text_color: '#FFFFFF',
          is_active: true,
          created_by: req.admin?.email || 'admin',
        });
      } catch (e) { console.error('Campaign announcement error:', e); }
    }

    createLog(db, { action: `Kampanya oluşturuldu: ${campaign.name}`, adminEmail: req.admin?.email || 'admin', targetType: 'campaign', targetId: campaign.id, details: { name: campaign.name, discountType: campaign.discount_type, discountValue: campaign.discount_value }, req });
    res.status(201).json({ success: true, campaign: mapCampaign(campaign) });
  } catch (error) {
    console.error('Admin campaigns POST error:', error?.message || error);
    res.status(500).json({ error: 'Kampanya eklenirken hata oluştu: ' + (error?.message || 'Bilinmeyen hata') });
  }
}

async function handlePut(db, req, res) {
  try {
    const { id, name, discountType, discountValue, startDate, endDate, isActive, appliesTo, targetCategory, targetProducts } = req.body;
    if (!id) return res.status(400).json({ error: 'Kampanya ID zorunludur' });

    const updateData = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (discountType !== undefined) {
      if (!['percent', 'fixed'].includes(discountType)) return res.status(400).json({ error: 'İndirim tipi percent veya fixed olmalıdır' });
      updateData.discount_type = discountType;
    }
    if (discountValue !== undefined) {
      if (isNaN(Number(discountValue)) || Number(discountValue) < 0) return res.status(400).json({ error: 'Geçersiz indirim değeri' });
      updateData.discount_value = Number(discountValue);
    }
    if (startDate !== undefined) updateData.start_date = startDate;
    if (endDate !== undefined) updateData.end_date = endDate;
    if (isActive !== undefined) updateData.is_active = !!isActive;
    if (appliesTo !== undefined) updateData.applies_to = appliesTo;
    if (targetCategory !== undefined) updateData.target_category = (appliesTo === 'category' || updateData.applies_to === 'category') ? (targetCategory || '').trim() || null : null;
    if (targetProducts !== undefined) updateData.target_products = targetProducts;

    updateData.updated_at = new Date().toISOString();

    if (Object.keys(updateData).length === 1) return res.status(400).json({ error: 'Güncellenecek alan belirtilmedi' });

    const { data: campaign, error } = await db
      .from('campaigns')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !campaign) return res.status(404).json({ error: 'Kampanya bulunamadı' });

    createLog(db, { action: `Kampanya güncellendi: ${campaign.name}`, adminEmail: req.admin?.email || 'admin', targetType: 'campaign', targetId: id, details: { name: campaign.name }, req });
    res.status(200).json({ success: true, campaign: mapCampaign(campaign) });
  } catch (error) {
    console.error('Admin campaigns PUT error:', error);
    res.status(500).json({ error: 'Kampanya güncellenirken hata oluştu' });
  }
}

async function handleDelete(db, req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Kampanya ID zorunludur' });

    const { data: campaign } = await db.from('campaigns').select('name').eq('id', id).single();
    if (!campaign) return res.status(404).json({ error: 'Kampanya bulunamadı' });

    await db.from('campaigns').delete().eq('id', id);

    createLog(db, { action: `Kampanya silindi: ${campaign.name}`, adminEmail: req.admin?.email || 'admin', targetType: 'campaign', targetId: id, details: { name: campaign.name }, req });
    res.status(200).json({ success: true, message: 'Kampanya başarıyla silindi' });
  } catch (error) {
    console.error('Admin campaigns DELETE error:', error);
    res.status(500).json({ error: 'Kampanya silinirken hata oluştu' });
  }
}

export default withAuth(handler);
