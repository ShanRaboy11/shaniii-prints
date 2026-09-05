'use client';

import { useEffect, useState } from 'react';
import {
  Save,
  Printer,
  Droplets,
  FileText,
  Calculator,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  Info,
  Database,
  Wallet,
  ChevronDown,
} from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import { useAuth } from '@/components/AuthProvider';
import {
  BusinessSettings,
  PRINTER_PRESETS,
  calculateDerivedCosts,
  getBusinessSettings,
  upsertBusinessSettings,
} from '@/lib/db';

export default function SettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'estimator' | 'general' | 'data'>('estimator');

  // Settings state
  const [printerModel, setPrinterModel] = useState('epson_l3210');
  const [bwYield, setBwYield] = useState(4500);
  const [colorYield, setColorYield] = useState(7500);
  const [inkBottleCost, setInkBottleCost] = useState(0);
  const [colorSetCost, setColorSetCost] = useState(0);
  const [paperCostPerReam, setPaperCostPerReam] = useState(0);
  const [sheetsPerReam, setSheetsPerReam] = useState(500);

  // General settings (using localStorage as fallback)
  const [capital, setCapital] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);

  useEffect(() => {
    setMounted(true);
    loadSettings();
  }, [user]);

  async function loadSettings() {
    if (!user) return;
    try {
      const s = await getBusinessSettings(user.id);
      if (s) {
        setPrinterModel(s.printer_model || 'epson_l3210');
        setBwYield(s.bw_page_yield);
        setColorYield(s.color_page_yield);
        setInkBottleCost(s.ink_bottle_cost);
        setColorSetCost(s.color_set_cost);
        setPaperCostPerReam(s.paper_cost_per_ream);
        setSheetsPerReam(s.sheets_per_ream);
      }
    } catch {
      // Supabase not configured yet — use defaults
    }

    // Load general from localStorage as fallback
    try {
      const local = localStorage.getItem('shanii-prints-settings');
      if (local) {
        const parsed = JSON.parse(local);
        setCapital(parsed.capital || 0);
        setMonthlyExpenses(parsed.monthlyExpenses || 0);
      }
    } catch {}
  }

  // Derived costs preview
  const derived = calculateDerivedCosts({
    bw_page_yield: bwYield,
    color_page_yield: colorYield,
    ink_bottle_cost: inkBottleCost,
    color_set_cost: colorSetCost,
    paper_cost_per_ream: paperCostPerReam,
    sheets_per_ream: sheetsPerReam,
  });

  // When printer changes, auto-populate yields
  function handlePrinterChange(model: string) {
    setPrinterModel(model);
    const preset = PRINTER_PRESETS[model];
    if (preset && model !== 'custom') {
      setBwYield(preset.bw_yield);
      setColorYield(preset.color_yield || 0);
    }
  }

  async function handleSave() {
    if (!user) {
      showToast('Please log in first', 'error');
      return;
    }

    setSaving(true);
    try {
      await upsertBusinessSettings({
        owner_id: user.id,
        printer_model: printerModel,
        bw_page_yield: bwYield,
        color_page_yield: colorYield,
        ink_bottle_cost: inkBottleCost,
        color_set_cost: colorSetCost,
        paper_cost_per_ream: paperCostPerReam,
        sheets_per_ream: sheetsPerReam,
      });

      // Save general to localStorage too
      localStorage.setItem('shanii-prints-settings', JSON.stringify({
        capital,
        monthlyExpenses,
        businessName: 'Shanii Prints',
      }));

      showToast('Settings saved!', 'success');
    } catch (err: any) {
      // If Supabase isn't configured, save locally
      localStorage.setItem('shanii-prints-business-settings', JSON.stringify({
        printer_model: printerModel,
        bw_page_yield: bwYield,
        color_page_yield: colorYield,
        ink_bottle_cost: inkBottleCost,
        color_set_cost: colorSetCost,
        paper_cost_per_ream: paperCostPerReam,
        sheets_per_ream: sheetsPerReam,
        ...derived,
      }));
      localStorage.setItem('shanii-prints-settings', JSON.stringify({
        capital,
        monthlyExpenses,
        businessName: 'Shanii Prints',
      }));
      showToast('Saved locally (connect Supabase for cloud sync)', 'info');
    } finally {
      setSaving(false);
    }
  }

  if (!mounted) return <SettingsSkeleton />;

  const tabs = [
    { id: 'estimator', label: 'Ink Estimator', icon: Calculator },
    { id: 'general', label: 'General', icon: Wallet },
    { id: 'data', label: 'Data', icon: Database },
  ];

  return (
    <div className="animate-fade-in relative">
      <div className="blob-1" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure your printer, ink costs, and business data.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary-gradient !rounded-full">
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Changes
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1.5 bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-white/40 dark:border-white/10 rounded-full w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========== INK ESTIMATOR TAB ========== */}
      {activeTab === 'estimator' && (
        <div className="space-y-5 max-w-3xl">
          {/* Info Banner */}
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-primary-50/80 dark:bg-primary-500/5 border border-primary-200/50 dark:border-primary-500/20">
            <Info className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-primary-700 dark:text-primary-300 leading-relaxed">
              Configure your printer and ink costs below. The system will automatically estimate the ink and paper cost per transaction for accurate profit tracking.
            </p>
          </div>

          {/* Printer Selection */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-500/15 flex items-center justify-center text-primary-600 dark:text-primary-400">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Printer Configuration</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Select your printer model for auto-populated yields</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Printer Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Printer Model
                </label>
                <div className="relative">
                  <select
                    value={printerModel}
                    onChange={(e) => handlePrinterChange(e.target.value)}
                    className="select"
                  >
                    {Object.entries(PRINTER_PRESETS).map(([key, preset]) => (
                      <option key={key} value={key}>
                        {preset.label}
                        {key !== 'custom' && ` — B&W: ${preset.bw_yield.toLocaleString()} pages`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Yields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    B&W Page Yield
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={bwYield}
                    onChange={(e) => setBwYield(parseInt(e.target.value) || 1)}
                    disabled={printerModel !== 'custom'}
                    className="input disabled:opacity-60"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Pages per black bottle</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Color Page Yield
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={colorYield}
                    onChange={(e) => setColorYield(parseInt(e.target.value) || 0)}
                    disabled={printerModel !== 'custom' && printerModel !== 'laser_printer'}
                    className="input disabled:opacity-60"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Pages per color set</p>
                </div>
              </div>

              {printerModel === 'laser_printer' && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/20">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Laser printers typically don&apos;t support color. Color yield is set to N/A.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Ink Costs */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-500/15 flex items-center justify-center text-accent-600 dark:text-accent-400">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Ink Costs</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Enter the cost of your ink bottles/cartridges</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Price per Black Bottle (₱)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₱</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={inkBottleCost}
                    onChange={(e) => setInkBottleCost(parseFloat(e.target.value) || 0)}
                    className="input pl-8"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Price per Color Set (₱)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₱</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={colorSetCost}
                    onChange={(e) => setColorSetCost(parseFloat(e.target.value) || 0)}
                    className="input pl-8"
                    disabled={printerModel === 'laser_printer'}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Paper Costs */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Paper Costs</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Calculate the cost per sheet from your ream</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Cost per Ream (₱)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₱</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={paperCostPerReam}
                    onChange={(e) => setPaperCostPerReam(parseFloat(e.target.value) || 0)}
                    className="input pl-8"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Sheets per Ream
                </label>
                <input
                  type="number"
                  min="1"
                  value={sheetsPerReam}
                  onChange={(e) => setSheetsPerReam(parseInt(e.target.value) || 500)}
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Cost Summary Card */}
          <div className="glass-card p-6 border-primary-200/40 dark:border-primary-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Estimated Costs per Page</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Auto-calculated from your inputs above</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-white/5 text-center">
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">B&W Ink</p>
                <p className="text-lg font-extrabold text-slate-900 dark:text-white">₱{derived.cost_per_bw_page.toFixed(2)}</p>
                <p className="text-[10px] text-slate-400">per page</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-white/5 text-center">
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Color Ink</p>
                <p className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {colorYield > 0 ? `₱${derived.cost_per_color_page.toFixed(2)}` : 'N/A'}
                </p>
                <p className="text-[10px] text-slate-400">per page</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-white/5 text-center">
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Paper</p>
                <p className="text-lg font-extrabold text-slate-900 dark:text-white">₱{derived.cost_per_sheet.toFixed(2)}</p>
                <p className="text-[10px] text-slate-400">per sheet</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== GENERAL TAB ========== */}
      {activeTab === 'general' && (
        <div className="space-y-5 max-w-2xl">
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Capital & Expenses</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Total Capital Invested (₱)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₱</span>
                  <input
                    type="number"
                    min="0"
                    value={capital}
                    onChange={(e) => setCapital(parseFloat(e.target.value) || 0)}
                    className="input pl-8"
                    placeholder="0"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">Equipment, supplies, and initial investment.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Monthly Expenses (₱)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₱</span>
                  <input
                    type="number"
                    min="0"
                    value={monthlyExpenses}
                    onChange={(e) => setMonthlyExpenses(parseFloat(e.target.value) || 0)}
                    className="input pl-8"
                    placeholder="0"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">Rent, electricity, internet, etc.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== DATA TAB ========== */}
      {activeTab === 'data' && (
        <div className="space-y-5 max-w-2xl">
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Backup & Restore</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Export all local data or import from backup. Cloud data syncs automatically with Supabase.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  const data = {
                    settings: localStorage.getItem('shanii-prints-settings'),
                    transactions: localStorage.getItem('shanii-prints-transactions'),
                    exportDate: new Date().toISOString(),
                  };
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `shanii-prints-backup-${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  showToast('Backup exported!', 'success');
                }}
                className="btn-primary-gradient !rounded-xl"
              >
                <Download className="w-4 h-4" />
                Export Backup
              </button>
              <label className="btn-ghost !rounded-xl cursor-pointer">
                <Upload className="w-4 h-4" />
                Import Backup
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      try {
                        const data = JSON.parse(ev.target?.result as string);
                        if (data.settings) localStorage.setItem('shanii-prints-settings', data.settings);
                        if (data.transactions) localStorage.setItem('shanii-prints-transactions', data.transactions);
                        showToast('Data imported!', 'success');
                        loadSettings();
                      } catch { showToast('Invalid file', 'error'); }
                    };
                    reader.readAsText(file);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="glass-card p-6 border-red-200/40 dark:border-red-500/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-bold text-red-600 dark:text-red-400">Danger Zone</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              These actions are irreversible. Export a backup first.
            </p>
            <button
              onClick={() => {
                if (confirm('Delete ALL local transactions? This cannot be undone.')) {
                  localStorage.removeItem('shanii-prints-transactions');
                  showToast('Local transactions cleared', 'warning');
                }
              }}
              className="btn-danger !rounded-xl"
            >
              <Trash2 className="w-4 h-4" />
              Clear Local Transactions
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
      <div className="h-4 w-56 bg-slate-200 dark:bg-slate-800 rounded mb-6" />
      <div className="h-12 w-72 bg-slate-200 dark:bg-slate-800 rounded-full mb-6" />
      <div className="space-y-5 max-w-3xl">
        <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-[1.5rem]" />
        <div className="h-36 bg-slate-200 dark:bg-slate-800 rounded-[1.5rem]" />
        <div className="h-36 bg-slate-200 dark:bg-slate-800 rounded-[1.5rem]" />
      </div>
    </div>
  );
}
