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
import { Reveal } from '@/components/Reveal';
import { Footer } from '@/components/Footer';
import { MarketingHeader } from '@/components/MarketingHeader';
import { AnimatedDotGrid } from '@/components/AnimatedDotGrid';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f4f8fb] dark:bg-[#05070e] overflow-hidden">
      {/* Interactive dot-matrix background — fixed behind the whole page */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Extra animated gradient blobs + floating decorative rings for depth */}
        <div className="absolute -top-24 -left-24 w-[30rem] h-[30rem] rounded-full bg-primary-500/10 dark:bg-primary-500/25 blur-3xl animate-float" />
        <div className="absolute top-1/3 -right-28 w-[34rem] h-[34rem] rounded-full bg-accent-500/10 dark:bg-accent-500/22 blur-3xl" style={{ animation: 'floatX 13s ease-in-out infinite' }} />
        <div className="absolute -bottom-32 left-1/4 w-[28rem] h-[28rem] rounded-full bg-indigo-500/8 dark:bg-indigo-500/20 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="deco-ring w-72 h-72 top-24 right-[12%]" style={{ animation: 'spinSlow 60s linear infinite' }} />
        <div className="deco-ring w-52 h-52 bottom-32 left-[8%]" style={{ animation: 'spinSlow 48s linear infinite reverse' }} />
        <AnimatedDotGrid />
      </div>

      {/* ========== HEADER — shared marketing header (matches login) ========== */}
      <div className="relative z-50">
        <MarketingHeader />
      </div>

      {/* ========== HERO — full viewport section ========== */}
      <section id="hero" className="section-viewport relative z-10 pt-32 sm:pt-36">
        {/* Background Decorations */}
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-primary-500/10 blur-3xl pointer-events-none animate-float" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-accent-500/10 blur-3xl pointer-events-none animate-float" style={{ animationDelay: '1.5s' }} />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <Reveal>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-primary-100 dark:bg-primary-500/10 border border-primary-200/60 dark:border-primary-500/20">
              <Sparkles className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
              <span className="text-xs font-semibold text-primary-700 dark:text-primary-300 uppercase tracking-wider">
                Built for print shop owners
              </span>
            </div>
          </Reveal>

          {/* Headline */}
          <Reveal delay={80}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-6">
              Manage your Print Shop{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 via-sky-500 to-accent-500">
                Like a Pro
              </span>
            </h1>
          </Reveal>

          {/* Subheadline */}
          <Reveal delay={160}>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Track every transaction, estimate ink costs automatically, generate digital receipts
              with QR codes, and understand your profit margins — all from one beautiful dashboard.
            </p>
          </Reveal>

          {/* CTA Buttons */}
          <Reveal delay={240}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="btn-primary-gradient !rounded-full !py-3.5 !px-8 !text-sm !shadow-xl !shadow-primary-500/30 group"
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
          </Reveal>

          {/* Social Proof */}
          <Reveal delay={320}>
            <div className="mt-12 flex items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span>Trusted by local print shops</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ========== FEATURES GRID — full viewport section ========== */}
      <section id="features" className="section-viewport relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
                Everything you need to run your shop
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                From transaction logging to profit analytics — all designed for speed at the counter.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <Reveal delay={0}>
              <FeatureCard
                icon={<Zap className="w-5 h-5" />}
                color="primary"
                title="Instant Transactions"
                description="Record print & photocopy orders in seconds. Automated pricing with manual override for discounts."
              />
            </Reveal>
            <Reveal delay={80}>
              <FeatureCard
                icon={<Calculator className="w-5 h-5" />}
                color="sky"
                title="Ink Cost Estimator"
                description="Configure your printer and ink costs. Every transaction auto-calculates your real ink expense."
              />
            </Reveal>
            <Reveal delay={160}>
              <FeatureCard
                icon={<QrCode className="w-5 h-5" />}
                color="accent"
                title="Digital Receipts & QR"
                description="Generate a unique receipt for every order. Customers scan a QR code — no paper wasted."
              />
            </Reveal>
            <Reveal delay={0}>
              <FeatureCard
                icon={<BarChart3 className="w-5 h-5" />}
                color="emerald"
                title="Profit Analytics"
                description="Revenue trends, capital vs profit, ROI tracking, and monthly breakdowns at a glance."
              />
            </Reveal>
            <Reveal delay={80}>
              <FeatureCard
                icon={<Shield className="w-5 h-5" />}
                color="amber"
                title="Role-Based Access"
                description="Owner gets full analytics and settings. Customers can optionally view their order history."
              />
            </Reveal>
            <Reveal delay={160}>
              <FeatureCard
                icon={<Printer className="w-5 h-5" />}
                color="rose"
                title="Multi-Printer Support"
                description="Epson L3210, generic ink tanks, laser printers, or custom — configure your exact setup."
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ========== PRICING — full viewport section ========== */}
      <section id="pricing" className="section-viewport relative z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-50/50 dark:via-primary-500/5 to-transparent pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 w-full">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
                Simple, transparent pricing
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400">
                No hidden fees. Start free, upgrade when you grow.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {/* Free Plan */}
            <Reveal delay={0}>
              <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-3xl p-8 shadow-xl h-full">
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
            </Reveal>

            {/* Pro Plan */}
            <Reveal delay={120}>
              <div className="relative bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border-2 border-primary-500/50 dark:border-primary-400/30 rounded-3xl p-8 shadow-xl shadow-primary-500/10 h-full">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 text-xs font-bold text-white uppercase tracking-wider shadow-lg">
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
            </Reveal>

            {/* AI Integration Plan */}
            <Reveal delay={240}>
              <div className="relative rounded-3xl p-8 h-full overflow-hidden bg-gradient-to-br from-primary-600 to-accent-500 shadow-xl shadow-primary-500/25">
                {/* Ambient glow accents */}
                <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/20 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-10 w-52 h-52 rounded-full bg-accent-300/30 blur-3xl pointer-events-none" />

                <div className="absolute top-5 right-5">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-bold text-white uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" /> New
                  </span>
                </div>

                <div className="relative">
                  <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm mb-3">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">AI Integration</h3>
                    <p className="text-sm text-white/70">Intelligent automation, built in</p>
                  </div>
                  <div className="mb-6">
                    <span className="text-4xl font-extrabold text-white">₱599</span>
                    <span className="text-sm text-white/70 ml-1">/month</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <PricingFeature text="Everything in Pro" light />
                    <PricingFeature text="AI-powered smart pricing" light />
                    <PricingFeature text="Demand forecasting" light />
                    <PricingFeature text="Smart receipt insights" light />
                    <PricingFeature text="Automated expense categorization" light />
                    <PricingFeature text="Natural-language reports" light />
                  </ul>
                  <Link href="/signup" className="w-full inline-flex items-center justify-center gap-2 !rounded-full !py-3 bg-white text-primary-600 font-semibold shadow-lg hover:bg-white/90 transition-colors">
                    Start with AI
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ========== FINAL CTA — full viewport section ========== */}
      <section id="cta" className="section-viewport relative z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center w-full">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
              Ready to take control of your print shop?
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 mb-8">
              Join shop owners who save hours every week with automated tracking and smart insights.
            </p>
            <Link
              href="/signup"
              className="btn-primary-gradient !rounded-full !py-3.5 !px-8 !text-sm !shadow-xl !shadow-primary-500/30"
            >
              Get Started — It&apos;s Free
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <div className="relative z-10">
        <Footer />
      </div>
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
  color: 'primary' | 'sky' | 'accent' | 'emerald' | 'amber' | 'rose';
  title: string;
  description: string;
}) {
  const colors: Record<string, string> = {
    primary: 'bg-primary-100 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400',
    sky: 'bg-sky-100 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400',
    accent: 'bg-accent-100 dark:bg-accent-500/15 text-accent-600 dark:text-accent-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400',
    rose: 'bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400',
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${colors[color]}`}>
        {icon}
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

function PricingFeature({ text, light = false }: { text: string; light?: boolean }) {
  return (
    <li className={`flex items-center gap-3 text-sm ${light ? 'text-white/90' : 'text-slate-700 dark:text-slate-300'}`}>
      <Check className={`w-4 h-4 flex-shrink-0 ${light ? 'text-white' : 'text-accent-500'}`} />
      {text}
    </li>
  );
}
