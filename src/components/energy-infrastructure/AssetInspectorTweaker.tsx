"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Building2,
  Check,
  ChevronRight,
  Flame,
  Gauge,
  Info,
  Radio,
  RefreshCw,
  Sliders,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
  Wind,
  Zap,
} from "lucide-react";
import type {
  ClimateEventLite,
  LiveCommodity,
  OsintEventLite,
} from "@/lib/energy-infrastructure-service";
import type { MapAsset } from "@/components/energy-infrastructure/infraDefaults";

// Great-circle distance calculation in km
function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export interface AssetInspectorTweakerProps {
  asset: MapAsset;
  climateEvents: ClimateEventLite[];
  osintEvents: OsintEventLite[];
  commodities: LiveCommodity[];
  isMonitored: boolean;
  onToggleMonitored: (assetId: string) => void;
  userNotes: string;
  onSaveNotes: (assetId: string, notes: string) => void;
  onClose?: () => void;
}

export default function AssetInspectorTweaker({
  asset,
  climateEvents,
  osintEvents,
  commodities,
  isMonitored,
  onToggleMonitored,
  userNotes,
  onSaveNotes,
  onClose,
}: AssetInspectorTweakerProps) {
  // Tweaker capacity slider: 100% = normal operating, 0% = total outage, 115% = surge
  const [capacitySlider, setCapacitySlider] = useState<number>(100);
  const [notes, setNotes] = useState<string>(userNotes);
  const [savedNotesMessage, setSavedNotesMessage] = useState<boolean>(false);

  const baseOutput = asset.baseOutputNumeric ?? 1.0;
  const unit = asset.capacityUnit ?? "GW";
  const benchmarkSymbol = asset.macroExposure?.benchmarkSymbol ?? "CRUDE";

  const liveBenchmark = useMemo(() => {
    return (
      commodities.find(
        (c) => c.symbol.toUpperCase() === benchmarkSymbol.toUpperCase(),
      ) ?? {
        symbol: benchmarkSymbol,
        label: benchmarkSymbol,
        price: benchmarkSymbol === "CRUDE" ? 78.40 : benchmarkSymbol === "NATGAS" ? 2.48 : 100,
        change: 0.5,
        changePercent: 0.64,
        marketStatus: "OPEN",
        lastTradingTimestamp: new Date().toISOString(),
      }
    );
  }, [commodities, benchmarkSymbol]);

  // Nearby threats: calculate distance from this asset
  const nearbyThreats = useMemo(() => {
    const threats: Array<{
      id: string;
      title: string;
      type: "climate" | "osint";
      distKm: number;
      severity: number;
      label: string;
    }> = [];

    for (const c of climateEvents) {
      const dist = calculateDistanceKm(asset.lat, asset.lng, c.lat, c.lng);
      if (dist <= 1500) {
        threats.push({
          id: c.id,
          title: c.title,
          type: "climate",
          distKm: dist,
          severity: c.severity,
          label: c.type.toUpperCase(),
        });
      }
    }

    for (const o of osintEvents) {
      threats.push({
        id: o.id,
        title: o.title,
        type: "osint",
        distKm: 780,
        severity: o.threatScore,
        label: o.category.toUpperCase(),
      });
    }

    return threats.sort((a, b) => a.distKm - b.distKm).slice(0, 4);
  }, [asset.lat, asset.lng, climateEvents, osintEvents]);

  // Real-time calculation of tweak impact
  const tweakedOutput = Number(((baseOutput * capacitySlider) / 100).toFixed(2));
  const volumeDelta = Number((baseOutput - tweakedOutput).toFixed(2));
  const outagePct = 100 - capacitySlider;

  const priceImpactPct = useMemo(() => {
    if (outagePct === 0) return 0;
    const sensitivity = asset.macroExposure?.priceSensitivityPerOutagePct ?? 0.8;
    const globalShare = asset.macroExposure?.globalSharePct ?? 1.5;
    return Number((((outagePct / 100) * globalShare * sensitivity * 10)).toFixed(2));
  }, [outagePct, asset.macroExposure]);

  const projectedPrice = Number(
    (liveBenchmark.price * (1 + priceImpactPct / 100)).toFixed(2),
  );

  const handleApplyPreset = (sliderValue: number) => {
    setCapacitySlider(sliderValue);
  };

  const handleNotesSave = () => {
    onSaveNotes(asset.id, notes);
    setSavedNotesMessage(true);
    setTimeout(() => setSavedNotesMessage(false), 2000);
  };

  return (
    <article className="rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-gray-900/95 via-gray-950/90 to-black p-4 text-gray-100 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
              {asset.layer}
            </span>
            <span className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
              {asset.primaryFuel ?? asset.tech}
            </span>
            <span className="text-[11px] text-gray-400">{asset.region}</span>
          </div>
          <h2 className="mt-1 text-lg font-bold text-white tracking-tight sm:text-xl">
            {asset.name}
          </h2>
          <p className="text-xs text-gray-400">
            Operator: <span className="text-gray-200">{asset.operator ?? "Independent"}</span> • Coords: {asset.lat.toFixed(2)}°, {asset.lng.toFixed(2)}°
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onToggleMonitored(asset.id)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
              isMonitored
                ? "border-amber-400/50 bg-amber-400/15 text-amber-300"
                : "border-white/15 bg-white/5 text-gray-300 hover:border-amber-400/40 hover:text-amber-200"
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${isMonitored ? "fill-amber-400 text-amber-400" : ""}`} />
            {isMonitored ? "Monitored" : "Watch"}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-gray-400 transition hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Output & Utilization Telemetry */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-black/40 p-2.5">
          <p className="text-[10px] uppercase tracking-wider text-gray-400">Nameplate Cap</p>
          <p className="mt-1 text-base font-bold text-gray-100">
            {asset.nameplateCapacityNumeric ?? asset.capacity} {unit}
          </p>
          <p className="text-[10px] text-gray-500">Engineering limit</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/40 p-2.5">
          <p className="text-[10px] uppercase tracking-wider text-gray-400">Current Output</p>
          <p className={`mt-1 text-base font-bold ${capacitySlider < 80 ? "text-amber-400" : "text-emerald-400"}`}>
            {tweakedOutput} {unit}
          </p>
          <p className="text-[10px] text-gray-500">
            {capacitySlider !== 100 ? `${capacitySlider}% simulated` : `${asset.utilizationPercent ?? 92}% operating`}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/40 p-2.5">
          <p className="text-[10px] uppercase tracking-wider text-gray-400">Global Share</p>
          <p className="mt-1 text-base font-bold text-cyan-300">
            {asset.macroExposure?.globalSharePct ?? 1.8}%
          </p>
          <p className="text-[10px] text-gray-500">Of {benchmarkSymbol} supply</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/40 p-2.5">
          <p className="text-[10px] uppercase tracking-wider text-gray-400">Inflation Risk</p>
          <p className="mt-1 text-base font-bold text-amber-400">
            {asset.macroExposure?.inflationRisk ?? "Moderate"}
          </p>
          <p className="text-[10px] text-gray-500">CPI pass-through</p>
        </div>
      </div>

      {/* 7-Day Output History Mini-Sparkline */}
      <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-gray-200">7-Day Output Stability Profile</span>
          <span className="text-[11px] text-gray-400">Avg: {baseOutput} {unit}</span>
        </div>
        <div className="mt-2 flex items-end justify-between gap-1.5 h-10 pt-1">
          {(asset.outputHistory7d ?? [baseOutput * 0.95, baseOutput * 0.98, baseOutput * 0.96, baseOutput * 0.99, baseOutput * 0.97, baseOutput * 1.01, baseOutput]).map((val, idx) => {
            const heightPct = Math.min(100, Math.max(20, Math.round((val / (baseOutput * 1.05)) * 100)));
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full rounded-sm transition-all duration-300 ${
                    idx === 6
                      ? capacitySlider < 100
                        ? "bg-amber-400"
                        : "bg-cyan-400"
                      : "bg-white/20 group-hover:bg-white/40"
                  }`}
                />
                <span className="text-[9px] text-gray-500">D-{6 - idx}</span>
              </div>
            );
          })}
        </div>
      </div>
      {/* Situation Outage & Curtailment Tweaker */}
      <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-amber-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-300">
              Interactive Outage & Stress Tweaker
            </h3>
          </div>
          <button
            type="button"
            onClick={() => handleApplyPreset(100)}
            className="text-[10px] text-gray-400 hover:text-white underline transition"
          >
            Reset 100%
          </button>
        </div>

        <div className="mt-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-300">Operating Output:</span>
            <span className={`font-mono font-bold ${capacitySlider < 50 ? "text-rose-400" : capacitySlider < 85 ? "text-amber-300" : "text-emerald-400"}`}>
              {capacitySlider}% ({tweakedOutput} {unit})
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="120"
            step="5"
            value={capacitySlider}
            onChange={(e) => setCapacitySlider(Number(e.target.value))}
            className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-800 accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>0% (Blackout)</span>
            <span>50% (Trip)</span>
            <span>100% (Normal)</span>
            <span>120% (Surge)</span>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleApplyPreset(15)}
            className="rounded border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-300 hover:bg-rose-500/20"
          >
            🌀 Cat-4 Storm (-85%)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset(0)}
            className="rounded border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-300 hover:bg-rose-500/20"
          >
            🚧 Chokepoint Cut (0%)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset(60)}
            className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-300 hover:bg-amber-500/20"
          >
            ⚡ Heatwave (-40%)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset(25)}
            className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-300 hover:bg-amber-500/20"
          >
            🛡️ Embargo (-75%)
          </button>
        </div>

        {/* Ripple Calculation */}
        {capacitySlider !== 100 && (
          <div className="mt-2.5 rounded-lg border border-white/10 bg-black/70 p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
              Live Projected Ripple Effect
            </p>
            <div className="mt-1.5 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400">Net Offline:</span>
                <p className="font-mono font-bold text-rose-400">-{volumeDelta} {unit}</p>
              </div>
              <div>
                <span className="text-gray-400">{benchmarkSymbol} Price Shift:</span>
                <p className={`font-mono font-bold ${priceImpactPct > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                  {priceImpactPct > 0 ? `+${priceImpactPct}%` : `${priceImpactPct}%`} (${projectedPrice})
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Threat Radar Scanner */}
      <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-rose-400 animate-pulse" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-200">
              Proximity Threat Radar
            </h3>
          </div>
          <span className="text-[10px] text-gray-500">1500km perimeter</span>
        </div>

        <div className="mt-2 space-y-1.5">
          {nearbyThreats.length === 0 ? (
            <p className="text-xs text-gray-500">No active storm or conflict anomalies within 1500km.</p>
          ) : (
            nearbyThreats.map((t) => (
              <div
                key={t.id}
                className="flex items-start justify-between gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-2 text-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`rounded px-1.5 py-0.2 text-[9px] uppercase font-bold ${
                        t.type === "climate" ? "bg-cyan-500/20 text-cyan-300" : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {t.label}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      ~{t.distKm} km away
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] font-medium text-gray-200 leading-tight">
                    {t.title}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    t.severity >= 80
                      ? "bg-rose-500/20 text-rose-400"
                      : "bg-amber-500/20 text-amber-300"
                  }`}
                >
                  {t.severity}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Analyst Notes */}
      <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-gray-200">Analyst Monitoring Notes</span>
          {savedNotesMessage && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
              <Check className="h-3 w-3" /> Saved to storage
            </span>
          )}
        </div>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add operational notes, maintenance schedules, or hedging alerts for this asset..."
          className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 p-2 text-xs text-gray-200 placeholder-gray-600 focus:border-cyan-500/50 focus:outline-none"
        />
        <div className="mt-1.5 flex justify-end">
          <button
            type="button"
            onClick={handleNotesSave}
            className="rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-gray-300 hover:text-white"
          >
            Save Notes
          </button>
        </div>
      </div>
    </article>
  );
}
