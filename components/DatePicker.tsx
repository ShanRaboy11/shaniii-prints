'use client';

import { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  /** Value in YYYY-MM-DD format */
  value: string;
  /** Called with a YYYY-MM-DD string */
  onChange: (value: string) => void;
  id?: string;
  className?: string;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Parse a YYYY-MM-DD string into a local Date (avoids TZ shifts). */
function parseYMD(v: string): Date | null {
  if (!v) return null;
  const [y, m, d] = v.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** Format a Date as YYYY-MM-DD using local parts. */
function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * DatePicker
 * A fully-rounded custom calendar popover that replaces the native
 * <input type="date">. Purely presentational: emits a YYYY-MM-DD string
 * via onChange exactly like the native control, so business logic that
 * builds dates from the value is unaffected.
 */
export function DatePicker({ value, onChange, id, className = '' }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = parseYMD(value);
  const today = new Date();

  // Month currently shown in the calendar grid.
  const [viewYear, setViewYear] = useState<number>((selected || today).getFullYear());
  const [viewMonth, setViewMonth] = useState<number>((selected || today).getMonth());

  // Keep the viewed month in sync when the popover opens with a value.
  useEffect(() => {
    if (open) {
      const base = parseYMD(value) || new Date();
      setViewYear(base.getFullYear());
      setViewMonth(base.getMonth());
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

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

  function prevMonth() {
    setViewMonth((m) => {
      if (m === 0) { setViewYear((y) => y - 1); return 11; }
      return m - 1;
    });
  }

  function nextMonth() {
    setViewMonth((m) => {
      if (m === 11) { setViewYear((y) => y + 1); return 0; }
      return m + 1;
    });
  }

  function pick(day: number) {
    onChange(toYMD(new Date(viewYear, viewMonth, day)));
    setOpen(false);
  }

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const label = selected
    ? selected.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Select date';

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
          <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className={selected ? '' : 'text-slate-400 dark:text-slate-500'}>{label}</span>
        </span>
      </button>

      {open && (
        <div className="dropdown-panel !p-3 w-72" role="dialog">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-2 px-1">
            <button
              type="button"
              onClick={prevMonth}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-primary-50 dark:hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-300 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-primary-50 dark:hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-300 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday header */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((w) => (
              <div key={w} className="h-7 flex items-center justify-center text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {w}
              </div>
            ))}
          </div>

          {/* Day grid — rounded selection pills */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} className="h-9" />;
              const cellDate = new Date(viewYear, viewMonth, day);
              const isSelected = selected && sameDay(cellDate, selected);
              const isToday = sameDay(cellDate, today);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => pick(day)}
                  className={`h-9 rounded-full text-sm font-medium transition-all
                    ${isSelected
                      ? 'bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-md shadow-primary-500/30'
                      : isToday
                        ? 'text-primary-600 dark:text-primary-300 ring-1 ring-inset ring-primary-300 dark:ring-primary-500/40 hover:bg-primary-50 dark:hover:bg-primary-500/10'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-primary-500/10 hover:text-primary-700 dark:hover:text-primary-300'
                    }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Today shortcut */}
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5">
            <button
              type="button"
              onClick={() => { onChange(toYMD(today)); setOpen(false); }}
              className="w-full py-2 rounded-xl text-xs font-semibold text-primary-600 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
