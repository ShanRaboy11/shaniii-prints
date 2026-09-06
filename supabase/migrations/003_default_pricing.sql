-- ============================================
-- SHANII PRINTS - Configurable default selling prices
-- Adds owner-editable base per-page selling prices used by the Add Order modal.
-- Defaults: 3 for Black & White, 5 for Colored. Existing rows are backfilled.
-- ============================================

ALTER TABLE business_settings
  ADD COLUMN IF NOT EXISTS default_bw_price DECIMAL(10,2) NOT NULL DEFAULT 3;

ALTER TABLE business_settings
  ADD COLUMN IF NOT EXISTS default_color_price DECIMAL(10,2) NOT NULL DEFAULT 5;
