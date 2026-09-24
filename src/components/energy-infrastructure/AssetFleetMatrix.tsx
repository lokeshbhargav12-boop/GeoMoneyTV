"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  ChevronRight,
  Filter,
  Search,
  Sliders,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import type { MapAsset } from "@/components/energy-infrastructure/infraDefaults";

interface AssetFleetMatrixProps {
  assets: MapAsset[];
  selectedAssetId?: string | null;
  onSelectAsset: (asset: MapAsset) => void;
  monitoredAssetIds: string[];
  onToggleMonitored: (assetId: string) => void;
}

const FLEET_TABS = [
  { id: "all", label: "All Fleet" },
  { id: "monitored", label: "★ Watched" },
  { id: "oil", label: "Oil & Liquids" },
  { id: "gas", label: "Gas & LNG" },
  { id: "power", label: "Power & Grids" },
  { id: "renewables", label: "Clean / Hydro" },
  { id: "coal", label: "Coal" },
] as const;

export default function AssetFleetMatrix({
  assets,
  selectedAssetId,
  onSelectAsset,
  monitoredAssetIds,
  onToggleMonitored,
}: AssetFleetMatrixProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      if (activeTab === "monitored" && !monitoredAssetIds.includes(asset.id)) {
        return false;
      }
      if (activeTab === "oil") {
        const t = (asset.primaryFuel || asset.tech).toLowerCase();
        if (!t.includes("oil") && !t.includes("crude")) return false;
      }
      if (activeTab === "gas") {
        const t = (asset.primaryFuel || asset.tech).toLowerCase();
        if (!t.includes("gas") && !t.includes("lng")) return false;
      }
      if (activeTab === "power") {
        const t = (asset.primaryFuel || asset.tech).toLowerCase();
        if (!t.includes("grid") && !t.includes("power") && !t.includes("ops")) return false;
      }
      if (activeTab === "renewables") {
        const t = (asset.primaryFuel || asset.tech).toLowerCase();
        if (!t.includes("hydro") && !t.includes("wind") && !t.includes("solar") && !t.includes("geothermal")) return false;
      }
      if (activeTab === "coal") {
        const t = (asset.primaryFuel || asset.tech).toLowerCase();
        if (!t.includes("coal")) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = asset.name.toLowerCase().includes(q);
        const matchesRegion = asset.region.toLowerCase().includes(q);
        const matchesOperator = (asset.operator || "").toLowerCase().includes(q);
        const matchesTech = (asset.tech || "").toLowerCase().includes(q);
        if (!matchesName && !matchesRegion && !matchesOperator && !matchesTech) {
          return false;
        }
      }

      return true;
    });
  }, [assets, activeTab, monitoredAssetIds, searchQuery]);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-gray-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-200">
            Infrastructure Asset Matrix & Watchlist
          </h3>
          <p className="text-xs text-gray-400">
            Monitoring 37 strategic global energy assets. Click any row to inspect & simulate outage impact.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search asset, region, operator..."
            className="w-full rounded-lg border border-white/10 bg-white/5 py-1.5 pl-8 pr-3 text-xs text-gray-200 placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {FLEET_TABS.map((tab) => {
          const count =
            tab.id === "monitored"
              ? monitoredAssetIds.length
              : tab.id === "all"
                ? assets.length
                : assets.filter((a) => {
                    const t = (a.primaryFuel || a.tech).toLowerCase();
                    if (tab.id === "oil") return t.includes("oil") || t.includes("crude");
                    if (tab.id === "gas") return t.includes("gas") || t.includes("lng");
                    if (tab.id === "power") return t.includes("grid") || t.includes("power") || t.includes("ops");
                    if (tab.id === "renewables") return t.includes("hydro") || t.includes("wind") || t.includes("solar") || t.includes("geothermal");
                    if (tab.id === "coal") return t.includes("coal");
                    return true;
                  }).length;

          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                active
                  ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-300"
                  : "border-white/10 bg-white/5 text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab.label} <span className="text-[10px] opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase text-gray-500">
              <th className="py-2 px-2 w-8">Watch</th>
              <th className="py-2 px-2">Asset Name & Operator</th>
              <th className="py-2 px-2">Region</th>
              <th className="py-2 px-2">Stream</th>
              <th className="py-2 px-2">Output / Cap</th>
              <th className="py-2 px-2">Utilization</th>
              <th className="py-2 px-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-gray-300">
            {filteredAssets.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-xs text-gray-500">
                  {activeTab === "monitored"
                    ? "No assets currently starred. Click the star icon on any asset to pin it here."
                    : "No assets match your search criteria."}
                </td>
              </tr>
            ) : (
              filteredAssets.map((asset) => {
                const isSelected = selectedAssetId === asset.id;
                const isWatched = monitoredAssetIds.includes(asset.id);
                const util = asset.utilizationPercent ?? 90;

                return (
                  <tr
                    key={asset.id}
                    className={`transition hover:bg-white/[0.03] ${
                      isSelected ? "bg-cyan-500/10 border-l-2 border-l-cyan-400" : ""
                    }`}
                  >
                    <td className="py-2 px-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleMonitored(asset.id);
                        }}
                        className="text-gray-500 hover:text-amber-400"
                      >
                        <Star
                          className={`h-3.5 w-3.5 ${
                            isWatched ? "fill-amber-400 text-amber-400" : ""
                          }`}
                        />
                      </button>
                    </td>
                    <td className="py-2 px-2 font-medium text-white">
                      <div>{asset.name}</div>
                      <div className="text-[10px] text-gray-500">{asset.operator ?? "Independent"}</div>
                    </td>
                    <td className="py-2 px-2 text-gray-400">{asset.region}</td>
                    <td className="py-2 px-2">
                      <span className="rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[10px] text-gray-300">
                        {asset.primaryFuel ?? asset.tech}
                      </span>
                    </td>
                    <td className="py-2 px-2 font-mono text-gray-200">
                      {asset.baseOutputNumeric ?? asset.capacity} {asset.capacityUnit ?? ""}
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-gray-800">
                          <div
                            style={{ width: `${util}%` }}
                            className={`h-full rounded-full ${
                              util > 92 ? "bg-amber-400" : util > 75 ? "bg-emerald-400" : "bg-rose-400"
                            }`}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-gray-400">{util}%</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectAsset(asset)}
                        className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] font-medium transition ${
                          isSelected
                            ? "border-cyan-400/50 bg-cyan-400/20 text-cyan-300"
                            : "border-white/10 bg-white/5 text-gray-300 hover:border-cyan-400/40 hover:text-cyan-300"
                        }`}
                      >
                        <Sliders className="h-3 w-3" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
