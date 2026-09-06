'use client';

import { useEffect, useRef, useState } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Extra classes for the inner .modal panel (e.g. "!max-w-sm"). */
  panelClassName?: string;
  /** When false, clicking the backdrop won't close (e.g. during a busy op). */
  dismissOnBackdrop?: boolean;
}

// Keep in sync with the exit animation duration in globals.css.
const EXIT_MS = 200;

/**
 * Modal
 * A reusable dialog shell that owns its mount/unmount lifecycle so every modal
 * gets a synchronized entrance AND exit animation: the backdrop blur fades in
 * and the panel scales/slides up on open, then both reverse smoothly on close
 * before the node is removed from the DOM.
 *
 * Usage mirrors the previous inline pattern — pass `open` + `onClose` and the
 * modal body as children; the overlay + panel wrappers are provided here.
 */
export function Modal({
  open,
  onClose,
  children,
  panelClassName = '',
  dismissOnBackdrop = true,
}: ModalProps) {
  // `render` keeps the node mounted through the exit animation.
  const [render, setRender] = useState(open);
  // `closing` drives the reverse (exit) animation classes.
  const [closing, setClosing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setClosing(false);
      setRender(true);
    } else if (render) {
      // Begin exit animation, then unmount after it completes.
      setClosing(true);
      timerRef.current = setTimeout(() => {
        setRender(false);
        setClosing(false);
      }, EXIT_MS);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on Escape while open.
  useEffect(() => {
    if (!render) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [render, onClose]);

  if (!render) return null;

  return (
    <div
      className={`modal-overlay ${closing ? 'modal-overlay--closing' : ''}`}
      onClick={dismissOnBackdrop ? onClose : undefined}
    >
      <div
        className={`modal ${closing ? 'modal--closing' : ''} ${panelClassName}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}
