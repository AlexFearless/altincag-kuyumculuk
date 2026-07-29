-- ============================================
-- AltınÇağ Kuyumculuk - Migration V13
-- CHECK constraint güncellemeleri + eksik kolonlar
-- Supabase Dashboard > SQL Editor'da çalıştır
-- ============================================

-- 1. orders tablosu: payment_status CHECK constraint'ini genişlet
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'havale_bekliyor', 'odendi', 'iptal'));

-- 2. orders tablosu: order_status CHECK constraint'ini genişlet
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_order_status_check
  CHECK (order_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'));

-- 3. orders tablosu: payment_method CHECK constraint'ini genişlet
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('paytr', 'havale', 'kapida', 'kredikarti'));

-- 4. Eksik kolonları ekle (eğer yoksa)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT DEFAULT '';

-- 5. rate_limits tablosu (rate limiter için)
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

-- 6. token_blacklist tablosu
CREATE TABLE IF NOT EXISTS token_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_jti TEXT UNIQUE NOT NULL,
  user_id TEXT,
  user_type TEXT DEFAULT 'user',
  token_type TEXT DEFAULT 'access',
  expires_at TIMESTAMPTZ,
  reason TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_jti ON token_blacklist(token_jti);

-- 7. refresh_tokens tablosu (eğer yoksa)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_type TEXT DEFAULT 'user',
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- 8. RLS politikaları
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON rate_limits;
DROP POLICY IF EXISTS "Service role full access" ON token_blacklist;
DROP POLICY IF EXISTS "Service role full access" ON refresh_tokens;

CREATE POLICY "Service role full access" ON rate_limits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON token_blacklist FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON refresh_tokens FOR ALL USING (true) WITH CHECK (true);

-- 9. Trigger
DROP TRIGGER IF EXISTS update_rate_limits_updated_at ON rate_limits;
CREATE TRIGGER update_rate_limits_updated_at BEFORE UPDATE ON rate_limits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
