'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { LayoutDashboard, FileText, BarChart3, Settings, Printer, Sun, Moon, PlusCircle, LogOut, User } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { signOut } from '@/lib/auth';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/transactions', label: 'Orders', icon: FileText },
  { href: '/analytics', label: 'Profit', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, profile, isAuthenticated, isOwner } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => setMounted(true), []);

  async function handleSignOut() {
    try {
      await signOut();
      router.push('/');
    } catch {}
  }

  // Filter nav items based on role
  const visibleNav = isOwner
    ? navItems
    : navItems.filter((n) => n.href === '/dashboard' || n.href === '/transactions');

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
      <header className="w-full max-w-5xl">
        <div className="glass-card !rounded-full px-4 sm:px-6 py-3 flex items-center justify-between border-white/50 dark:border-white/10 shadow-2xl">

          {/* Brand */}
          <Link href={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform duration-300">
              <Printer size={20} strokeWidth={2.5} />
            </div>
            <span className="hidden sm:block text-lg font-bold tracking-tight dark:text-white">
              Shanii<span className="text-indigo-500">Prints</span>
            </span>
          </Link>

          {/* Navigation Island */}
          <nav className="flex items-center gap-0.5 bg-slate-100/50 dark:bg-white/5 p-1 rounded-full">
            {visibleNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-indigo-600 dark:hover:text-slate-300'
                  }`}
                >
                  <Icon size={18} />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {isOwner && (
              <Link href="/transactions" className="hidden sm:flex btn-primary-gradient !rounded-full !py-2 !px-4 !text-xs">
                <PlusCircle size={16} />
                New Order
              </Link>
            )}

            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-indigo-600" />}
              </button>
            )}

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-500/30 transition-colors"
                  aria-label="User menu"
                >
                  <User size={16} />
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 top-12 z-50 w-56 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/10 rounded-2xl shadow-xl p-2 animate-modal-in">
                      {/* User info */}
                      <div className="px-3 py-2 mb-1">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                          {profile?.full_name || 'User'}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isOwner
                            ? 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                            : 'bg-cyan-100 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
                        }`}>
                          {profile?.role || 'user'}
                        </span>
                      </div>

                      <div className="border-t border-slate-100 dark:border-white/5 my-1" />

                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-full text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
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
