"use client";
import type { ReactNode } from 'react';
import MonitorSheet from './MonitorSheet';

export default function MonitorFilters({ compact, open, onClose, children }: { compact: boolean; open: boolean; onClose: () => void; children: ReactNode }) {
  if (compact) return open ? <MonitorSheet title="Map filters" onClose={onClose}><div className="[&_button]:min-h-[44px] [&_button]:text-sm [&_button]:aria-pressed:font-semibold">{children}</div></MonitorSheet> : null;
  return <div className="absolute bottom-4 left-[6.5rem] w-[min(24rem,calc(100%-7.5rem))] rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl shadow-2xl shadow-black/30">{children}</div>;
}