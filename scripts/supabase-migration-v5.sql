-- ============================================
-- AltınÇağ Kuyumculuk - Migration V5
-- settings tablosu + mağaza içi sipariş alanı
-- Bu dosyayı Supabase Dashboard > SQL Editor'da çalıştır
-- ============================================

-- 1. SETTINGS tablosu
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON settings FOR ALL USING (true) WITH CHECK (true);

-- Varsayılan altın fiyatı ayarları
INSERT INTO settings (key, value) VALUES
  ('gold_price', '{"autoUpdate": false, "apiKey": "", "lastPrice": 0, "lastUpdate": null, "currency": "TRY", "source": "manual"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 2. ORDERS tablosuna walk-in alanı ekle
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_walkin BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS walkin_notes TEXT DEFAULT '';
