'use client';

import { forwardRef } from 'react';
import { TransactionRecord, paperTypeLabel } from '@/lib/db';

interface DigitalReceiptProps {
  tx: TransactionRecord;
}

/**
 * DigitalReceipt
 * A self-contained, image-capture-friendly receipt graphic rendered from a
 * TransactionRecord. Uses solid colors + simple layout (no backdrop-blur) so
 * html-to-image reproduces it faithfully when copying to the clipboard.
 * Only discounts are shown; additional fees are intentionally omitted.
 */
export const DigitalReceipt = forwardRef<HTMLDivElement, DigitalReceiptProps>(
  function DigitalReceipt({ tx }, ref) {
    const d = new Date(tx.created_at || Date.now());
    const dateStr = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const hasDiscount = tx.adjustment < 0;

    return (
      <div
        ref={ref}
        className="w-[340px] bg-white text-slate-900 rounded-2xl overflow-hidden border border-slate-200"
        style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 text-center text-white"
          style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #22c55e 100%)' }}
        >
          <div className="text-lg font-extrabold tracking-tight">
            Shanii<span className="opacity-90">Prints</span>
          </div>
          <div className="text-[11px] text-white/80 mt-0.5">Official Digital Receipt</div>
        </div>

        {/* Receipt id */}
        {tx.receipt_id && (
          <div className="px-6 pt-3 text-center">
            <span className="text-[10px] font-mono text-slate-400 break-all">{tx.receipt_id}</span>
          </div>
        )}

        {/* Meta */}
        <div className="px-6 py-4 space-y-1.5">
          <Row label="Date" value={dateStr} />
          <Row label="Time" value={timeStr} />
          <Row label="Customer" value={tx.customer_name || 'Walk-in'} />
        </div>

        <Divider />

        {/* Service */}
        <div className="px-6 py-4 space-y-1.5">
          <Row label="Service" value={tx.print_type === 'print' ? 'Print' : 'Photocopy'} />
          <Row label="Paper" value={paperTypeLabel(tx.paper_size)} />
          <Row label="Color" value={tx.is_colored ? 'Colored' : 'Black & White'} />
          <Row label="Bond paper sheets" value={String(tx.quantity)} />
          <Row label="Price / sheet" value={`₱${tx.price_per_copy}`} />
        </div>

        <Divider />

        {/* Pricing */}
        <div className="px-6 py-4 space-y-1.5">
          <Row label="Subtotal" value={`₱${tx.computed_total}`} />
          {hasDiscount && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-orange-500">Discount</span>
              <span className="font-semibold text-orange-500">-₱{Math.abs(tx.adjustment)}</span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="mx-6 mb-5 mt-1 rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: '#f0f9ff' }}>
          <span className="text-sm font-semibold text-slate-600">TOTAL</span>
          <span className="text-2xl font-extrabold" style={{ color: '#0284c7' }}>₱{tx.final_total}</span>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 text-center">
          <div className="border-t border-dashed border-slate-200 pt-3">
            <p className="text-[11px] text-slate-400">Thank you for your business!</p>
            <p className="text-[10px] text-slate-300 mt-0.5">Shanii Prints &copy; {new Date().getFullYear()}</p>
          </div>
        </div>
      </div>
    );
  }
);

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-800 text-right">{value}</span>
    </div>
  );
}

function Divider() {
  return <div className="mx-6 border-t border-dashed border-slate-200" />;
}
