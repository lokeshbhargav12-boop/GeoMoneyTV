// Legend overlay for the energy globe. ALL colors come from
// src/config/energyLayers.ts via props — nothing hardcoded here.
import Link from "next/link";
import { FUEL_COLORS, FUEL_LABELS, type FuelType } from "@/config/energyLayers";
import type { GlobePointSet } from "./types";

interface Props {
  fuels?: FuelType[];
  pointSets?: GlobePointSet[];
  hasBoundaries?: boolean;
  hasArcs?: boolean;
}

export default function LayerLegend({ fuels, pointSets, hasBoundaries, hasArcs }: Props) {
  return (
    <div className="pointer-events-auto absolute left-3 top-3 z-10 max-w-[220px] rounded-xl border border-white/10 bg-black/60 p-3 backdrop-blur-md">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
        Layers
      </div>
      <div className="space-y-1">
        {fuels?.map((f) => (
          <div key={f} className="flex items-center gap-2 text-xs text-gray-300">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: FUEL_COLORS[f] }}
            />
            {FUEL_LABELS[f]}
          </div>
        ))}
        {pointSets?.filter((s) => s.points.length > 0).map((s) => (
          <div key={s.id} className="flex items-center gap-2 text-xs text-gray-300">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            {s.label}
          </div>
        ))}
        {hasBoundaries && (
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <span className="h-px w-3 bg-slate-300" />
            Country borders
          </div>
        )}
        {hasArcs && (
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <span className="h-2.5 w-2.5 rounded-full border border-amber-400/60" />
            Routes / flows
          </div>
        )}
      </div>
      <Link
        href="/attribution"
        className="mt-2 block text-[10px] text-gray-500 underline-offset-2 hover:text-gray-300 hover:underline"
      >
        Data sources & licenses
      </Link>
    </div>
  );
}
