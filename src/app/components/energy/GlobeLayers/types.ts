// Shared prop types for the energy globe layer stack.
import type { FuelType, PlantStatus } from "@/config/energyLayers";

export interface GlobeArc {
  id: string;
  label?: string;
  from: [number, number]; // [lat, lng]
  to: [number, number]; // [lat, lng]
  color?: string;
  dashed?: boolean;
  highlight?: boolean;
}

export interface GlobePolyline {
  id: string;
  label?: string;
  color: string;
  path: [number, number][]; // [lat, lng][]
  /** rendered at reduced opacity (planned/permitting corridors) */
  subdued?: boolean;
}

export interface GlobePoint {
  id: string;
  title?: string;
  lat: number;
  lng: number;
}

export interface GlobePointSet {
  id: string;
  label: string;
  color: string;
  size?: number; // world units (default 0.03)
  opacity?: number;
  /** renders an animated halo ring that pulses (events, alerts) */
  pulse?: boolean;
  points: GlobePoint[];
}

export interface PlantLayerQuery {
  fuels?: FuelType[];
  statuses?: PlantStatus[];
  minMW?: number;
  bbox?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  limit?: number;
}

export interface PlantClickInfo {
  id: string;
  name: string;
  fuel: FuelType;
  status: PlantStatus;
  capacityMW: number | null;
  owner: string | null;
  country: string;
  year: number | null;
  source: string;
}
