'use client';

import { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  Printer,
  Download,
  ArrowDown,
  ArrowUp,
  X,
  QrCode,
  User,
  Droplets,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '@/components/ToastProvider';
import { useAuth } from '@/components/AuthProvider';
import { Dropdown } from '@/components/Dropdown';
import {
  TransactionRecord,
  BusinessSettings,
  getDefaultPrice,
  estimateInkCost,
  estimatePaperCost,
  generateReceiptId,
  getBusinessSettings,
  addTransactionDB,
  getTransactionsDB,
  deleteTransactionDB,
  updateTransactionDB,
} from '@/lib/db';
import {
  getTransactions as getLocalTransactions,
  addTransaction as addLocalTransaction,
  deleteTransaction as deleteLocalTransaction,
  updateTransaction as updateLocalTransaction,
  getSettings as getLocalSettings,
  Transaction as LocalTransaction,
} from '@/lib/store';

type PaperSize = 'short' | 'a4' | 'long' | 'photopaper';
type PrintType = 'print' | 'photocopy';

// Valid paper sizes per type (no photopaper for photocopy)
function getValidPapers(type: PrintType): PaperSize[] {
  return type === 'photocopy' ? ['short', 'a4', 'long'] : ['short', 'a4', 'long', 'photopaper'];
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [mounted, setMounted] = useState(false);

  // Modal
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);

  // QR Modal
  const [showQR, setShowQR] = useState(false);
  const [qrReceiptId, setQrReceiptId] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | PrintType>('all');
  const [filterPaper, setFilterPaper] = useState<'all' | PaperSize>('all');

  // Form fields
  const [fType, setFType] = useState<PrintType>('print');
  const [fPaper, setFPaper] = useState<PaperSize>('short');
  const [fColored, setFColored] = useState(false);
  const [fCopies, setFCopies] = useState(1);
  const [fCustomer, setFCustomer] = useState('');
  const [fDate, setFDate] = useState('');
  const [fTime, setFTime] = useState('');
  const [fNotes, setFNotes] = useState('');
  const [fFinal, setFFinal] = useState(0);

  useEffect(() => {
    setMounted(true);
    loadData();
    setNowDateTime();
  }, [user]);

  async function loadData() {
    // Load settings
    if (user) {
      try {
        const s = await getBusinessSettings(user.id);
        if (s) setSettings(s);
      } catch {}
    }
    // Try local fallback for settings
    if (!settings) {
      try {
        const local = localStorage.getItem('shanii-prints-business-settings');
        if (local) setSettings(JSON.parse(local));
      } catch {}
    }

    // Load transactions
    if (user) {
      try {
        const txs = await getTransactionsDB(user.id);
        setTransactions(txs);
        return;
      } catch {}
    }
    // Fallback: localStorage
    const local = getLocalTransactions();
    setTransactions(local.map(localToRecord));
  }

  function localToRecord(t: LocalTransaction): TransactionRecord {
    return {
      id: t.id,
      owner_id: user?.id || '',
      customer_name: '',
      paper_size: t.paperSize,
      print_type: t.type,
      is_colored: t.colored,
      quantity: t.copies,
      price_per_copy: t.pricePerCopy,
      computed_total: t.computedTotal,
      final_total: t.finalTotal,
      adjustment: t.adjustment,
      adjustment_label: t.adjustmentLabel,
      estimated_ink_cost: 0,
      estimated_paper_cost: 0,
      notes: t.notes,
      receipt_id: undefined,
      created_at: t.date,
    };
  }

  function setNowDateTime() {
    const now = new Date();
    setFDate(now.toISOString().split('T')[0]);
    setFTime(now.toTimeString().slice(0, 5));
  }

  // Computed price
  const pricePerCopy = getDefaultPrice(fPaper, fColored);
  const computedTotal = pricePerCopy * fCopies;
  const inkCost = estimateInkCost(settings, fCopies, fColored);
  const paperCost = estimatePaperCost(settings, fCopies);
  const adjustment = fFinal - computedTotal;
  const adjustmentLabel = adjustment < 0 ? 'Discount' : adjustment > 0 ? 'Additional' : '';

  // Sync finalTotal with computed when in add mode
  useEffect(() => {
    if (formMode === 'add') setFFinal(computedTotal);
  }, [computedTotal, formMode]);

  // Validate paper when type changes
  useEffect(() => {
    const valid = getValidPapers(fType);
    if (!valid.includes(fPaper)) setFPaper(valid[0]);
  }, [fType]);

  function resetForm() {
    setFType('print');
    setFPaper('short');
    setFColored(false);
    setFCopies(1);
    setFCustomer('');
    setFNotes('');
    setFFinal(0);
    setFormMode('add');
    setEditingId(null);
    setNowDateTime();
  }

  function openAdd() { resetForm(); setShowForm(true); }

  function openEdit(tx: TransactionRecord) {
    const d = new Date(tx.created_at || '');
    setFType(tx.print_type as PrintType);
    setFPaper(tx.paper_size as PaperSize);
    setFColored(tx.is_colored);
    setFCopies(tx.quantity);
    setFCustomer(tx.customer_name || '');
    setFDate(d.toISOString().split('T')[0]);
    setFTime(d.toTimeString().slice(0, 5));
    setFNotes(tx.notes || '');
    setFFinal(tx.final_total);
    setFormMode('edit');
    setEditingId(tx.id || null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const receiptId = generateReceiptId();
    const dateTime = new Date(`${fDate}T${fTime}`).toISOString();

    const txData: Omit<TransactionRecord, 'id' | 'created_at'> = {
      owner_id: user?.id || '',
      customer_name: fCustomer || undefined,
      paper_size: fPaper,
      print_type: fType,
      is_colored: fColored,
      quantity: fCopies,
      price_per_copy: pricePerCopy,
      computed_total: computedTotal,
      final_total: fFinal,
      adjustment,
      adjustment_label: adjustmentLabel,
      estimated_ink_cost: parseFloat(inkCost.toFixed(4)),
      estimated_paper_cost: parseFloat(paperCost.toFixed(4)),
      notes: fNotes || undefined,
      receipt_id: formMode === 'add' ? receiptId : undefined,
    };

    try {
      if (formMode === 'add') {
        if (user) {
          await addTransactionDB(txData);
        } else {
          // Local fallback
          addLocalTransaction({
            type: fType,
            paperSize: fPaper,
            copies: fCopies,
            colored: fColored,
            pricePerCopy,
            computedTotal,
            finalTotal: fFinal,
            adjustment,
            adjustmentLabel,
            date: dateTime,
            notes: fNotes || undefined,
          });
        }
        showToast('Transaction added!', 'success');

        // Show QR
        setQrReceiptId(receiptId);
        setShowQR(true);
      } else if (editingId) {
        if (user) {
          await updateTransactionDB(editingId, { ...txData, receipt_id: undefined });
        } else {
          updateLocalTransaction(editingId, {
            type: fType,
            paperSize: fPaper,
            copies: fCopies,
            colored: fColored,
            pricePerCopy,
            computedTotal,
            finalTotal: fFinal,
            adjustment,
            adjustmentLabel,
            date: dateTime,
            notes: fNotes || undefined,
          });
        }
        showToast('Transaction updated!', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Error saving', 'error');
    }

    await loadData();
    setShowForm(false);
    resetForm();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this transaction?')) return;
    try {
      if (user) await deleteTransactionDB(id);
      else deleteLocalTransaction(id);
      showToast('Deleted', 'info');
      await loadData();
    } catch { showToast('Error deleting', 'error'); }
  }

  function exportCSV() {
    const headers = ['Date', 'Customer', 'Type', 'Paper', 'Color', 'Qty', 'Computed', 'Final', 'Adj', 'Ink Cost', 'Notes', 'Receipt'];
    const rows = filteredTx.map((tx) => {
      const d = new Date(tx.created_at || '');
      return [d.toLocaleString(), tx.customer_name || '', tx.print_type, tx.paper_size, tx.is_colored ? 'Y' : 'N', tx.quantity, tx.computed_total, tx.final_total, tx.adjustment, tx.estimated_ink_cost.toFixed(2), tx.notes || '', tx.receipt_id || ''].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shanii-prints-${fDate || 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported!', 'success');
  }

  // Filter
  const filteredTx = transactions.filter((tx) => {
    if (filterType !== 'all' && tx.print_type !== filterType) return false;
    if (filterPaper !== 'all' && tx.paper_size !== filterPaper) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (tx.customer_name || '').toLowerCase().includes(q) || tx.print_type.includes(q) || tx.paper_size.includes(q) || (tx.notes || '').toLowerCase().includes(q);
    }
    return true;
  });

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const validPapers = getValidPapers(fType);

  if (!mounted) return <Skeleton />;

  return (
    <div className="animate-fade-in relative">
      <div className="blob-1" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">Record and manage print & photocopy orders.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="btn-ghost btn-sm"><Download className="w-3.5 h-3.5" /><span className="hidden sm:inline">Export</span></button>
          <button onClick={openAdd} className="btn-primary-gradient !rounded-full">
            <Plus className="w-4 h-4" /> New Order
          </button>
        </div>
      </div>

      {/* ===== QR CODE MODAL ===== */}
      {showQR && (
        <div className="modal-overlay" onClick={() => setShowQR(false)}>
          <div className="modal !max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white mb-4">
                <QrCode className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Receipt Generated!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">Scan or share this QR code with the customer</p>

              <div className="inline-block p-4 bg-white rounded-2xl shadow-lg mb-4">
                <QRCodeSVG
                  value={`${appUrl}/receipt/${qrReceiptId}`}
                  size={180}
                  level="M"
                  includeMargin={false}
                />
              </div>

              <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mb-4 break-all">{qrReceiptId}</p>

              <div className="flex gap-2">
                <button
                  onClick={() => { navigator.clipboard.writeText(`${appUrl}/receipt/${qrReceiptId}`); showToast('Link copied!', 'success'); }}
                  className="btn-ghost flex-1 !rounded-xl"
                >
                  Copy Link
                </button>
                <button onClick={() => setShowQR(false)} className="btn-primary-gradient flex-1 !rounded-xl">
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== ADD/EDIT MODAL ===== */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {formMode === 'add' ? 'New Order' : 'Edit Order'}
              </h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
              {/* Customer Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Customer Name <span className="normal-case text-slate-400">(optional)</span></label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" value={fCustomer} onChange={(e) => setFCustomer(e.target.value)} placeholder="Walk-in" className="input pl-10" />
                </div>
              </div>

              {/* Type of Print — consistent rounded-menu dropdown */}
              <div>
                <label htmlFor="type-of-print" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Type of Print
                </label>
                <Dropdown
                  id="type-of-print"
                  value={fType}
                  onChange={(v) => setFType(v as PrintType)}
                  options={[
                    { value: 'print', label: 'Print' },
                    { value: 'photocopy', label: 'Photocopy' },
                  ]}
                />
              </div>

              {/* Type of Paper — consistent rounded-menu dropdown */}
              <div>
                <label htmlFor="type-of-paper" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Type of Paper
                </label>
                <Dropdown
                  id="type-of-paper"
                  value={fPaper}
                  onChange={(v) => setFPaper(v as PaperSize)}
                  options={validPapers.map((s) => ({
                    value: s,
                    label: s === 'photopaper' ? 'Photo Paper' : s.toUpperCase(),
                  }))}
                />
              </div>

              {/* Colored */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 dark:bg-white/5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Colored</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={fColored} onChange={(e) => setFColored(e.target.checked)} className="sr-only peer" />
                  <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-primary-500 peer-checked:to-accent-500" />
                </label>
              </div>

              {/* Copies */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Copies</label>
                <input type="number" min="1" value={fCopies} onChange={(e) => setFCopies(Math.max(1, parseInt(e.target.value) || 1))} className="input text-center text-lg font-bold" />
              </div>

              {/* Date/Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Date</label>
                  <input type="date" value={fDate} onChange={(e) => setFDate(e.target.value)} className="input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Time</label>
                  <input type="time" value={fTime} onChange={(e) => setFTime(e.target.value)} className="input" />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Notes</label>
                <input type="text" value={fNotes} onChange={(e) => setFNotes(e.target.value)} placeholder="Special instructions..." className="input" />
              </div>

              {/* Pricing Breakdown */}
              <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 overflow-hidden">
                <div className="bg-slate-50/80 dark:bg-white/5 px-4 py-2.5 border-b border-slate-200/60 dark:border-white/5">
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pricing</p>
                </div>
                <div className="p-4 space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">{fCopies} × ₱{pricePerCopy} <span className="text-[10px]">({fColored ? 'color' : 'b&w'})</span></span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">₱{computedTotal}</span>
                  </div>

                  {/* Ink cost estimate */}
                  {(inkCost > 0 || paperCost > 0) && (
                    <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                      <span className="flex items-center gap-1"><Droplets className="w-3 h-3" /> Est. cost: ink ₱{inkCost.toFixed(2)} + paper ₱{paperCost.toFixed(2)}</span>
                      <span className="font-medium">₱{(inkCost + paperCost).toFixed(2)}</span>
                    </div>
                  )}

                  {/* Editable final */}
                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Final Price (editable)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₱</span>
                      <input type="number" min="0" step="0.5" value={fFinal} onChange={(e) => setFFinal(parseFloat(e.target.value) || 0)} className="input pl-8 text-lg font-bold text-center" />
                    </div>
                  </div>

                  {adjustment !== 0 && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${adjustment < 0 ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400'}`}>
                      {adjustment < 0 ? <><ArrowDown className="w-3.5 h-3.5" /> Discount: -₱{Math.abs(adjustment)}</> : <><ArrowUp className="w-3.5 h-3.5" /> Additional: +₱{adjustment}</>}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1 !rounded-xl">Cancel</button>
                <button type="submit" className="btn-primary-gradient flex-1 !rounded-xl">
                  {formMode === 'add' ? 'Save & Generate Receipt' : 'Update'}
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
          <input type="text" placeholder="Search by customer, type..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input pl-10" />
        </div>
        <div className="flex gap-2">
          <Dropdown
            className="w-40"
            value={filterType}
            onChange={(v) => setFilterType(v as 'all' | PrintType)}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'print', label: 'Print' },
              { value: 'photocopy', label: 'Photocopy' },
            ]}
          />
          <Dropdown
            className="w-40"
            value={filterPaper}
            onChange={(v) => setFilterPaper(v as 'all' | PaperSize)}
            options={[
              { value: 'all', label: 'All Paper' },
              { value: 'short', label: 'Short' },
              { value: 'a4', label: 'A4' },
              { value: 'long', label: 'Long' },
              { value: 'photopaper', label: 'Photo' },
            ]}
          />
        </div>
      </div>

      {/* Table */}
      {filteredTx.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
            <Printer className="w-7 h-7 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No transactions found</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{transactions.length === 0 ? 'Add your first order.' : 'Try different filters.'}</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Paper</th>
                <th>Qty</th>
                <th>Final</th>
                <th>Ink Cost</th>
                <th>Adj.</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTx.map((tx) => {
                const d = new Date(tx.created_at || '');
                return (
                  <tr key={tx.id}>
                    <td>
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                      <div className="text-[11px] text-slate-400">{d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="text-sm text-slate-600 dark:text-slate-300">{tx.customer_name || <span className="text-slate-400">Walk-in</span>}</td>
                    <td><span className={`badge ${tx.print_type === 'print' ? 'badge-print' : 'badge-photocopy'}`}>{tx.print_type}</span></td>
                    <td>
                      <span className={`badge badge-${tx.paper_size}`}>{tx.paper_size === 'photopaper' ? 'Photo' : tx.paper_size}</span>
                      {tx.is_colored && <span className="badge bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 ml-1">CLR</span>}
                    </td>
                    <td className="font-semibold">{tx.quantity}</td>
                    <td className="font-bold text-slate-900 dark:text-white">₱{tx.final_total}</td>
                    <td className="text-xs text-slate-400">₱{tx.estimated_ink_cost.toFixed(2)}</td>
                    <td>
                      {tx.adjustment !== 0 ? (
                        <span className={`badge ${tx.adjustment < 0 ? 'badge-discount' : 'badge-additional'}`}>{tx.adjustment < 0 ? `-₱${Math.abs(tx.adjustment)}` : `+₱${tx.adjustment}`}</span>
                      ) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        {tx.receipt_id && (
                          <button onClick={() => { setQrReceiptId(tx.receipt_id!); setShowQR(true); }} className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-500/10 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" aria-label="Show QR">
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => openEdit(tx)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" aria-label="Edit">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(tx.id!)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" aria-label="Delete">
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

      {filteredTx.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="text-slate-500 dark:text-slate-400">{filteredTx.length} order{filteredTx.length !== 1 ? 's' : ''}</span>
          <span className="font-semibold text-slate-800 dark:text-white">Total: ₱{filteredTx.reduce((s, t) => s + t.final_total, 0).toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
      <div className="h-4 w-72 bg-slate-200 dark:bg-slate-800 rounded mb-6" />
      <div className="flex gap-3 mb-5">
        <div className="h-10 flex-1 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-10 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
      <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-[1.5rem]" />
    </div>
  );
}
