'use client';

import { Printer } from 'lucide-react';

/**
 * Sleek, modern footer used across all user-facing pages.
 * Quick Links section removed — keeps essential branding + copyright only.
 * Presentational only — no state, no side effects.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-500 to-accent-400 flex items-center justify-center shadow-md">
              <Printer size={15} strokeWidth={2.5} className="text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-800 dark:text-white">
              Shanii<span className="text-primary-500">Prints</span>
            </span>
          </div>

          {/* Tagline */}
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
            Print shop management, simplified.
          </p>

          {/* Copyright */}
          <p className="text-xs text-slate-400 dark:text-slate-500">
            &copy; {year} Shanii Prints. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
