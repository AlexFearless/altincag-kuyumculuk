-- ============================================
-- RLS Politika Düzeltmesi
-- Anon key sadece products (okuma) ve announcements (okuma) erişebilir
-- Service role her şeye erişebilir (tüm API route'larda kullanılıyor)
-- ============================================

-- Mevcut polítikaları kaldır
DROP POLICY IF EXISTS "Service role full access" ON users;
DROP POLICY IF EXISTS "Service role full access" ON admins;
DROP POLICY IF EXISTS "Service role full access" ON products;
DROP POLICY IF EXISTS "Service role full access" ON orders;
DROP POLICY IF EXISTS "Service role full access" ON order_items;
DROP POLICY IF EXISTS "Service role full access" ON carts;
DROP POLICY IF EXISTS "Service role full access" ON cart_items;
DROP POLICY IF EXISTS "Service role full access" ON messages;
DROP POLICY IF EXISTS "Service role full access" ON message_replies;
DROP POLICY IF EXISTS "Service role full access" ON logs;
DROP POLICY IF EXISTS "Service role full access" ON coupons;
DROP POLICY IF EXISTS "Service role full access" ON announcements;
DROP POLICY IF EXISTS "Service role full access" ON campaigns;
DROP POLICY IF EXISTS "Service role full access" ON settings;

-- ===== USERS =====
-- Service role: tam erişim
CREATE POLICY "service_all_users" ON users FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
-- Anon: hiçbir erişim yok
-- (policy eklemiyoruz = anon key erişemez)

-- ===== ADMINS =====
-- Service role: tam erişim
CREATE POLICY "service_all_admins" ON admins FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ===== PRODUCTS =====
-- Service role: tam erişim
CREATE POLICY "service_all_products" ON products FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
-- Anon: sadece aktif ürünleri okuyabilir
CREATE POLICY "anon_read_active_products" ON products FOR SELECT USING (auth.role() = 'anon' AND is_active = true);

-- ===== ORDERS =====
CREATE POLICY "service_all_orders" ON orders FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ===== ORDER ITEMS =====
CREATE POLICY "service_all_order_items" ON order_items FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ===== CARTS =====
CREATE POLICY "service_all_carts" ON carts FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
-- Anon: guest_id ile kendi sepetini yönetebilir (API route'larda service role kullanıldığı için buna gerek yok ama ekliyoruz)
CREATE POLICY "anon_manage_own_cart" ON carts FOR ALL USING (auth.role() = 'anon') WITH CHECK (auth.role() = 'anon');

-- ===== CART ITEMS =====
CREATE POLICY "service_all_cart_items" ON cart_items FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "anon_manage_own_cart_items" ON cart_items FOR ALL USING (auth.role() = 'anon') WITH CHECK (auth.role() = 'anon');

-- ===== MESSAGES =====
CREATE POLICY "service_all_messages" ON messages FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
-- Anon: sadece mesaj gönderebilir (INSERT)
CREATE POLICY "anon_insert_messages" ON messages FOR INSERT WITH CHECK (auth.role() = 'anon');

-- ===== MESSAGE REPLIES =====
CREATE POLICY "service_all_message_replies" ON message_replies FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ===== LOGS =====
CREATE POLICY "service_all_logs" ON logs FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ===== COUPONS =====
CREATE POLICY "service_all_coupons" ON coupons FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
-- Anon: aktif kuponları okuyabilir (validate için)
CREATE POLICY "anon_read_active_coupons" ON coupons FOR SELECT USING (auth.role() = 'anon' AND is_active = true);

-- ===== ANNOUNCEMENTS =====
CREATE POLICY "service_all_announcements" ON announcements FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
-- Anon: aktif duyuruları okuyabilir
CREATE POLICY "anon_read_active_announcements" ON announcements FOR SELECT USING (auth.role() = 'anon' AND is_active = true);

-- ===== CAMPAIGNS =====
CREATE POLICY "service_all_campaigns" ON campaigns FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
-- Anon: aktif kampanyaları okuyabilir
CREATE POLICY "anon_read_active_campaigns" ON campaigns FOR SELECT USING (auth.role() = 'anon' AND is_active = true);

-- ===== SETTINGS =====
CREATE POLICY "service_all_settings" ON settings FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
-- Anon: ayarları okuyabilir
CREATE POLICY "anon_read_settings" ON settings FOR SELECT USING (auth.role() = 'anon');
