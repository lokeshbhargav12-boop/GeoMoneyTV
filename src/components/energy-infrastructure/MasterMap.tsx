"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import {
  Globe,
  Layers,
  LayoutGrid,
  Radio,
  Building2,
  ToggleLeft,
} from "lucide-react";
import type {
  FlowRoute,
  GridStressNode,
  InfraLayer,
  MapAsset,
  MapCorridor,
  MapEvent,
  MapOverlay,
  MapShip,
} from "@/components/EnergyInfrastructureMap";
import type {
  GlobeArc,
  GlobePointSet,
  GlobePolyline,
} from "@/components/EnergyInfrastructureGlobe";

const EnergyInfrastructureMap = dynamic(
  () => import("@/components/EnergyInfrastructureMap"),
  { ssr: false },
);

const EnergyInfrastructureGlobe = dynamic(
  () => import("@/components/EnergyInfrastructureGlobe"),
  { ssr: false },
);

export type MapViewMode = "2d" | "3d";
export type DataLayerKey =
  | "globalInfrastructure"
  | "liveAssetTracking"
  | "regionalHubs";

interface DataLayerOption {
  id: DataLayerKey;
  label: string;
  description: string;
  accent: string;
}

const DATASET_OPTIONS: DataLayerOption[] = [
  {
    id: "globalInfrastructure",
    label: "Global Infrastructure",
    description: "Assets + corridors",
    accent: "text-cyan-300",
  },
  {
    id: "liveAssetTracking",
    label: "Live Asset Tracking",
    description: "Stress + ships + events",
    accent: "text-amber-300",
  },
  {
    id: "regionalHubs",
    label: "Regional Hubs",
    description: "Trade flows",
    accent: "text-rose-300",
  },
];

const MAP_LAYER_OPTIONS: { id: InfraLayer; label: string }[] = [
  { id: "all", label: "All layers" },
  { id: "extraction", label: "Extraction" },
  { id: "processing", label: "Processing" },
  { id: "transport", label: "Transport" },
  { id: "storage", label: "Storage" },
  { id: "distribution", label: "Distribution" },
  { id: "control", label: "Control" },
];

interface MasterMapProps {
  mapView: MapViewMode;
  onMapViewChange: (mode: MapViewMode) => void;
  activeLayer: InfraLayer;
  onActiveLayerChange: (layer: InfraLayer) => void;
  dataLayerState: Record<DataLayerKey, boolean>;
  onToggleDataLayer: (layer: DataLayerKey) => void;
  assets: MapAsset[];
  corridors: MapCorridor[];
  flows: FlowRoute[];
  gridStress: GridStressNode[];
  climateEvents: MapEvent[];
  osintEvents: MapEvent[];
  ships: MapShip[];
  updatedAt?: string | null;
}

export default function MasterMap({
  mapView,
  onMapViewChange,
  activeLayer,
  onActiveLayerChange,
  dataLayerState,
  onToggleDataLayer,
  assets,
  corridors,
  flows,
  gridStress,
  climateEvents,
  osintEvents,
  ships,
  updatedAt,
}: MasterMapProps) {
  const overlays = useMemo(() => {
    const next: MapOverlay[] = [];
    if (dataLayerState.globalInfrastructure) {
      next.push("assets", "corridors");
    }
    if (dataLayerState.liveAssetTracking) {
      next.push("grid-stress", "ships", "climate", "osint");
    }
    if (dataLayerState.regionalHubs) {
      next.push("flows");
    }
    return next;
  }, [dataLayerState]);

  const globePolylines = useMemo<GlobePolyline[]>(() => {
    if (!dataLayerState.globalInfrastructure) return [];
    return corridors.slice(0, 14).map((corridor) => ({
      id: corridor.id,
      label: corridor.name,
      path: corridor.path,
      color:
        corridor.kind === "shipping"
          ? "#22d3ee"
          : corridor.kind === "pipeline"
            ? "#f59e0b"
            : corridor.kind === "transmission"
              ? "#38bdf8"
              : "#a3a3a3",
      subdued:
        corridor.status === "Permitting" || corridor.status === "Restricted",
    }));
  }, [corridors, dataLayerState.globalInfrastructure]);

  const globeArcs = useMemo<GlobeArc[]>(() => {
    if (!dataLayerState.regionalHubs) return [];
    return flows.map((flow) => ({
      id: flow.id,
      label: `${flow.label} · ${flow.volume}`,
      from: flow.origin,
      to: flow.destination,
      color: flow.color,
    }));
  }, [flows, dataLayerState.regionalHubs]);

  const globePointSets = useMemo<GlobePointSet[]>(() => {
    const sets: GlobePointSet[] = [];

    if (dataLayerState.globalInfrastructure) {
      sets.push({
        id: "infra-assets",
        label: "Infrastructure nodes",
        color: "#22d3ee",
        size: 0.028,
        points: assets.slice(0, 80).map((asset) => ({
          id: asset.id,
          title: asset.name,
          lat: asset.lat,
          lng: asset.lng,
        })),
      });
    }

    if (dataLayerState.liveAssetTracking) {
      sets.push({
        id: "grid-stress",
        label: "Grid stress",
        color: "#f59e0b",
        size: 0.032,
        pulse: true,
        points: gridStress.map((node) => ({
          id: node.id,
          title: `${node.name} (${node.alert})`,
          lat: node.lat,
          lng: node.lng,
        })),
      });

      sets.push({
        id: "climate-events",
        label: "Climate / OSINT",
        color: "#fb7185",
        size: 0.026,
        pulse: true,
        points: [...climateEvents, ...osintEvents].slice(0, 36).map((event) => ({
          id: event.id,
          title: event.title,
          lat: event.lat,
          lng: event.lng,
        })),
      });

      sets.push({
        id: "ships",
        label: "Vessel positions",
        color: "#38bdf8",
        size: 0.022,
        points: ships.slice(0, 90).map((ship) => ({
          id: ship.mmsi,
          title: ship.name || ship.type,
          lat: ship.latitude,
          lng: ship.longitude,
        })),
      });
    }

    return sets;
  }, [
    assets,
    climateEvents,
    dataLayerState.globalInfrastructure,
    dataLayerState.liveAssetTracking,
    gridStress,
    osintEvents,
    ships,
  ]);

  const summary = {
    assets: dataLayerState.globalInfrastructure ? assets.length : 0,
    corridors: dataLayerState.globalInfrastructure ? corridors.length : 0,
    flows: dataLayerState.regionalHubs ? flows.length : 0,
    liveSignals: dataLayerState.liveAssetTracking
      ? climateEvents.length + osintEvents.length + gridStress.length
      : 0,
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 xl:grid-cols-[220px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-cyan-300">
            <Layers className="h-3.5 w-3.5" /> Layers
          </div>
          <div className="space-y-2">
            {MAP_LAYER_OPTIONS.map((option) => {
              const active = option.id === activeLayer;
              return (
                <button
                  key={option.id}
                  onClick={() => onActiveLayerChange(option.id)}
                  className={`w-full rounded-lg border px-2 py-1.5 text-left text-xs transition ${
                    active
                      ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-100"
                      : "border-white/10 bg-white/5 text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-cyan-300">
              <LayoutGrid className="h-3.5 w-3.5" /> Unified master map
            </div>
            <div className="inline-flex rounded-lg border border-white/10 bg-black/60 p-1">
              <button
                onClick={() => onMapViewChange("2d")}
                className={`rounded-md px-2 py-1 text-xs transition ${
                  mapView === "2d"
                    ? "bg-cyan-500/20 text-cyan-200"
                    : "text-gray-400"
                }`}
              >
                2D Map
              </button>
              <button
                onClick={() => onMapViewChange("3d")}
                className={`rounded-md px-2 py-1 text-xs transition ${
                  mapView === "3d"
                    ? "bg-cyan-500/20 text-cyan-200"
                    : "text-gray-400"
                }`}
              >
                3D Globe
              </button>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {DATASET_OPTIONS.map((option) => {
              const active = dataLayerState[option.id];
              return (
                <button
                  key={option.id}
                  onClick={() => onToggleDataLayer(option.id)}
                  className={`rounded-lg border p-2 text-left transition ${
                    active
                      ? "border-cyan-500/40 bg-cyan-500/10"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-medium ${option.accent}`}>
                      {option.label}
                    </p>
                    <ToggleLeft
                      className={`h-4 w-4 ${
                        active ? "rotate-180 text-cyan-300" : "text-gray-500"
                      }`}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">{option.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="relative">
        {mapView === "2d" ? (
          <EnergyInfrastructureMap
            activeLayer={activeLayer}
            overlays={overlays}
            assets={assets}
            corridors={corridors}
            climate={climateEvents}
            osint={osintEvents}
            ships={ships}
            flows={flows}
            gridStress={gridStress}
            height="620px"
          />
        ) : (
          <EnergyInfrastructureGlobe
            plants={false}
            polylines={globePolylines}
            arcs={globeArcs}
            pointSets={globePointSets}
            height="620px"
            live={true}
            updatedAt={updatedAt ?? null}
          />
        )}

        <div className="pointer-events-none absolute left-4 top-4 z-[800]">
          <div className="rounded-xl border border-white/10 bg-black/80 p-3 backdrop-blur-md">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Snapshot
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-gray-500">Assets</p>
                <p className="font-semibold text-gray-100">{summary.assets}</p>
              </div>
              <div>
                <p className="text-gray-500">Corridors</p>
                <p className="font-semibold text-gray-100">{summary.corridors}</p>
              </div>
              <div>
                <p className="text-gray-500">Trade flows</p>
                <p className="font-semibold text-gray-100">{summary.flows}</p>
              </div>
              <div>
                <p className="text-gray-500">Live signals</p>
                <p className="font-semibold text-amber-300">{summary.liveSignals}</p>
              </div>
            </div>
            {updatedAt && (
              <p className="mt-2 text-[10px] text-gray-500">
                Updated {new Date(updatedAt).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-4 right-4 z-[800] rounded-lg border border-white/10 bg-black/80 px-3 py-1.5 text-[11px] text-gray-300">
          <span className="inline-flex items-center gap-1">
            {mapView === "2d" ? (
              <LayoutGrid className="h-3.5 w-3.5 text-cyan-300" />
            ) : (
              <Globe className="h-3.5 w-3.5 text-cyan-300" />
            )}
            {mapView === "2d" ? "2D map" : "3D globe"}
          </span>
          <span className="mx-2 text-gray-600">•</span>
          <span className="inline-flex items-center gap-1 text-emerald-300">
            <Radio className="h-3.5 w-3.5" />
            Live
          </span>
          <span className="mx-2 text-gray-600">•</span>
          <span className="inline-flex items-center gap-1 text-amber-300">
            <Building2 className="h-3.5 w-3.5" />
            Unified
          </span>
        </div>
      </div>
    </div>
  );
}
