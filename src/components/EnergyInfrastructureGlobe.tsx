"use client";

// Shared energy-infrastructure globe (OpenGrid-style). One Canvas, instancing
// only, filterable plant queries, centralized colors via energyLayers.ts.
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { Pause, Play, RotateCcw } from "lucide-react";
import EarthSphere from "@/app/components/energy/GlobeLayers/EarthSphere";
import BoundaryLines from "@/app/components/energy/GlobeLayers/BoundaryLines";
import PlantsInstancedLayer from "@/app/components/energy/GlobeLayers/PlantsInstancedLayer";
import ArcsLayer from "@/app/components/energy/GlobeLayers/ArcsLayer";
import PointsLayer from "@/app/components/energy/GlobeLayers/PointsLayer";
import LayerLegend from "@/app/components/energy/GlobeLayers/LayerLegend";
import { FUEL_COLORS, STATUS_COLORS, type FuelType } from "@/config/energyLayers";
import { verifyCoordinateMath } from "@/lib/globe/coordinates";
import type {
  GlobeArc,
  GlobePoint,
  GlobePointSet,
  GlobePolyline,
  PlantClickInfo,
  PlantLayerQuery,
} from "@/app/components/energy/GlobeLayers/types";

export type {
  GlobeArc,
  GlobePoint,
  GlobePointSet,
  GlobePolyline,
  PlantClickInfo,
  PlantLayerQuery,
};

export interface EnergyInfrastructureGlobeProps {
  /** false hides the plants layer; object = /api/map/power-plants query */
  plants?: PlantLayerQuery | false;
  boundaries?: boolean; // default true
  arcs?: GlobeArc[];
  polylines?: GlobePolyline[];
  pointSets?: GlobePointSet[];
  height?: string; // default "560px"
  autoRotate?: boolean; // default false
  legend?: boolean; // default true
  sizeScale?: number; // bubble-size multiplier
  /** override the plant-layer marker opacity (0–1); default 0.7 */
  plantOpacity?: number;
  onPlantClick?: (p: PlantClickInfo) => void;
  /** fires when a route/flow arc is clicked on the globe */
  onArcClick?: (a: GlobeArc) => void;
  /** fires when a point (vessel, event, node) is clicked on the globe */
  onPointClick?: (p: GlobePoint, set: GlobePointSet) => void;
  /** shows a pulsing LIVE badge (top-right) */
  live?: boolean;
  /** timestamp of the last data refresh — rendered as "updated Xs ago" */
  updatedAt?: string | number | Date | null;
}

const DEFAULT_PLANT_FUELS: FuelType[] = [
  "Coal",
  "Gas",
  "Oil",
  "Nuclear",
  "Hydro",
  "Wind",
  "Solar",
];

export default function EnergyInfrastructureGlobe({
  plants,
  boundaries = true,
  arcs = [],
  polylines = [],
  pointSets = [],
  height = "560px",
  autoRotate = true,
  legend = true,
  sizeScale = 1,
  plantOpacity,
  onPlantClick,
  onArcClick,
  onPointClick,
  live = false,
  updatedAt = null,
}: EnergyInfrastructureGlobeProps) {
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<PlantClickInfo | null>(null);
  const [hoverTip, setHoverTip] = useState<{
    plant: PlantClickInfo;
    x: number;
    y: number;
  } | null>(null);
  // Shared hover tooltip for arcs + point sets (label-driven, no plant data)
  const [metaTip, setMetaTip] = useState<{
    title: string;
    subtitle?: string;
    color: string;
    x: number;
    y: number;
  } | null>(null);
  const [interacting, setInteracting] = useState(false);
  const [paused, setPaused] = useState(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  // Ticking clock for the LIVE badge ("updated Xs ago")
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, [live]);

  const updatedAgo = useMemo(() => {
    if (!updatedAt) return null;
    const t = new Date(updatedAt).getTime();
    if (Number.isNaN(t)) return null;
    const s = Math.max(0, Math.round((now - t) / 1000));
    if (s < 5) return "just now";
    if (s < 60) return `${s}s ago`;
    const m = Math.round(s / 60);
    if (m < 60) return `${m}m ago`;
    return `${Math.round(m / 60)}h ago`;
  }, [updatedAt, now]);

  // Spec §17 dev verification (runs once)
  useEffect(() => {
    if (process.env.NODE_ENV === "development") verifyCoordinateMath();
  }, []);

  const legendFuels = useMemo(() => {
    if (plants === false) return undefined;
    if (plants?.fuels?.length) return plants.fuels;
    return DEFAULT_PLANT_FUELS;
  }, [plants]);

  const handlePlantClick = (p: PlantClickInfo) => {
    setSelected(p);
    onPlantClick?.(p);
  };

  const handleArcHover = (a: GlobeArc | null, pos?: { x: number; y: number }) => {
    if (!a || !pos) {
      setMetaTip(null);
      return;
    }
    setHoverTip(null);
    setMetaTip({
      title: a.label ?? a.id,
      subtitle: "Route / flow — click to inspect",
      color: a.color ?? "#f59e0b",
      x: pos.x,
      y: pos.y,
    });
  };

  const handlePointHover = (
    p: GlobePoint | null,
    set?: GlobePointSet,
    pos?: { x: number; y: number },
  ) => {
    if (!p || !pos) {
      setMetaTip(null);
      return;
    }
    setHoverTip(null);
    setMetaTip({
      title: p.title ?? p.id,
      subtitle: set?.label,
      color: set?.color ?? "#f59e0b",
      x: pos.x,
      y: pos.y,
    });
  };

  const plantQuery = plants === false ? undefined : (plants ?? {});

  // Viewport → container-relative tooltip coordinates (shared by all tooltips)
  const activeTipPos = hoverTip
    ? { x: hoverTip.x, y: hoverTip.y }
    : metaTip
      ? { x: metaTip.x, y: metaTip.y }
      : null;
  const rect = activeTipPos
    ? containerRef.current?.getBoundingClientRect()
    : null;
  const tipPos =
    activeTipPos && rect
      ? {
          left: Math.min(
            Math.max(activeTipPos.x - rect.left + 12, 8),
            rect.width - 240,
          ),
          top: Math.max(activeTipPos.y - rect.top - 64, 8),
        }
      : null;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#04060c]"
      style={{ height }}
    >
      <Canvas
        camera={{ position: [0, 0.5, 5.2], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
        // Tight world-unit pick thresholds so thin arcs + small points are
        // hoverable without hijacking the whole scene (defaults are 1.0).
        raycaster={{
          params: {
            Line: { threshold: 0.05 },
            Points: { threshold: 0.06 },
          } as never,
        }}
        onCreated={() => setReady(true)}
      >
        <color attach="background" args={["#04060c"]} />
        <Suspense fallback={null}>
          <Stars radius={80} depth={40} count={2500} factor={3} fade speed={0.4} />
          <EarthSphere />
          {boundaries && <BoundaryLines />}
          {plantQuery && (
            <PlantsInstancedLayer
              query={plantQuery}
              onPlantClick={handlePlantClick}
              onPlantHover={(p, pos) => {
                setMetaTip(null);
                setHoverTip(p && pos ? { plant: p, x: pos.x, y: pos.y } : null);
              }}
              sizeScale={sizeScale}
              opacity={plantOpacity}
            />
          )}
          <ArcsLayer
            arcs={arcs}
            polylines={polylines}
            onArcHover={handleArcHover}
            onArcClick={onArcClick}
          />
          <PointsLayer
            sets={pointSets}
            onPointHover={handlePointHover}
            onPointClick={onPointClick}
          />
        </Suspense>
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          minDistance={2.7}
          maxDistance={8.5}
          dampingFactor={0.08}
          enableDamping
          autoRotate={autoRotate && !interacting && !paused}
          autoRotateSpeed={0.3}
          onStart={() => {
            if (resumeTimer.current) clearTimeout(resumeTimer.current);
            setInteracting(true);
          }}
          onEnd={() => {
            if (resumeTimer.current) clearTimeout(resumeTimer.current);
            resumeTimer.current = setTimeout(() => setInteracting(false), 1500);
          }}
        />
      </Canvas>

      {!ready && (
        <div className="absolute inset-0 z-10 flex items-center justify-center gap-3 bg-[#04060c] text-sm text-gray-400">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
          Loading globe…
        </div>
      )}

      {legend && (
        <LayerLegend
          fuels={legendFuels}
          pointSets={pointSets}
          hasBoundaries={boundaries}
          hasArcs={arcs.length > 0 || polylines.length > 0}
        />
      )}

      {live && (
        <div className="pointer-events-none absolute right-3 top-3 z-10 flex items-center gap-2 rounded-full border border-emerald-400/30 bg-black/70 px-2.5 py-1 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
            Live
          </span>
          {updatedAgo && (
            <span className="text-[10px] text-gray-400">{updatedAgo}</span>
          )}
        </div>
      )}

      {/* Viewer controls — pause/resume rotation, reset camera */}
      <div className="absolute bottom-3 right-3 z-10 flex gap-1.5">
        <button
          onClick={() => setPaused((p) => !p)}
          className="rounded-lg border border-white/10 bg-black/60 p-1.5 text-gray-300 backdrop-blur-md transition-colors hover:border-white/25 hover:text-white"
          title={paused ? "Resume rotation" : "Pause rotation"}
          aria-label={paused ? "Resume rotation" : "Pause rotation"}
        >
          {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={() => controlsRef.current?.reset()}
          className="rounded-lg border border-white/10 bg-black/60 p-1.5 text-gray-300 backdrop-blur-md transition-colors hover:border-white/25 hover:text-white"
          title="Reset view"
          aria-label="Reset view"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {hoverTip && tipPos && !selected && (
        <div
          className="pointer-events-none absolute z-20 max-w-[220px] rounded-lg border border-white/15 bg-black/85 px-3 py-2 backdrop-blur-md"
          style={{ left: tipPos.left, top: tipPos.top }}
        >
          <div className="truncate text-xs font-bold text-white">
            {hoverTip.plant.name}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{
                backgroundColor: FUEL_COLORS[hoverTip.plant.fuel],
              }}
            />
            {hoverTip.plant.fuel}
            {hoverTip.plant.capacityMW != null && (
              <span>• {hoverTip.plant.capacityMW.toLocaleString()} MW</span>
            )}
          </div>
        </div>
      )}

      {!hoverTip && metaTip && tipPos && !selected && (
        <div
          className="pointer-events-none absolute z-20 max-w-[220px] rounded-lg border border-white/15 bg-black/85 px-3 py-2 backdrop-blur-md"
          style={{ left: tipPos.left, top: tipPos.top }}
        >
          <div className="truncate text-xs font-bold text-white">
            {metaTip.title}
          </div>
          {metaTip.subtitle && (
            <div className="flex items-center gap-2 text-[10px] text-gray-400">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: metaTip.color }}
              />
              {metaTip.subtitle}
            </div>
          )}
        </div>
      )}

      {selected && (
        <div className="absolute bottom-4 left-4 z-10 w-72 max-w-full rounded-xl border border-white/10 bg-black/85 p-4 backdrop-blur-xl">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500">
                {selected.country}
              </div>
              <div className="font-bold text-white">{selected.name}</div>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-gray-500 hover:text-white"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1 text-xs text-gray-300">
            <div className="flex justify-between">
              <span className="text-gray-500">Fuel:</span>
              <span
                className="flex items-center gap-1.5"
                style={{ color: FUEL_COLORS[selected.fuel] }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: FUEL_COLORS[selected.fuel] }}
                />
                {selected.fuel}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Capacity:</span>
              <span>
                {selected.capacityMW != null
                  ? `${selected.capacityMW.toLocaleString(undefined, { maximumFractionDigits: 1 })} MW`
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status:</span>
              <span style={{ color: STATUS_COLORS[selected.status] }}>
                {selected.status}
              </span>
            </div>
            {selected.owner && (
              <div className="flex justify-between">
                <span className="text-gray-500">Owner:</span>
                <span className="max-w-[65%] truncate text-right">
                  {selected.owner}
                </span>
              </div>
            )}
            {selected.year != null && (
              <div className="flex justify-between">
                <span className="text-gray-500">Commissioned:</span>
                <span>{selected.year}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Source:</span>
              <span>{selected.source}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
