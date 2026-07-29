import { supabaseAdmin } from './supabase';

let _rateLimitsReady = null;
let _rateLimitsCreating = false;

async function ensureRateLimitsTable() {
  if (_rateLimitsReady === true) return true;
  if (_rateLimitsReady === false) return false;
  if (_rateLimitsCreating) return false;

  _rateLimitsCreating = true;
  try {
    const { error } = await supabaseAdmin.from('rate_limits').select('id').limit(1);
    if (!error) {
      _rateLimitsReady = true;
      return true;
    }
    if (error.code === '42P01') {
      const { error: createErr } = await supabaseAdmin.rpc('exec_sql', {
        sql_text: `
          CREATE TABLE IF NOT EXISTS rate_limits (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            key TEXT UNIQUE NOT NULL,
            window_start TIMESTAMPTZ DEFAULT now(),
            attempts INTEGER DEFAULT 1,
            locked_until TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
          );
          CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);
          ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
          DROP POLICY IF EXISTS "Service role full access" ON rate_limits;
          CREATE POLICY "Service role full access" ON rate_limits FOR ALL USING (true) WITH CHECK (true);
        `
      });
      if (!createErr) {
        _rateLimitsReady = true;
        return true;
      }
    }
    _rateLimitsReady = false;
    return false;
  } catch {
    _rateLimitsReady = false;
    return false;
  } finally {
    _rateLimitsCreating = false;
  }
}

function getClientIp(req) {
  const raw = req.socket?.remoteAddress;
  if (raw) {
    const ip = raw.replace(/^::ffff:/, '');
    if (ip && /^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return ip;
    if (ip === '127.0.0.1' || ip === '::1') return '127.0.0.1';
  }
  return 'unknown';
}

const _memoryStore = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of _memoryStore.entries()) {
    if (now - entry.start > 120000) _memoryStore.delete(key);
  }
}, 60000);

function memoryRateLimit(key, windowMs, max) {
  const now = Date.now();
  const entry = _memoryStore.get(key);
  if (!entry || now - entry.start > windowMs) {
    _memoryStore.set(key, { start: now, count: 1 });
    return { allowed: true, count: 1 };
  }
  entry.count++;
  return { allowed: entry.count <= max, count: entry.count };
}

export function rateLimit({ windowMs = 60000, max = 10, message = 'Çok fazla deneme. Lütfen bekleyin.' } = {}) {
  return async (req, res) => {
    if (!supabaseAdmin) {
      return true;
    }

    const ip = getClientIp(req);
    const pathname = req.url ? req.url.split('?')[0] : '/';
    const key = `rl:${ip}:${pathname}`;

    const tableReady = await ensureRateLimitsTable();
    if (!tableReady) {
      const { allowed } = memoryRateLimit(key, windowMs, max);
      if (!allowed) {
        res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
        res.status(429).json({ error: message, retryAfter: Math.ceil(windowMs / 1000) });
        return false;
      }
      return true;
    }

    try {
      const { data: record } = await supabaseAdmin
        .from('rate_limits')
        .select('*')
        .eq('key', key)
        .single();

      const now = new Date();

      if (!record) {
        await supabaseAdmin.from('rate_limits').insert({
          key,
          window_start: now.toISOString(),
          attempts: 1,
        });
        return true;
      }

      const recordTime = new Date(record.window_start).getTime();
      if (now.getTime() - recordTime > windowMs) {
        await supabaseAdmin
          .from('rate_limits')
          .update({ window_start: now.toISOString(), attempts: 1, updated_at: now.toISOString() })
          .eq('key', key);
        return true;
      }

      if (record.locked_until && new Date(record.locked_until) > now) {
        const retryAfter = Math.ceil((new Date(record.locked_until).getTime() - now.getTime()) / 1000);
        res.setHeader('Retry-After', retryAfter);
        res.status(429).json({ error: message, retryAfter });
        return false;
      }

      const newCount = (record.attempts || 0) + 1;
      if (newCount > max) {
        const retryAfter = Math.ceil((recordTime + windowMs - now.getTime()) / 1000);
        res.setHeader('Retry-After', retryAfter);
        res.status(429).json({ error: message, retryAfter });
        return false;
      }

      await supabaseAdmin
        .from('rate_limits')
        .update({ attempts: newCount, updated_at: now.toISOString() })
        .eq('key', key);

      return true;
    } catch (error) {
      console.error('Rate limit error:', error.message);
      const { allowed } = memoryRateLimit(key, windowMs, max);
      if (!allowed) {
        res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
        res.status(429).json({ error: message, retryAfter: Math.ceil(windowMs / 1000) });
        return false;
      }
      return true;
    }
  };
}

export async function checkAccountLockout(identifier) {
  if (!supabaseAdmin) return { locked: false, remainingSeconds: 0 };

  const tableReady = await ensureRateLimitsTable();
  if (!tableReady) return { locked: false, remainingSeconds: 0 };

  try {
    const { data: record } = await supabaseAdmin
      .from('rate_limits')
      .select('*')
      .eq('key', `lockout:${identifier}`)
      .single();

    if (!record) return { locked: false, remainingSeconds: 0 };

    const now = new Date();
    if (record.locked_until && new Date(record.locked_until) > now) {
      const remainingSeconds = Math.ceil((new Date(record.locked_until).getTime() - now.getTime()) / 1000);
      return { locked: true, remainingSeconds };
    }

    if (record.locked_until && new Date(record.locked_until) <= now) {
      await supabaseAdmin.from('rate_limits').delete().eq('key', `lockout:${identifier}`);
    }

    return { locked: false, remainingSeconds: 0 };
  } catch {
    return { locked: false, remainingSeconds: 0 };
  }
}

export async function recordFailedAttempt(identifier, maxAttempts = 5, lockoutMinutes = 15) {
  if (!supabaseAdmin) return { attempts: 1, locked: false };

  const tableReady = await ensureRateLimitsTable();
  if (!tableReady) return { attempts: 1, locked: false };

  try {
    const key = `lockout:${identifier}`;
    const { data: record } = await supabaseAdmin
      .from('rate_limits')
      .select('*')
      .eq('key', key)
      .single();

    const now = new Date();

    if (!record) {
      await supabaseAdmin.from('rate_limits').insert({
        key,
        window_start: now.toISOString(),
        attempts: 1,
      });
      return { attempts: 1, locked: false };
    }

    if (record.locked_until && new Date(record.locked_until) <= now) {
      await supabaseAdmin
        .from('rate_limits')
        .update({ attempts: 1, locked_until: null, window_start: now.toISOString(), updated_at: now.toISOString() })
        .eq('key', key);
      return { attempts: 1, locked: false };
    }

    const newAttempts = (record.attempts || 0) + 1;
    const updateData = { attempts: newAttempts, updated_at: now.toISOString() };

    if (newAttempts >= maxAttempts) {
      const lockedUntil = new Date(now.getTime() + lockoutMinutes * 60 * 1000).toISOString();
      updateData.locked_until = lockedUntil;
    }

    await supabaseAdmin
      .from('rate_limits')
      .update(updateData)
      .eq('key', key);

    return { attempts: newAttempts, locked: newAttempts >= maxAttempts };
  } catch (error) {
    console.error('Failed attempt recording error:', error.message);
    return { attempts: 1, locked: false };
  }
}

export async function clearFailedAttempts(identifier) {
  if (!supabaseAdmin) return;
  try {
    await supabaseAdmin.from('rate_limits').delete().eq('key', `lockout:${identifier}`);
  } catch {}
}
