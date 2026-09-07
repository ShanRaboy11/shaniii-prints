-- ============================================
-- SHANII PRINTS - Ensure expenses.entry_type exists + refresh schema cache
-- Fixes: "Could not find the 'entry_type' column of 'expenses' in the schema cache"
-- The column may be missing on databases created before it was introduced, and
-- PostgREST caches the schema — so we add it (idempotently) and force a reload.
-- ============================================

-- 1. Add the column if it doesn't already exist.
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS entry_type VARCHAR(50) NOT NULL DEFAULT 'expense';

-- 2. Constrain to the supported values (drop first so re-runs are safe).
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_entry_type_check;
ALTER TABLE expenses
  ADD CONSTRAINT expenses_entry_type_check
  CHECK (entry_type IN ('expense', 'capital'));

-- 3. Backfill any legacy NULLs (safety, though DEFAULT covers new rows).
UPDATE expenses SET entry_type = 'expense' WHERE entry_type IS NULL;

-- 4. Force PostgREST to reload its schema cache so the API recognizes the
--    column immediately without an API restart.
NOTIFY pgrst, 'reload schema';
