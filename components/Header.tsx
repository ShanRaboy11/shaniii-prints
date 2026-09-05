'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, LogOut, User, Settings, Printer } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { signOut } from '@/lib/auth';

// Text-only navigation — no icons, per design system guidelines.
// "New Order" and "Settings" intentionally excluded from the header.
const navItems = [
  { href: '/dashboard', label: 'Home' },
  { href: '/transactions', label: 'Orders' },
  { href: '/analytics', label: 'Profit' },
  { href: '/expenses', label: 'Expenses' },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, profile, isAuthenticated, isOwner } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => setMounted(true), []);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      // even if the network call fails, still send them to login
    } finally {
      setShowUserMenu(false);
      setSigningOut(false);
      // Full navigation to guarantee all in-memory state is dropped
      router.replace('/login');
      router.refresh();
    }
  }

  // Owners see Expenses/Profit; customers see a reduced set.
  const visibleNav = isOwner
    ? navItems
    : navItems.filter((n) => n.href === '/dashboard' || n.href === '/transactions');

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
      <header className="w-full max-w-5xl">
        <div className="header-glass rounded-full px-4 sm:px-6 py-3 flex items-center justify-between">

          {/* Brand — modern printer icon + wordmark */}
          <Link href={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-500 to-accent-400 flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:scale-105 transition-transform duration-300">
              <Printer size={18} strokeWidth={2.5} className="text-white" />
            </div>
            <span className="hidden sm:block text-lg font-bold tracking-tight dark:text-white">
              Shanii<span className="text-primary-500">Prints</span>
            </span>
          </Link>

          {/* Navigation — clean typography-driven text links, no icons */}
          <nav className="flex items-center gap-1 bg-white/40 dark:bg-white/5 backdrop-blur-md p-1 rounded-full border border-white/40 dark:border-white/5">
            {visibleNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-primary-600" />}
              </button>
            )}

            {/* Profile Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-500/30 transition-colors"
                  aria-label="Profile menu"
                >
                  <User size={16} />
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 top-12 z-50 w-60 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl shadow-xl p-2 animate-modal-in">
                      {/* User info */}
                      <div className="px-3 py-2 mb-1">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                          {profile?.full_name || 'User'}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                        <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isOwner
                            ? 'bg-primary-100 dark:bg-primary-500/15 text-primary-700 dark:text-primary-300'
                            : 'bg-accent-100 dark:bg-accent-500/15 text-accent-700 dark:text-accent-300'
                        }`}>
                          {profile?.role || 'user'}
                        </span>
                      </div>

                      <div className="border-t border-slate-100 dark:border-white/5 my-1" />

                      {/* Settings — moved here from the header nav */}
                      {isOwner && (
                        <Link
                          href="/settings"
                          onClick={() => setShowUserMenu(false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                        >
                          <Settings size={16} />
                          Settings
                        </Link>
                      )}

                      <button
                        onClick={handleSignOut}
                        disabled={signingOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-60"
                      >
                        <LogOut size={16} />
                        {signingOut ? 'Signing out…' : 'Sign Out'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-full text-xs font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}
