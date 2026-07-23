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

function mapCoupon(c) {
  return {
    _id: c.id,
    id: c.id,
    code: c.code,
    description: c.description,
    discountType: c.discount_type,
    discountValue: c.discount_value,
    minOrderAmount: c.min_order_amount,
    maxUses: c.max_uses,
    usedCount: c.used_count,
    isActive: c.is_active,
    expiresAt: c.expires_at,
    createdAt: c.created_at,
  };
}

async function handleGet(db, req, res) {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const safeLimit = parseInt(limit) || 50;
    const from = (parseInt(page) - 1) * safeLimit;
    const to = from + safeLimit - 1;

    let query = db.from('coupons').select('*', { count: 'exact' });
    if (search) query = query.ilike('code', `%${search}%`);

    const { data: coupons, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    const total = count || 0;
    res.status(200).json({ coupons: (coupons || []).map(mapCoupon), total, page: parseInt(page), pages: Math.ceil(total / safeLimit) });
  } catch (error) {
    console.error('Admin coupons GET error:', error);
    res.status(500).json({ error: 'Kuponlar yüklenirken hata oluştu' });
  }
}

async function handlePost(db, req, res) {
  try {
    const { code, description, discountType, discountValue, minOrderAmount, maxUses, isActive, expiresAt } = req.body;
    if (!code || !discountType || discountValue === undefined) {
      return res.status(400).json({ error: 'Kupon kodu, indirim tipi ve indirim değeri zorunludur' });
    }
    if (!['percent', 'fixed'].includes(discountType)) {
      return res.status(400).json({ error: 'İndirim tipi percent veya fixed olmalıdır' });
    }
    if (isNaN(Number(discountValue)) || Number(discountValue) < 0) {
      return res.status(400).json({ error: 'Geçersiz indirim değeri' });
    }

    const { data: existing } = await db.from('coupons').select('id').ilike('code', code.trim()).single();
    if (existing) return res.status(400).json({ error: 'Bu kupon kodu zaten mevcut' });

    const { data: coupon, error } = await db
      .from('coupons')
      .insert({
        code: code.trim().toUpperCase(),
        description: description || '',
        discount_type: discountType,
        discount_value: Number(discountValue),
        min_order_amount: Number(minOrderAmount) || 0,
        max_uses: Number(maxUses) || null,
        is_active: isActive !== false,
        expires_at: expiresAt || null,
      })
      .select()
      .single();

    if (error) throw error;

    createLog(db, { action: `Kupon oluşturuldu: ${coupon.code}`, adminEmail: req.admin?.email || 'admin', targetType: 'coupon', targetId: coupon.id, details: { code: coupon.code, discountType: coupon.discount_type, discountValue: coupon.discount_value }, req });
    res.status(201).json({ success: true, coupon: mapCoupon(coupon) });
  } catch (error) {
    console.error('Admin coupons POST error:', error);
    res.status(500).json({ error: 'Kupon eklenirken hata oluştu' });
  }
}

async function handlePut(db, req, res) {
  try {
    const { id, code, description, discountType, discountValue, minOrderAmount, maxUses, isActive, expiresAt } = req.body;
    if (!id) return res.status(400).json({ error: 'Kupon ID zorunludur' });

    const updateData = {};
    if (code !== undefined) updateData.code = String(code).trim().toUpperCase();
    if (description !== undefined) updateData.description = String(description);
    if (discountType !== undefined) {
      if (!['percent', 'fixed'].includes(discountType)) return res.status(400).json({ error: 'İndirim tipi percent veya fixed olmalıdır' });
      updateData.discount_type = discountType;
    }
    if (discountValue !== undefined) {
      if (isNaN(Number(discountValue)) || Number(discountValue) < 0) return res.status(400).json({ error: 'Geçersiz indirim değeri' });
      updateData.discount_value = Number(discountValue);
    }
    if (minOrderAmount !== undefined) updateData.min_order_amount = Number(minOrderAmount) || 0;
    if (maxUses !== undefined) updateData.max_uses = Number(maxUses) || null;
    if (isActive !== undefined) updateData.is_active = !!isActive;
    if (expiresAt !== undefined) updateData.expires_at = expiresAt || null;

    if (Object.keys(updateData).length === 0) return res.status(400).json({ error: 'Güncellenecek alan belirtilmedi' });

    const { data: coupon, error } = await db
      .from('coupons')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !coupon) return res.status(404).json({ error: 'Kupon bulunamadı' });

    createLog(db, { action: `Kupon güncellendi: ${coupon.code}`, adminEmail: req.admin?.email || 'admin', targetType: 'coupon', targetId: id, details: { code: coupon.code }, req });
    res.status(200).json({ success: true, coupon: mapCoupon(coupon) });
  } catch (error) {
    console.error('Admin coupons PUT error:', error);
    res.status(500).json({ error: 'Kupon güncellenirken hata oluştu' });
  }
}

async function handleDelete(db, req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Kupon ID zorunludur' });

    const { data: coupon } = await db.from('coupons').select('code').eq('id', id).single();
    if (!coupon) return res.status(404).json({ error: 'Kupon bulunamadı' });

    await db.from('coupons').delete().eq('id', id);

    createLog(db, { action: `Kupon silindi: ${coupon.code}`, adminEmail: req.admin?.email || 'admin', targetType: 'coupon', targetId: id, details: { code: coupon.code }, req });
    res.status(200).json({ success: true, message: 'Kupon başarıyla silindi' });
  } catch (error) {
    console.error('Admin coupons DELETE error:', error);
    res.status(500).json({ error: 'Kupon silinirken hata oluştu' });
  }
}

export default withAuth(handler);
