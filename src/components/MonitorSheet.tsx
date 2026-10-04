"use client";

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/** Viewport-level dialog so map clipping/stacking contexts cannot hide controls. */
export default function MonitorSheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.focus();
    const viewport = window.visualViewport;
    const resize = () => {
      overlay.current?.style.setProperty('--monitor-viewport-height', `${viewport?.height || window.innerHeight}px`);
      overlay.current?.style.setProperty('--monitor-viewport-top', `${viewport?.offsetTop || 0}px`);
    };
    resize();
    viewport?.addEventListener('resize', resize);
    viewport?.addEventListener('scroll', resize);
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close.current();
      if (event.key !== 'Tab') return;
      const targets = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input,select,textarea,[tabindex="0"]') || []).filter((el) => el.getClientRects().length > 0);
      const first = targets[0]; const last = targets[targets.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', keydown); viewport?.removeEventListener('resize', resize); viewport?.removeEventListener('scroll', resize); previousFocus?.focus(); };
  }, []);
  return createPortal(
    <div ref={overlay} className="fixed inset-0 z-[5000] flex items-end justify-center bg-black/65 backdrop-blur-sm" onClick={onClose} style={{ height: 'var(--monitor-viewport-height, 100dvh)', top: 'var(--monitor-viewport-top, 0px)' }}>
      <div ref={dialog} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} onClick={(event) => event.stopPropagation()} className="flex max-h-[85%] w-full max-w-2xl flex-col rounded-t-3xl border border-white/15 bg-[#091422] text-white shadow-2xl outline-none pb-[env(safe-area-inset-bottom)]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <h2 className="text-base font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label={`Close ${title}`} className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10"><X className="h-5 w-5" /></button>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain p-4">{children}</div>
      </div>
    </div>, document.body,
  );
}