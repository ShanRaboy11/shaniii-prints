'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import ChartSetup from '@/components/charts/ChartSetup';
import { Dropdown } from '@/components/Dropdown';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Printer,
  Copy,
  Tag,
  ArrowDown,
  ArrowUp,
  Calendar,
} from 'lucide-react';
import {
  Transaction,
  SettingsData,
  getTransactions,
  getSettings,
  getMonthlyData,
  getTransactionsByType,
  getTransactionsByPaper,
  getTotalRevenue,
  getMonthlyRevenue,
  getTotalDiscounts,
  getTotalAdditionals,
} from '@/lib/store';

export default function AnalyticsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [mounted, setMounted] = useState(false);
  const [period, setPeriod] = useState<'6' | '12'>('6');
  const { theme } = useTheme();

  useEffect(() => {
    setTransactions(getTransactions());
    setSettings(getSettings());
    setMounted(true);
  }, []);

  if (!mounted) return <AnalyticsSkeleton />;

  const isDark = theme === 'dark';
  const gridColor = isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(148, 163, 184, 0.15)';
  const textColor = isDark ? '#64748b' : '#94a3b8';

  // Calculations
  const monthlyData = getMonthlyData(transactions, parseInt(period));
  const { prints, photocopies } = getTransactionsByType(transactions);
  const paperData = getTransactionsByPaper(transactions);
  const totalRevenue = getTotalRevenue(transactions);
  const capital = settings?.capital || 0;
  const totalDiscounts = getTotalDiscounts(transactions);
  const totalAdditionals = getTotalAdditionals(transactions);
  const now = new Date();
  const thisMonthRev = getMonthlyRevenue(transactions, now.getFullYear(), now.getMonth());
  const lastMonthRev = getMonthlyRevenue(
    transactions,
    now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear(),
    now.getMonth() === 0 ? 11 : now.getMonth() - 1
  );
  const growth = lastMonthRev > 0 ? ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100 : thisMonthRev > 0 ? 100 : 0;
  const totalCopies = transactions.reduce((s, t) => s + t.copies, 0);
  const avgOrder = transactions.length > 0 ? totalRevenue / transactions.length : 0;
  const printRevenue = prints.reduce((s, t) => s + t.finalTotal, 0);
  const photocopyRevenue = photocopies.reduce((s, t) => s + t.finalTotal, 0);

  // Revenue chart
  const revenueChart = {
    labels: monthlyData.map((d) => d.month),
    datasets: [{
      label: 'Revenue',
      data: monthlyData.map((d) => d.revenue),
      borderColor: isDark ? '#818cf8' : '#6366f1',
      backgroundColor: isDark ? 'rgba(129, 140, 248, 0.1)' : 'rgba(99, 102, 241, 0.08)',
      borderWidth: 2.5,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: isDark ? '#818cf8' : '#6366f1',
      pointBorderColor: isDark ? '#030712' : '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    }],
  };

  const revenueOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#fff',
        titleColor: isDark ? '#f1f5f9' : '#0f172a',
        bodyColor: isDark ? '#94a3b8' : '#475569',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
        callbacks: { label: (ctx: any) => `₱${ctx.raw.toLocaleString()}` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: textColor, font: { size: 11 } } },
      y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 }, callback: (v: any) => `₱${v}` } },
    },
  };

  // Type doughnut
  const typeChart = {
    labels: ['Print', 'Photocopy'],
    datasets: [{
      data: [prints.length, photocopies.length],
      backgroundColor: [isDark ? 'rgba(129, 140, 248, 0.8)' : '#6366f1', isDark ? 'rgba(34, 211, 238, 0.8)' : '#06b6d4'],
      borderColor: isDark ? '#030712' : '#ffffff',
      borderWidth: 3,
      hoverOffset: 8,
    }],
  };

  const typeOpts = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: textColor, padding: 16, usePointStyle: true, pointStyle: 'circle', font: { size: 12 } },
      },
    },
  };

  // Paper bar chart
  const paperChart = {
    labels: ['Short', 'A4', 'Long', 'Photo Paper'],
    datasets: [{
      label: 'Orders',
      data: [paperData.short.length, paperData.a4.length, paperData.long.length, paperData.photopaper.length],
      backgroundColor: [
        isDark ? 'rgba(129, 140, 248, 0.6)' : 'rgba(99, 102, 241, 0.6)',
        isDark ? 'rgba(34, 211, 238, 0.6)' : 'rgba(6, 182, 212, 0.6)',
        isDark ? 'rgba(251, 191, 36, 0.6)' : 'rgba(245, 158, 11, 0.6)',
        isDark ? 'rgba(248, 113, 113, 0.6)' : 'rgba(239, 68, 68, 0.6)',
      ],
      borderColor: [
        isDark ? '#818cf8' : '#6366f1',
        isDark ? '#22d3ee' : '#06b6d4',
        isDark ? '#fbbf24' : '#f59e0b',
        isDark ? '#f87171' : '#ef4444',
      ],
      borderWidth: 1.5,
      borderRadius: 8,
    }],
  };

  const paperOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: textColor, font: { size: 11 } } },
      y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 }, stepSize: 1 } },
    },
  };

  return (
    <div className="animate-fade-in relative">
      <ChartSetup />
      <div className="blob-2" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Financial insights and performance metrics.</p>
        </div>
        <Dropdown
          className="w-44"
          value={period}
          onChange={(v) => setPeriod(v as '6' | '12')}
          options={[
            { value: '6', label: 'Last 6 Months' },
            { value: '12', label: 'Last 12 Months' },
          ]}
        />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <MiniStat
          icon={<DollarSign className="w-4 h-4" />}
          color="indigo"
          label="Total Revenue"
          value={`₱${totalRevenue.toLocaleString()}`}
        />
        <MiniStat
          icon={growth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          color="cyan"
          label="Monthly Growth"
          value={`${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`}
        />
        <MiniStat
          icon={<Printer className="w-4 h-4" />}
          color="violet"
          label="Total Copies"
          value={totalCopies.toLocaleString()}
        />
        <MiniStat
          icon={<Tag className="w-4 h-4" />}
          color="amber"
          label="Avg. per Order"
          value={`₱${avgOrder.toFixed(0)}`}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <div className="lg:col-span-3 glass-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Revenue Trend</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Monthly income over time</p>
            </div>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="chart-container">
            <Line data={revenueChart} options={revenueOpts as any} />
          </div>
        </div>

        <div className="lg:col-span-2 glass-card p-5 sm:p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Service Distribution</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Print vs Photocopy</p>
          </div>
          <div className="chart-container h-[220px]">
            <Doughnut data={typeChart} options={typeOpts as any} />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/30">
            <div className="text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">Print</p>
              <p className="text-sm font-bold text-slate-800 dark:text-white">₱{printRevenue.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">Photocopy</p>
              <p className="text-sm font-bold text-slate-800 dark:text-white">₱{photocopyRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="glass-card p-5 sm:p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Paper Size Usage</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Orders by paper type</p>
          </div>
          <div className="chart-container h-[240px]">
            <Bar data={paperChart} options={paperOpts as any} />
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="glass-card p-5 sm:p-6">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Financial Breakdown</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Capital, revenue, and adjustments</p>
          </div>

          <div className="space-y-4">
            {/* Capital */}
            <ProgressRow label="Capital" value={capital} max={Math.max(totalRevenue, capital)} color="amber" />
            {/* Revenue */}
            <ProgressRow label="Revenue" value={totalRevenue} max={Math.max(totalRevenue, capital)} color="emerald" />

            <div className="pt-4 border-t border-slate-100 dark:border-slate-700/30 space-y-3">
              {/* ROI */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Return on Investment</span>
                <span className={`text-sm font-bold ${totalRevenue >= capital ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                  {capital > 0 ? `${(((totalRevenue - capital) / capital) * 100).toFixed(1)}%` : '—'}
                </span>
              </div>

              {/* Discounts */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowDown className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Total Discounts</span>
                </div>
                <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">-₱{totalDiscounts.toLocaleString()}</span>
              </div>

              {/* Additionals */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowUp className="w-3.5 h-3.5 text-violet-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Total Additionals</span>
                </div>
                <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">+₱{totalAdditionals.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Comparison */}
      <div className="glass-card p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">Period Comparison</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <CompareCard label="This Month" value={thisMonthRev} />
          <CompareCard label="Last Month" value={lastMonthRev} />
          <CompareCard label="Monthly Expenses" value={settings?.monthlyExpenses || 0} negative />
          <CompareCard label="Net This Month" value={thisMonthRev - (settings?.monthlyExpenses || 0)} highlight />
        </div>
      </div>
    </div>
  );
}

function MiniStat({ icon, color, label, value }: { icon: React.ReactNode; color: string; label: string; value: string }) {
  const colors: Record<string, string> = {
    indigo: 'bg-primary-100 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400',
    cyan: 'bg-accent-100 dark:bg-accent-500/15 text-accent-600 dark:text-accent-400',
    violet: 'bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400',
    amber: 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400',
  };

  return (
    <div className="stat-card flex-col gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function ProgressRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const barColors: Record<string, string> = {
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
        <span className="text-sm font-semibold text-slate-800 dark:text-white">₱{value.toLocaleString()}</span>
      </div>
      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${barColors[color]} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function CompareCard({ label, value, negative, highlight }: { label: string; value: number; negative?: boolean; highlight?: boolean }) {
  return (
    <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/30">
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <p className={`text-base font-bold ${
        highlight
          ? value >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
          : negative
            ? 'text-red-500 dark:text-red-400'
            : 'text-slate-900 dark:text-white'
      }`}>
        {negative ? '-' : ''}₱{Math.abs(value).toLocaleString()}
      </p>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-36 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
      <div className="h-4 w-56 bg-slate-200 dark:bg-slate-800 rounded mb-8" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <div className="lg:col-span-3 h-72 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="lg:col-span-2 h-72 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    </div>
  );
}
