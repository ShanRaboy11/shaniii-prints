'use client';

import { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  X,
  Wallet,
  PiggyBank,
  TrendingDown,
  Package,
} from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import { useAuth } from '@/components/AuthProvider';
import { Dropdown } from '@/components/Dropdown';
import { DatePicker } from '@/components/DatePicker';
import { ErrorState } from '@/components/ErrorState';
import { useOwnerData } from '@/lib/useOwnerData';
import {
  Expense,
  EntryType,
  EXPENSE_CATEGORIES,
  CAPITAL_CATEGORIES,
  addExpense,
  updateExpense,
  deleteExpense,
  sumExpenses,
  sumCapital,
} from '@/lib/db';

function categoryLabel(entryType: EntryType, value: string): string {
  const list = entryType === 'capital' ? CAPITAL_CATEGORIES : EXPENSE_CATEGORIES;
  return list.find((c) => c.value === value)?.label || value;
}

export default function ExpensesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { expenses, loading, error, reload } = useOwnerData();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | EntryType>('all');

  // Form fields
  const [fEntryType, setFEntryType] = useState<EntryType>('expense');
  const [fItem, setFItem] = useState('');
  const [fCategory, setFCategory] = useState('general');
  const [fQuantity, setFQuantity] = useState(1);
  const [fUnitPrice, setFUnitPrice] = useState(0);
  const [fDate, setFDate] = useState('');
  const [fNotes, setFNotes] = useState('');

  useEffect(() => {
    setToday();
  }, []);

  function setToday() {
    setFDate(new Date().toISOString().split('T')[0]);
  }

  const totalCost = fQuantity * fUnitPrice;
  const categoryOptions = (fEntryType === 'capital' ? CAPITAL_CATEGORIES : EXPENSE_CATEGORIES).map((c) => ({
    value: c.value,
    label: c.label,
  }));

  // When entry type switches, ensure category is valid for that list
  useEffect(() => {
    const valid = (fEntryType === 'capital' ? CAPITAL_CATEGORIES : EXPENSE_CATEGORIES).map((c) => c.value);
    if (!valid.includes(fCategory as any)) setFCategory(valid[0]);
  }, [fEntryType]); // eslint-disable-line react-hooks/exhaustive-deps

  function resetForm() {
    setFEntryType('expense');
    setFItem('');
    setFCategory('general');
    setFQuantity(1);
    setFUnitPrice(0);
    setFNotes('');
    setEditingId(null);
    setToday();
  }

  function openAdd() {
    resetForm();
    setShowForm(true);
  }

  function openEdit(exp: Expense) {
    setFEntryType(exp.entry_type);
    setFItem(exp.item_name);
    setFCategory(exp.category);
    setFQuantity(exp.quantity);
    setFUnitPrice(exp.unit_price);
    setFDate((exp.date_bought || '').split('T')[0]);
    setFNotes(exp.notes || '');
    setEditingId(exp.id || null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      showToast('You must be signed in.', 'error');
      return;
    }
    if (!fItem.trim()) {
      showToast('Please enter an item name.', 'error');
      return;
    }

    const payload: Omit<Expense, 'id' | 'created_at'> = {
      owner_id: user.id,
      item_name: fItem.trim(),
      category: fCategory,
      entry_type: fEntryType,
      quantity: fQuantity,
      unit_price: fUnitPrice,
      total_cost: totalCost,
      date_bought: fDate,
      notes: fNotes || undefined,
    };

    setSaving(true);
    try {
      if (editingId) {
        await updateExpense(editingId, payload);
        showToast('Entry updated!', 'success');
      } else {
        await addExpense(payload);
        showToast(fEntryType === 'capital' ? 'Capital recorded!' : 'Expense recorded!', 'success');
      }
      await reload();
      setShowForm(false);
      resetForm();
    } catch (err: any) {
      showToast(err?.message || 'Error saving entry', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this entry?')) return;
    try {
      await deleteExpense(id);
      showToast('Deleted', 'info');
      await reload();
    } catch (err: any) {
      showToast(err?.message || 'Error deleting', 'error');
    }
  }

  const filtered = expenses.filter((e) => {
    if (filterType !== 'all' && e.entry_type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        e.item_name.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        (e.notes || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalExpenses = sumExpenses(expenses);
  const totalCapital = sumCapital(expenses);

  if (loading) return <Skeleton />;
  if (error) return <div className="pt-4"><ErrorState message={error} onRetry={reload} /></div>;

  return (
    <div className="animate-fade-in relative">
      <div className="blob-1" />
      <div className="blob-2" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Expenses &amp; Capital</h1>
          <p className="page-subtitle">Log business expenses and capital investments.</p>
        </div>
        <button onClick={openAdd} className="btn-primary-gradient !rounded-full">
          <Plus className="w-4 h-4" /> New Entry
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="stat-card flex-col gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Expenses</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">₱{totalExpenses.toLocaleString()}</p>
          </div>
        </div>
        <div className="stat-card flex-col gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary-100 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400">
            <PiggyBank className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Capital Invested</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">₱{totalCapital.toLocaleString()}</p>
          </div>
        </div>
        <div className="stat-card flex-col gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent-100 dark:bg-accent-500/15 text-accent-600 dark:text-accent-400">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Outlay</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">₱{(totalExpenses + totalCapital).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search entries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <Dropdown
          className="w-44"
          value={filterType}
          onChange={(v) => setFilterType(v as 'all' | EntryType)}
          options={[
            { value: 'all', label: 'All Entries' },
            { value: 'expense', label: 'Expenses' },
            { value: 'capital', label: 'Capital' },
          ]}
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
            <Package className="w-7 h-7 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No entries found</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {expenses.length === 0 ? 'Log your first expense or capital investment.' : 'Try different filters.'}
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Item</th>
                <th>Type</th>
                <th>Category</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((exp) => {
                const d = new Date(exp.date_bought);
                return (
                  <tr key={exp.id}>
                    <td className="text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                    </td>
                    <td>
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{exp.item_name}</div>
                      {exp.notes && <div className="text-[11px] text-slate-400 dark:text-slate-500 max-w-[180px] truncate">{exp.notes}</div>}
                    </td>
                    <td>
                      <span className={`badge ${exp.entry_type === 'capital' ? 'badge-print' : 'bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300'}`}>
                        {exp.entry_type}
                      </span>
                    </td>
                    <td className="text-sm text-slate-600 dark:text-slate-300">{categoryLabel(exp.entry_type, exp.category)}</td>
                    <td className="font-semibold">{exp.quantity}</td>
                    <td className="text-sm text-slate-600 dark:text-slate-300">₱{exp.unit_price.toLocaleString()}</td>
                    <td className="font-bold text-slate-900 dark:text-white">₱{exp.total_cost.toLocaleString()}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(exp)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" aria-label="Edit">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(exp.id!)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" aria-label="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="text-slate-500 dark:text-slate-400">{filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}</span>
          <span className="font-semibold text-slate-800 dark:text-white">
            Total: ₱{filtered.reduce((s, e) => s + e.total_cost, 0).toLocaleString()}
          </span>
        </div>
      )}

      {/* ===== ADD/EDIT MODAL ===== */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingId ? 'Edit Entry' : 'New Entry'}
              </h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
              {/* Entry type toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Entry Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFEntryType('expense')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      fEntryType === 'expense'
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300'
                        : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4" /> Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setFEntryType('capital')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      fEntryType === 'capital'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300'
                        : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <PiggyBank className="w-4 h-4" /> Capital
                  </button>
                </div>
              </div>

              {/* Item name */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Item Name</label>
                <input
                  type="text"
                  value={fItem}
                  onChange={(e) => setFItem(e.target.value)}
                  placeholder={fEntryType === 'capital' ? 'e.g. Epson L3210 Printer' : 'e.g. Black Ink Bottle'}
                  className="input"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="expense-category" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                <Dropdown
                  id="expense-category"
                  value={fCategory}
                  onChange={setFCategory}
                  options={categoryOptions}
                />
              </div>

              {/* Qty + Unit price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Quantity</label>
                  <input type="number" min="1" value={fQuantity} onChange={(e) => setFQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="input text-center font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Unit Price</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₱</span>
                    <input type="number" min="0" step="0.5" value={fUnitPrice} onChange={(e) => setFUnitPrice(parseFloat(e.target.value) || 0)} className="input pl-8 font-bold" />
                  </div>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Date</label>
                <input type="date" value={fDate} onChange={(e) => setFDate(e.target.value)} className="input" />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Notes</label>
                <input type="text" value={fNotes} onChange={(e) => setFNotes(e.target.value)} placeholder="Optional details..." className="input" />
              </div>

              {/* Total preview */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                <span className="text-sm text-slate-500 dark:text-slate-400">{fQuantity} × ₱{fUnitPrice.toLocaleString()}</span>
                <span className="text-lg font-extrabold text-slate-900 dark:text-white">₱{totalCost.toLocaleString()}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1 !rounded-xl" disabled={saving}>Cancel</button>
                <button type="submit" className="btn-primary-gradient flex-1 !rounded-xl" disabled={saving}>
                  {saving ? 'Saving…' : editingId ? 'Update' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-56 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
      <div className="h-4 w-72 bg-slate-200 dark:bg-slate-800 rounded mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-[1.5rem]" />)}
      </div>
      <div className="flex gap-3 mb-5">
        <div className="h-10 flex-1 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-10 w-44 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
      <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-[1.5rem]" />
    </div>
  );
}
