// Server-only data source for the /api/map/* endpoints.
// MVP: in-memory GeoJSON filter. PostGIS (Neon) replaces queryPowerPlants()
// internals later WITHOUT changing the API contract.
import { readFileSync } from "fs";
import path from "path";
import {
  FUEL_TYPES,
  MAP_API,
  PLANT_STATUSES,
  type FuelType,
  type PlantStatus,
} from "@/config/energyLayers";

export interface PlantProperties {
  id: string;
  name: string;
  fuel: FuelType;
  fuelRaw: string;
  status: PlantStatus;
  statusRaw: string;
  capacityMW: number | null;
  owner: string | null;
  country: string;
  year: number | null;
  source: string;
}

export interface PointFeature {
  type: "Feature";
  properties: PlantProperties;
  geometry: { type: "Point"; coordinates: [number, number] };
}

export interface FeatureCollection<F> {
  type: "FeatureCollection";
  metadata?: Record<string, unknown>;
  features: F[];
}

type PlantFC = FeatureCollection<PointFeature>;
type BoundaryFC = FeatureCollection<{
  type: "Feature";
  properties: Record<string, string>;
  geometry: unknown;
}>;

// Module-level cache that survives Next.js dev HMR (mirrors lib/prisma.ts)
const g = globalThis as unknown as {
  __powerPlants?: PlantFC;
  __boundaries?: BoundaryFC;
};

function loadJson<T>(file: string): T {
  return JSON.parse(
    readFileSync(path.join(process.cwd(), "src", "data", "map", file), "utf8"),
  ) as T;
}

export function getPowerPlants(): PlantFC {
  if (!g.__powerPlants) g.__powerPlants = loadJson<PlantFC>("power-plants.geojson");
  return g.__powerPlants;
}

export function getBoundaries(): BoundaryFC {
  if (!g.__boundaries) g.__boundaries = loadJson<BoundaryFC>("countries.geojson");
  return g.__boundaries;
}

export interface PlantQuery {
  bbox?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  fuels?: FuelType[];
  statuses?: PlantStatus[];
  minMW?: number;
  limit?: number;
}

export function queryPowerPlants(q: PlantQuery): PlantFC {
  const fc = getPowerPlants();
  const fuels = q.fuels?.length ? new Set(q.fuels) : null;
  const statuses = q.statuses?.length ? new Set(q.statuses) : null;
  const minMW = q.minMW ?? 0;
  const limit = Math.min(q.limit ?? MAP_API.plantsDefaultLimit, MAP_API.plantsMaxLimit);
  const bbox = q.bbox;
  const crossesAntimeridian = bbox ? bbox[0] > bbox[2] : false;

  const out: PointFeature[] = [];
  for (const f of fc.features) {
    const p = f.properties;
    if (fuels && !fuels.has(p.fuel)) continue;
    if (statuses && !statuses.has(p.status)) continue;
    if (minMW > 0 && (p.capacityMW ?? 0) < minMW) continue;
    if (bbox) {
      const [lng, lat] = f.geometry.coordinates;
      if (lat < bbox[1] || lat > bbox[3]) continue;
      const inLng = crossesAntimeridian
        ? lng >= bbox[0] || lng <= bbox[2]
        : lng >= bbox[0] && lng <= bbox[2];
      if (!inLng) continue;
    }
    out.push(f);
    if (out.length >= limit) break;
  }

  return {
    type: "FeatureCollection",
    metadata: { ...fc.metadata, count: out.length, limit },
    features: out,
  };
}

const VALID_FUELS = new Set<string>(FUEL_TYPES);
const VALID_STATUSES = new Set<string>(PLANT_STATUSES);

export function parsePlantQueryParams(sp: URLSearchParams): PlantQuery {
  const q: PlantQuery = {};
  const bboxRaw = sp.get("bbox");
  if (bboxRaw) {
    const parts = bboxRaw.split(",").map(Number);
    if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
      q.bbox = parts as [number, number, number, number];
    }
  }
  const fuelsRaw = sp.get("fuels");
  if (fuelsRaw) {
    q.fuels = fuelsRaw.split(",").filter((f) => VALID_FUELS.has(f)) as FuelType[];
  }
  const statusRaw = sp.get("status");
  if (statusRaw) {
    q.statuses = statusRaw
      .split(",")
      .filter((s) => VALID_STATUSES.has(s)) as PlantStatus[];
  }
  const minMW = Number(sp.get("minMW"));
  if (Number.isFinite(minMW) && minMW > 0) q.minMW = minMW;
  const limit = Number(sp.get("limit"));
  if (Number.isFinite(limit) && limit > 0) q.limit = limit;
  return q;
}
