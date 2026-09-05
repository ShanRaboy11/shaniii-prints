'use client';

import { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';

interface TimePickerProps {
  /** Value in 24-hour HH:MM format */
  value: string;
  /** Called with a 24-hour HH:MM string */
  onChange: (value: string) => void;
  id?: string;
  className?: string;
}

/** Parse HH:MM (24h) into { hour24, minute } or null. */
function parseHM(v: string): { hour24: number; minute: number } | null {
  if (!v) return null;
  const [h, m] = v.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return { hour24: h, minute: m };
}

/** Build a 24h HH:MM string from 12h parts. */
function toHM(hour12: number, minute: number, period: 'AM' | 'PM'): string {
  let h24 = hour12 % 12;
  if (period === 'PM') h24 += 12;
  return `${String(h24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 0,5,...,55

/**
 * TimePicker
 * A fully-rounded custom time popover that replaces the native
 * <input type="time">. Emits a 24-hour HH:MM string via onChange, matching
 * the native control so date/time assembly logic stays unchanged.
 */
export function TimePicker({ value, onChange, id, className = '' }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parsed = parseHM(value);
  const hour24 = parsed?.hour24 ?? 12;
  const minute = parsed?.minute ?? 0;
  const period: 'AM' | 'PM' = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  function setHour(h12: number) {
    onChange(toHM(h12, minute, period));
  }
  function setMinute(m: number) {
    onChange(toHM(hour12, m, period));
  }
  function setPeriod(p: 'AM' | 'PM') {
    onChange(toHM(hour12, minute, p));
  }

  const label = parsed
    ? `${hour12}:${String(minute).padStart(2, '0')} ${period}`
    : 'Select time';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="dropdown-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className={parsed ? '' : 'text-slate-400 dark:text-slate-500'}>{label}</span>
        </span>
      </button>

      {open && (
        <div className="dropdown-panel !p-3 w-64" role="dialog">
          {/* AM / PM toggle */}
          <div className="grid grid-cols-2 gap-1.5 mb-3 p-1 rounded-2xl bg-slate-100/80 dark:bg-white/5">
            {(['AM', 'PM'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                  period === p
                    ? 'bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Hours */}
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 px-1">Hour</p>
          <div className="grid grid-cols-6 gap-1 mb-3">
            {HOURS_12.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHour(h)}
                className={`h-8 rounded-full text-sm font-medium transition-all ${
                  h === hour12
                    ? 'bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-md shadow-primary-500/30'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-primary-500/10 hover:text-primary-700 dark:hover:text-primary-300'
                }`}
              >
                {h}
              </button>
            ))}
          </div>

          {/* Minutes */}
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 px-1">Minute</p>
          <div className="grid grid-cols-6 gap-1">
            {MINUTES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMinute(m)}
                className={`h-8 rounded-full text-sm font-medium transition-all ${
                  m === minute
                    ? 'bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-md shadow-primary-500/30'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-primary-500/10 hover:text-primary-700 dark:hover:text-primary-300'
                }`}
              >
                {String(m).padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
