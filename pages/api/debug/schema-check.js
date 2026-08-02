import { getDb } from '@/lib/supabase';
import { withAdminRole } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

const debugLimiter = rateLimit({ windowMs: 300000, max: 3, message: 'Çok fazla istek. 5 dakika bekleyin.' });

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await debugLimiter(req, res))) return;

  let db;
  try { db = getDb(); } catch (e) { return res.status(503).json({ error: 'DB baglantisi kurulamadi' }); }

  try {
    const results = {};

    const { error: rlErr } = await db.from('rate_limits').select('id').limit(1);
    results.rate_limits_ok = !rlErr;

    const { error: tbErr } = await db.from('token_blacklist').select('id').limit(1);
    results.token_blacklist_ok = !tbErr;

    const { error: rtErr } = await db.from('refresh_tokens').select('id').limit(1);
    results.refresh_tokens_ok = !rtErr;

    res.status(200).json(results);
  } catch (error) {
    console.error('Debug error:', error.code);
    res.status(500).json({ error: 'Debug failed' });
  }
}

export default withAdminRole()(handler);
