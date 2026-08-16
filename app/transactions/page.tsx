'use client';

import { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  Printer,
  Copy,
  Download,
  Tag,
  ArrowDown,
  ArrowUp,
  X,
} from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import {
  Transaction,
  PaperSize,
  PrintType,
  getTransactions,
  addTransaction,
  deleteTransaction,
  updateTransaction,
  getSettings,
  getPricePerCopy,
  getValidPaperSizes,
  SettingsData,
} from '@/lib/store';

type FormMode = 'add' | 'edit';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'print' | 'photocopy'>('all');
  const [filterPaper, setFilterPaper] = useState<'all' | PaperSize>('all');
  const [mounted, setMounted] = useState(false);
  const { showToast } = useToast();

  // Form state
  const [formType, setFormType] = useState<PrintType>('print');
  const [formPaper, setFormPaper] = useState<PaperSize>('short');
  const [formCopies, setFormCopies] = useState(1);
  const [formColored, setFormColored] = useState(false);
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formFinalTotal, setFormFinalTotal] = useState(0);

  useEffect(() => {
    setTransactions(getTransactions());
    setSettings(getSettings());
    setMounted(true);
    setDefaultDateTime();
  }, []);

  // Recalculate computed total when inputs change
  const computedTotal = settings
    ? getPricePerCopy(settings, formPaper, formColored) * formCopies
    : 0;

  // Update finalTotal when computed changes (only in add mode or when user hasn't manually edited)
  useEffect(() => {
    if (formMode === 'add') {
      setFormFinalTotal(computedTotal);
    }
  }, [computedTotal, formMode]);

  const adjustment = formFinalTotal - computedTotal;
  const adjustmentLabel = adjustment < 0 ? 'Discount' : adjustment > 0 ? 'Additional' : '';

  function setDefaultDateTime() {
    const now = new Date();
    setFormDate(now.toISOString().split('T')[0]);
    setFormTime(now.toTimeString().slice(0, 5));
  }

  function resetForm() {
    setFormType('print');
    setFormPaper('short');
    setFormCopies(1);
    setFormColored(false);
    setFormNotes('');
    setFormFinalTotal(0);
    setFormMode('add');
    setEditingId(null);
    setDefaultDateTime();
  }

  function openAddForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditForm(tx: Transaction) {
    const d = new Date(tx.date);
    setFormType(tx.type);
    setFormPaper(tx.paperSize);
    setFormCopies(tx.copies);
    setFormColored(tx.colored);
    setFormDate(d.toISOString().split('T')[0]);
    setFormTime(d.toTimeString().slice(0, 5));
    setFormNotes(tx.notes || '');
    setFormFinalTotal(tx.finalTotal);
    setFormMode('edit');
    setEditingId(tx.id);
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;

    const pricePerCopy = getPricePerCopy(settings, formPaper, formColored);
    const computed = pricePerCopy * formCopies;
    const final = formFinalTotal;
    const adj = final - computed;
    const adjLabel = adj < 0 ? 'Discount' : adj > 0 ? 'Additional' : '';
    const dateTime = new Date(`${formDate}T${formTime}`).toISOString();

    const txData = {
      type: formType,
      paperSize: formPaper,
      copies: formCopies,
      colored: formColored,
      pricePerCopy,
      computedTotal: computed,
      finalTotal: final,
      adjustment: adj,
      adjustmentLabel: adjLabel,
      date: dateTime,
      notes: formNotes || undefined,
    };

    if (formMode === 'add') {
      addTransaction(txData);
      showToast('Transaction added!', 'success');
    } else if (editingId) {
      updateTransaction(editingId, txData);
      showToast('Transaction updated!', 'success');
    }

    setTransactions(getTransactions());
    setShowForm(false);
    resetForm();
  }

  function handleDelete(id: string) {
    if (confirm('Delete this transaction?')) {
      const updated = deleteTransaction(id);
      setTransactions(updated);
      showToast('Transaction deleted', 'info');
    }
  }

  function exportCSV() {
    const headers = ['Date', 'Time', 'Type', 'Paper', 'Colored', 'Copies', 'Price/Copy', 'Computed', 'Final', 'Adjustment', 'Label', 'Notes'];
    const rows = filteredTransactions.map((tx) => {
      const d = new Date(tx.date);
      return [
        d.toLocaleDateString(),
        d.toLocaleTimeString(),
        tx.type,
        tx.paperSize,
        tx.colored ? 'Yes' : 'No',
        tx.copies,
        tx.pricePerCopy,
        tx.computedTotal,
        tx.finalTotal,
        tx.adjustment,
        tx.adjustmentLabel,
        tx.notes || '',
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shanii-prints-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported to CSV!', 'success');
  }

  // When type changes, validate paper size
  useEffect(() => {
    const validSizes = getValidPaperSizes(formType);
    if (!validSizes.includes(formPaper)) {
      setFormPaper(validSizes[0]);
    }
  }, [formType, formPaper]);

  // Filtering
  const filteredTransactions = transactions.filter((tx) => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (filterPaper !== 'all' && tx.paperSize !== filterPaper) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        tx.type.includes(q) ||
        tx.paperSize.includes(q) ||
        tx.notes?.toLowerCase().includes(q) ||
        tx.finalTotal.toString().includes(q) ||
        tx.adjustmentLabel.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (!mounted) return <TransactionsSkeleton />;

  const validPaperSizes = getValidPaperSizes(formType);

  return (
    <div className="animate-fade-in relative">
      <div className="blob-1" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">Record and manage print & photocopy jobs.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="btn-ghost btn-sm">
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button onClick={openAddForm} className="btn-primary">
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {formMode === 'add' ? 'New Transaction' : 'Edit Transaction'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Type Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Service Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType('print')}
                    className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 transition-all font-medium text-sm ${
                      formType === 'print'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('photocopy')}
                    className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 transition-all font-medium text-sm ${
                      formType === 'photocopy'
                        ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <Copy className="w-4 h-4" />
                    Photocopy
                  </button>
                </div>
              </div>

              {/* Paper Size */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Paper Size
                </label>
                <div className={`grid gap-2 ${validPaperSizes.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
                  {validPaperSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setFormPaper(size)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold uppercase transition-all ${
                        formPaper === size
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {size === 'photopaper' ? 'Photo' : size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colored Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Colored Print</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formColored}
                    onChange={(e) => setFormColored(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-indigo-500 peer-checked:to-purple-500" />
                </label>
              </div>

              {/* Copies */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Number of Copies
                </label>
                <input
                  type="number"
                  min="1"
                  value={formCopies}
                  onChange={(e) => setFormCopies(Math.max(1, parseInt(e.target.value) || 1))}
                  className="input text-center text-lg font-bold"
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Date</label>
                  <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Time</label>
                  <input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} className="input" />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Notes <span className="text-slate-400 dark:text-slate-500 normal-case">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Customer name, special request..."
                  className="input"
                />
              </div>

              {/* Price Section - The Key Feature */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-700/50">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Pricing Breakdown</p>
                </div>
                <div className="p-4 space-y-3">
                  {/* Computed price */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">
                      {formCopies} × ₱{settings ? getPricePerCopy(settings, formPaper, formColored) : 0}
                      <span className="text-xs ml-1">({formColored ? 'colored' : 'b&w'})</span>
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">₱{computedTotal}</span>
                  </div>

                  {/* Editable final total */}
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                      Final Price (editable)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₱</span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={formFinalTotal}
                        onChange={(e) => setFormFinalTotal(parseFloat(e.target.value) || 0)}
                        className="input pl-8 text-lg font-bold text-center"
                      />
                    </div>
                  </div>

                  {/* Adjustment indicator */}
                  {adjustment !== 0 && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                      adjustment < 0
                        ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400'
                        : 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400'
                    }`}>
                      {adjustment < 0 ? (
                        <><ArrowDown className="w-3.5 h-3.5" /> Discount: -₱{Math.abs(adjustment)}</>
                      ) : (
                        <><ArrowUp className="w-3.5 h-3.5" /> Additional: +₱{adjustment}</>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {formMode === 'add' ? 'Add Transaction' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="select">
            <option value="all">All Types</option>
            <option value="print">Print</option>
            <option value="photocopy">Photocopy</option>
          </select>
          <select value={filterPaper} onChange={(e) => setFilterPaper(e.target.value as any)} className="select">
            <option value="all">All Paper</option>
            <option value="short">Short</option>
            <option value="a4">A4</option>
            <option value="long">Long</option>
            <option value="photopaper">Photo Paper</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {filteredTransactions.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Printer className="w-7 h-7 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No transactions found</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {transactions.length === 0 ? 'Add your first transaction to get started.' : 'Try different filters.'}
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Paper</th>
                <th>Copies</th>
                <th>Computed</th>
                <th>Final</th>
                <th>Adj.</th>
                <th>Notes</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => {
                const d = new Date(tx.date);
                return (
                  <tr key={tx.id}>
                    <td>
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">
                        {d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${tx.type === 'print' ? 'badge-print' : 'badge-photocopy'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${tx.paperSize}`}>
                        {tx.paperSize === 'photopaper' ? 'Photo' : tx.paperSize}
                      </span>
                      {tx.colored && (
                        <span className="badge bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 ml-1">
                          Color
                        </span>
                      )}
                    </td>
                    <td className="font-semibold text-slate-700 dark:text-slate-200">{tx.copies}</td>
                    <td className="text-slate-500 dark:text-slate-400">₱{tx.computedTotal}</td>
                    <td className="font-bold text-slate-900 dark:text-white">₱{tx.finalTotal}</td>
                    <td>
                      {tx.adjustment !== 0 ? (
                        <span className={`badge ${tx.adjustment < 0 ? 'badge-discount' : 'badge-additional'}`}>
                          {tx.adjustment < 0 ? `-₱${Math.abs(tx.adjustment)}` : `+₱${tx.adjustment}`}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="text-xs text-slate-500 dark:text-slate-400 max-w-[120px] truncate">
                      {tx.notes || '—'}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditForm(tx)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          aria-label="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          aria-label="Delete"
                        >
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

      {/* Summary Footer */}
      {filteredTransactions.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="text-slate-500 dark:text-slate-400">
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-4">
            {filteredTransactions.some(t => t.adjustment !== 0) && (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Adjustments: <span className="text-orange-500">-₱{filteredTransactions.filter(t => t.adjustment < 0).reduce((s, t) => s + Math.abs(t.adjustment), 0)}</span>
                {' / '}
                <span className="text-violet-500">+₱{filteredTransactions.filter(t => t.adjustment > 0).reduce((s, t) => s + t.adjustment, 0)}</span>
              </span>
            )}
            <span className="font-semibold text-slate-800 dark:text-white">
              Total: ₱{filteredTransactions.reduce((s, t) => s + t.finalTotal, 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function TransactionsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
      <div className="h-4 w-72 bg-slate-200 dark:bg-slate-800 rounded mb-6" />
      <div className="flex gap-3 mb-5">
        <div className="h-10 flex-1 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-10 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-10 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
      <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
    </div>
  );
}
