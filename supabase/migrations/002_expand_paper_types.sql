-- ============================================
-- SHANII PRINTS - Paper type catalog
-- Widens the transactions.paper_size CHECK constraint to the supported
-- paper-type catalog. Existing rows are unaffected.
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
    'sticker'
  ));
