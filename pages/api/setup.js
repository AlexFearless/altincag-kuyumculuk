import { saveConfig, isSetupComplete } from '@/lib/config';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  phone TEXT DEFAULT '',
  address JSONB DEFAULT '{}',
  ip_address TEXT DEFAULT '',
  last_login_ip TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  verification_code TEXT,
  verification_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT DEFAULT 'Admin',
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  is_active BOOLEAN DEFAULT true,
  totp_enabled BOOLEAN DEFAULT false,
  totp_secret TEXT,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  cost_price NUMERIC DEFAULT 0,
  discounted_price NUMERIC DEFAULT 0,
  category TEXT NOT NULL CHECK (category IN ('yuzuk','kolye','bileklik','kelepce','kupe','zincir','set')),
  images TEXT[] DEFAULT '{}',
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  karat TEXT DEFAULT '',
  weight NUMERIC DEFAULT 0,
  material TEXT DEFAULT '',
  discount_percent NUMERIC DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  discount_type TEXT DEFAULT '' CHECK (discount_type IN ('real','fake','')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_first_name TEXT NOT NULL,
  customer_last_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  customer_city TEXT DEFAULT 'İstanbul',
  customer_district TEXT DEFAULT '',
  customer_zip_code TEXT DEFAULT '',
  special_instructions TEXT DEFAULT '',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  shipping_cost NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  coupon_code TEXT DEFAULT '',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'havale' CHECK (payment_method IN ('paytr','havale','kapida')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','havale_bekliyor','odendi','iptal','failed','refunded')),
  order_status TEXT DEFAULT 'pending' CHECK (order_status IN ('pending','processing','shipped','delivered','cancelled','refunded')),
  guest_id TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address TEXT,
  tracking_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  name TEXT,
  price NUMERIC,
  quantity INTEGER NOT NULL DEFAULT 1,
  image TEXT
);

CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type TEXT DEFAULT 'user',
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS token_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_jti TEXT UNIQUE NOT NULL,
  user_id UUID,
  user_type TEXT DEFAULT 'user',
  token_type TEXT DEFAULT 'access',
  expires_at TIMESTAMPTZ,
  reason TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  window_start TIMESTAMPTZ DEFAULT now(),
  attempts INTEGER DEFAULT 1,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','answered','closed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS message_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('admin','user')),
  sender_name TEXT DEFAULT '',
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  bg_color TEXT DEFAULT '#B8860B',
  text_color TEXT DEFAULT '#FFFFFF',
  is_active BOOLEAN DEFAULT true,
  created_by TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent','fixed')),
  discount_value NUMERIC NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  applies_to TEXT DEFAULT 'all' CHECK (applies_to IN ('all','category','specific_products')),
  target_category TEXT,
  target_products TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent','fixed')),
  discount_value NUMERIC NOT NULL DEFAULT 0,
  min_order_amount NUMERIC DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  applicable_categories TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB DEFAULT '{}',
  ip TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  target_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_guest_id ON orders(guest_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_jti ON token_blacklist(token_jti);
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access" ON rate_limits;
CREATE POLICY "Service role full access" ON rate_limits FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION increment_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products SET stock = stock + p_quantity WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;
`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (isSetupComplete()) {
    return res.status(400).json({ error: 'Kurulum zaten tamamlanmış' });
  }

  try {
    const { supabaseUrl, supabaseAnonKey, supabaseServiceKey, adminEmail, adminPassword } = req.body;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return res.status(400).json({ error: 'Supabase URL, anon key ve service key zorunludur' });
    }
    if (!adminEmail || !adminPassword) {
      return res.status(400).json({ error: 'Admin e-posta ve şifresi zorunludur' });
    }
    if (adminPassword.length < 8) {
      return res.status(400).json({ error: 'Admin şifresi en az 8 karakter olmalıdır' });
    }

    const testClient = createClient(supabaseUrl, supabaseServiceKey);
    const { error: testError } = await testClient.from('admins').select('id').limit(1);
    if (testError && testError.code !== '42P01') {
      return res.status(400).json({ error: `Supabase bağlantısı başarısız: ${testError.message}` });
    }

    const tableMissing = testError && testError.code === '42P01';

    if (tableMissing) {
      const { error: sqlError } = await testClient.rpc('exec_sql', { sql_text: MIGRATION_SQL });
      if (sqlError) {
        return res.status(500).json({ error: `Tablo oluşturma başarısız: ${sqlError.message}` });
      }
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    const { data: existingAdmin } = await testClient.from('admins').select('id').eq('email', adminEmail.toLowerCase().trim()).single();

    if (!existingAdmin) {
      const { error: adminError } = await testClient.from('admins').insert({
        email: adminEmail.toLowerCase().trim(),
        password: hashedPassword,
        name: 'Admin',
        role: 'superadmin',
        is_active: true,
      });
      if (adminError) {
        return res.status(500).json({ error: `Admin hesabı oluşturulamadı: ${adminError.message}` });
      }
    }

    const jwtSecret = crypto.randomBytes(64).toString('hex');

    saveConfig({
      supabaseUrl,
      supabaseAnonKey,
      supabaseServiceKey,
      jwtSecret,
      adminEmail: adminEmail.toLowerCase().trim(),
      adminPassword,
    });

    res.status(200).json({ success: true, message: 'Kurulum başarıyla tamamlandı' });
  } catch (error) {
    res.status(500).json({ error: 'Kurulum sırasında hata oluştu' });
  }
}
