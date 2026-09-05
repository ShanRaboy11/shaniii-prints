'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import {
  getTransactionsDB,
  getExpenses,
  getBusinessSettings,
  TransactionRecord,
  Expense,
  BusinessSettings,
} from './db';

// ============================================
// useOwnerData
// Central data hook: fetches transactions, expenses and business
// settings for the signed-in owner. Exposes loading + error state so
// every page can render skeletons and error UIs consistently.
// ============================================

interface OwnerData {
  transactions: TransactionRecord[];
  expenses: Expense[];
  settings: BusinessSettings | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useOwnerData(): OwnerData {
  const { user, loading: authLoading } = useAuth();
  // Depend on the stable user id primitive rather than the user object, so
  // background auth events (token refresh / focus) never re-trigger loads.
  const userId = user?.id ?? null;
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const load = useCallback(async () => {
    if (!userId) {
      setTransactions([]);
      setExpenses([]);
      setSettings(null);
      setLoading(false);
      return;
    }

    // Only show the full-page skeleton on the first load; subsequent reloads
    // (e.g. after saving) refresh data in place without a jarring flash.
    if (!hasLoadedRef.current) setLoading(true);
    setError(null);
    try {
      const [txs, exps, sett] = await Promise.all([
        getTransactionsDB(userId),
        getExpenses(userId),
        getBusinessSettings(userId),
      ]);
      setTransactions(txs);
      setExpenses(exps);
      setSettings(sett);
      hasLoadedRef.current = true;
    } catch (err: any) {
      setError(err?.message || 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (authLoading) return;
    load();
  }, [authLoading, load]);

  return {
    transactions,
    expenses,
    settings,
    loading: loading || authLoading,
    error,
    reload: load,
  };
}
