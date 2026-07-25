import { getDb, getDbPublic } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { createLog } from '@/pages/api/admin/logs';

async function handler(req, res) {
  let db;
  try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'Veritabanı bağlantısı kurulamadı' }); }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Yetki gerekli' });
  }

  switch (req.method) {
    case 'GET': return handleGet(db, req, res);
    case 'PUT': return handlePut(db, req, res);
    case 'POST': return handleRefresh(db, req, res);
    default: return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(db, req, res) {
  try {
    const { data: setting, error } = await db.from('settings').select('*').eq('key', 'gold_price').single();
    if (error && error.code === '42P01') {
      return res.status(200).json({ success: true, settings: { autoUpdate: false, apiKey: '', lastPrice: 0, lastUpdate: null, source: 'manual' }, currentPrice: null, needsMigration: true });
    }
    const value = setting?.value || { autoUpdate: false, apiKey: '', lastPrice: 0, lastUpdate: null, source: 'manual' };

    let currentPrice = null;
    if (value.apiKey && value.autoUpdate) {
      try {
        // Önce GRAM (gram altın) dene, yoksa ALTIN (has altın) kullan
        let response = await fetch('https://altinapi.com/api/v1/prices/GRAM', {
          headers: { 'X-API-Key': value.apiKey },
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          response = await fetch('https://altinapi.com/api/v1/prices/ALTIN', {
            headers: { 'X-API-Key': value.apiKey },
            signal: AbortSignal.timeout(10000),
          });
        }

        if (response.ok) {
          const data = await response.json();
          currentPrice = {
            bid: data.bid,
            ask: data.ask,
            symbol: data.symbol,
            timestamp: data.timestamp,
          };
        }
      } catch (e) {
        console.error('Gold price fetch error:', e.message);
      }
    }

    res.status(200).json({ success: true, settings: value, currentPrice });
  } catch (error) {
    console.error('Gold price GET error:', error);
    res.status(500).json({ error: 'Altın fiyatı bilgisi alınamadı' });
  }
}

async function handlePut(db, req, res) {
  try {
    const { autoUpdate, apiKey, manualPrice } = req.body;

    const { data: existing } = await db.from('settings').select('value').eq('key', 'gold_price').single();
    const current = existing?.value || {};

    const newValue = {
      ...current,
      autoUpdate: autoUpdate !== undefined ? !!autoUpdate : current.autoUpdate,
      apiKey: apiKey !== undefined ? String(apiKey) : current.apiKey,
    };

    if (manualPrice !== undefined && !newValue.autoUpdate) {
      newValue.lastPrice = Number(manualPrice);
      newValue.lastUpdate = new Date().toISOString();
      newValue.source = 'manual';
    }

    const row = { key: 'gold_price', value: newValue, updated_at: new Date().toISOString() };

    // Önce insert dene, olmazsa update yap
    const { error: insertError } = await db.from('settings').insert(row);
    if (insertError) {
      const { error: updateError } = await db.from('settings').update({ value: newValue, updated_at: new Date().toISOString() }).eq('key', 'gold_price');
      if (updateError) {
        console.error('Settings update error:', updateError);
        return res.status(500).json({ error: 'Ayarlar güncellenemedi. Supabase SQL Editor\'da scripts/supabase-migration-v5.sql dosyasını çalıştırın.' });
      }
    }

    createLog(db, {
      action: 'Altın fiyatı ayarları güncellendi',
      adminEmail: req.admin?.email || 'admin',
      targetType: 'system',
      details: { autoUpdate: newValue.autoUpdate, source: newValue.source },
      req,
    });

    res.status(200).json({ success: true, settings: newValue });
  } catch (error) {
    console.error('Gold price PUT error:', error);
    res.status(500).json({ error: 'Ayarlar güncellenemedi. Supabase SQL Editor\'da scripts/supabase-migration-v5.sql dosyasını çalıştırın.' });
  }
}

async function handleRefresh(db, req, res) {
  try {
    const { data: existing } = await db.from('settings').select('value').eq('key', 'gold_price').single();
    const current = existing?.value || {};

    if (!current.apiKey) {
      return res.status(400).json({ error: 'API anahtarı tanımlı değil' });
    }

    // Önce GRAM (gram altın) dene, yoksa ALTIN (has altın) kullan
    let response = await fetch('https://altinapi.com/api/v1/prices/GRAM', {
      headers: { 'X-API-Key': current.apiKey },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      response = await fetch('https://altinapi.com/api/v1/prices/ALTIN', {
        headers: { 'X-API-Key': current.apiKey },
        signal: AbortSignal.timeout(10000),
      });
    }

    if (!response.ok) {
      return res.status(502).json({ error: `API hatası: ${response.status}` });
    }

    const data = await response.json();
    const price = data.bid || data.ask || 0;

    const newValue = {
      ...current,
      lastPrice: Number(price),
      lastUpdate: new Date().toISOString(),
      source: 'api',
    };

    // upsert yerine insert/update kullan (RLS sorunlarını önler)
    const row = { key: 'gold_price', value: newValue, updated_at: new Date().toISOString() };
    const { error: insertError } = await db.from('settings').insert(row);
    if (insertError) {
      await db.from('settings').update({ value: newValue, updated_at: new Date().toISOString() }).eq('key', 'gold_price');
    }

    createLog(db, {
      action: 'Altın fiyatı manuel yenilendi',
      adminEmail: req.admin?.email || 'admin',
      targetType: 'system',
      details: { price, symbol: data.symbol, source: 'api' },
      req,
    });

    res.status(200).json({ success: true, price: { bid: data.bid, ask: data.ask, symbol: data.symbol } });
  } catch (error) {
    console.error('Gold price refresh error:', error);
    res.status(500).json({ error: 'Fiyat yenilenemedi' });
  }
}

export default withAuth(handler);
