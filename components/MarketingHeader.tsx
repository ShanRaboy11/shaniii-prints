'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Printer } from 'lucide-react';

/**
 * MarketingHeader
 * The shared unauthenticated header used on the landing and login pages.
 * Keeping a single component guarantees identical glassmorphic styling,
 * logo, typography, and the Light/Dark theme toggle across both pages.
 */
export function MarketingHeader() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
      <header className="w-full max-w-6xl animate-header-in">
        <div className="header-glass flex items-center justify-between rounded-full px-4 sm:px-6 py-3">
          {/* Brand — printer icon + wordmark (matches app Header) */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-500 to-accent-400 flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:scale-105 transition-transform duration-300">
              <Printer size={18} strokeWidth={2.5} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight dark:text-white">
              Shanii<span className="text-primary-500">Prints</span>
            </span>
          </Link>

          {/* Right actions — theme toggle + auth CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-primary-600" />}
              </button>
            )}

            <Link
              href="/login"
              className="hidden sm:inline-flex px-4 py-2 rounded-full text-xs font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors"
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
      </header>
    </div>
  );
}
