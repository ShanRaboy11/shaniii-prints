'use client';

import { useEffect, useRef, useState } from 'react';
import {
  X,
  User,
  Droplets,
  ArrowDown,
  ArrowUp,
  Copy,
  Check,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { toBlob } from 'html-to-image';
import { useToast } from '@/components/ToastProvider';
import { useAuth } from '@/components/AuthProvider';
import { Dropdown } from '@/components/Dropdown';
import { DatePicker } from '@/components/DatePicker';
import { TimePicker } from '@/components/TimePicker';
import { DigitalReceipt } from '@/components/DigitalReceipt';
import { Modal } from '@/components/Modal';
import { RollingNumber } from '@/components/RollingNumber';
import {
  TransactionRecord,
  BusinessSettings,
  PaperType,
  PAPER_TYPES,
  getDefaultPrice,
  estimateInkCost,
  estimatePaperCost,
  addTransactionDB,
  updateTransactionDB,
} from '@/lib/db';

type PaperSize = PaperType;
type PrintType = 'print' | 'photocopy';

// Valid papers per print type. Photocopy only supports standard (non-specialty)
// stocks; full printing supports the complete paper catalog.
function getValidPapers(type: PrintType): PaperSize[] {
  return type === 'photocopy'
    ? PAPER_TYPES.filter((p) => !p.specialty).map((p) => p.value)
    : PAPER_TYPES.map((p) => p.value);
}

/**
 * Capitalize the first letter of each word as the user types, so customer
 * names are consistently formatted (e.g. "juan dela cruz" → "Juan Dela Cruz").
 * Preserves trailing spaces so multi-word entry stays fluid.
 */
function capitalizeName(value: string): string {
  return value.replace(/(^|\s)([a-z])/g, (_m, sep, ch) => sep + ch.toUpperCase());
}

/**
 * Build an ISO timestamp from the date (YYYY-MM-DD) + time (HH:MM) pickers,
 * interpreted in the user's local timezone. Falls back to "now" if either
 * part is missing/invalid so we never write an invalid created_at.
 */
function buildTimestamp(date: string, time: string): string {
  const local = new Date(`${date}T${(time || '00:00')}:00`);
  if (Number.isNaN(local.getTime())) return new Date().toISOString();
  return local.toISOString();
}

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  /** Called after a successful add/update so the host page can reload data. */
  onSaved: () => void | Promise<void>;
  /** When provided, the modal opens in edit mode for this transaction. */
  editingTx?: TransactionRecord | null;
  settings: BusinessSettings | null;
  /** Sequential fallback identifier (e.g. "Customer #1001") when no name given. */
  nextCustomerId?: string;
}

/**
 * TransactionModal
 * Shared New/Edit Order modal (form + pricing breakdown + QR receipt).
 * Extracted from the transactions page so it can be reused on the dashboard
 * without duplicating the ~150 lines of form + pricing logic. All business
 * logic (pricing, ink/paper estimates, DB writes) is preserved verbatim.
 */
export function TransactionModal({ open, onClose, onSaved, editingTx, settings, nextCustomerId }: TransactionModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const formMode: 'add' | 'edit' = editingTx ? 'edit' : 'add';

  // Receipt graphic modal (shown after a successful new order). `receiptOpen`
  // drives the animated Modal; `receiptTx` retains the data through the exit
  // animation so the receipt doesn't vanish mid-transition.
  const [receiptTx, setReceiptTx] = useState<TransactionRecord | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Form fields
  const [fType, setFType] = useState<PrintType>('print');
  const [fPaper, setFPaper] = useState<PaperSize>('short');
  const [fColored, setFColored] = useState(false);
  // Numeric fields are stored as raw strings so the user can freely type/clear
  // them (no forced leading zero, empty allowed). Parsed to numbers on demand.
  const [fCopies, setFCopies] = useState('1');
  const [fCustomer, setFCustomer] = useState('');
  const [fDate, setFDate] = useState('');
  const [fTime, setFTime] = useState('');
  const [fNotes, setFNotes] = useState('');
  const [fFinal, setFFinal] = useState('0');
  // Tracks whether the user has manually edited the final price this session,
  // so auto-sync with the computed total stops once they take control.
  const [finalDirty, setFinalDirty] = useState(false);

  // Numeric derivations (empty / invalid → sensible fallback).
  const copiesNum = Math.max(1, parseInt(fCopies, 10) || 1);

  // Stepper handlers for the bond-paper-sheets field (min 1).
  const stepSheets = (delta: number) =>
    setFCopies((v) => String(Math.max(1, (parseInt(v, 10) || 1) + delta)));
  const finalNum = fFinal.trim() === '' ? 0 : parseFloat(fFinal) || 0;

  function setNowDateTime() {
    const now = new Date();
    setFDate(now.toISOString().split('T')[0]);
    setFTime(now.toTimeString().slice(0, 5));
  }

  // Populate form when the modal opens (add → defaults, edit → tx values).
  useEffect(() => {
    if (!open) return;
    if (editingTx) {
      const d = new Date(editingTx.created_at || '');
      setFType(editingTx.print_type as PrintType);
      setFPaper(editingTx.paper_size as PaperSize);
      setFColored(editingTx.is_colored);
      setFCopies(String(editingTx.quantity));
      setFCustomer(editingTx.customer_name || '');
      setFDate(d.toISOString().split('T')[0]);
      setFTime(d.toTimeString().slice(0, 5));
      setFNotes(editingTx.notes || '');
      setFFinal(String(editingTx.final_total));
      setFinalDirty(true); // keep the saved final price as-is when editing
    } else {
      setFType('print');
      setFPaper('short');
      setFColored(false);
      setFCopies('1');
      setFCustomer('');
      setFNotes('');
      // Seed the final price with the calculated default (rate × qty) so it
      // never flashes 0; the auto-sync effect keeps it in step until edited.
      setFFinal(String(getDefaultPrice('short', false, settings) * 1));
      setFinalDirty(false);
      setNowDateTime();
    }
  }, [open, editingTx, settings]);

  // Computed price — standard sizes use the owner-configured base rates.
  const pricePerCopy = getDefaultPrice(fPaper, fColored, settings);
  const computedTotal = pricePerCopy * copiesNum;
  const inkCost = estimateInkCost(settings, copiesNum, fColored);
  const paperCost = estimatePaperCost(settings, copiesNum);
  const adjustment = finalNum - computedTotal;
  const adjustmentLabel = adjustment < 0 ? 'Discount' : adjustment > 0 ? 'Additional' : '';

  // Auto-sync the final price with the computed total until the user manually
  // edits it (then we respect their value).
  useEffect(() => {
    if (formMode === 'add' && !finalDirty) setFFinal(String(computedTotal));
  }, [computedTotal, formMode, finalDirty]);

  // Validate paper when type changes
  useEffect(() => {
    const valid = getValidPapers(fType);
    if (!valid.includes(fPaper)) setFPaper(valid[0]);
  }, [fType]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      showToast('You must be signed in to save orders.', 'error');
      return;
    }

    // Fall back to a sequential customer identifier when no name is entered.
    const customerName = fCustomer.trim() || nextCustomerId || 'Customer';

    // Build the event timestamp from the date + time pickers. This is the
    // authoritative created_at for the transaction, so editing the pickers
    // actually mutates the stored timestamp (and analytics recompute from it).
    const createdAt = buildTimestamp(fDate, fTime);

    const txData: Omit<TransactionRecord, 'id'> = {
      owner_id: user.id,
      customer_name: customerName,
      paper_size: fPaper,
      print_type: fType,
      is_colored: fColored,
      quantity: copiesNum,
      price_per_copy: pricePerCopy,
      computed_total: computedTotal,
      final_total: finalNum,
      adjustment,
      adjustment_label: adjustmentLabel,
      estimated_ink_cost: parseFloat(inkCost.toFixed(4)),
      estimated_paper_cost: parseFloat(paperCost.toFixed(4)),
      notes: fNotes || undefined,
      created_at: createdAt,
    };

    setSaving(true);
    try {
      if (formMode === 'add') {
        const created = await addTransactionDB(txData);
        showToast('Transaction added!', 'success');
        await onSaved();
        onClose();
        // Show the full receipt graphic (with image-copy) instead of a QR code.
        setReceiptTx(created ?? txData);
        setReceiptOpen(true);
        setCopied(false);
      } else if (editingTx?.id) {
        await updateTransactionDB(editingTx.id, txData);
        showToast('Transaction updated!', 'success');
        await onSaved();
        onClose();
      }
    } catch (err: any) {
      showToast(err?.message || 'Error saving transaction', 'error');
    } finally {
      setSaving(false);
    }
  }

  const validPapers = getValidPapers(fType);

  // Render the on-screen receipt to a PNG and write it straight to the system
  // clipboard so the user can paste it into Messenger/chat without downloading.
  async function copyReceiptImage() {
    if (!receiptRef.current) return;
    setCopying(true);
    try {
      const node = receiptRef.current;
      // Capture at the element's true size so a narrow/scrolled modal ancestor
      // can never clip the rendered image. Explicit width/height + reset margin
      // pin the capture box to the receipt itself.
      const width = node.offsetWidth;
      const height = node.offsetHeight;
      const blob = await toBlob(node, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
        width,
        height,
        style: {
          margin: '0',
          transform: 'none',
        },
      });
      if (!blob) throw new Error('Could not render receipt image.');

      if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
        throw new Error('Image clipboard not supported in this browser.');
      }
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      showToast('Receipt image copied — paste it anywhere!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch (err: any) {
      showToast(err?.message || 'Failed to copy receipt image.', 'error');
    } finally {
      setCopying(false);
    }
  }

  return (
    <>
      {/* ===== RECEIPT GRAPHIC MODAL (after a new order) ===== */}
      <Modal open={receiptOpen} onClose={() => setReceiptOpen(false)} panelClassName="!max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Receipt Generated</h3>
          <button onClick={() => setReceiptOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {/* The receipt graphic (this exact node is captured to an image) */}
          <div className="py-2 flex justify-center overflow-x-auto">
            {receiptTx && <DigitalReceipt ref={receiptRef} tx={receiptTx} />}
          </div>

          <div className="flex gap-2 mt-5">
            <button onClick={() => setReceiptOpen(false)} className="btn-ghost flex-1 !rounded-xl">
              Done
            </button>
            <button
              onClick={copyReceiptImage}
              disabled={copying}
              className="btn-primary-gradient flex-1 !rounded-xl"
            >
              {copied ? <><Check className="w-4 h-4" /> Copied!</> : copying ? 'Copying…' : <><Copy className="w-4 h-4" /> Copy Receipt Image</>}
            </button>
          </div>
        </div>
      </Modal>

      {/* ===== ADD/EDIT MODAL ===== */}
      <Modal open={open} onClose={onClose}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {formMode === 'add' ? 'New Order' : 'Edit Order'}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
              {/* ── Section: Order Details ── */}
              <div className="modal-section space-y-4">
                <p className="modal-section-title">Order Details</p>

                {/* Customer Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Customer Name <span className="normal-case text-slate-400">(optional)</span></label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                    <input type="text" value={fCustomer} onChange={(e) => setFCustomer(capitalizeName(e.target.value))} placeholder="Juan Dela Cruz" className="input-soft pl-10" />
                  </div>
                </div>

                {/* Type of Print + Paper */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="type-of-print" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Print Type
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
                  <div>
                    <label htmlFor="type-of-paper" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Paper
                    </label>
                    <Dropdown
                      id="type-of-paper"
                      value={fPaper}
                      onChange={(v) => setFPaper(v as PaperSize)}
                      options={PAPER_TYPES.filter((p) => validPapers.includes(p.value)).map((p) => ({
                        value: p.value,
                        label: p.label,
                      }))}
                    />
                  </div>
                </div>

                {/* Colored + Bond paper sheets */}
                <div className="grid grid-cols-2 gap-3 items-end">
                  <div className="flex items-center justify-between px-3.5 py-3.5 rounded-2xl bg-white/70 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/10">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Colored</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={fColored} onChange={(e) => setFColored(e.target.checked)} className="sr-only peer" />
                      <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-primary-500 peer-checked:to-accent-500" />
                    </label>
                  </div>
                  <div>
                    <label htmlFor="bond-sheets" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Bond Paper Sheets</label>
                    {/* Sheets stepper — custom -/+ arrows always visible (incl. mobile,
                        where native number spinners are hidden). Compact + responsive. */}
                    <div className="input-soft flex items-center gap-1 !px-2 !py-2">
                      <button
                        type="button"
                        aria-label="Decrease sheets"
                        onClick={() => stepSheets(-1)}
                        className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-white/[0.06] hover:bg-primary-100 dark:hover:bg-primary-500/20 hover:text-primary-600 dark:hover:text-primary-300 active:scale-95 transition-all"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <input
                        id="bond-sheets"
                        aria-label="Bond paper sheets"
                        type="number"
                        min="1"
                        inputMode="numeric"
                        value={fCopies}
                        onChange={(e) => setFCopies(e.target.value)}
                        onBlur={() => setFCopies((v) => (v.trim() === '' ? '1' : String(Math.max(1, parseInt(v, 10) || 1))))}
                        className="min-w-0 flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-center text-lg font-bold text-slate-900 dark:text-slate-100 no-spinner"
                        placeholder="1"
                      />
                      <button
                        type="button"
                        aria-label="Increase sheets"
                        onClick={() => stepSheets(1)}
                        className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-white/[0.06] hover:bg-primary-100 dark:hover:bg-primary-500/20 hover:text-primary-600 dark:hover:text-primary-300 active:scale-95 transition-all"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Section: Timestamp ── */}
              <div className="modal-section">
                <p className="modal-section-title">Timestamp</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Date</label>
                    <DatePicker value={fDate} onChange={setFDate} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Time</label>
                    <TimePicker value={fTime} onChange={setFTime} />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Notes</label>
                  <input type="text" value={fNotes} onChange={(e) => setFNotes(e.target.value)} placeholder="Special instructions..." className="input-soft" />
                </div>
              </div>

              {/* ── Section: Pricing ── */}
              <div className="modal-section space-y-2.5">
                <p className="modal-section-title !mb-1">Pricing</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">{copiesNum} sheet{copiesNum !== 1 ? 's' : ''} × ₱{pricePerCopy} <span className="text-[10px]">({fColored ? 'color' : 'b&w'})</span></span>
                  <RollingNumber value={computedTotal} prefix="₱" className="font-semibold text-slate-700 dark:text-slate-200" />
                </div>

                {/* Ink cost estimate */}
                {(inkCost > 0 || paperCost > 0) && (
                  <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1"><Droplets className="w-3 h-3" /> Est. cost: ink ₱{inkCost.toFixed(2)} + paper ₱{paperCost.toFixed(2)}</span>
                    <span className="font-medium">₱{(inkCost + paperCost).toFixed(2)}</span>
                  </div>
                )}

                {/* Final price */}
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Final Price</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 z-10">₱</span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      inputMode="decimal"
                      value={fFinal}
                      onChange={(e) => { setFinalDirty(true); setFFinal(e.target.value); }}
                      onBlur={() => setFFinal((v) => (v.trim() === '' ? '0' : String(parseFloat(v) || 0)))}
                      className="input-soft pl-8 text-lg font-bold text-center"
                    />
                  </div>
                </div>

                {adjustment !== 0 && (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${adjustment < 0 ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'bg-accent-50 dark:bg-accent-500/10 text-accent-600 dark:text-accent-400'}`}>
                    {adjustment < 0 ? <><ArrowDown className="w-3.5 h-3.5" /> Discount: -₱{Math.abs(adjustment)}</> : <><ArrowUp className="w-3.5 h-3.5" /> Additional: +₱{adjustment}</>}
                  </div>
                )}

                {/* Grand total — odometer roll on every price change */}
                <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-200/70 dark:border-white/10">
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Total</span>
                  <RollingNumber value={Math.round(finalNum)} prefix="₱" className="text-2xl font-extrabold text-primary-600 dark:text-primary-400" />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} className="btn-ghost flex-1 !rounded-xl" disabled={saving}>Cancel</button>
                <button type="submit" className="btn-primary-gradient flex-1 !rounded-xl" disabled={saving}>
                  {saving ? 'Saving…' : formMode === 'add' ? 'Save & Generate Receipt' : 'Update'}
                </button>
              </div>
            </form>
      </Modal>
    </>
  );
}
