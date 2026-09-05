'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Printer, Menu, X } from 'lucide-react';

// Landing section anchors surfaced in the mobile drawer.
const MARKETING_NAV = [
  { href: '/#features', label: 'Features' },
  { href: '/#pricing', label: 'Pricing' },
];

/**
 * MarketingHeader
 * The shared unauthenticated header used on the landing and login pages.
 * Keeping a single component guarantees identical glassmorphic styling,
 * logo, typography, and the Light/Dark theme toggle across both pages.
 *
 * On mobile, the auth CTAs collapse into a hamburger button that expands a
 * glassmorphic drawer (Sign In + nav links + Get Started) so nothing is ever
 * clipped or hidden off-screen.
 */
export function MarketingHeader() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
      <header className="w-full max-w-6xl animate-header-in">
        <div className="header-glass flex items-center justify-between rounded-full px-4 sm:px-6 py-3">
          {/* Brand — printer icon + wordmark (matches app Header) */}
          <Link href="/" className="flex items-center gap-2.5 group" onClick={() => setMenuOpen(false)}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-500 to-accent-400 flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:scale-105 transition-transform duration-300">
              <Printer size={18} strokeWidth={2.5} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight dark:text-white">
              Shanii<span className="text-primary-500">Prints</span>
            </span>
          </Link>

          {/* Right actions */}
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

            {/* Desktop CTAs */}
            <Link
              href="/login"
              className="hidden sm:inline-flex px-4 py-2 rounded-full text-xs font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="hidden sm:inline-flex btn-primary-gradient !rounded-full !py-2 !px-5 !text-xs"
            >
              Get Started
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="sm:hidden w-9 h-9 rounded-full flex items-center justify-center bg-white/50 dark:bg-white/5 border border-white/50 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile drawer — glassmorphic dropdown */}
        {menuOpen && (
          <>
            <div
              className="sm:hidden fixed inset-0 top-0 z-40 bg-slate-900/20 dark:bg-black/40 backdrop-blur-[2px]"
              onClick={() => setMenuOpen(false)}
            />
            <div className="sm:hidden relative z-50 mt-3 rounded-3xl header-glass p-3 animate-menu-drop origin-top">
              <nav className="flex flex-col gap-1">
                {MARKETING_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="px-4 py-3 rounded-2xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-white/5 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}

                <div className="border-t border-slate-200/70 dark:border-white/10 my-1" />

                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 rounded-2xl text-sm font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="btn-primary-gradient !rounded-2xl justify-center !py-3 mt-0.5"
                >
                  Get Started
                </Link>
              </nav>
            </div>
          </>
        )}
      </header>
    </div>
  );
}
