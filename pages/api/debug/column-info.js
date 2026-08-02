import { getDb } from '@/lib/supabase';
import { withAdminRole } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

const limiter = rateLimit({ windowMs: 300000, max: 3, message: 'Çok fazla istek.' });

async function handler(req, res) {
  if (!(await limiter(req, res))) return;

  let db;
  try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'DB baglantisi kurulamadi' }); }

  try {
    const { data: testInsert, error: insertErr } = await db
      .from('products')
      .insert({ name: '__karat_test_8', price: 0, category: 'yuzuk', karat: '8', stock: 0 })
      .select('id, karat')
      .single();

    if (insertErr) {
      console.error('[column-info] insert test failed:', insertErr);
      return res.status(200).json({ karat_8_supported: false });
    }

    await db.from('products').delete().eq('id', testInsert.id);
    console.log('[column-info] karat 8 supported, inserted and deleted id:', testInsert.id);
    res.status(200).json({ karat_8_supported: true, insertedKarat: testInsert.karat });
  } catch (error) {
    console.error('[column-info] error:', error);
    res.status(500).json({ error: 'Debug failed' });
  }
}

export default withAdminRole()(handler);
