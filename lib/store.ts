// ============================================
// Data Store - localStorage utilities
// ============================================

export type PrintType = 'print' | 'photocopy';
export type PaperSize = 'short' | 'a4' | 'long' | 'photopaper';

// Photocopy only allows: short, a4, long (no photopaper)
export type PhotocopyPaperSize = 'short' | 'a4' | 'long';

export interface Transaction {
  id: string;
  type: PrintType;
  paperSize: PaperSize;
  copies: number;
  colored: boolean;
  pricePerCopy: number;
  computedTotal: number;   // copies × pricePerCopy (the system-calculated total)
  finalTotal: number;      // the actual charged amount (user may modify)
  adjustment: number;      // finalTotal - computedTotal (positive = additional, negative = discount)
  adjustmentLabel: string; // e.g. "Discount", "Additional", "" if none
  date: string;            // ISO string
  notes?: string;
}

export interface PricingConfig {
  bw: { short: number; a4: number; long: number; photopaper: number };
  colored: { short: number; a4: number; long: number; photopaper: number };
}

export interface SettingsData {
  capital: number;
  pricing: PricingConfig;
  businessName: string;
  monthlyExpenses: number;
}

const TRANSACTIONS_KEY = 'shanii-prints-transactions';
const SETTINGS_KEY = 'shanii-prints-settings';

const DEFAULT_SETTINGS: SettingsData = {
  capital: 0,
  pricing: {
    bw: { short: 3, a4: 4, long: 4, photopaper: 15 },
    colored: { short: 5, a4: 6, long: 6, photopaper: 25 },
  },
  businessName: 'Shanii Prints',
  monthlyExpenses: 0,
};

// --- Transactions ---
export function getTransactions(): Transaction[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(TRANSACTIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveTransactions(transactions: Transaction[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
}

export function addTransaction(transaction: Omit<Transaction, 'id'>): Transaction {
  const newTx: Transaction = {
    ...transaction,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
  };
  const all = getTransactions();
  all.unshift(newTx);
  saveTransactions(all);
  return newTx;
}

export function updateTransaction(id: string, data: Partial<Transaction>) {
  const all = getTransactions();
  const idx = all.findIndex((t) => t.id === id);
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...data };
    saveTransactions(all);
  }
  return all;
}

export function deleteTransaction(id: string) {
  const all = getTransactions().filter((t) => t.id !== id);
  saveTransactions(all);
  return all;
}

// --- Settings ---
export function getSettings(): SettingsData {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: SettingsData) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// --- Price Lookup ---
export function getPricePerCopy(
  settings: SettingsData,
  paperSize: PaperSize,
  colored: boolean
): number {
  if (colored) {
    return settings.pricing.colored[paperSize];
  }
  return settings.pricing.bw[paperSize];
}

// Get valid paper sizes for a print type
export function getValidPaperSizes(type: PrintType): PaperSize[] {
  if (type === 'photocopy') {
    return ['short', 'a4', 'long']; // No photopaper for photocopy
  }
  return ['short', 'a4', 'long', 'photopaper'];
}

// --- Calculations ---
export function getMonthlyRevenue(transactions: Transaction[], year: number, month: number): number {
  return transactions
    .filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .reduce((sum, t) => sum + t.finalTotal, 0);
}

export function getTodayRevenue(transactions: Transaction[]): number {
  const today = new Date().toISOString().split('T')[0];
  return transactions
    .filter((t) => t.date.split('T')[0] === today)
    .reduce((sum, t) => sum + t.finalTotal, 0);
}

export function getWeeklyRevenue(transactions: Transaction[]): number {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return transactions
    .filter((t) => new Date(t.date) >= weekAgo)
    .reduce((sum, t) => sum + t.finalTotal, 0);
}

export function getTotalRevenue(transactions: Transaction[]): number {
  return transactions.reduce((sum, t) => sum + t.finalTotal, 0);
}

export function getTotalDiscounts(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.adjustment < 0)
    .reduce((sum, t) => sum + Math.abs(t.adjustment), 0);
}

export function getTotalAdditionals(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.adjustment > 0)
    .reduce((sum, t) => sum + t.adjustment, 0);
}

export function getTransactionsByType(transactions: Transaction[]) {
  const prints = transactions.filter((t) => t.type === 'print');
  const photocopies = transactions.filter((t) => t.type === 'photocopy');
  return { prints, photocopies };
}

export function getTransactionsByPaper(transactions: Transaction[]) {
  return {
    short: transactions.filter((t) => t.paperSize === 'short'),
    a4: transactions.filter((t) => t.paperSize === 'a4'),
    long: transactions.filter((t) => t.paperSize === 'long'),
    photopaper: transactions.filter((t) => t.paperSize === 'photopaper'),
  };
}

export function getMonthlyData(transactions: Transaction[], months: number = 6) {
  const data: { month: string; revenue: number }[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const revenue = getMonthlyRevenue(transactions, d.getFullYear(), d.getMonth());
    const monthLabel = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    data.push({ month: monthLabel, revenue });
  }

  return data;
}
