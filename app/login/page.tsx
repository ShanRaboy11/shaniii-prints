'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Printer, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { signIn } from '@/lib/auth';
import { useToast } from '@/components/ToastProvider';
import { AnimatedDotGrid } from '@/components/AnimatedDotGrid';
import { Footer } from '@/components/Footer';
import { MarketingHeader } from '@/components/MarketingHeader';

// localStorage key for the "Remember me" email preference.
const REMEMBER_KEY = 'shanii:rememberedEmail';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  // On mount, restore the remembered email (if any) and reflect it in the
  // checkbox state so returning users land pre-filled.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setEmail(saved);
        setRememberMe(true);
      } else {
        setRememberMe(false);
      }
    } catch {
      /* localStorage unavailable (SSR/private mode) — ignore */
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    // Persist or clear the remembered email before attempting sign-in so the
    // preference survives the redirect on success.
    try {
      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, email);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
    } catch {
      /* ignore storage errors */
    }

    setLoading(true);
    try {
      await signIn(email, password);
      showToast('Welcome back!', 'success');
      router.push('/dashboard');
    } catch (err: any) {
      showToast(err.message || 'Invalid credentials', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f8fb] dark:bg-[#05070e] relative overflow-hidden">
      {/* Interactive dot-matrix background — the only background visual here */}
      <AnimatedDotGrid />

      {/* Shared marketing header — identical to the landing page */}
      <MarketingHeader />

      {/* First fold: exactly one viewport tall — header + centered card only.
          The footer is pushed strictly below the fold. */}
      <section className="relative h-screen flex items-center justify-center px-4 pt-28 pb-8">
        <div className="w-full max-w-md">
          {/* Logo — staggered entrance */}
          <div className="text-center mb-8 animate-card-in" style={{ animationDelay: '0.05s' }}>
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-primary-600 to-accent-400 flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
                <Printer size={22} strokeWidth={2.5} />
              </div>
            </Link>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Sign in to your Shanii Prints account
            </p>
          </div>

          {/* Frosted, floating glassmorphic form card — staggered entrance */}
          <div
            className="relative bg-white/60 dark:bg-white/[0.07] backdrop-blur-2xl border border-white/70 dark:border-white/15 rounded-3xl p-8 shadow-2xl shadow-primary-500/10 dark:shadow-[0_20px_70px_rgba(2,6,20,0.7),inset_0_1px_0_rgba(255,255,255,0.10)] ring-1 ring-white/40 dark:ring-white/10 animate-card-in"
            style={{ animationDelay: '0.18s' }}
          >
            {/* subtle top-edge highlight for extra glass realism */}
            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/70 dark:via-white/25 to-transparent" />
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="input-soft pl-11"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-soft pl-11 pr-11"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors z-10"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer select-none group/remember">
                  <span className="relative inline-flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="peer sr-only"
                    />
                    <span className="w-4 h-4 rounded-md border border-slate-300 dark:border-white/20 bg-white/70 dark:bg-white/5 peer-checked:bg-gradient-to-br peer-checked:from-primary-500 peer-checked:to-accent-500 peer-checked:border-transparent transition-all" />
                    <svg
                      className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300 group-hover/remember:text-slate-800 dark:group-hover/remember:text-white transition-colors">
                    Remember me
                  </span>
                </label>

                <Link
                  href="/login"
                  className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary-gradient w-full !rounded-xl !py-3.5 justify-center group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white/80 dark:bg-transparent px-3 text-xs text-slate-400">or</span>
              </div>
            </div>

            {/* Sign Up Link */}
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
