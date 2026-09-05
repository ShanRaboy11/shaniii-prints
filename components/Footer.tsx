'use client';

import Link from 'next/link';
import { Printer, Mail, Github, Twitter } from 'lucide-react';
import { useAuth } from './AuthProvider';

/**
 * Rich, fully responsive multi-column footer used across all user-facing pages.
 * Frosted glass surface, branded messaging, organized resource columns, and a
 * legal/copyright row. The "Account" column (sign in / create account) is
 * conditionally hidden whenever a user is actively logged in.
 */
export function Footer() {
  const year = new Date().getFullYear();
  const { isAuthenticated } = useAuth();

  type Column = { title: string; links: { label: string; href: string }[] };

  const productColumn: Column = {
    title: 'Product',
    links: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Orders', href: '/transactions' },
      { label: 'Profit Analytics', href: '/analytics' },
      { label: 'Expenses', href: '/expenses' },
    ],
  };

  const resourcesColumn: Column = {
    title: 'Resources',
    links: [
      { label: 'Getting Started', href: '/dashboard' },
      { label: 'Ink Estimator', href: '/settings' },
      { label: 'Receipts', href: '/transactions' },
    ],
  };

  const accountColumn: Column = {
    title: 'Account',
    links: [
      { label: 'Sign In', href: '/login' },
      { label: 'Create Account', href: '/signup' },
    ],
  };

  // Hide the Account column entirely when the user is logged in.
  const columns: Column[] = isAuthenticated
    ? [productColumn, resourcesColumn]
    : [productColumn, resourcesColumn, accountColumn];

  return (
    <footer className="site-footer mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        {/* Top: brand block + resource columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-10">
          {/* Brand messaging */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-500 to-accent-400 flex items-center justify-center shadow-lg shadow-primary-500/30">
                <Printer size={18} strokeWidth={2.5} className="text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-800 dark:text-white">
                Shanii<span className="text-primary-500">Prints</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
              The all-in-one management suite for print shops — track orders, estimate ink costs,
              manage expenses, and understand your profit at a glance.
            </p>

            {/* Social / contact */}
            <div className="flex items-center gap-2.5 mt-5">
              {[
                { icon: <Mail size={16} />, label: 'Email' },
                { icon: <Twitter size={16} />, label: 'Twitter' },
                { icon: <Github size={16} />, label: 'GitHub' },
              ].map((s) => (
                <button
                  key={s.label}
                  aria-label={s.label}
                  className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-300 dark:hover:border-primary-500/40 transition-colors"
                >
                  {s.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Resource columns — responsive column count adapts to how many exist */}
          <div className={`md:col-span-7 grid gap-8 ${columns.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
            {columns.map((col) => (
              <div key={col.title}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                  {col.title}
                </h4>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-sm text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />

        {/* Bottom: legal / copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            &copy; {year} Shanii Prints. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5 text-xs text-slate-400 dark:text-slate-500">
            <Link href="/" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Privacy</Link>
            <Link href="/" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Terms</Link>
            <span className="hidden md:inline">Print shop management, simplified.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
