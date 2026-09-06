'use client';

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
const MINUTES = Array.from({ length: 60 }, (_, i) => i); // 0..59
const PERIODS: ('AM' | 'PM')[] = ['AM', 'PM'];

const ITEM_H = 40; // px height of each wheel row (must match markup)
const VISIBLE_PAD = 2; // rows of padding above/below center
// How many times to repeat the item list for the infinite buffer. The wheel
// keeps the user near the middle copy and silently recenters on settle so
// scrolling never reaches a hard top/bottom boundary.
const LOOP_COPIES = 41; // odd number so there's a clean middle copy

/**
 * WheelColumn
 * A single vertical tumbler with native scroll inertia + snap-to-center.
 * When `loop` is true the items are repeated into a large buffer and the
 * scroll position is silently recentered to the middle copy after each settle,
 * producing seamless infinite wrapping (past 59 → 00, past 12 → 01) with no
 * visible top/bottom stop.
 */
function WheelColumn<T extends string | number>({
  items,
  selected,
  onSelect,
  format = (v) => String(v),
  ariaLabel,
  loop = false,
}: {
  items: T[];
  selected: T;
  onSelect: (v: T) => void;
  format?: (v: T) => string;
  ariaLabel: string;
  loop?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProgrammatic = useRef(false);

  const n = items.length;
  const selIndex = Math.max(0, items.findIndex((i) => i === selected));

  // The rendered buffer: for a looping wheel we repeat the items; for a finite
  // wheel (AM/PM) we render once with spacer padding.
  const copies = loop ? LOOP_COPIES : 1;
  const middleCopy = Math.floor(copies / 2);

  // Absolute row index (within the buffer) that should sit at the center.
  function centeredScrollTop(bufferIndex: number) {
    return bufferIndex * ITEM_H;
  }

  // Sync scroll position when the selected value changes from outside, or on
  // mount — always park on the middle copy so there's room to wrap both ways.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    isProgrammatic.current = true;
    const bufferIndex = loop ? middleCopy * n + selIndex : selIndex;
    el.scrollTop = centeredScrollTop(bufferIndex);
    const clear = setTimeout(() => { isProgrammatic.current = false; }, 60);
    return () => clearTimeout(clear);
  }, [selIndex, loop, n, middleCopy]);

  const handleScroll = useCallback(() => {
    const el = ref.current;
    if (!el || isProgrammatic.current) return;
    if (settleTimer.current) clearTimeout(settleTimer.current);
    // Debounce: once inertia settles, snap to the nearest row + report value.
    settleTimer.current = setTimeout(() => {
      const rawIndex = Math.round(el.scrollTop / ITEM_H);
      const value = items[((rawIndex % n) + n) % n];

      if (loop) {
        // Silently recenter to the equivalent row in the middle copy so the
        // user always has a full buffer of rows above and below to keep going.
        const valueIndex = ((rawIndex % n) + n) % n;
        const recentered = middleCopy * n + valueIndex;
        if (recentered !== rawIndex) {
          isProgrammatic.current = true;
          el.scrollTop = centeredScrollTop(recentered);
          requestAnimationFrame(() => { isProgrammatic.current = false; });
        }
      }

      if (value !== selected) onSelect(value);
    }, 110);
  }, [items, n, loop, middleCopy, onSelect, selected]);

  // Build the rendered rows.
  const rows: { key: string; item: T; bufferIndex: number }[] = [];
  for (let c = 0; c < copies; c++) {
    for (let i = 0; i < n; i++) {
      rows.push({ key: `${c}-${i}`, item: items[i], bufferIndex: c * n + i });
    }
  }

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      role="listbox"
      aria-label={ariaLabel}
      className="wheel-column relative h-[200px] w-full overflow-y-auto snap-y snap-mandatory scrollbar-none"
    >
      {/* top spacer so the first reachable row can center */}
      <div style={{ height: ITEM_H * VISIBLE_PAD }} aria-hidden />
      {rows.map(({ key, item }) => {
        const isActive = item === selected;
        return (
          <button
            key={key}
            type="button"
            role="option"
            aria-selected={isActive}
            onClick={() => onSelect(item)}
            style={{ height: ITEM_H }}
            className={`snap-center w-full flex items-center justify-center text-base tabular-nums transition-all duration-150 ${
              isActive
                ? 'font-extrabold text-primary-600 dark:text-primary-300 scale-110'
                : 'font-medium text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            {format(item)}
          </button>
        );
      })}
      {/* bottom spacer so the last reachable row can center */}
      <div style={{ height: ITEM_H * VISIBLE_PAD }} aria-hidden />
    </div>
  );
}

/**
 * TimePicker
 * An alarm-style tumbler/wheel time popover that replaces the native
 * <input type="time">. Users scroll or swipe vertical wheels for Hours,
 * Minutes, and AM/PM. Emits a 24-hour HH:MM string via onChange, matching
 * the native control so date/time assembly logic stays unchanged.
 */
export function TimePicker({ value, onChange, id, className = '' }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<{ left: number; top: number; openUp: boolean } | null>(null);

  const parsed = parseHM(value);
  const hour24 = parsed?.hour24 ?? 12;
  const minute = parsed?.minute ?? 0;
  const period: 'AM' | 'PM' = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  useEffect(() => setMounted(true), []);

  // Anchor the portaled panel to the trigger; flip up if little space below.
  function reposition() {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const PANEL_H = 280; // approx wheel panel height
    const spaceBelow = window.innerHeight - r.bottom;
    const openUp = spaceBelow < PANEL_H && r.top > spaceBelow;
    setRect({ left: r.left, top: openUp ? r.top : r.bottom, openUp });
  }

  useLayoutEffect(() => {
    if (open) reposition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      const t = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(t) &&
        panelRef.current && !panelRef.current.contains(t)
      ) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    function handleReflow() { reposition(); }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', handleReflow);
    window.addEventListener('scroll', handleReflow, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', handleReflow);
      window.removeEventListener('scroll', handleReflow, true);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const label = parsed
    ? `${hour12}:${String(minute).padStart(2, '0')} ${period}`
    : 'Select time';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        id={id}
        ref={triggerRef}
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

      {open && mounted && rect && createPortal(
        <div
          ref={panelRef}
          className="dropdown-panel !fixed !mt-0 !p-3 w-64"
          role="dialog"
          style={{
            left: rect.left,
            ...(rect.openUp
              ? { bottom: window.innerHeight - rect.top + 6 }
              : { top: rect.top + 6 }),
          }}
        >
          <div className="relative">
            {/* Center selection band — the "now selecting" highlight */}
            <div
              className="pointer-events-none absolute inset-x-1 top-1/2 -translate-y-1/2 h-10 rounded-2xl bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-primary-400/30 dark:border-primary-400/25"
              aria-hidden
            />
            {/* Fade masks top/bottom for the tumbler depth effect */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/95 dark:from-slate-900/95 to-transparent z-10 rounded-t-xl" aria-hidden />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/95 dark:from-slate-900/95 to-transparent z-10 rounded-b-xl" aria-hidden />

            <div className="grid grid-cols-3 gap-1">
              <WheelColumn
                ariaLabel="Hour"
                items={HOURS_12}
                selected={hour12}
                onSelect={(h) => onChange(toHM(h, minute, period))}
                loop
              />
              <WheelColumn
                ariaLabel="Minute"
                items={MINUTES}
                selected={minute}
                onSelect={(m) => onChange(toHM(hour12, m, period))}
                format={(m) => String(m).padStart(2, '0')}
                loop
              />
              <WheelColumn
                ariaLabel="AM or PM"
                items={PERIODS}
                selected={period}
                onSelect={(p) => onChange(toHM(hour12, minute, p))}
              />
            </div>
          </div>

          {/* Column captions */}
          <div className="grid grid-cols-3 gap-1 mt-2 pt-2 border-t border-slate-100 dark:border-white/5">
            {['Hour', 'Min', 'AM/PM'].map((c) => (
              <span key={c} className="text-center text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {c}
              </span>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
