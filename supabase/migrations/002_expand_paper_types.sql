-- ============================================
-- SHANII PRINTS - Expand paper_size catalog
-- Widens the transactions.paper_size CHECK constraint to include the full
-- paper-type catalog (bond, photo variants, cardstock, sticker, kraft, vellum)
-- in addition to the original cut sizes. Existing rows are unaffected.
-- ============================================

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_paper_size_check;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_paper_size_check
  CHECK (paper_size IN (
    'short',
    'a4',
    'long',
    'bond',
    'photopaper',
    'glossy_photo',
    'matte_photo',
    'cardstock',
    'sticker',
    'kraft',
    'vellum'
  ));
