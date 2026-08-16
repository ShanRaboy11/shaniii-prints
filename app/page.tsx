'use client';

import Link from 'next/link';
import {
  Printer,
  BarChart3,
  Zap,
  Shield,
  QrCode,
  Calculator,
  ArrowRight,
  Check,
  Sparkles,
  Star,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f0f4f8] dark:bg-[#0b1121] overflow-hidden">
      {/* ========== NAVBAR ========== */}
      <nav className="fixed top-0 inset-x-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-full px-6 py-3 shadow-xl">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center text-white">
                <Printer size={18} strokeWidth={2.5} />
              </div>
              <span className="text-base font-bold tracking-tight dark:text-white">
                Shanii<span className="text-indigo-500">Prints</span>
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden sm:inline-flex text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="btn-primary-gradient !rounded-full !py-2 !px-5 !text-xs"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ========== HERO ========== */}
      <section className="relative pt-36 pb-20 sm:pt-44 sm:pb-28">
        {/* Background Decorations */}
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200/60 dark:border-indigo-500/20">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
              Built for print shop owners
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-6">
            Manage your Print Shop{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-500 to-cyan-500">
              Like a Pro
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Track every transaction, estimate ink costs automatically, generate digital receipts
            with QR codes, and understand your profit margins — all from one beautiful dashboard.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="btn-primary-gradient !rounded-full !py-3.5 !px-8 !text-sm !shadow-xl !shadow-indigo-500/30 group"
            >
              Start Free Today
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="#features"
              className="btn-ghost !rounded-full !py-3.5 !px-8 !text-sm"
            >
              See Features
            </Link>
          </div>

          {/* Social Proof */}
          <div className="mt-12 flex items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span>Trusted by local print shops</span>
          </div>
        </div>
      </section>

      {/* ========== FEATURES GRID ========== */}
      <section id="features" className="relative py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
              Everything you need to run your shop
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              From transaction logging to profit analytics — all designed for speed at the counter.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              icon={<Zap className="w-5 h-5" />}
              color="indigo"
              title="Instant Transactions"
              description="Record print & photocopy orders in seconds. Automated pricing with manual override for discounts."
            />
            <FeatureCard
              icon={<Calculator className="w-5 h-5" />}
              color="purple"
              title="Ink Cost Estimator"
              description="Configure your printer and ink costs. Every transaction auto-calculates your real ink expense."
            />
            <FeatureCard
              icon={<QrCode className="w-5 h-5" />}
              color="cyan"
              title="Digital Receipts & QR"
              description="Generate a unique receipt for every order. Customers scan a QR code — no paper wasted."
            />
            <FeatureCard
              icon={<BarChart3 className="w-5 h-5" />}
              color="emerald"
              title="Profit Analytics"
              description="Revenue trends, capital vs profit, ROI tracking, and monthly breakdowns at a glance."
            />
            <FeatureCard
              icon={<Shield className="w-5 h-5" />}
              color="amber"
              title="Role-Based Access"
              description="Owner gets full analytics and settings. Customers can optionally view their order history."
            />
            <FeatureCard
              icon={<Printer className="w-5 h-5" />}
              color="rose"
              title="Multi-Printer Support"
              description="Epson L3210, generic ink tanks, laser printers, or custom — configure your exact setup."
            />
          </div>
        </div>
      </section>

      {/* ========== PRICING ========== */}
      <section className="relative py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-50/50 dark:via-indigo-500/5 to-transparent pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400">
              No hidden fees. Start free, upgrade when you grow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-3xl p-8 shadow-xl">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Starter</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Perfect for getting started</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">Free</span>
                <span className="text-sm text-slate-500 dark:text-slate-400 ml-1">forever</span>
              </div>
              <ul className="space-y-3 mb-8">
                <PricingFeature text="Unlimited transactions" />
                <PricingFeature text="Ink cost estimator" />
                <PricingFeature text="Digital receipts & QR" />
                <PricingFeature text="Basic analytics" />
                <PricingFeature text="1 printer profile" />
              </ul>
              <Link href="/signup" className="btn-ghost w-full !rounded-full !py-3 justify-center">
                Get Started Free
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="relative bg-white/80 dark:bg-slate-900/40 backdrop-blur-md border-2 border-indigo-500/50 dark:border-indigo-400/30 rounded-3xl p-8 shadow-xl shadow-indigo-500/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-xs font-bold text-white uppercase tracking-wider shadow-lg">
                  Popular
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Pro</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">For growing businesses</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">₱299</span>
                <span className="text-sm text-slate-500 dark:text-slate-400 ml-1">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <PricingFeature text="Everything in Starter" />
                <PricingFeature text="Advanced profit analytics" />
                <PricingFeature text="Expense tracking" />
                <PricingFeature text="Unlimited printer profiles" />
                <PricingFeature text="PDF receipt download" />
                <PricingFeature text="Priority support" />
              </ul>
              <Link href="/signup" className="btn-primary-gradient w-full !rounded-full !py-3 justify-center">
                Start 14-day Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FOOTER CTA ========== */}
      <section className="py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            Ready to take control of your print shop?
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 mb-8">
            Join shop owners who save hours every week with automated tracking and smart insights.
          </p>
          <Link
            href="/signup"
            className="btn-primary-gradient !rounded-full !py-3.5 !px-8 !text-sm !shadow-xl !shadow-indigo-500/30"
          >
            Get Started — It&apos;s Free
          </Link>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="border-t border-slate-200/60 dark:border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center text-white">
              <Printer size={14} strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold dark:text-white">Shanii<span className="text-indigo-500">Prints</span></span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} Shanii Prints. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

// --- Sub-components ---

function FeatureCard({
  icon,
  color,
  title,
  description,
}: {
  icon: React.ReactNode;
  color: 'indigo' | 'purple' | 'cyan' | 'emerald' | 'amber' | 'rose';
  title: string;
  description: string;
}) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
    purple: 'bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400',
    cyan: 'bg-cyan-100 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400',
    rose: 'bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400',
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${colors[color]}`}>
        {icon}
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

function PricingFeature({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
      {text}
    </li>
  );
}
