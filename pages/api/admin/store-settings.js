import { getDb } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { createLog } from '@/pages/api/admin/logs';

async function handler(req, res) {
  let db;
  try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyin.' }); }

  switch (req.method) {
    case 'GET': return handleGet(db, req, res);
    case 'PUT': return handlePut(db, req, res);
    default: return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(db, req, res) {
  try {
    const { key } = req.query;

    if (key) {
      const { data: setting } = await db.from('store_settings').select('*').eq('key', key).single();
      if (!setting) return res.status(404).json({ error: 'Ayar bulunamadı' });
      return res.status(200).json({ key: setting.key, value: setting.value });
    }

    const { data: settings } = await db.from('store_settings').select('*').order('key', { ascending: true });
    const mapped = {};
    (settings || []).forEach(s => { mapped[s.key] = s.value; });

    res.status(200).json({ settings: mapped });
  } catch (error) {
    console.error('Admin store-settings GET error:', error);
    res.status(500).json({ error: 'Mağaza ayarları yüklenirken hata oluştu' });
  }
}

async function handlePut(db, req, res) {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: 'Ayar anahtarı zorunludur' });

    const { data: existing } = await db.from('store_settings').select('id').eq('key', key).single();

    let result;
    if (existing) {
      result = await db.from('store_settings').update({ value }).eq('key', key).select().single();
    } else {
      result = await db.from('store_settings').insert({ key, value }).select().single();
    }

    if (result.error) throw result.error;

    createLog(db, { action: `Mağaza ayarı güncellendi: ${key}`, adminEmail: req.admin?.email || 'admin', targetType: 'setting', details: { key, value }, req });
    res.status(200).json({ success: true, key, value });
  } catch (error) {
    console.error('Admin store-settings PUT error:', error);
    res.status(500).json({ error: 'Mağaza ayarı güncellenirken hata oluştu' });
  }
}

export default withAuth(handler);
