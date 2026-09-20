"use client";

import { useMemo, useState } from "react";

export interface TabbedDataRow {
  name: string;
  region: string;
  technology: string;
  layer: string;
  capacity: string;
  status: string;
}

interface TabbedDataGridProps {
  title: string;
  subtitle?: string;
  rows: TabbedDataRow[];
}

const REGION_TABS = [
  { id: "na", label: "North America" },
  { id: "eu", label: "Europe" },
  { id: "asia", label: "Asia / ME" },
  { id: "other", label: "Other" },
] as const;

function classifyRegion(region: string): (typeof REGION_TABS)[number]["id"] {
  const r = region.toLowerCase();
  if (
    r.includes("usa") ||
    r.includes("canada") ||
    r.includes("mex") ||
    r.includes("gulf coast")
  ) {
    return "na";
  }
  if (
    r.includes("uk") ||
    r.includes("germany") ||
    r.includes("netherlands") ||
    r.includes("norway") ||
    r.includes("europe") ||
    r.includes("north sea")
  ) {
    return "eu";
  }
  if (
    r.includes("saudi") ||
    r.includes("qatar") ||
    r.includes("india") ||
    r.includes("china") ||
    r.includes("persian") ||
    r.includes("asia")
  ) {
    return "asia";
  }
  return "other";
}

export default function TabbedDataGrid({
  title,
  subtitle,
  rows,
}: TabbedDataGridProps) {
  const [activeTab, setActiveTab] = useState<(typeof REGION_TABS)[number]["id"]>(
    "na",
  );

  const grouped = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        const bucket = classifyRegion(row.region);
        acc[bucket].push(row);
        return acc;
      },
      {
        na: [] as TabbedDataRow[],
        eu: [] as TabbedDataRow[],
        asia: [] as TabbedDataRow[],
        other: [] as TabbedDataRow[],
      },
    );
  }, [rows]);

  const activeRows = grouped[activeTab];

  return (
    <section className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <header className="mb-3">
        <h3 className="text-sm font-semibold text-gray-100">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </header>

      <div className="mb-3 flex flex-wrap gap-2">
        {REGION_TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                active
                  ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-300"
                  : "border-white/10 bg-white/5 text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab.label} ({grouped[tab.id].length})
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-gray-500">
              <th className="px-2 py-2">Asset</th>
              <th className="px-2 py-2">Region</th>
              <th className="px-2 py-2">Technology</th>
              <th className="px-2 py-2">Layer</th>
              <th className="px-2 py-2">Capacity</th>
              <th className="px-2 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {activeRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-2 py-4 text-center text-gray-500">
                  No assets in this region.
                </td>
              </tr>
            ) : (
              activeRows.map((row) => (
                <tr key={`${row.name}-${row.region}`} className="border-b border-white/5">
                  <td className="px-2 py-2 text-gray-100">{row.name}</td>
                  <td className="px-2 py-2 text-gray-400">{row.region}</td>
                  <td className="px-2 py-2 text-gray-300">{row.technology}</td>
                  <td className="px-2 py-2 capitalize text-gray-400">{row.layer}</td>
                  <td className="px-2 py-2 text-gray-300">{row.capacity}</td>
                  <td className="px-2 py-2 text-gray-300">{row.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
