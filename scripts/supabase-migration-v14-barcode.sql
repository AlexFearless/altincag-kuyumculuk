-- Barkod sütunu ekle
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT DEFAULT '';

-- İndeks ekle (hızlı arama için)
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products (barcode);
