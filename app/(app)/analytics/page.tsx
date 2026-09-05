'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import ChartSetup from '@/components/charts/ChartSetup';
import { ErrorState } from '@/components/ErrorState';
import { useOwnerData } from '@/lib/useOwnerData';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Tag,
  ArrowDown,
  ArrowUp,
  Calendar,
  ShoppingCart,
} from 'lucide-react';
import {
  txByType,
  txByPaper,
  txSeries,
  txTotalRevenue,
  txTotalDiscounts,
  txTotalAdditionals,
  sumCapital,
  sumExpenses,
  timeframeMetrics,
  TIMEFRAME_LABEL,
  Timeframe,
} from '@/lib/db';

// Brand chart colors — light blue (primary) + light green (accent)
const C = {
  primary: '#0ea5e9',
  primaryDark: '#38bdf8',
  accent: '#22c55e',
  accentDark: '#4ade80',
};

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export default function AnalyticsPage() {
  const { transactions, expenses, loading, error, reload } = useOwnerData();
  const [timeframe, setTimeframe] = useState<Timeframe>('monthly'); // Monthly default
  const { theme } = useTheme();

  if (loading) return <AnalyticsSkeleton />;
  if (error) return <div className="pt-4"><ErrorState message={error} onRetry={reload} /></div>;

  const isDark = theme === 'dark';
  const gridColor = isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(148, 163, 184, 0.15)';
  const textColor = isDark ? '#64748b' : '#94a3b8';

  // Timeframe-scoped metrics
  const m = timeframeMetrics(transactions, expenses, timeframe);
  const series = txSeries(transactions, timeframe);

  // All-time / structural data
  const { prints, photocopies } = txByType(transactions);
  const paperData = txByPaper(transactions);
  const totalRevenue = txTotalRevenue(transactions);
  const capital = sumCapital(expenses);
  const totalExpenses = sumExpenses(expenses);
  const totalDiscounts = txTotalDiscounts(transactions);
  const totalAdditionals = txTotalAdditionals(transactions);
  const printRevenue = prints.reduce((s, t) => s + t.final_total, 0);
  const photocopyRevenue = photocopies.reduce((s, t) => s + t.final_total, 0);
  const netProfit = totalRevenue - totalExpenses;

  const tfLabel = TIMEFRAME_LABEL[timeframe];
  const trendLabel = timeframe === 'daily' ? 'Last 14 days' : timeframe === 'weekly' ? 'Last 8 weeks' : 'Last 6 months';

  // Revenue chart
  const revenueChart = {
    labels: series.map((d) => d.label),
    datasets: [{
      label: 'Revenue',
      data: series.map((d) => d.revenue),
      borderColor: isDark ? C.primaryDark : C.primary,
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(14, 165, 233, 0.10)',
      borderWidth: 2.5,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: isDark ? C.primaryDark : C.primary,
      pointBorderColor: isDark ? '#070b14' : '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 3,
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
      x: { grid: { display: false }, ticks: { color: textColor, font: { size: 11 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } },
      y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 }, callback: (v: any) => `₱${v}` } },
    },
  };

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
  // Micro-chart sparkline points for the revenue panel
  const spark = series.map((d) => d.revenue);

  return (
    <div className="animate-fade-in relative">
      <ChartSetup />
      <div className="blob-1" />
      <div className="blob-2" />

      {/* Header + Timeframe segmented control */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Financial insights and performance metrics.</p>
        </div>
        <Segmented value={timeframe} onChange={setTimeframe} options={TIMEFRAMES} />
      </div>

      {/* High-variance metric panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <MetricPanel
          tone="primary"
          icon={<DollarSign className="w-5 h-5" />}
          label={`${tfLabel} Revenue`}
          value={`₱${m.curRevenue.toLocaleString()}`}
          trend={m.growth}
          spark={spark}
        />
        <MetricPanel
          tone="accent"
          icon={<TrendingUp className="w-5 h-5" />}
          label={`${tfLabel} Net Profit`}
          value={`₱${m.netProfit.toLocaleString()}`}
          sub={`Expenses ₱${m.curExpenses.toLocaleString()}`}
          positive={m.netProfit >= 0}
        />
        <MetricPanel
          tone="sky"
          icon={<ShoppingCart className="w-5 h-5" />}
          label={`${tfLabel} Orders`}
          value={m.orders.toLocaleString()}
          sub={`${m.copies.toLocaleString()} copies`}
        />
        <MetricPanel
          tone="amber"
          icon={<Tag className="w-5 h-5" />}
          label="Avg. per Order"
          value={`₱${m.avgOrder.toFixed(0)}`}
          sub={tfLabel}
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
            <Panel className="lg:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Revenue Trend</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{trendLabel}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary-100 dark:bg-primary-500/15 text-primary-700 dark:text-primary-300">
                  <Calendar className="w-3 h-3" /> {tfLabel}
                </span>
              </div>
              <div className="chart-container">
                <Line data={revenueChart} options={revenueOpts as any} />
              </div>
            </Panel>

            <Panel className="lg:col-span-2">
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
            </Panel>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Panel>
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Paper Size Usage</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Orders by paper type</p>
              </div>
              <div className="chart-container h-[240px]">
                <Bar data={paperChart} options={paperOpts as any} />
              </div>
            </Panel>

            {/* Financial Breakdown */}
            <Panel>
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Financial Breakdown</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">All-time capital, revenue &amp; profit</p>
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
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Segmented control ---------- */
function Segmented({ value, onChange, options }: { value: Timeframe; onChange: (v: Timeframe) => void; options: { value: Timeframe; label: string }[] }) {
  return (
    <div className="inline-flex p-1 rounded-2xl bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-white/60 dark:border-white/10 ring-1 ring-white/40 dark:ring-white/5 shadow-sm self-start">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`relative px-4 sm:px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
              active
                ? 'text-white shadow-md'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {active && (
              <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 -z-0" />
            )}
            <span className="relative z-10">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- High-variance metric panel ---------- */
type Tone = 'primary' | 'accent' | 'sky' | 'amber';

function MetricPanel({
  tone, icon, label, value, sub, trend, positive, spark,
}: {
  tone: Tone;
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  trend?: number;
  positive?: boolean;
  spark?: number[];
}) {
  const tones: Record<Tone, { grad: string; ring: string; iconBg: string; glow: string }> = {
    primary: {
      grad: 'from-primary-500/15 to-transparent',
      ring: 'ring-primary-300/40 dark:ring-primary-400/20',
      iconBg: 'bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-300',
      glow: 'bg-primary-400/20',
    },
    accent: {
      grad: 'from-accent-500/15 to-transparent',
      ring: 'ring-accent-300/40 dark:ring-accent-400/20',
      iconBg: 'bg-accent-100 dark:bg-accent-500/20 text-accent-600 dark:text-accent-300',
      glow: 'bg-accent-400/20',
    },
    sky: {
      grad: 'from-sky-500/15 to-transparent',
      ring: 'ring-sky-300/40 dark:ring-sky-400/20',
      iconBg: 'bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-300',
      glow: 'bg-sky-400/20',
    },
    amber: {
      grad: 'from-amber-500/15 to-transparent',
      ring: 'ring-amber-300/40 dark:ring-amber-400/20',
      iconBg: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300',
      glow: 'bg-amber-400/20',
    },
  };
  const t = tones[tone];

  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-white/60 dark:border-white/10 ring-1 ${t.ring} shadow-[0_8px_30px_rgba(2,132,199,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:-translate-y-1 transition-all duration-300`}>
      {/* tinted gradient wash */}
      <div className={`absolute inset-0 bg-gradient-to-br ${t.grad} pointer-events-none`} />
      {/* muted glow blob */}
      <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl ${t.glow} pointer-events-none`} />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.iconBg}`}>{icon}</div>
          {typeof trend === 'number' && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
              trend >= 0
                ? 'bg-accent-100 dark:bg-accent-500/15 text-accent-700 dark:text-accent-300'
                : 'bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300'
            }`}>
              {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
            </span>
          )}
        </div>

        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-4">{label}</p>
        <p className={`text-xl sm:text-2xl font-extrabold mt-0.5 ${
          positive === false ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
        }`}>{value}</p>
        {sub && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}

        {spark && spark.length > 1 && <Sparkline data={spark} tone={tone} />}
      </div>
    </div>
  );
}

/* ---------- Inline SVG micro-chart ---------- */
function Sparkline({ data, tone }: { data: number[]; tone: Tone }) {
  const w = 120;
  const h = 26;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(' ');
  const strokes: Record<Tone, string> = {
    primary: 'stroke-primary-500',
    accent: 'stroke-accent-500',
    sky: 'stroke-sky-500',
    amber: 'stroke-amber-500',
  };
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-6 mt-3" preserveAspectRatio="none">
      <polyline points={pts} fill="none" className={strokes[tone]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------- Reusable elevated glass panel ---------- */
function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-white/60 dark:border-white/10 ring-1 ring-white/40 dark:ring-white/5 shadow-[0_8px_30px_rgba(2,132,199,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] ${className}`}>
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />
      {children}
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

function AnalyticsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-36 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
      <div className="h-4 w-56 bg-slate-200 dark:bg-slate-800 rounded mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => <div key={i} className="h-36 bg-slate-200 dark:bg-slate-800 rounded-2xl" />)}
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
