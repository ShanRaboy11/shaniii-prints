'use client';

import { useCallback, useEffect, useState } from 'react';
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
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setExpenses([]);
      setSettings(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [txs, exps, sett] = await Promise.all([
        getTransactionsDB(user.id),
        getExpenses(user.id),
        getBusinessSettings(user.id),
      ]);
      setTransactions(txs);
      setExpenses(exps);
      setSettings(sett);
    } catch (err: any) {
      setError(err?.message || 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

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
