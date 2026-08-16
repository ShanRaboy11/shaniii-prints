import { supabase } from './supabase';

// ============================================
// DATABASE LAYER - Supabase CRUD + Ink Estimation
// ============================================

// --- Types ---

export interface BusinessSettings {
  id?: string;
  owner_id: string;
  printer_model: string;
  bw_page_yield: number;
  color_page_yield: number;
  ink_bottle_cost: number;
  color_set_cost: number;
  paper_cost_per_ream: number;
  sheets_per_ream: number;
  cost_per_bw_page: number;
  cost_per_color_page: number;
  cost_per_sheet: number;
}

export interface TransactionRecord {
  id?: string;
  owner_id: string;
  customer_name?: string;
  paper_size: 'short' | 'a4' | 'long' | 'photopaper';
  print_type: 'print' | 'photocopy';
  is_colored: boolean;
  quantity: number;
  price_per_copy: number;
  computed_total: number;
  final_total: number;
  adjustment: number;
  adjustment_label: string;
  estimated_ink_cost: number;
  estimated_paper_cost: number;
  notes?: string;
  receipt_id?: string;
  created_at?: string;
}

export interface Expense {
  id?: string;
  owner_id: string;
  item_name: string;
  category: string;
  quantity: number;
  unit_price: number;
  total_cost: number;
  date_bought: string;
  notes?: string;
  created_at?: string;
}

// --- Printer Presets ---

export const PRINTER_PRESETS: Record<string, { label: string; bw_yield: number; color_yield: number | null }> = {
  epson_l3210: { label: 'Epson L3210', bw_yield: 4500, color_yield: 7500 },
  generic_ink_tank: { label: 'Generic Ink Tank', bw_yield: 4000, color_yield: 6000 },
  laser_printer: { label: 'Laser Printer', bw_yield: 2000, color_yield: 0 },
  custom: { label: 'Custom', bw_yield: 0, color_yield: 0 },
};

// --- Pricing Defaults ---
// B&W: short=3, a4/long=4 | Colored: short=5, a4/long=6 | Photopaper colored whole page=40
export const PRICING = {
  bw: { short: 3, a4: 4, long: 4, photopaper: 15 },
  colored: { short: 5, a4: 6, long: 6, photopaper: 40 },
} as const;

export function getDefaultPrice(paperSize: string, isColored: boolean): number {
  if (isColored) {
    return PRICING.colored[paperSize as keyof typeof PRICING.colored] ?? 5;
  }
  return PRICING.bw[paperSize as keyof typeof PRICING.bw] ?? 3;
}

// --- Ink Cost Estimation ---

export function estimateInkCost(
  settings: BusinessSettings | null,
  quantity: number,
  isColored: boolean
): number {
  if (!settings) return 0;
  if (isColored) {
    if (settings.cost_per_color_page <= 0) return 0;
    return quantity * settings.cost_per_color_page;
  }
  if (settings.cost_per_bw_page <= 0) return 0;
  return quantity * settings.cost_per_bw_page;
}

export function estimatePaperCost(
  settings: BusinessSettings | null,
  quantity: number
): number {
  if (!settings || settings.cost_per_sheet <= 0) return 0;
  return quantity * settings.cost_per_sheet;
}

export function calculateDerivedCosts(settings: Partial<BusinessSettings>): {
  cost_per_bw_page: number;
  cost_per_color_page: number;
  cost_per_sheet: number;
} {
  const bwYield = settings.bw_page_yield || 1;
  const colorYield = settings.color_page_yield || 1;
  const sheetsPerReam = settings.sheets_per_ream || 500;

  const cost_per_bw_page = bwYield > 0 ? (settings.ink_bottle_cost || 0) / bwYield : 0;
  const cost_per_color_page = colorYield > 0 ? (settings.color_set_cost || 0) / colorYield : 0;
  const cost_per_sheet = sheetsPerReam > 0 ? (settings.paper_cost_per_ream || 0) / sheetsPerReam : 0;

  return { cost_per_bw_page, cost_per_color_page, cost_per_sheet };
}

// --- Generate Receipt ID ---

export function generateReceiptId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `SP-${timestamp}-${random}`.toUpperCase();
}

// ============================================
// BUSINESS SETTINGS CRUD
// ============================================

export async function getBusinessSettings(ownerId: string): Promise<BusinessSettings | null> {
  const { data, error } = await supabase
    .from('business_settings')
    .select('*')
    .eq('owner_id', ownerId)
    .single();

  if (error || !data) return null;
  return data as BusinessSettings;
}

export async function upsertBusinessSettings(settings: Partial<BusinessSettings> & { owner_id: string }): Promise<BusinessSettings | null> {
  // Calculate derived costs before saving
  const derived = calculateDerivedCosts(settings);
  const payload = { ...settings, ...derived };

  const { data, error } = await supabase
    .from('business_settings')
    .upsert(payload, { onConflict: 'owner_id' })
    .select()
    .single();

  if (error) throw error;
  return data as BusinessSettings;
}

// ============================================
// TRANSACTIONS CRUD
// ============================================

export async function getTransactionsDB(ownerId: string, limit = 100): Promise<TransactionRecord[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as TransactionRecord[];
}

export async function addTransactionDB(tx: Omit<TransactionRecord, 'id' | 'created_at'>): Promise<TransactionRecord> {
  const { data, error } = await supabase
    .from('transactions')
    .insert(tx)
    .select()
    .single();

  if (error) throw error;
  return data as TransactionRecord;
}

export async function updateTransactionDB(id: string, updates: Partial<TransactionRecord>): Promise<TransactionRecord> {
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as TransactionRecord;
}

export async function deleteTransactionDB(id: string): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getTransactionByReceiptId(receiptId: string): Promise<TransactionRecord | null> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('receipt_id', receiptId)
    .single();

  if (error || !data) return null;
  return data as TransactionRecord;
}

// ============================================
// EXPENSES CRUD
// ============================================

export async function getExpenses(ownerId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('owner_id', ownerId)
    .order('date_bought', { ascending: false });

  if (error) throw error;
  return (data || []) as Expense[];
}

export async function addExpense(expense: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .insert(expense)
    .select()
    .single();

  if (error) throw error;
  return data as Expense;
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================
// ANALYTICS HELPERS (from DB)
// ============================================

export async function getMonthlyRevenueDB(ownerId: string, year: number, month: number): Promise<number> {
  const startDate = new Date(year, month, 1).toISOString();
  const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

  const { data, error } = await supabase
    .from('transactions')
    .select('final_total')
    .eq('owner_id', ownerId)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (error || !data) return 0;
  return data.reduce((sum, t) => sum + (t.final_total || 0), 0);
}

export async function getTodayRevenueDB(ownerId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('transactions')
    .select('final_total')
    .eq('owner_id', ownerId)
    .gte('created_at', today.toISOString());

  if (error || !data) return 0;
  return data.reduce((sum, t) => sum + (t.final_total || 0), 0);
}
