// ─── GeoMoney energy-layer config — SINGLE SOURCE OF TRUTH (spec §37) ───────
// All colors, thresholds, sizes and dataset licensing live here.
// Globe layers, API routes, filters and the /attribution page import from
// this file only. If a number matters, it is here.

// ── Globe geometry ──────────────────────────────────────────────────────────
export const GLOBE_RADIUS = 2;
export const GLOBE_POINT_ALTITUDE = 0.02;
export const GLOBE_BOUNDARY_ALTITUDE = 0.004;
export const GLOBE_ARC_BASE_LIFT = 0.02;
export const GLOBE_ARC_LIFT_PER_RAD = 0.35;

// ── Canonical fuel vocabulary (13 fuels) ────────────────────────────────────
export const FUEL_TYPES = [
  "Coal",
  "Gas",
  "Oil",
  "Nuclear",
  "Hydro",
  "Wind",
  "Solar",
  "Geothermal",
  "Biomass",
  "Waste",
  "Tidal",
  "Hydrogen",
  "Other",
] as const;
export type FuelType = (typeof FUEL_TYPES)[number];

export const FUEL_COLORS: Record<FuelType, string> = {
  Coal: "#a8a29e",
  Gas: "#f97316",
  Oil: "#eab308",
  Nuclear: "#c084fc",
  Hydro: "#38bdf8",
  Wind: "#10b981",
  Solar: "#fde047",
  Geothermal: "#ef4444",
  Biomass: "#a3e635",
  Waste: "#9ca3af",
  Tidal: "#2dd4bf",
  Hydrogen: "#f472b6",
  Other: "#64748b",
};

export const FUEL_LABELS: Record<FuelType, string> = {
  Coal: "Coal",
  Gas: "Gas",
  Oil: "Oil",
  Nuclear: "Nuclear",
  Hydro: "Hydro",
  Wind: "Wind",
  Solar: "Solar",
  Geothermal: "Geothermal",
  Biomass: "Biomass",
  Waste: "Waste",
  Tidal: "Tidal",
  Hydrogen: "Hydrogen",
  Other: "Other / Storage",
};

// Raw dataset fuel strings → canonical (WRI GPPD primary_fuel + GEM subsector)
export const FUEL_RAW_MAP: Record<string, FuelType> = {
  coal: "Coal",
  petcoke: "Oil",
  gas: "Gas",
  "natural gas": "Gas",
  oil: "Oil",
  nuclear: "Nuclear",
  hydro: "Hydro",
  wind: "Wind",
  solar: "Solar",
  biomass: "Biomass",
  waste: "Waste",
  geothermal: "Geothermal",
  cogeneration: "Biomass",
  "wave and tidal": "Tidal",
  tidal: "Tidal",
  storage: "Other",
  other: "Other",
  "": "Other",
};

// ── Plant status vocabulary ─────────────────────────────────────────────────
export const PLANT_STATUSES = [
  "operating",
  "construction",
  "announced",
  "pre-construction",
  "mothballed",
  "retired",
  "cancelled",
] as const;
export type PlantStatus = (typeof PLANT_STATUSES)[number];

export const STATUS_COLORS: Record<PlantStatus, string> = {
  operating: "#22c55e",
  construction: "#f97316",
  announced: "#eab308",
  "pre-construction": "#facc15",
  mothballed: "#94a3b8",
  retired: "#ef4444",
  cancelled: "#dc2626",
};

export const STATUS_LABELS: Record<PlantStatus, string> = {
  operating: "Operating",
  construction: "Construction",
  announced: "Announced",
  "pre-construction": "Pre-construction",
  mothballed: "Mothballed",
  retired: "Retired",
  cancelled: "Cancelled",
};

export const STATUS_RAW_MAP: Record<string, PlantStatus> = {
  operating: "operating",
  cancelled: "cancelled",
  retired: "retired",
  construction: "construction",
  announced: "announced",
  planned: "announced",
  "not announced": "announced",
  "pre construction": "pre-construction",
  "pre-construction": "pre-construction",
  "planned converted": "pre-construction",
  shelved: "mothballed",
  mothballed: "mothballed",
  decommissioned: "retired",
};

// ── Logarithmic marker sizing (spec: never linear radius) ───────────────────
export const PLANT_SIZING = {
  referenceMW: 50,
  baseRadius: 0.014, // globe units for a reference-size plant
  minRadius: 0.006,
  maxRadius: 0.11,
} as const;

export function plantRadiusMW(
  capacityMW: number | null | undefined,
  sizeScale = 1,
): number {
  const mw = Math.max(capacityMW ?? 1, 1);
  const r =
    PLANT_SIZING.baseRadius *
    Math.log2(1 + mw / PLANT_SIZING.referenceMW) *
    sizeScale;
  return Math.min(Math.max(r, PLANT_SIZING.minRadius), PLANT_SIZING.maxRadius);
}

// ── Capacity heat ramp (colour-code single-fuel rings, e.g. the coal desk) ──
// When a plant layer is filtered to one fuel (coal), every ring would share the
// flat FUEL_COLORS[coal] grey and look monotonous. Instead the
// PlantsInstancedLayer can colour each ring by capacity on this thermal ramp:
// dim ember → glowing amber → hot red. Stops are in MW and interpolation is
// log10-spaced to mirror the logarithmic marker sizing (capacity spans several
// orders of magnitude, so a linear ramp would crush everything into one hue).
export const PLANT_CAPACITY_STOPS = [
  { mw: 50, color: "#57534e" }, // dim ember (small plants)
  { mw: 200, color: "#a8a29e" }, // base coal grey
  { mw: 600, color: "#f59e0b" }, // amber — warming up
  { mw: 1500, color: "#ea580c" }, // orange — hot
  { mw: 4000, color: "#dc2626" }, // red — intense / very large
] as const;

function _hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

const _CAP_STOPS_LOG = PLANT_CAPACITY_STOPS.map((s) => ({
  log: Math.log10(s.mw),
  rgb: _hexToRgb(s.color),
}));

/** Capacity-based ring colour for single-fuel plant layers (returns #rrggbb). */
export function plantColorByCapacity(
  capacityMW: number | null | undefined,
): string {
  const mw = Math.max(capacityMW ?? 0, 0);
  const first = PLANT_CAPACITY_STOPS[0];
  const last = PLANT_CAPACITY_STOPS[PLANT_CAPACITY_STOPS.length - 1];
  if (mw <= first.mw) return first.color;
  if (mw >= last.mw) return last.color;
  const lm = Math.log10(mw);
  for (let i = 0; i < _CAP_STOPS_LOG.length - 1; i++) {
    const a = _CAP_STOPS_LOG[i];
    const b = _CAP_STOPS_LOG[i + 1];
    if (lm >= a.log && lm <= b.log) {
      const t = (lm - a.log) / (b.log - a.log || 1);
      const r = Math.round(a.rgb.r + (b.rgb.r - a.rgb.r) * t);
      const g = Math.round(a.rgb.g + (b.rgb.g - a.rgb.g) * t);
      const bl = Math.round(a.rgb.b + (b.rgb.b - a.rgb.b) * t);
      return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bl.toString(16).padStart(2, "0")}`;
    }
  }
  return last.color;
}

// ── Level-of-detail thresholds (spec §33 step 2) ────────────────────────────
export const LOD = {
  globalMinCapacityMW: 50, // hide below 50 MW in global view
  globalMinVoltageKV: 345, // hide below 345 kV in global view (lines phase)
  globalCameraDistance: 4.6, // camera distance ≥ this → global LOD applies
  bboxDebounceMs: 400,
} as const;

// ── API contract (identical when PostGIS replaces the in-memory filter) ─────
export const MAP_API = {
  plantsDefaultLimit: 5000,
  plantsMaxLimit: 20000,
  plantsCache: "public, max-age=300, stale-while-revalidate=3600",
  boundariesCache: "public, max-age=86400, stale-while-revalidate=604800",
} as const;

// ── Voltage classes (future transmission-line renderer) ─────────────────────
export const VOLTAGE_CLASSES = [
  { maxKV: 110, color: "#a8a29e", widthPx: 1 },
  { maxKV: 220, color: "#f59e0b", widthPx: 1.2 },
  { maxKV: 345, color: "#fb7185", widthPx: 1.6 },
  { maxKV: 500, color: "#c084fc", widthPx: 2 },
  { maxKV: Infinity, color: "#38bdf8", widthPx: 2.4 },
] as const;

// ── Fossil desk region filter → bbox [minLng, minLat, maxLng, maxLat] ───────
export const REGION_BBOX: Record<string, [number, number, number, number]> = {
  "North America": [-170, 5, -30, 83],
  Europe: [-25, 34, 45, 72],
  "Asia-Pacific": [30, -45, 170, 75],
  "Middle East": [12, 12, 75, 42],
};

// ── Dataset licensing registry (spec §38 — attribution is mandatory) ────────
export interface AttributionEntry {
  key: string;
  dataset: string;
  provider: string;
  license: string;
  url: string;
  note?: string;
  status: "active" | "planned";
}

export const DATA_ATTRIBUTION: AttributionEntry[] = [
  {
    key: "wri-gppd",
    dataset: "Global Power Plant Database v1.3.0",
    provider: "World Resources Institute (WRI)",
    license: "CC BY 4.0",
    url: "http://datasets.wri.org/dataset/globalpowerplantdatabase",
    note: "~35k plants. No status column — all plants shown as operating.",
    status: "active",
  },
  {
    key: "natural-earth",
    dataset: "Cultural admin-0 country boundaries (50m, simplified)",
    provider: "Natural Earth via nvkelso/natural-earth-vector",
    license: "Public Domain",
    url: "https://www.naturalearthdata.com/",
    status: "active",
  },
  {
    key: "gem",
    dataset: "Global Power Plant Database / trackers",
    provider: "Global Energy Monitor (GEM)",
    license: "Per-release terms — verify before publishing",
    url: "https://globalenergymonitor.org/",
    note: "Planned as the authoritative source (dedup priority GEM > EIA > WRI); download is gated behind a release form.",
    status: "planned",
  },
  {
    key: "osm",
    dataset: "Power lines & substations",
    provider: "OpenStreetMap contributors (Overpass API)",
    license: "ODbL 1.0",
    url: "https://www.openstreetmap.org/copyright",
    status: "planned",
  },
  {
    key: "hifld",
    dataset: "US transmission & generation cross-check",
    provider: "Homeland Infrastructure Foundation-Level Data (US DHS/DOE)",
    license: "US Gov public domain — verify per dataset",
    url: "https://hifld-geoplatform.hub.arcgis.com/",
    status: "planned",
  },
  {
    key: "peeringdb",
    dataset: "Internet exchange (IX) endpoints",
    provider: "PeeringDB",
    license: "Open API with attribution",
    url: "https://www.peeringdb.com/",
    status: "planned",
  },
  {
    key: "electricity-maps",
    dataset: "Live carbon-intensity zones",
    provider: "Electricity Maps",
    license: "Commercial API terms — key stays server-side",
    url: "https://www.electricitymaps.com/",
    status: "planned",
  },
  {
    key: "gigawattmap",
    dataset: "Subsea cable reference",
    provider: "GigawattMap",
    license: "Non-commercial use only",
    url: "https://gigawattmap.com/",
    status: "planned",
  },
];
