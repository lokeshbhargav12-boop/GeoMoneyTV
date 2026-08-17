"use client";

// Shared energy-infrastructure globe (OpenGrid-style). One Canvas, instancing
// only, filterable plant queries, centralized colors via energyLayers.ts.
import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
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
  GlobePointSet,
  GlobePolyline,
  PlantClickInfo,
  PlantLayerQuery,
} from "@/app/components/energy/GlobeLayers/types";

export type {
  GlobeArc,
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
  onPlantClick?: (p: PlantClickInfo) => void;
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
  autoRotate = false,
  legend = true,
  sizeScale = 1,
  onPlantClick,
}: EnergyInfrastructureGlobeProps) {
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<PlantClickInfo | null>(null);

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

  const plantQuery = plants === false ? undefined : (plants ?? {});

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#04060c]"
      style={{ height }}
    >
      <Canvas
        camera={{ position: [0, 0.5, 5.2], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
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
              sizeScale={sizeScale}
            />
          )}
          <ArcsLayer arcs={arcs} polylines={polylines} />
          <PointsLayer sets={pointSets} />
        </Suspense>
        <OrbitControls
          enablePan={false}
          minDistance={2.7}
          maxDistance={8.5}
          dampingFactor={0.08}
          enableDamping
          autoRotate={autoRotate}
          autoRotateSpeed={0.25}
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
