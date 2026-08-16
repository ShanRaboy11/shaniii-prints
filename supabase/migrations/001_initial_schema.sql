-- ============================================
-- SHANII PRINTS - Database Schema
-- Updated for Supabase Native Compatibility
-- ============================================

-- ============================================
-- PROFILES (Extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('owner', 'customer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- BUSINESS SETTINGS (Epson L3210 & Costs)
-- ============================================
CREATE TABLE IF NOT EXISTS business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Fixed: Used native gen_random_uuid()
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  printer_model TEXT DEFAULT 'epson_l3210',
  bw_page_yield INTEGER DEFAULT 4500,
  color_page_yield INTEGER DEFAULT 7500,
  ink_bottle_cost DECIMAL(10,2) DEFAULT 0, -- Black bottle cost
  color_set_cost DECIMAL(10,2) DEFAULT 0,   -- CMY Set cost
  paper_cost_per_ream DECIMAL(10,2) DEFAULT 0,
  sheets_per_ream INTEGER DEFAULT 500,
  -- Per-unit costs (Calculated on the app side or via trigger)
  cost_per_bw_page DECIMAL(10,4) DEFAULT 0,
  cost_per_color_page DECIMAL(10,4) DEFAULT 0,
  cost_per_sheet DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(owner_id)
);

-- ============================================
-- EXPENSES / CAPITAL TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(10,2) DEFAULT 0,
  date_bought DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TRANSACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name TEXT,
  paper_size TEXT NOT NULL CHECK (paper_size IN ('short', 'a4', 'long', 'photopaper')),
  print_type TEXT NOT NULL CHECK (print_type IN ('print', 'photocopy')),
  is_colored BOOLEAN DEFAULT FALSE,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_per_copy DECIMAL(10,2) NOT NULL DEFAULT 0,
  computed_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  final_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  adjustment DECIMAL(10,2) DEFAULT 0,
  adjustment_label TEXT DEFAULT '',
  estimated_ink_cost DECIMAL(10,4) DEFAULT 0,
  estimated_paper_cost DECIMAL(10,4) DEFAULT 0,
  notes TEXT,
  receipt_id UUID DEFAULT gen_random_uuid() UNIQUE, -- Use UUID for receipt link security
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Profiles: Own profile access
CREATE POLICY "Profiles are viewable by owner" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles are updatable by owner" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Settings/Expenses: Strictly owner only
CREATE POLICY "Manage settings" ON business_settings FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Manage expenses" ON expenses FOR ALL USING (auth.uid() = owner_id);

-- Transactions: Owner manages, anyone with link can view receipt
CREATE POLICY "Manage transactions" ON transactions FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "View receipt" ON transactions FOR SELECT USING (TRUE); -- Public can view if they have the link

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_transactions_owner ON transactions(owner_id);
CREATE INDEX IF NOT EXISTS idx_transactions_receipt ON transactions(receipt_id);
CREATE INDEX IF NOT EXISTS idx_expenses_owner ON expenses(owner_id);