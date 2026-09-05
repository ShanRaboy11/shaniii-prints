'use client';

import Link from 'next/link';

/**
 * Sleek, modern footer used across all user-facing pages.
 * Presentational only — no state, no side effects.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-600 to-accent-400 flex items-center justify-center shadow-md">
              <span className="text-white text-xs font-black tracking-tight">S</span>
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-800 dark:text-white">
              Shanii<span className="text-primary-500">Prints</span>
            </span>
          </div>

          {/* Nav links — typography only */}
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-500 dark:text-slate-400">
            <Link href="/dashboard" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Home
            </Link>
            <Link href="/transactions" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Orders
            </Link>
            <Link href="/analytics" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Profit
            </Link>
            <Link href="/settings" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Settings
            </Link>
          </nav>

          {/* Copyright */}
          <p className="text-xs text-slate-400 dark:text-slate-500">
            &copy; {year} Shanii Prints. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
