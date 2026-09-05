'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import ChartSetup from '@/components/charts/ChartSetup';
import { Dropdown } from '@/components/Dropdown';
import { ErrorState } from '@/components/ErrorState';
import { useOwnerData } from '@/lib/useOwnerData';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Printer,
  Tag,
  ArrowDown,
  ArrowUp,
  Calendar,
} from 'lucide-react';
import {
  txByType,
  txByPaper,
  txMonthlySeries,
  txTotalRevenue,
  txMonthlyRevenue,
  txTotalDiscounts,
  txTotalAdditionals,
  sumCapital,
  sumExpenses,
  sumMonthlyExpenses,
} from '@/lib/db';

// Brand chart colors — light blue (primary) + light green (accent)
const C = {
  primary: '#0ea5e9',
  primaryDark: '#38bdf8',
  accent: '#22c55e',
  accentDark: '#4ade80',
};

export default function AnalyticsPage() {
  const { transactions, expenses, loading, error, reload } = useOwnerData();
  const [period, setPeriod] = useState<'6' | '12'>('6');
  const { theme } = useTheme();

  if (loading) return <AnalyticsSkeleton />;
  if (error) return <div className="pt-4"><ErrorState message={error} onRetry={reload} /></div>;

  const isDark = theme === 'dark';
  const gridColor = isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(148, 163, 184, 0.15)';
  const textColor = isDark ? '#64748b' : '#94a3b8';

  // Calculations
  const monthlyData = txMonthlySeries(transactions, parseInt(period));
  const { prints, photocopies } = txByType(transactions);
  const paperData = txByPaper(transactions);
  const totalRevenue = txTotalRevenue(transactions);
  const capital = sumCapital(expenses);
  const totalExpenses = sumExpenses(expenses);
  const totalDiscounts = txTotalDiscounts(transactions);
  const totalAdditionals = txTotalAdditionals(transactions);
  const now = new Date();
  const thisMonthRev = txMonthlyRevenue(transactions, now.getFullYear(), now.getMonth());
  const lastMonthRev = txMonthlyRevenue(
    transactions,
    now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear(),
    now.getMonth() === 0 ? 11 : now.getMonth() - 1
  );
  const monthExpenses = sumMonthlyExpenses(expenses, now.getFullYear(), now.getMonth());
  const growth = lastMonthRev > 0 ? ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100 : thisMonthRev > 0 ? 100 : 0;
  const totalCopies = transactions.reduce((s, t) => s + t.quantity, 0);
  const avgOrder = transactions.length > 0 ? totalRevenue / transactions.length : 0;
  const printRevenue = prints.reduce((s, t) => s + t.final_total, 0);
  const photocopyRevenue = photocopies.reduce((s, t) => s + t.final_total, 0);
  const netProfit = totalRevenue - totalExpenses;

  // Revenue chart
  const revenueChart = {
    labels: monthlyData.map((d) => d.month),
    datasets: [{
      label: 'Revenue',
      data: monthlyData.map((d) => d.revenue),
      borderColor: isDark ? C.primaryDark : C.primary,
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(14, 165, 233, 0.10)',
      borderWidth: 2.5,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: isDark ? C.primaryDark : C.primary,
      pointBorderColor: isDark ? '#070b14' : '#ffffff',
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

  // Type doughnut — primary (print) vs accent (photocopy)
  const typeChart = {
    labels: ['Print', 'Photocopy'],
    datasets: [{
      data: [prints.length, photocopies.length],
      backgroundColor: [
        isDark ? 'rgba(56, 189, 248, 0.85)' : C.primary,
        isDark ? 'rgba(74, 222, 128, 0.85)' : C.accent,
      ],
      borderColor: isDark ? '#070b14' : '#ffffff',
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
        isDark ? 'rgba(56, 189, 248, 0.6)' : 'rgba(14, 165, 233, 0.6)',
        isDark ? 'rgba(74, 222, 128, 0.6)' : 'rgba(34, 197, 94, 0.6)',
        isDark ? 'rgba(251, 191, 36, 0.6)' : 'rgba(245, 158, 11, 0.6)',
        isDark ? 'rgba(248, 113, 113, 0.6)' : 'rgba(239, 68, 68, 0.6)',
      ],
      borderColor: [
        isDark ? C.primaryDark : C.primary,
        isDark ? C.accentDark : C.accent,
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

  const hasData = transactions.length > 0;

  return (
    <div className="animate-fade-in relative">
      <ChartSetup />
      <div className="blob-1" />
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
          color="primary"
          label="Total Revenue"
          value={`₱${totalRevenue.toLocaleString()}`}
        />
        <MiniStat
          icon={growth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          color="accent"
          label="Monthly Growth"
          value={`${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`}
        />
        <MiniStat
          icon={<Printer className="w-4 h-4" />}
          color="sky"
          label="Total Copies"
          value={totalCopies.toLocaleString()}
        />
        <MiniStat
          icon={<Tag className="w-4 h-4" />}
          color="emerald"
          label="Avg. per Order"
          value={`₱${avgOrder.toFixed(0)}`}
        />
      </div>

      {!hasData ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
            <TrendingUp className="w-7 h-7 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No data yet</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Record orders to see analytics come to life.</p>
        </div>
      ) : (
        <>
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
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
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
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Capital, revenue &amp; profit</p>
              </div>

              <div className="space-y-4">
                <ProgressRow label="Capital invested" value={capital} max={Math.max(totalRevenue, capital, totalExpenses)} color="amber" />
                <ProgressRow label="Total revenue" value={totalRevenue} max={Math.max(totalRevenue, capital, totalExpenses)} color="primary" />
                <ProgressRow label="Total expenses" value={totalExpenses} max={Math.max(totalRevenue, capital, totalExpenses)} color="rose" />

                <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Net Profit</span>
                    <span className={`text-sm font-bold ${netProfit >= 0 ? 'text-accent-600 dark:text-accent-400' : 'text-rose-500'}`}>
                      ₱{netProfit.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Return on Investment</span>
                    <span className={`text-sm font-bold ${netProfit >= 0 ? 'text-accent-600 dark:text-accent-400' : 'text-rose-500'}`}>
                      {capital > 0 ? `${((netProfit / capital) * 100).toFixed(1)}%` : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowDown className="w-3.5 h-3.5 text-orange-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Total Discounts</span>
                    </div>
                    <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">-₱{totalDiscounts.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowUp className="w-3.5 h-3.5 text-accent-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Total Additionals</span>
                    </div>
                    <span className="text-sm font-semibold text-accent-600 dark:text-accent-400">+₱{totalAdditionals.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Comparison */}
          <div className="glass-card p-5 sm:p-6">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">Period Comparison</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <CompareCard label="This Month Rev." value={thisMonthRev} />
              <CompareCard label="Last Month Rev." value={lastMonthRev} />
              <CompareCard label="This Month Exp." value={monthExpenses} negative />
              <CompareCard label="Net This Month" value={thisMonthRev - monthExpenses} highlight />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

type MiniColor = 'primary' | 'accent' | 'sky' | 'emerald';

function MiniStat({ icon, color, label, value }: { icon: React.ReactNode; color: MiniColor; label: string; value: string }) {
  const colors: Record<MiniColor, string> = {
    primary: 'bg-primary-100 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400',
    accent: 'bg-accent-100 dark:bg-accent-500/15 text-accent-600 dark:text-accent-400',
    sky: 'bg-sky-100 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
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
    primary: 'bg-primary-500',
    accent: 'bg-accent-500',
    rose: 'bg-rose-500',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
        <span className="text-sm font-semibold text-slate-800 dark:text-white">₱{value.toLocaleString()}</span>
      </div>
      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${barColors[color] || 'bg-primary-500'} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function CompareCard({ label, value, negative, highlight }: { label: string; value: number; negative?: boolean; highlight?: boolean }) {
  return (
    <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-white/5">
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <p className={`text-base font-bold ${
        highlight
          ? value >= 0 ? 'text-accent-600 dark:text-accent-400' : 'text-rose-500 dark:text-rose-400'
          : negative
            ? 'text-rose-500 dark:text-rose-400'
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    </div>
  );
}
