'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

export interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
}

interface DropdownProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: DropdownOption<T>[];
  placeholder?: string;
  className?: string;
  /** Optional id for label association */
  id?: string;
}

/**
 * Dropdown
 * A reusable, fully-styled selection menu that replaces native <select>
 * elements. The open panel is rendered in a portal to document.body with
 * fixed positioning anchored to the trigger, so it can never be clipped by
 * an ancestor's overflow, backdrop-blur, or stacking context (e.g. inside a
 * scrollable modal or a frosted section card).
 *
 * Purely presentational: it takes `value` + `onChange` exactly like a
 * controlled native select, so it can be dropped in place of existing
 * selects/handlers without altering any business logic.
 */
export function Dropdown<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
  id,
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<{ left: number; top: number; width: number; openUp: boolean } | null>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => setMounted(true), []);

  // Measure the trigger and decide whether to open up or down.
  function reposition() {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const estimatedHeight = Math.min(256, options.length * 44 + 12);
    const openUp = spaceBelow < estimatedHeight && r.top > spaceBelow;
    setRect({
      left: r.left,
      top: openUp ? r.top : r.bottom,
      width: r.width,
      openUp,
    });
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
        triggerRef.current && !triggerRef.current.contains(t) &&
        panelRef.current && !panelRef.current.contains(t)
      ) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    function handleReflow() {
      reposition();
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', handleReflow);
    // capture scroll on any ancestor (e.g. the modal body) to keep anchored
    window.addEventListener('scroll', handleReflow, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', handleReflow);
      window.removeEventListener('scroll', handleReflow, true);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`relative ${className}`}>
      <button
        id={id}
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selected ? '' : 'text-slate-400 dark:text-slate-500'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && mounted && rect && createPortal(
        <div
          ref={panelRef}
          role="listbox"
          className="dropdown-panel !fixed !mt-0"
          style={{
            left: rect.left,
            width: rect.width,
            ...(rect.openUp
              ? { bottom: window.innerHeight - rect.top + 6 }
              : { top: rect.top + 6 }),
          }}
        >
          {options.map((option) => {
            const isActive = option.value === value;
            return (
              <div
                key={option.value}
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`dropdown-option ${isActive ? 'active' : ''}`}
              >
                <span>{option.label}</span>
                {isActive && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}
