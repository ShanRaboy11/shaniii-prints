'use client';

import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UserRole } from '@/lib/auth';

// ============================================
// PROTECTED ROUTE WRAPPER
// Redirects unauthenticated users or unauthorized roles
// ============================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole; // If set, only this role can access
  fallback?: React.ReactNode; // Loading state UI
}

export function ProtectedRoute({
  children,
  requiredRole,
  fallback,
}: ProtectedRouteProps) {
  const { user, profile, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Not logged in → redirect to login
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Logged in but wrong role → redirect to dashboard or home
    if (requiredRole && profile?.role !== requiredRole) {
      router.push('/');
      return;
    }
  }, [loading, isAuthenticated, profile, requiredRole, router]);

  // Still loading
  if (loading) {
    return fallback || <LoadingSkeleton />;
  }

  // Not authenticated or wrong role
  if (!isAuthenticated) return null;
  if (requiredRole && profile?.role !== requiredRole) return null;

  return <>{children}</>;
}

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
      </div>
    </div>
  );
}
