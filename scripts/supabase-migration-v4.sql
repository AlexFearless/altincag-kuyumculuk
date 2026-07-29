-- ============================================
-- AltınÇağ Kuyumculuk - Migration V4
-- Fix: trigger integer division hatası + mevcut ürünlerin discounted_price güncelleme
-- Bu dosyayı Supabase Dashboard > SQL Editor'da çalıştır
-- ============================================

-- 1. Trigger'ı düzelt - integer division sorunu
CREATE OR REPLACE FUNCTION compute_discounted_price()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.discount_percent > 0 AND NEW.discount_type = 'real' THEN
    NEW.discounted_price := ROUND(NEW.price * (1 - (NEW.discount_percent::NUMERIC / 100)), 2);
  ELSE
    NEW.discounted_price := 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Mevcut tüm ürünlerin discounted_price'ını yeniden hesapla
UPDATE products
SET discounted_price = CASE
  WHEN discount_type = 'real' AND discount_percent > 0
    THEN ROUND(price * (1 - (discount_percent::NUMERIC / 100)), 2)
  ELSE 0
END;
