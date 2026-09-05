'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  FileText,
  Wallet,
  ArrowUpRight,
  Plus,
  Printer,
  Copy,
  Tag,
  PiggyBank,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useOwnerData } from '@/lib/useOwnerData';
import { ErrorState } from '@/components/ErrorState';
import { TransactionModal } from '@/components/TransactionModal';
import {
  TransactionRecord,
  txTodayRevenue,
  txWeeklyRevenue,
  txMonthlyRevenue,
  txTotalRevenue,
  txTotalDiscounts,
  txTotalAdditionals,
  sumExpenses,
  sumCapital,
  sumMonthlyExpenses,
} from '@/lib/db';

export default function DashboardPage() {
  const { profile } = useAuth();
  const { transactions, expenses, settings, loading, error, reload } = useOwnerData();
  const [showOrderModal, setShowOrderModal] = useState(false);

  if (loading) return <DashboardSkeleton />;
  if (error) return <div className="pt-4"><ErrorState message={error} onRetry={reload} /></div>;

  const now = new Date();
  const todayRevenue = txTodayRevenue(transactions);
  const weeklyRevenue = txWeeklyRevenue(transactions);
  const monthlyRevenue = txMonthlyRevenue(transactions, now.getFullYear(), now.getMonth());
  const totalRevenue = txTotalRevenue(transactions);
  const totalDiscounts = txTotalDiscounts(transactions);
  const totalAdditionals = txTotalAdditionals(transactions);

  // Financials integrated from the expenses table
  const capital = sumCapital(expenses);
  const totalExpenses = sumExpenses(expenses);
  const monthExpenses = sumMonthlyExpenses(expenses, now.getFullYear(), now.getMonth());
  const netProfit = totalRevenue - totalExpenses;
  const monthNet = monthlyRevenue - monthExpenses;

  const todayStr = now.toISOString().split('T')[0];
  const todayTransactions = transactions.filter((t) => (t.created_at || '').split('T')[0] === todayStr);
  const todayPrints = todayTransactions.filter((t) => t.print_type === 'print').length;
  const todayPhotocopies = todayTransactions.filter((t) => t.print_type === 'photocopy').length;
  const todayCopies = todayTransactions.reduce((s, t) => s + t.quantity, 0);
  const recentTransactions = transactions.slice(0, 5);

  const firstName = (profile?.full_name || '').split(' ')[0] || 'there';

  return (
    <div className="animate-fade-in relative">
      <div className="blob-1" />
      <div className="blob-2" />

      {/* Shared New Order modal — opened by the quick-action card */}
      <TransactionModal
        open={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        onSaved={reload}
        settings={settings}
      />

      {/* Greeting — clean typography, no emoji/icon */}
      <div className="mb-8">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </span>
        <h1 className="text-gradient text-3xl sm:text-4xl mt-1">
          Good {getGreeting()}, {firstName}!
        </h1>
        <p className="page-subtitle mt-2">Here&apos;s how your business is performing today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <StatCard label="Today" value={`₱${todayRevenue.toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} color="primary" sub={`${todayTransactions.length} orders`} />
        <StatCard label="This Week" value={`₱${weeklyRevenue.toLocaleString()}`} icon={<TrendingUp className="w-5 h-5" />} color="accent" sub="Last 7 days" />
        <StatCard label="This Month" value={`₱${monthlyRevenue.toLocaleString()}`} icon={<Wallet className="w-5 h-5" />} color="sky" sub={now.toLocaleString('default', { month: 'long' })} />
        <StatCard label="Net Profit" value={`₱${netProfit.toLocaleString()}`} icon={<PiggyBank className="w-5 h-5" />} color={netProfit >= 0 ? 'emerald' : 'rose'} sub="Revenue − expenses" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Quick Action — opens the New Order modal in-place */}
          <button type="button" onClick={() => setShowOrderModal(true)} className="w-full text-left block glass-card p-5 group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:shadow-primary-500/40 group-hover:scale-105 transition-all duration-300">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-white">New Order</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Record a print or photocopy</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-primary-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </button>

          {/* Today */}
          <div className="glass-card p-5">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Today&apos;s Activity</h3>
            <div className="space-y-3">
              <ActivityRow icon={<Printer className="w-4 h-4" />} bg="bg-primary-100 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400" label="Prints" value={todayPrints} />
              <ActivityRow icon={<Copy className="w-4 h-4" />} bg="bg-accent-100 dark:bg-accent-500/15 text-accent-600 dark:text-accent-400" label="Photocopies" value={todayPhotocopies} />
              <div className="pt-3 border-t border-slate-100/60 dark:border-white/5 flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Total copies</span>
                <span className="font-bold text-slate-800 dark:text-white">{todayCopies}</span>
              </div>
            </div>
          </div>

          {/* Financial Overview */}
          <div className="glass-card p-5">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Financial Overview</h3>
            <div className="space-y-2.5">
              <FinanceRow label="Capital invested" value={capital} tone="neutral" />
              <FinanceRow label="Total expenses" value={totalExpenses} tone="negative" prefix="-" />
              <FinanceRow label="This month net" value={monthNet} tone={monthNet >= 0 ? 'positive' : 'negative'} prefix={monthNet >= 0 ? '+' : '-'} abs />
              <div className="pt-2.5 border-t border-slate-100/60 dark:border-white/5 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Net profit</span>
                <span className={`text-sm font-extrabold ${netProfit >= 0 ? 'text-accent-600 dark:text-accent-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  ₱{netProfit.toLocaleString()}
                </span>
              </div>
            </div>
            <Link href="/expenses" className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
              Manage expenses &amp; capital <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Adjustments */}
          <div className="glass-card p-5">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Price Adjustments</h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Discounts</span>
                </div>
                <span className="text-sm font-bold text-orange-600 dark:text-orange-400">-₱{totalDiscounts.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-accent-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Additionals</span>
                </div>
                <span className="text-sm font-bold text-accent-600 dark:text-accent-400">+₱{totalAdditionals.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-3 glass-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Recent Orders</h3>
            <Link href="/transactions" className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
              View All &rarr;
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                <FileText className="w-7 h-7 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No orders yet</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Record your first print or photocopy</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentTransactions.map((tx) => (
                <TxRow key={tx.id} tx={tx} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type StatColor = 'primary' | 'accent' | 'sky' | 'emerald' | 'rose';

function StatCard({ label, value, icon, color, sub }: { label: string; value: string; icon: React.ReactNode; color: StatColor; sub: string }) {
  const colors: Record<StatColor, string> = {
    primary: 'bg-primary-100 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400',
    accent: 'bg-accent-100 dark:bg-accent-500/15 text-accent-600 dark:text-accent-400',
    sky: 'bg-sky-100 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    rose: 'bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400',
  };

  return (
    <div className="stat-card flex-col gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 animate-number">{value}</p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{sub}</p>
      </div>
    </div>
  );
}

function ActivityRow({ icon, bg, label, value }: { icon: React.ReactNode; bg: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bg}`}>{icon}</div>
        <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
      </div>
      <span className="text-base font-bold text-slate-800 dark:text-white">{value}</span>
    </div>
  );
}

function FinanceRow({ label, value, tone, prefix = '', abs = false }: { label: string; value: number; tone: 'neutral' | 'positive' | 'negative'; prefix?: string; abs?: boolean }) {
  const toneClass =
    tone === 'positive'
      ? 'text-accent-600 dark:text-accent-400'
      : tone === 'negative'
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-slate-800 dark:text-white';
  const shown = abs ? Math.abs(value) : value;
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      <span className={`text-sm font-bold ${toneClass}`}>{prefix}₱{shown.toLocaleString()}</span>
    </div>
  );
}

function TxRow({ tx }: { tx: TransactionRecord }) {
  const d = new Date(tx.created_at || 0);
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-primary-50/40 dark:hover:bg-primary-500/5 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tx.print_type === 'print' ? 'bg-primary-100 dark:bg-primary-500/15' : 'bg-accent-100 dark:bg-accent-500/15'}`}>
          {tx.print_type === 'print' ? <Printer className="w-4 h-4 text-primary-600 dark:text-primary-400" /> : <Copy className="w-4 h-4 text-accent-600 dark:text-accent-400" />}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {tx.print_type === 'print' ? 'Print' : 'Photocopy'} &middot; {tx.paper_size.toUpperCase()}
            {tx.is_colored && <span className="text-[10px] text-accent-600 dark:text-accent-400 ml-1 font-bold">(CLR)</span>}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            {tx.customer_name ? `${tx.customer_name} · ` : ''}{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} &middot; {tx.quantity} {tx.quantity === 1 ? 'copy' : 'copies'}
            {tx.adjustment !== 0 && <span className={`ml-1 font-medium ${tx.adjustment < 0 ? 'text-orange-500' : 'text-accent-500'}`}>({tx.adjustment_label})</span>}
          </p>
        </div>
      </div>
      <span className="text-sm font-bold text-slate-800 dark:text-white">₱{tx.final_total}</span>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-3" />
      <div className="h-10 w-72 bg-slate-200 dark:bg-slate-800 rounded-lg mb-3" />
      <div className="h-4 w-56 bg-slate-200 dark:bg-slate-800 rounded mb-8" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-[1.5rem]" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-[1.5rem]" />
          <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-[1.5rem]" />
          <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-[1.5rem]" />
        </div>
        <div className="lg:col-span-3 h-80 bg-slate-200 dark:bg-slate-800 rounded-[1.5rem]" />
      </div>
    </div>
  );
}
