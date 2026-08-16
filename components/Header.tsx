'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { LayoutDashboard, FileText, BarChart3, Settings, Printer, Sun, Moon, PlusCircle } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: LayoutDashboard },
  { href: '/transactions', label: 'Orders', icon: FileText },
  { href: '/analytics', label: 'Profit', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
      <header className="w-full max-w-5xl">
        <div className="glass-card !rounded-full px-6 py-3 flex items-center justify-between border-white/50 dark:border-white/10 shadow-2xl">
          
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform duration-300">
              <Printer size={20} strokeWidth={2.5} />
            </div>
            <span className="hidden sm:block text-lg font-bold tracking-tight dark:text-white">
              Shanii<span className="text-indigo-500">Prints</span>
            </span>
          </Link>

          {/* Navigation Island */}
          <nav className="flex items-center gap-1 bg-slate-100/50 dark:bg-white/5 p-1 rounded-full">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-indigo-600 dark:hover:text-slate-300'
                  }`}
                >
                  <Icon size={18} />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link href="/transactions" className="hidden sm:flex btn-primary-gradient !rounded-full !py-2 !px-4 !text-xs">
              <PlusCircle size={16} />
              New Order
            </Link>
            
            <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                {theme === 'dark' ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-indigo-600" />}
              </button>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}