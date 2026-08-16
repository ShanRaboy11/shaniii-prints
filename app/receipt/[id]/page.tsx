'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Printer,
  Download,
  Calendar,
  Clock,
  FileText,
  Copy,
  Hash,
  User,
  Palette,
  Layers,
} from 'lucide-react';
import { getTransactionByReceiptId, TransactionRecord } from '@/lib/db';

export default function ReceiptPage() {
  const params = useParams();
  const receiptId = params.id as string;
  const [transaction, setTransaction] = useState<TransactionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const tx = await getTransactionByReceiptId(receiptId);
        if (tx) {
          setTransaction(tx);
        } else {
          // Try localStorage fallback
          const local = localStorage.getItem('shanii-prints-transactions');
          if (local) {
            const all = JSON.parse(local);
            const found = all.find((t: any) => t.receipt_id === receiptId || t.receiptId === receiptId);
            if (found) {
              setTransaction({
                id: found.id,
                owner_id: '',
                customer_name: found.customer_name || found.customerName || '',
                paper_size: found.paper_size || found.paperSize || 'short',
                print_type: found.print_type || found.type || 'print',
                is_colored: found.is_colored ?? found.colored ?? false,
                quantity: found.quantity || found.copies || 1,
                price_per_copy: found.price_per_copy || found.pricePerCopy || 0,
                computed_total: found.computed_total || found.computedTotal || 0,
                final_total: found.final_total || found.finalTotal || 0,
                adjustment: found.adjustment || 0,
                adjustment_label: found.adjustment_label || found.adjustmentLabel || '',
                estimated_ink_cost: found.estimated_ink_cost || 0,
                estimated_paper_cost: found.estimated_paper_cost || 0,
                notes: found.notes || '',
                receipt_id: receiptId,
                created_at: found.created_at || found.date || new Date().toISOString(),
              });
            } else {
              setError(true);
            }
          } else {
            setError(true);
          }
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [receiptId]);

  function handleDownloadPDF() {
    if (!transaction) return;
    // Generate a printable receipt and trigger browser print/save as PDF
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const d = new Date(transaction.created_at || '');
    const dateStr = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${receiptId}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; max-width: 400px; margin: 0 auto; color: #1e293b; }
          .header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px dashed #e2e8f0; }
          .logo { font-size: 20px; font-weight: 800; margin-bottom: 4px; }
          .logo span { color: #6366f1; }
          .subtitle { font-size: 11px; color: #64748b; }
          .receipt-id { font-size: 10px; color: #94a3b8; margin-top: 8px; font-family: monospace; }
          .section { margin-bottom: 16px; }
          .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
          .row-label { color: #64748b; }
          .row-value { font-weight: 600; }
          .divider { border-top: 1px dashed #e2e8f0; margin: 12px 0; }
          .total-row { font-size: 16px; font-weight: 800; padding: 12px 0; }
          .total-row .row-value { color: #6366f1; }
          .footer { text-align: center; margin-top: 24px; padding-top: 16px; border-top: 2px dashed #e2e8f0; font-size: 11px; color: #94a3b8; }
          .adjustment { font-size: 11px; color: ${transaction.adjustment < 0 ? '#ea580c' : '#7c3aed'}; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Shanii<span>Prints</span></div>
          <div class="subtitle">Digital Receipt</div>
          <div class="receipt-id">${receiptId}</div>
        </div>
        <div class="section">
          <div class="row"><span class="row-label">Date</span><span class="row-value">${dateStr}</span></div>
          <div class="row"><span class="row-label">Time</span><span class="row-value">${timeStr}</span></div>
          ${transaction.customer_name ? `<div class="row"><span class="row-label">Customer</span><span class="row-value">${transaction.customer_name}</span></div>` : ''}
        </div>
        <div class="divider"></div>
        <div class="section">
          <div class="row"><span class="row-label">Service</span><span class="row-value">${transaction.print_type === 'print' ? 'Print' : 'Photocopy'}</span></div>
          <div class="row"><span class="row-label">Paper Size</span><span class="row-value">${transaction.paper_size.toUpperCase()}</span></div>
          <div class="row"><span class="row-label">Color</span><span class="row-value">${transaction.is_colored ? 'Yes' : 'No (B&W)'}</span></div>
          <div class="row"><span class="row-label">Copies</span><span class="row-value">${transaction.quantity}</span></div>
          <div class="row"><span class="row-label">Price / Copy</span><span class="row-value">₱${transaction.price_per_copy}</span></div>
        </div>
        <div class="divider"></div>
        <div class="section">
          <div class="row"><span class="row-label">Subtotal</span><span class="row-value">₱${transaction.computed_total}</span></div>
          ${transaction.adjustment !== 0 ? `<div class="row"><span class="row-label">${transaction.adjustment_label}</span><span class="adjustment">${transaction.adjustment < 0 ? '-' : '+'}₱${Math.abs(transaction.adjustment)}</span></div>` : ''}
        </div>
        <div class="total-row row">
          <span class="row-label">TOTAL</span>
          <span class="row-value">₱${transaction.final_total}</span>
        </div>
        <div class="footer">
          <p>Thank you for your business!</p>
          <p style="margin-top: 4px;">Shanii Prints &copy; ${new Date().getFullYear()}</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] dark:bg-[#0b1121]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] dark:bg-[#0b1121] px-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
            <FileText className="w-7 h-7 text-slate-300 dark:text-slate-600" />
          </div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Receipt not found</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">This receipt ID doesn&apos;t exist or has been deleted.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-mono">{receiptId}</p>
        </div>
      </div>
    );
  }

  const d = new Date(transaction.created_at || '');
  const dateStr = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-[#f0f4f8] dark:bg-[#0b1121] py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center text-white">
              <Printer size={18} strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold dark:text-white">
              Shanii<span className="text-indigo-500">Prints</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Digital Receipt</p>
        </div>

        {/* Receipt Card */}
        <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-3xl shadow-xl overflow-hidden">
          {/* Receipt ID Banner */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 text-center">
            <p className="text-[10px] text-white/70 uppercase tracking-wider font-semibold">Receipt ID</p>
            <p className="text-sm font-mono font-bold text-white">{receiptId}</p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* Date & Customer */}
            <div className="space-y-2.5">
              <DetailRow icon={<Calendar className="w-3.5 h-3.5" />} label="Date" value={dateStr} />
              <DetailRow icon={<Clock className="w-3.5 h-3.5" />} label="Time" value={timeStr} />
              {transaction.customer_name && (
                <DetailRow icon={<User className="w-3.5 h-3.5" />} label="Customer" value={transaction.customer_name} />
              )}
            </div>

            <div className="border-t border-dashed border-slate-200 dark:border-white/10" />

            {/* Service Details */}
            <div className="space-y-2.5">
              <DetailRow
                icon={transaction.print_type === 'print' ? <Printer className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                label="Service"
                value={transaction.print_type === 'print' ? 'Print' : 'Photocopy'}
              />
              <DetailRow icon={<Layers className="w-3.5 h-3.5" />} label="Paper" value={transaction.paper_size.toUpperCase()} />
              <DetailRow icon={<Palette className="w-3.5 h-3.5" />} label="Color" value={transaction.is_colored ? 'Colored' : 'Black & White'} />
              <DetailRow icon={<Hash className="w-3.5 h-3.5" />} label="Copies" value={String(transaction.quantity)} />
            </div>

            <div className="border-t border-dashed border-slate-200 dark:border-white/10" />

            {/* Pricing */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  {transaction.quantity} × ₱{transaction.price_per_copy}
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-200">₱{transaction.computed_total}</span>
              </div>

              {transaction.adjustment !== 0 && (
                <div className="flex justify-between text-sm">
                  <span className={transaction.adjustment < 0 ? 'text-orange-500' : 'text-violet-500'}>
                    {transaction.adjustment_label}
                  </span>
                  <span className={`font-medium ${transaction.adjustment < 0 ? 'text-orange-500' : 'text-violet-500'}`}>
                    {transaction.adjustment < 0 ? '-' : '+'}₱{Math.abs(transaction.adjustment)}
                  </span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 border border-indigo-100/60 dark:border-indigo-500/20">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Total Paid</span>
                <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">₱{transaction.final_total}</span>
              </div>
            </div>

            {transaction.notes && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-semibold">Note:</span> {transaction.notes}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6">
            <button
              onClick={handleDownloadPDF}
              className="btn-primary-gradient w-full !rounded-xl !py-3 justify-center"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-6">
          Thank you for your business! &mdash; Shanii Prints &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <span className="text-sm font-semibold text-slate-800 dark:text-white">{value}</span>
    </div>
  );
}
