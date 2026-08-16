-- ============================================
-- SHANII PRINTS - Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (extends auth.users with role info)
-- ============================================
CREATE TABLE profiles (
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

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- BUSINESS SETTINGS (Ink Estimator)
-- ============================================
CREATE TABLE business_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Printer config
  printer_model TEXT DEFAULT 'epson_l3210',
  bw_page_yield INTEGER DEFAULT 4500,
  color_page_yield INTEGER DEFAULT 7500,
  -- Ink costs
  ink_bottle_cost DECIMAL(10,2) DEFAULT 0,
  color_set_cost DECIMAL(10,2) DEFAULT 0,
  -- Paper costs
  paper_cost_per_ream DECIMAL(10,2) DEFAULT 0,
  sheets_per_ream INTEGER DEFAULT 500,
  -- Derived (calculated on save)
  cost_per_bw_page DECIMAL(10,4) DEFAULT 0,
  cost_per_color_page DECIMAL(10,4) DEFAULT 0,
  cost_per_sheet DECIMAL(10,4) DEFAULT 0,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(owner_id)
);

-- ============================================
-- EXPENSES / CAPITAL TRACKING
-- ============================================
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  receipt_id TEXT UNIQUE, -- For digital receipt URL
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can read their own profile; owners can read all
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- BUSINESS_SETTINGS: Only owner can CRUD their own settings
CREATE POLICY "Owner can manage own settings"
  ON business_settings FOR ALL
  USING (auth.uid() = owner_id);

-- EXPENSES: Only owner can CRUD their own expenses
CREATE POLICY "Owner can manage own expenses"
  ON expenses FOR ALL
  USING (auth.uid() = owner_id);

-- TRANSACTIONS: Owner can manage; customers can view their own (by name match)
CREATE POLICY "Owner can manage own transactions"
  ON transactions FOR ALL
  USING (auth.uid() = owner_id);

CREATE POLICY "Public can view transaction by receipt_id"
  ON transactions FOR SELECT
  USING (receipt_id IS NOT NULL);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX idx_transactions_owner ON transactions(owner_id);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_transactions_receipt ON transactions(receipt_id);
CREATE INDEX idx_expenses_owner ON expenses(owner_id);
CREATE INDEX idx_expenses_date ON expenses(date_bought DESC);
