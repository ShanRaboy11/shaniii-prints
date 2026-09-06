'use client';

import { AlertTriangle, X } from 'lucide-react';

export interface ConfirmDeleteDetail {
  label: string;
  value: string;
}

interface ConfirmDeleteModalProps {
  open: boolean;
  title?: string;
  message?: string;
  /** Key/value rows describing the record being deleted (e.g. Customer, Order ID, Amount). */
  details?: ConfirmDeleteDetail[];
  confirmLabel?: string;
  /** Disables buttons + shows a busy state while the delete is in flight. */
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * ConfirmDeleteModal
 * A reusable glassmorphic confirmation dialog for destructive actions.
 * Shows a warning, the record's key details, and explicit Cancel / Confirm
 * Delete actions (red destructive accent) so deletions are never accidental.
 */
export function ConfirmDeleteModal({
  open,
  title = 'Delete transaction?',
  message = 'This action cannot be undone. The record will be permanently removed.',
  details = [],
  confirmLabel = 'Confirm Delete',
  busy = false,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={busy ? undefined : onCancel}>
      <div className="modal !max-w-sm" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/15 flex items-center justify-center text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            disabled={busy}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{message}</p>

          {details.length > 0 && (
            <div className="rounded-2xl border border-red-200/60 dark:border-red-500/20 bg-red-50/60 dark:bg-red-500/5 p-4 space-y-2">
              {details.map((d) => (
                <div key={d.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-500 dark:text-slate-400">{d.label}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 text-right truncate">{d.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="btn-ghost flex-1 !rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className="btn-danger flex-1 !rounded-xl"
            >
              {busy ? 'Deleting…' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
