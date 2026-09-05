'use client';

import { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  Printer,
  Download,
  QrCode,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '@/components/ToastProvider';
import { Dropdown } from '@/components/Dropdown';
import { ErrorState } from '@/components/ErrorState';
import { TransactionModal } from '@/components/TransactionModal';
import { useOwnerData } from '@/lib/useOwnerData';
import {
  TransactionRecord,
  PaperType,
  PAPER_TYPES,
  PAPER_TYPE_LABELS,
  deleteTransactionDB,
} from '@/lib/db';

type PaperSize = PaperType;
type PrintType = 'print' | 'photocopy';

export default function TransactionsPage() {
  const { showToast } = useToast();
  const { transactions, settings, loading, error, reload } = useOwnerData();

  // Order modal
  const [showForm, setShowForm] = useState(false);
  const [editingTx, setEditingTx] = useState<TransactionRecord | null>(null);

  // QR Modal (for viewing an existing receipt from the table)
  const [showQR, setShowQR] = useState(false);
  const [qrReceiptId, setQrReceiptId] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | PrintType>('all');
  const [filterPaper, setFilterPaper] = useState<'all' | PaperSize>('all');

  // Pagination (20 records per page) + mobile expanded card
  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function openAdd() { setEditingTx(null); setShowForm(true); }
  function openEdit(tx: TransactionRecord) { setEditingTx(tx); setShowForm(true); }

  async function handleDelete(id: string) {
    if (!confirm('Delete this transaction?')) return;
    try {
      await deleteTransactionDB(id);
      showToast('Deleted', 'info');
      await reload();
    } catch (err: any) {
      showToast(err?.message || 'Error deleting', 'error');
    }
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
    a.download = `shanii-prints-${new Date().toISOString().split('T')[0]}.csv`;
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

  // Reset to first page whenever the filters/search change.
  useEffect(() => { setPage(1); }, [searchQuery, filterType, filterPaper]);

  const totalPages = Math.max(1, Math.ceil(filteredTx.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedTx = filteredTx.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  if (loading) return <Skeleton />;
  if (error) return <div className="pt-4"><ErrorState message={error} onRetry={reload} /></div>;

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

      {/* ===== SHARED ORDER MODAL ===== */}
      <TransactionModal
        open={showForm}
        onClose={() => setShowForm(false)}
        onSaved={reload}
        editingTx={editingTx}
        settings={settings}
      />

      {/* ===== QR CODE MODAL (view existing receipt) ===== */}
      {showQR && (
        <div className="modal-overlay" onClick={() => setShowQR(false)}>
          <div className="modal !max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white mb-4">
                <QrCode className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Receipt QR</h3>
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
            className="w-44"
            value={filterPaper}
            onChange={(v) => setFilterPaper(v as 'all' | PaperSize)}
            options={[
              { value: 'all', label: 'All Paper' },
              ...PAPER_TYPES.map((p) => ({ value: p.value, label: p.label })),
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
        <>
          {/* ===== Desktop table (hidden on mobile) — center-aligned ===== */}
          <div className="table-wrapper hidden md:block">
            <table className="table text-center">
              <thead>
                <tr>
                  <th className="text-center">Date</th>
                  <th className="text-center">Customer</th>
                  <th className="text-center">Type</th>
                  <th className="text-center">Paper</th>
                  <th className="text-center">Qty</th>
                  <th className="text-center">Final</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedTx.map((tx) => {
                  const d = new Date(tx.created_at || '');
                  return (
                    <tr key={tx.id}>
                      <td className="text-center">
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                        <div className="text-[11px] text-slate-400">{d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="text-center text-sm text-slate-600 dark:text-slate-300">{tx.customer_name || <span className="text-slate-400">Walk-in</span>}</td>
                      <td className="text-center"><span className={`badge ${tx.print_type === 'print' ? 'badge-print' : 'badge-photocopy'}`}>{tx.print_type}</span></td>
                      <td className="text-center"><span className="badge badge-paper">{PAPER_TYPE_LABELS[tx.paper_size as PaperType] || tx.paper_size}</span></td>
                      <td className="text-center font-semibold">{tx.quantity}</td>
                      <td className="text-center font-bold text-slate-900 dark:text-white">₱{tx.final_total}</td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1">
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

          {/* ===== Mobile collapsible cards (hidden on desktop) ===== */}
          <div className="md:hidden space-y-2.5">
            {pagedTx.map((tx) => {
              const d = new Date(tx.created_at || '');
              const isExpanded = expandedId === tx.id;
              return (
                <div key={tx.id} className="glass-card overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : tx.id!)}
                    className="w-full flex items-center justify-between gap-3 p-4 text-left"
                    aria-expanded={isExpanded}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                        {tx.customer_name || 'Walk-in'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">₱{tx.final_total}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-100/70 dark:border-white/5 space-y-2.5 animate-fade-in">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Type</span>
                        <span className={`badge ${tx.print_type === 'print' ? 'badge-print' : 'badge-photocopy'}`}>{tx.print_type}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Paper</span>
                        <span className="badge badge-paper">{PAPER_TYPE_LABELS[tx.paper_size as PaperType] || tx.paper_size}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Copies</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{tx.quantity}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Final</span>
                        <span className="font-bold text-slate-900 dark:text-white">₱{tx.final_total}</span>
                      </div>
                      {tx.notes && (
                        <div className="flex items-start justify-between text-sm gap-3">
                          <span className="text-slate-500 dark:text-slate-400 flex-shrink-0">Notes</span>
                          <span className="text-slate-600 dark:text-slate-300 text-right">{tx.notes}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-end gap-1 pt-1">
                        {tx.receipt_id && (
                          <button onClick={() => { setQrReceiptId(tx.receipt_id!); setShowQR(true); }} className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-500/10 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" aria-label="Show QR">
                            <QrCode className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => openEdit(tx)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" aria-label="Edit">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(tx.id!)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" aria-label="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ===== Pagination (20 per page) ===== */}
          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-9 h-9 rounded-full flex items-center justify-center btn-ghost !p-0 disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-9 h-9 rounded-full flex items-center justify-center btn-ghost !p-0 disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
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
