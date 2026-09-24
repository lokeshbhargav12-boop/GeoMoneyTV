"use client";

import { useMemo, useState } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  Compass,
  Radio,
} from "lucide-react";
import type {
  ClimateEventLite,
  OsintEventLite,
} from "@/lib/energy-infrastructure-service";

interface ThreatCalamityRadarProps {
  climateEvents: ClimateEventLite[];
  osintEvents: OsintEventLite[];
  onFocusCoordinates?: (lat: number, lng: number) => void;
}

export default function ThreatCalamityRadar({
  climateEvents,
  osintEvents,
  onFocusCoordinates,
}: ThreatCalamityRadarProps) {
  const [filterType, setFilterType] = useState<"all" | "climate" | "osint">("all");

  const combinedThreats = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      kind: "climate" | "osint";
      category: string;
      severity: number;
      region: string;
      lat?: number;
      lng?: number;
      timestamp: string;
    }> = [];

    if (filterType === "all" || filterType === "climate") {
      for (const c of climateEvents) {
        list.push({
          id: c.id,
          title: c.title,
          kind: "climate",
          category: c.type.toUpperCase(),
          severity: c.severity,
          region: c.region,
          lat: c.lat,
          lng: c.lng,
          timestamp: c.timestamp,
        });
      }
    }

    if (filterType === "all" || filterType === "osint") {
      for (const o of osintEvents) {
        list.push({
          id: o.id,
          title: o.title,
          kind: "osint",
          category: o.category.toUpperCase(),
          severity: o.threatScore,
          region: o.region,
          timestamp: o.timestamp,
        });
      }
    }

    return list.sort((a, b) => b.severity - a.severity);
  }, [climateEvents, osintEvents, filterType]);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-gray-100">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-rose-400 animate-pulse" />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-200">
              Natural Calamities & Geopolitical Threat Radar
            </h3>
            <p className="text-xs text-gray-400">
              Active weather events, storms, heat domes, droughts, and OSINT conflict alerts intersecting energy corridors.
            </p>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
              filterType === "all"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "bg-white/5 text-gray-400 border border-white/10 hover:text-white"
            }`}
          >
            All ({climateEvents.length + osintEvents.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("climate")}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
              filterType === "climate"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "bg-white/5 text-gray-400 border border-white/10 hover:text-white"
            }`}
          >
            Disasters ({climateEvents.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("osint")}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
              filterType === "osint"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "bg-white/5 text-gray-400 border border-white/10 hover:text-white"
            }`}
          >
            OSINT ({osintEvents.length})
          </button>
        </div>
      </div>

      {/* Threat List */}
      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        {combinedThreats.length === 0 ? (
          <p className="col-span-2 py-6 text-center text-xs text-gray-500">
            No active threat anomalies currently flagged.
          </p>
        ) : (
          combinedThreats.map((threat) => {
            const isHigh = threat.severity >= 80;
            const isMedium = threat.severity >= 65 && threat.severity < 80;

            return (
              <div
                key={threat.id}
                className="flex flex-col justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3 transition hover:border-white/15"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                          threat.kind === "climate"
                            ? "bg-cyan-500/20 text-cyan-300"
                            : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {threat.category}
                      </span>
                      <span className="text-[10px] text-gray-400">{threat.region}</span>
                    </div>

                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isHigh
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : isMedium
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-gray-800 text-gray-300"
                      }`}
                    >
                      Risk {threat.severity}
                    </span>
                  </div>

                  <p className="mt-2 text-xs font-semibold text-gray-100 leading-snug">
                    {threat.title}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-[10px] text-gray-500">
                  <span>
                    {threat.lat != null && threat.lng != null
                      ? `${threat.lat.toFixed(1)}°, ${threat.lng.toFixed(1)}°`
                      : "Corridor Wide"}
                  </span>

                  {threat.lat != null && threat.lng != null && onFocusCoordinates && (
                    <button
                      type="button"
                      onClick={() => onFocusCoordinates(threat.lat!, threat.lng!)}
                      className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200 transition"
                    >
                      <Compass className="h-3 w-3" />
                      Show on Map
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
