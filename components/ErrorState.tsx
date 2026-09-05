'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

/**
 * Consistent error UI shown when a database fetch fails.
 */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="glass-card p-10 sm:p-12 text-center max-w-lg mx-auto">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-100 dark:bg-red-500/15 flex items-center justify-center">
        <AlertTriangle className="w-7 h-7 text-red-500" />
      </div>
      <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">Something went wrong</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
        {message || 'We couldn\u2019t load your data. Check your connection and try again.'}
      </p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary-gradient !rounded-xl mx-auto">
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      )}
    </div>
  );
}
