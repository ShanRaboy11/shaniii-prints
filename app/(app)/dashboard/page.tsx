'use client';

import { useEffect, useState } from 'react';
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
  Sparkles,
  Tag,
} from 'lucide-react';
import {
  getTransactions,
  getSettings,
  getTodayRevenue,
  getWeeklyRevenue,
  getMonthlyRevenue,
  getTotalRevenue,
  getTotalDiscounts,
  getTotalAdditionals,
  Transaction,
  SettingsData,
} from '@/lib/store';

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTransactions(getTransactions());
    setSettings(getSettings());
    setMounted(true);
  }, []);

  if (!mounted) return <DashboardSkeleton />;

  const now = new Date();
  const todayRevenue = getTodayRevenue(transactions);
  const weeklyRevenue = getWeeklyRevenue(transactions);
  const monthlyRevenue = getMonthlyRevenue(transactions, now.getFullYear(), now.getMonth());
  const totalRevenue = getTotalRevenue(transactions);
  const capital = settings?.capital || 0;
  const totalDiscounts = getTotalDiscounts(transactions);
  const totalAdditionals = getTotalAdditionals(transactions);

  const todayStr = now.toISOString().split('T')[0];
  const todayTransactions = transactions.filter((t) => t.date.split('T')[0] === todayStr);
  const todayPrints = todayTransactions.filter((t) => t.type === 'print').length;
  const todayPhotocopies = todayTransactions.filter((t) => t.type === 'photocopy').length;
  const todayCopies = todayTransactions.reduce((s, t) => s + t.copies, 0);
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="animate-fade-in relative">
      <div className="blob-1" />
      <div className="blob-2" />

      {/* Greeting */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>
        <h1 className="text-gradient text-3xl sm:text-4xl">
          Good {getGreeting()}, Shanii!
        </h1>
        <p className="page-subtitle mt-2">Here&apos;s how your business is performing today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <StatCard label="Today" value={`₱${todayRevenue.toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} color="indigo" sub={`${todayTransactions.length} orders`} />
        <StatCard label="This Week" value={`₱${weeklyRevenue.toLocaleString()}`} icon={<TrendingUp className="w-5 h-5" />} color="cyan" sub="Last 7 days" />
        <StatCard label="This Month" value={`₱${monthlyRevenue.toLocaleString()}`} icon={<Wallet className="w-5 h-5" />} color="purple" sub={now.toLocaleString('default', { month: 'long' })} />
        <StatCard label="Capital" value={`₱${capital.toLocaleString()}`} icon={<FileText className="w-5 h-5" />} color="amber" sub={`ROI: ${capital > 0 ? ((totalRevenue / capital) * 100).toFixed(0) : 0}%`} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Quick Action */}
          <Link href="/transactions" className="block glass-card p-5 group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 group-hover:scale-105 transition-all duration-300">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-white">New Order</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Record a print or photocopy</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </Link>

          {/* Today */}
          <div className="glass-card p-5">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Today&apos;s Activity</h3>
            <div className="space-y-3">
              <ActivityRow icon={<Printer className="w-4 h-4" />} bg="bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400" label="Prints" value={todayPrints} />
              <ActivityRow icon={<Copy className="w-4 h-4" />} bg="bg-cyan-100 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400" label="Photocopies" value={todayPhotocopies} />
              <div className="pt-3 border-t border-slate-100/60 dark:border-white/5 flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Total copies</span>
                <span className="font-bold text-slate-800 dark:text-white">{todayCopies}</span>
              </div>
            </div>
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
                  <Plus className="w-3.5 h-3.5 text-violet-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Additionals</span>
                </div>
                <span className="text-sm font-bold text-violet-600 dark:text-violet-400">+₱{totalAdditionals.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-3 glass-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Recent Orders</h3>
            <Link href="/transactions" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
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

function StatCard({ label, value, icon, color, sub }: { label: string; value: string; icon: React.ReactNode; color: 'indigo' | 'cyan' | 'purple' | 'amber'; sub: string }) {
  const colors = {
    indigo: 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
    cyan: 'bg-cyan-100 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
    purple: 'bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400',
    amber: 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400',
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

function TxRow({ tx }: { tx: Transaction }) {
  const d = new Date(tx.date);
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tx.type === 'print' ? 'bg-indigo-100 dark:bg-indigo-500/15' : 'bg-cyan-100 dark:bg-cyan-500/15'}`}>
          {tx.type === 'print' ? <Printer className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> : <Copy className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {tx.type === 'print' ? 'Print' : 'Photocopy'} &middot; {tx.paperSize.toUpperCase()}
            {tx.colored && <span className="text-[10px] text-purple-500 dark:text-purple-400 ml-1 font-bold">(CLR)</span>}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} &middot; {tx.copies} {tx.copies === 1 ? 'copy' : 'copies'}
            {tx.adjustment !== 0 && <span className={`ml-1 font-medium ${tx.adjustment < 0 ? 'text-orange-500' : 'text-violet-500'}`}>({tx.adjustmentLabel})</span>}
          </p>
        </div>
      </div>
      <span className="text-sm font-bold text-slate-800 dark:text-white">₱{tx.finalTotal}</span>
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
        </div>
        <div className="lg:col-span-3 h-80 bg-slate-200 dark:bg-slate-800 rounded-[1.5rem]" />
      </div>
    </div>
  );
}
