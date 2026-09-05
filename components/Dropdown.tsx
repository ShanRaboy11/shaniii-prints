'use client';

import { useEffect, useRef, useState } from 'react';
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
 * elements wherever visual consistency with the app's rounded-corner
 * design tokens matters (trigger, open panel, and hover states all use
 * the same .dropdown-* utility classes defined in globals.css).
 *
 * This component is purely presentational: it takes `value` + `onChange`
 * exactly like a controlled native select, so it can be dropped in place
 * of existing selects/handlers without altering any business logic.
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
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
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

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        id={id}
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

      {open && (
        <div className="dropdown-panel" role="listbox">
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
        </div>
      )}
    </div>
  );
}
