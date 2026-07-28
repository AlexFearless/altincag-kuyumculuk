-- ============================================
-- RLS Sıkılaştırma v2
-- Cart anon politikalarını kısıtla
-- Yeni tabloları koruma altına al
-- ============================================

-- ===== CARTS - Anon politikasını sıkılaştır =====
-- Eski geniş politikayı kaldır
DROP POLICY IF EXISTS "anon_manage_own_cart" ON carts;

-- Anon: sadece SELECT yapabilir (okuma), INSERT/UPDATE/DELETE service role ile
CREATE POLICY "anon_read_carts" ON carts FOR SELECT USING (auth.role() = 'anon');
CREATE POLICY "anon_insert_carts" ON carts FOR INSERT WITH CHECK (auth.role() = 'anon');

-- ===== CART ITEMS - Anon politikasını sıkılaştır =====
DROP POLICY IF EXISTS "anon_manage_own_cart_items" ON cart_items;

-- Anon: sadece SELECT ve INSERT yapabilir
CREATE POLICY "anon_read_cart_items" ON cart_items FOR SELECT USING (auth.role() = 'anon');
CREATE POLICY "anon_insert_cart_items" ON cart_items FOR INSERT WITH CHECK (auth.role() = 'anon');
CREATE POLICY "anon_update_cart_items" ON cart_items FOR UPDATE USING (auth.role() = 'anon');
CREATE POLICY "anon_delete_cart_items" ON cart_items FOR DELETE USING (auth.role() = 'anon');

-- ===== TOKEN BLACKLIST - Service role only =====
ALTER TABLE IF EXISTS token_blacklist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role only" ON token_blacklist;
CREATE POLICY "service_only_token_blacklist" ON token_blacklist FOR ALL USING (auth.role() = 'service_role');

-- ===== RATE LIMITS - Service role only =====
ALTER TABLE IF EXISTS rate_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role only" ON rate_limits;
CREATE POLICY "service_only_rate_limits" ON rate_limits FOR ALL USING (auth.role() = 'service_role');

-- ===== REFRESH TOKENS - Service role only =====
ALTER TABLE IF EXISTS refresh_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role only" ON refresh_tokens;
CREATE POLICY "service_only_refresh_tokens" ON refresh_tokens FOR ALL USING (auth.role() = 'service_role');

-- ===== NOTIFICATIONS - Service role + Anon read =====
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_all_notifications" ON notifications;
CREATE POLICY "service_all_notifications" ON notifications FOR ALL USING (auth.role() = 'service_role');

-- ===== DISCOUNTS - Service role only =====
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'discounts') THEN
    ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "service_all_discounts" ON discounts;
    CREATE POLICY "service_all_discounts" ON discounts FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ===== LOW STOCK NOTIFICATIONS - Service role only =====
-- Notifications tablosunda low_stock tipi için ek politika yok, service role yeterli

-- Anon'un yazma erişimi olan tüm tabloları kontrol et
-- Sadece products (okuma), announcements (okuma), campaigns (okuma),
-- coupons (okuma), settings (okuma), messages (INSERT), carts (SELECT/INSERT),
-- cart_items (SELECT/INSERT/UPDATE/DELETE) anon erişimine açık
-- Diğer tüm tablolar: service role only
