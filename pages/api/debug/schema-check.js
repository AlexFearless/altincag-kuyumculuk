import { getDb } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let db;
  try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'DB baglantisi kurulamadi' }); }

  try {
    const results = {};

    // Test orders table columns
    const { data: orderTest, error: orderErr } = await db
      .from('orders')
      .insert({
        order_number: 'TEST_' + Date.now(),
        customer_first_name: 'Test',
        customer_last_name: 'Test',
        customer_email: 'test@test.com',
        customer_phone: '05550000000',
        customer_address: 'Test Adres',
        customer_city: 'Istanbul',
        customer_district: 'Test',
        subtotal: 0,
        total_amount: 0,
        payment_method: 'havale',
        payment_status: 'havale_bekliyor',
        order_status: 'pending',
      })
      .select('id')
      .single();

    if (orderErr) {
      results.orders_insert = { ok: false, error: orderErr.message, code: orderErr.code, hint: orderErr.hint };
      if (orderErr.code === '23514') {
        results.migration_needed = true;
        results.migration_url = '/api/debug/run-migration';
      }
    } else {
      results.orders_insert = { ok: true, id: orderTest.id };
      // Clean up test order
      await db.from('orders').delete().eq('id', orderTest.id);
    }

    // Check rate_limits table
    const { error: rlErr } = await db.from('rate_limits').select('id').limit(1);
    results.rate_limits_exists = !rlErr;

    // Check token_blacklist table
    const { error: tbErr } = await db.from('token_blacklist').select('id').limit(1);
    results.token_blacklist_exists = !tbErr;

    // Check refresh_tokens table
    const { error: rtErr } = await db.from('refresh_tokens').select('id').limit(1);
    results.refresh_tokens_exists = !rtErr;

    res.status(200).json(results);
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: 'Debug failed', details: error.message });
  }
}
