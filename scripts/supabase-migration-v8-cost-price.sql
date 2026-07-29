-- v8: Add cost_price to products for profit/loss analysis
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price NUMERIC DEFAULT 0;
