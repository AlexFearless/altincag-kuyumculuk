-- Token blacklist table for JWT revocation
-- Once a token is blacklisted, it cannot be used even if not expired

CREATE TABLE IF NOT EXISTS token_blacklist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_jti TEXT NOT NULL UNIQUE,       -- JWT jti claim (unique identifier)
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL DEFAULT 'user', -- 'user' or 'admin'
  token_type TEXT NOT NULL DEFAULT 'access', -- 'access' or 'refresh'
  expires_at TIMESTAMPTZ NOT NULL,       -- When the original token expires
  blacklisted_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT                            -- 'logout', 'admin_revoke', 'security'
);

-- Index for fast lookups during token verification
CREATE INDEX IF NOT EXISTS idx_token_blacklist_jti ON token_blacklist(token_jti);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);

-- Auto-cleanup: delete expired blacklist entries (run periodically)
-- Expired tokens are already invalid, no need to keep them in blacklist
CREATE OR REPLACE FUNCTION cleanup_expired_blacklist()
RETURNS void AS $$
BEGIN
  DELETE FROM token_blacklist WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE token_blacklist ENABLE ROW LEVEL SECURITY;

-- Only service role can access (no anon/user access)
CREATE POLICY "Service role only" ON token_blacklist
  FOR ALL
  USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON token_blacklist TO service_role;
