"use client";

import type { LucideIcon } from "lucide-react";
import { Activity, AlertTriangle } from "lucide-react";

export interface InfrastructureNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface InfrastructureSidebarProps {
  items: InfrastructureNavItem[];
  lastUpdated?: string | null;
  error?: string | null;
}

export default function InfrastructureSidebar({
  items,
  lastUpdated,
  error,
}: InfrastructureSidebarProps) {
  return (
    <aside className="hidden h-full lg:block">
      <div className="sticky top-4 flex h-full max-h-[calc(100vh-10rem)] flex-col gap-4 rounded-2xl border border-white/10 bg-black/30 p-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-400">
            Navigator
          </p>
          <h2 className="mt-2 text-lg font-semibold text-gray-100">
            Infrastructure Desk
          </h2>
        </div>

        <nav className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  document
                    .getElementById(item.id)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm text-gray-300 transition hover:border-white/10 hover:bg-white/5 hover:text-gray-100"
              >
                <Icon className="h-4 w-4 text-cyan-400" />
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="mt-auto rounded-xl border border-white/10 bg-black/50 p-3">
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            Live feed
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            {lastUpdated
              ? `Updated ${new Date(lastUpdated).toLocaleTimeString()}`
              : "Awaiting first payload"}
          </p>
          {error && (
            <p className="mt-2 flex items-start gap-1 text-[11px] text-rose-400">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              {error}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
