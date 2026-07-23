-- ============================================
-- AltınÇağ Kuyumculuk - Supabase Migration
-- Bu dosyayı Supabase Dashboard > SQL Editor'da çalıştır
-- ============================================

-- 1. USERS tablosu
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  address JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT DEFAULT '',
  last_login_ip TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  verification_code TEXT,
  verification_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ADMINS tablosu
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT DEFAULT 'Admin',
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PRODUCTS tablosu
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT DEFAULT '',
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  discounted_price NUMERIC(10,2) DEFAULT 0 CHECK (discounted_price >= 0),
  category TEXT NOT NULL CHECK (category IN ('yuzuk', 'kolye', 'bileklik', 'kelepce', 'kupe', 'zincir', 'set')),
  images TEXT[] DEFAULT '{}',
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  karat TEXT DEFAULT '' CHECK (karat IN ('14', '18', '22', '24', '')),
  weight NUMERIC(10,2) DEFAULT 0,
  material TEXT DEFAULT '',
  discount_percent INTEGER DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  discount_type TEXT DEFAULT '' CHECK (discount_type IN ('real', 'fake', '')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_name_desc ON products USING gin(to_tsvector('simple', name || ' ' || COALESCE(description, '')));

-- 4. ORDERS tablosu
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE,
  customer_first_name TEXT NOT NULL,
  customer_last_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  customer_city TEXT NOT NULL,
  customer_district TEXT NOT NULL,
  customer_zip_code TEXT DEFAULT '',
  special_instructions TEXT DEFAULT '',
  subtotal NUMERIC(10,2) NOT NULL,
  shipping_cost NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT DEFAULT 'paytr' CHECK (payment_method IN ('paytr', 'havale', 'kapida')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  paytr_token TEXT,
  paytr_status TEXT,
  order_status TEXT DEFAULT 'pending' CHECK (order_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  guest_id TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address TEXT,
  tracking_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ORDER_ITEMS tablosu
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  name TEXT,
  price NUMERIC(10,2),
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  image TEXT
);

-- 6. CARTS tablosu
CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. CART_ITEMS tablosu
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  UNIQUE(cart_id, product_id)
);

-- 8. MESSAGES tablosu
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. MESSAGE_REPLIES tablosu
CREATE TABLE IF NOT EXISTS message_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('admin', 'user')),
  sender_name TEXT DEFAULT '',
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. LOGS tablosu
CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  target_type TEXT CHECK (target_type IN ('user', 'product', 'order', 'message', 'discount', 'system')),
  target_id TEXT,
  details JSONB,
  ip TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_admin_email ON logs(admin_email);

-- 11. WISHLISTS tablosu (opsiyonel - şimdilik localStorage kullanıyoruz)
-- Gerekirse ekleyebiliriz

-- ============================================
-- Functions
-- ============================================

-- updated_at otomatik güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Order number auto-generate fonksiyonu
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'AC' || to_char(now(), 'YYMMDD') || lpad(floor(random() * 10000)::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- Product slug auto-generate fonksiyonu
CREATE OR REPLACE FUNCTION generate_product_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(
      regexp_replace(NEW.name, '[ĞÜŞİÖÇğüşıöç]', 
        CASE 
          WHEN LOWER(NEW.name) LIKE '%ğ%' THEN 'g'
          WHEN LOWER(NEW.name) LIKE '%ü%' THEN 'u'
          WHEN LOWER(NEW.name) LIKE '%ş%' THEN 's'
          WHEN LOWER(NEW.name) LIKE '%i%' THEN 'i'
          WHEN LOWER(NEW.name) LIKE '%ö%' THEN 'o'
          WHEN LOWER(NEW.name) LIKE '%ç%' THEN 'c'
          ELSE NEW.name
        END, 'g'),
      '[^a-z0-9]+', '-', 'gi'
    ));
    -- Duplicate slug kontrolü
    IF EXISTS (SELECT 1 FROM products WHERE slug = NEW.slug AND id != NEW.id) THEN
      NEW.slug := NEW.slug || '-' || extract(epoch from now())::int;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_product_slug BEFORE INSERT ON products FOR EACH ROW EXECUTE FUNCTION generate_product_slug();

-- Discounted price auto-compute
CREATE OR REPLACE FUNCTION compute_discounted_price()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.discount_percent > 0 AND NEW.discount_type = 'real' THEN
    NEW.discounted_price := ROUND(NEW.price * (1 - NEW.discount_percent / 100), 2);
  ELSE
    NEW.discounted_price := 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER compute_discount BEFORE INSERT OR UPDATE ON products FOR EACH ROW EXECUTE FUNCTION compute_discounted_price();

-- Cart last_updated trigger
CREATE OR REPLACE FUNCTION update_cart_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE carts SET last_updated = now() WHERE id = NEW.cart_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cart_items_timestamp AFTER INSERT OR UPDATE OR DELETE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_cart_last_updated();

-- ============================================
-- Row Level Security (RLS) - opsiyonel
-- ============================================
-- Şimdilik RLS'i devre dışı bırakıyoruz, API route'larda token doğrulama yapıyoruz
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Service role her şeye erişebilir
CREATE POLICY "Service role full access" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON admins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON carts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON cart_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON message_replies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON logs FOR ALL USING (true) WITH CHECK (true);
