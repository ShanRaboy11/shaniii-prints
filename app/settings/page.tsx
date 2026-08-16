'use client';

import { useEffect, useState } from 'react';
import {
  Save,
  Wallet,
  Receipt,
  Database,
  AlertTriangle,
  Trash2,
  RotateCcw,
  Download,
  Upload,
  Info,
} from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import { SettingsData, getSettings, saveSettings, getTransactions, saveTransactions } from '@/lib/store';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'pricing' | 'data'>('general');
  const { showToast } = useToast();

  useEffect(() => {
    setSettings(getSettings());
    setMounted(true);
  }, []);

  const handleSave = () => {
    if (!settings) return;
    saveSettings(settings);
    showToast('Settings saved!', 'success');
  };

  const handleResetPricing = () => {
    if (!settings) return;
    setSettings({
      ...settings,
      pricing: {
        bw: { short: 3, a4: 4, long: 4, photopaper: 15 },
        colored: { short: 5, a4: 6, long: 6, photopaper: 25 },
      },
    });
    showToast('Pricing reset to defaults', 'info');
  };

  const handleClearTransactions = () => {
    if (confirm('Delete ALL transactions? This cannot be undone.')) {
      saveTransactions([]);
      showToast('All transactions cleared', 'warning');
    }
  };

  const handleExport = () => {
    const data = { settings: getSettings(), transactions: getTransactions(), exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shanii-prints-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup exported!', 'success');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.settings) { saveSettings(data.settings); setSettings(data.settings); }
        if (data.transactions) { saveTransactions(data.transactions); }
        showToast('Data imported!', 'success');
      } catch { showToast('Invalid backup file', 'error'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!mounted || !settings) return <SettingsSkeleton />;

  const tabs = [
    { id: 'general', label: 'General', icon: Wallet },
    { id: 'pricing', label: 'Pricing', icon: Receipt },
    { id: 'data', label: 'Data', icon: Database },
  ];

  return (
    <div className="animate-fade-in relative">
      <div className="blob-1" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage pricing, capital, and application data.</p>
        </div>
        <button onClick={handleSave} className="btn-primary">
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1.5 glass-card !rounded-full !shadow-none w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* General */}
      {activeTab === 'general' && (
        <div className="space-y-5 max-w-2xl">
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">Business Information</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                Business Name
              </label>
              <input
                type="text"
                value={settings.businessName}
                onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">Capital & Expenses</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Total Capital Invested (₱)
                </label>
                <input
                  type="number"
                  min="0"
                  value={settings.capital}
                  onChange={(e) => setSettings({ ...settings, capital: parseFloat(e.target.value) || 0 })}
                  className="input"
                  placeholder="0"
                />
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                  Equipment, supplies, and initial investment.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Monthly Expenses (₱)
                </label>
                <input
                  type="number"
                  min="0"
                  value={settings.monthlyExpenses}
                  onChange={(e) => setSettings({ ...settings, monthlyExpenses: parseFloat(e.target.value) || 0 })}
                  className="input"
                  placeholder="0"
                />
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                  Rent, ink, paper, electricity, etc.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing */}
      {activeTab === 'pricing' && (
        <div className="space-y-5 max-w-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Info className="w-3.5 h-3.5" />
              <span>Price per copy in Philippine Peso (₱). Applied automatically when adding transactions.</span>
            </div>
            <button onClick={handleResetPricing} className="btn-ghost btn-sm">
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* B&W Pricing */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">B&W</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Black & White</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Default: Short ₱3, A4/Long ₱4</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['short', 'a4', 'long', 'photopaper'] as const).map((size) => (
                <div key={size}>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                    {size === 'photopaper' ? 'Photo Paper' : size}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₱</span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={settings.pricing.bw[size]}
                      onChange={(e) => setSettings({
                        ...settings,
                        pricing: { ...settings.pricing, bw: { ...settings.pricing.bw, [size]: parseFloat(e.target.value) || 0 } },
                      })}
                      className="input pl-7 text-center font-semibold"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Colored Pricing */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">CLR</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Colored</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Default: Short ₱5, A4/Long ₱6</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['short', 'a4', 'long', 'photopaper'] as const).map((size) => (
                <div key={size}>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                    {size === 'photopaper' ? 'Photo Paper' : size}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₱</span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={settings.pricing.colored[size]}
                      onChange={(e) => setSettings({
                        ...settings,
                        pricing: { ...settings.pricing, colored: { ...settings.pricing.colored, [size]: parseFloat(e.target.value) || 0 } },
                      })}
                      className="input pl-7 text-center font-semibold"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info note */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-500/5 border border-indigo-200/50 dark:border-indigo-500/20">
            <Info className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
              Photo Paper pricing only applies to <strong>Print</strong> transactions. Photocopy does not support photo paper.
              Users can still adjust the final price per transaction — any difference is tracked as a discount or additional.
            </p>
          </div>
        </div>
      )}

      {/* Data */}
      {activeTab === 'data' && (
        <div className="space-y-5 max-w-2xl">
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-2">Backup & Restore</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Export all data as JSON or restore from a backup file.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={handleExport} className="btn-primary">
                <Download className="w-4 h-4" />
                Export Backup
              </button>
              <label className="btn-ghost cursor-pointer">
                <Upload className="w-4 h-4" />
                Import Backup
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
            </div>
          </div>

          <div className="glass-card p-6 border-red-200/50 dark:border-red-500/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">Danger Zone</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Irreversible actions. Export a backup first.
            </p>
            <button onClick={handleClearTransactions} className="btn-danger">
              <Trash2 className="w-4 h-4" />
              Clear All Transactions
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
      <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl mb-6" />
      <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl max-w-2xl" />
    </div>
  );
}
