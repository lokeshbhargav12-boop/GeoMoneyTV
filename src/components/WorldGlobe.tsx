"use client";

import { useRef, useMemo, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Sphere, Line, Html, Stars } from "@react-three/drei";
import * as THREE from "three";

// ─── TYPES ───────────────────────────────────────────────────
export interface GlobeEvent {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  category: string;
  threatScore?: number;
  source: string;
  sourceDetail?: string;
  timestamp: string;
  locations: Array<{ name: string; lat: number; lng: number; region: string }>;
  region: string;
  link?: string;
  url?: string;
  engagement?: { upvotes: number; comments: number };
}

export interface AircraftData {
  icao24: string;
  callsign: string;
  origin_country: string;
  longitude: number;
  latitude: number;
  altitude: number;
  velocity: number;
  heading: number;
  vertical_rate: number;
  category: string;
  trail?: Array<{
    latitude: number;
    longitude: number;
    altitude: number;
    heading: number;
    velocity: number;
    timestamp: number;
  }>;
}

export interface ShipData {
  mmsi: string;
  name: string;
  imo?: string;
  callsign?: string;
  type: string;
  flag: string;
  flagEmoji: string;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  destination: string;
  length: number;
  status?: "underway" | "anchored" | "moored" | "stopped" | "unknown";
  live?: boolean;
  source?: string;
  lastUpdate?: number;
  zone?: string;
  lastPort?: string;
  owner?: string;
  manager?: string;
  built?: number;
  beam?: number;
  deadweight?: number;
  trail?: Array<{
    latitude: number;
    longitude: number;
    heading: number;
    speed: number;
    timestamp: number;
  }>;
}

type ShipTypeFilter =
  | "tanker"
  | "container"
  | "lng"
  | "military"
  | "bulk"
  | "cargo"
  | "cruise"
  | "fishing"
  | "other"
  | "stalled";

type EventCategoryFilter =
  | "military"
  | "energy"
  | "geopolitical"
  | "economic"
  | "cyber"
  | "climate"
  | "supply_chain";

type InfrastructureType = "refinery" | "lng_terminal" | "storage";
type ClimateOverlayType = "heat" | "drought" | "storm";
type RouteGroup = "energy" | "trade" | "strategic";

interface InfrastructureSite {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: InfrastructureType;
  region: string;
  detail: string;
}

interface ClimateHotspot {
  id: string;
  label: string;
  lat: number;
  lng: number;
  type: ClimateOverlayType;
  severity: number;
  detail: string;
}

interface MaritimeRoute {
  id: string;
  name: string;
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  color: string;
  group: RouteGroup;
}

interface GlobeLayerState {
  groups: {
    events: boolean;
    ships: boolean;
    aircraft: boolean;
    infrastructure: boolean;
    climate: boolean;
    routes: boolean;
    chokepoints: boolean;
    satellites: boolean;
    cityLights: boolean;
  };
  shipTypes: Record<ShipTypeFilter, boolean>;
  eventCategories: Record<EventCategoryFilter, boolean>;
  infrastructureTypes: Record<InfrastructureType, boolean>;
  climateTypes: Record<ClimateOverlayType, boolean>;
  routeGroups: Record<RouteGroup, boolean>;
}

export interface GlobeFocusTarget {
  key: string;
  lat: number;
  lng: number;
  distance?: number;
  targetDepth?: number;
}

interface GlobeProps {
  events: GlobeEvent[];
  onEventClick?: (event: GlobeEvent) => void;
  onAircraftClick?: (aircraft: AircraftData) => void;
  onShipClick?: (ship: ShipData) => void;
  selectedEvent?: GlobeEvent | null;
  aircraft?: AircraftData[];
  ships?: ShipData[];
  focusTarget?: GlobeFocusTarget | null;
  onZoomChange?: (zoom: number) => void;
  layerState?: GlobeLayerState;
}

// ─── CONSTANTS ───────────────────────────────────────────────
const GLOBE_RADIUS = 2;
const POINT_ALTITUDE = 0.02;

// Multiple CDN sources for texture reliability
const EARTH_DAY_URLS = [
  "/earth-blue-marble.jpg",
  "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
  "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg",
  "https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-blue-marble.jpg",
];
const EARTH_NIGHT_URLS = [
  "/earth-night.jpg",
  "https://unpkg.com/three-globe/example/img/earth-night.jpg",
  "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg",
  "https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-night.jpg",
];

// Helper: try loading texture from multiple URLs
function loadTextureWithFallback(
  urls: string[],
  onSuccess: (tex: THREE.Texture) => void,
  index = 0,
): void {
  if (index >= urls.length) {
    console.warn("[WorldGlobe] All texture URLs failed");
    return;
  }
  const loader = new THREE.TextureLoader();
  loader.crossOrigin = "anonymous";
  loader.load(
    urls[index],
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;
      console.log(`[WorldGlobe] Texture loaded from: ${urls[index]}`);
      onSuccess(texture);
    },
    undefined,
    () => {
      console.warn(`[WorldGlobe] Failed: ${urls[index]}, trying next...`);
      loadTextureWithFallback(urls, onSuccess, index + 1);
    },
  );
}

// ─── CHOKEPOINTS ─────────────────────────────────────────────
const CHOKEPOINTS = [
  { name: "Strait of Hormuz", lat: 26.5, lng: 56.2, type: "energy" },
  { name: "Strait of Malacca", lat: 2.5, lng: 101.5, type: "trade" },
  { name: "Suez Canal", lat: 30.4, lng: 32.3, type: "trade" },
  { name: "Panama Canal", lat: 9.0, lng: -79.6, type: "trade" },
  { name: "Bab el-Mandeb", lat: 12.5, lng: 43.3, type: "energy" },
  { name: "Bosporus Strait", lat: 41.1, lng: 29.0, type: "trade" },
  { name: "GIUK Gap", lat: 63.0, lng: -15.0, type: "military" },
  { name: "Taiwan Strait", lat: 24.0, lng: 119.5, type: "military" },
  { name: "Cape of Good Hope", lat: -34.3, lng: 18.4, type: "trade" },
  { name: "Danish Straits", lat: 55.7, lng: 11.0, type: "trade" },
];

// ─── SHIPPING ROUTES ─────────────────────────────────────────
const SHIPPING_ROUTES = [
  // Asia → Europe (Suez)
  {
    from: { lat: 31.2, lng: 121.4 },
    to: { lat: 1.3, lng: 103.8 },
    color: "#D4AF37",
  },
  {
    from: { lat: 1.3, lng: 103.8 },
    to: { lat: 12.5, lng: 43.3 },
    color: "#D4AF37",
  },
  {
    from: { lat: 12.5, lng: 43.3 },
    to: { lat: 30.4, lng: 32.3 },
    color: "#D4AF37",
  },
  {
    from: { lat: 30.4, lng: 32.3 },
    to: { lat: 37.0, lng: 15.0 },
    color: "#D4AF37",
  },
  {
    from: { lat: 37.0, lng: 15.0 },
    to: { lat: 51.5, lng: -0.1 },
    color: "#D4AF37",
  },
  // Trans-Pacific
  {
    from: { lat: 31.2, lng: 121.4 },
    to: { lat: 35.6, lng: 139.6 },
    color: "#3B82F6",
  },
  {
    from: { lat: 35.6, lng: 139.6 },
    to: { lat: 37.7, lng: -122.4 },
    color: "#3B82F6",
  },
  {
    from: { lat: 37.7, lng: -122.4 },
    to: { lat: 9.0, lng: -79.6 },
    color: "#3B82F6",
  },
  // Persian Gulf → Asia
  {
    from: { lat: 26.5, lng: 56.2 },
    to: { lat: 20.5, lng: 78.9 },
    color: "#EF4444",
  },
  {
    from: { lat: 26.5, lng: 56.2 },
    to: { lat: 35.8, lng: 104.1 },
    color: "#EF4444",
  },
  // Africa → Europe (minerals)
  {
    from: { lat: -4.0, lng: 21.7 },
    to: { lat: -34.3, lng: 18.4 },
    color: "#8B5CF6",
  },
  {
    from: { lat: -34.3, lng: 18.4 },
    to: { lat: 51.5, lng: -0.1 },
    color: "#8B5CF6",
  },
  // Trans-Atlantic
  {
    from: { lat: 40.7, lng: -74.0 },
    to: { lat: 51.5, lng: -0.1 },
    color: "#10B981",
  },
  {
    from: { lat: 29.7, lng: -95.3 },
    to: { lat: -14.2, lng: -51.9 },
    color: "#10B981",
  },
  // Northern Sea Route
  {
    from: { lat: 59.9, lng: 30.3 },
    to: { lat: 72.0, lng: 50.0 },
    color: "#06B6D4",
  },
  {
    from: { lat: 72.0, lng: 50.0 },
    to: { lat: 72.0, lng: 130.0 },
    color: "#06B6D4",
  },
  {
    from: { lat: 72.0, lng: 130.0 },
    to: { lat: 35.6, lng: 139.6 },
    color: "#06B6D4",
  },
  // Middle East → India
  {
    from: { lat: 25.2, lng: 55.3 },
    to: { lat: 19.0, lng: 72.8 },
    color: "#F97316",
  },
  // Australia → China
  {
    from: { lat: -33.8, lng: 151.2 },
    to: { lat: 31.2, lng: 121.4 },
    color: "#F59E0B",
  },
  // West Africa → Americas
  {
    from: { lat: 6.4, lng: 3.4 },
    to: { lat: 29.7, lng: -95.3 },
    color: "#8B5CF6",
  },
];

const MARITIME_ROUTES: MaritimeRoute[] = [
  {
    id: "hormuz-india",
    name: "Hormuz to West India",
    from: { lat: 26.5, lng: 56.2 },
    to: { lat: 19.0, lng: 72.8 },
    color: "#EF4444",
    group: "energy",
  },
  {
    id: "fujairah-singapore",
    name: "Fujairah to Singapore",
    from: { lat: 25.2, lng: 56.3 },
    to: { lat: 1.3, lng: 103.8 },
    color: "#F97316",
    group: "energy",
  },
  {
    id: "suez-rotterdam",
    name: "Suez to Rotterdam",
    from: { lat: 30.4, lng: 32.3 },
    to: { lat: 51.9, lng: 4.5 },
    color: "#D4AF37",
    group: "trade",
  },
  {
    id: "malacca-shanghai",
    name: "Malacca to Shanghai",
    from: { lat: 2.5, lng: 101.5 },
    to: { lat: 31.2, lng: 121.4 },
    color: "#3B82F6",
    group: "trade",
  },
  {
    id: "red-sea-med",
    name: "Bab el-Mandeb to Mediterranean",
    from: { lat: 12.5, lng: 43.3 },
    to: { lat: 37.0, lng: 15.0 },
    color: "#F59E0B",
    group: "energy",
  },
  {
    id: "giuk-atlantic",
    name: "GIUK Gap patrol lane",
    from: { lat: 63.0, lng: -15.0 },
    to: { lat: 51.5, lng: -0.1 },
    color: "#8B5CF6",
    group: "strategic",
  },
  {
    id: "taiwan-japan",
    name: "Taiwan Strait to Okinawa",
    from: { lat: 24.0, lng: 119.5 },
    to: { lat: 26.2, lng: 127.7 },
    color: "#EC4899",
    group: "strategic",
  },
  {
    id: "cape-brazil",
    name: "Cape to Santos",
    from: { lat: -34.3, lng: 18.4 },
    to: { lat: -23.9, lng: -46.3 },
    color: "#10B981",
    group: "trade",
  },
];

// ─── FLIGHT ROUTES ───────────────────────────────────────────
const FLIGHT_ROUTES = [
  // Transatlantic
  {
    from: { lat: 40.7, lng: -74.0 },
    to: { lat: 51.5, lng: -0.1 },
    speed: 0.08,
    color: "#00FFFF",
  },
  {
    from: { lat: 40.7, lng: -74.0 },
    to: { lat: 48.8, lng: 2.3 },
    speed: 0.075,
    color: "#00FFFF",
  },
  {
    from: { lat: 33.9, lng: -118.4 },
    to: { lat: 51.5, lng: -0.1 },
    speed: 0.06,
    color: "#00FFFF",
  },
  // Trans-Pacific
  {
    from: { lat: 37.7, lng: -122.4 },
    to: { lat: 35.6, lng: 139.6 },
    speed: 0.05,
    color: "#00E5FF",
  },
  {
    from: { lat: 33.9, lng: -118.4 },
    to: { lat: 31.2, lng: 121.4 },
    speed: 0.045,
    color: "#00E5FF",
  },
  // Asia-Middle East
  {
    from: { lat: 25.2, lng: 55.3 },
    to: { lat: 19.0, lng: 72.8 },
    speed: 0.09,
    color: "#00BFFF",
  },
  {
    from: { lat: 25.2, lng: 55.3 },
    to: { lat: 51.5, lng: -0.1 },
    speed: 0.07,
    color: "#00BFFF",
  },
  // Intra-Asia
  {
    from: { lat: 1.3, lng: 103.8 },
    to: { lat: 35.6, lng: 139.6 },
    speed: 0.085,
    color: "#00E5FF",
  },
  {
    from: { lat: 22.3, lng: 114.1 },
    to: { lat: -33.8, lng: 151.2 },
    speed: 0.06,
    color: "#00E5FF",
  },
  // Americas
  {
    from: { lat: 40.7, lng: -74.0 },
    to: { lat: -23.5, lng: -46.6 },
    speed: 0.065,
    color: "#00FFFF",
  },
  {
    from: { lat: 40.7, lng: -74.0 },
    to: { lat: 19.4, lng: -99.1 },
    speed: 0.1,
    color: "#00FFFF",
  },
  // Europe-Asia
  {
    from: { lat: 51.5, lng: -0.1 },
    to: { lat: 31.2, lng: 121.4 },
    speed: 0.05,
    color: "#00BFFF",
  },
  // Africa
  {
    from: { lat: 51.5, lng: -0.1 },
    to: { lat: -33.9, lng: 18.4 },
    speed: 0.055,
    color: "#00BFFF",
  },
  {
    from: { lat: 25.2, lng: 55.3 },
    to: { lat: -1.3, lng: 36.8 },
    speed: 0.08,
    color: "#00BFFF",
  },
  // Russia corridor
  {
    from: { lat: 55.7, lng: 37.6 },
    to: { lat: 35.6, lng: 139.6 },
    speed: 0.04,
    color: "#00E5FF",
  },
];

// ─── SATELLITE ORBITS ────────────────────────────────────────
const SATELLITE_ORBITS = [
  { inclination: 0.4, speed: 0.12, offset: 0, altitude: 0.5, color: "#FFD700" },
  { inclination: 0.8, speed: 0.08, offset: 2, altitude: 0.6, color: "#FFD700" },
  {
    inclination: 1.2,
    speed: 0.06,
    offset: 4,
    altitude: 0.45,
    color: "#FFD700",
  },
  {
    inclination: 0.2,
    speed: 0.15,
    offset: 1,
    altitude: 0.55,
    color: "#00FF88",
  },
  { inclination: 0.6, speed: 0.1, offset: 3, altitude: 0.5, color: "#00FF88" },
  {
    inclination: 1.0,
    speed: 0.07,
    offset: 5,
    altitude: 0.65,
    color: "#FF6B6B",
  },
  { inclination: 0.0, speed: 0.04, offset: 0, altitude: 0.8, color: "#FF6B6B" },
  {
    inclination: 1.4,
    speed: 0.09,
    offset: 2.5,
    altitude: 0.5,
    color: "#FFD700",
  },
];

// ─── CITY LIGHTS DATA (major world cities) ───────────────────
const CITY_LIGHTS = [
  // North America
  { lat: 40.7, lng: -74.0, s: 1.0 },
  { lat: 34.0, lng: -118.2, s: 0.9 },
  { lat: 41.8, lng: -87.6, s: 0.8 },
  { lat: 29.7, lng: -95.3, s: 0.8 },
  { lat: 33.4, lng: -112.0, s: 0.6 },
  { lat: 39.9, lng: -75.1, s: 0.7 },
  { lat: 37.7, lng: -122.4, s: 0.8 },
  { lat: 47.6, lng: -122.3, s: 0.6 },
  { lat: 25.7, lng: -80.1, s: 0.7 },
  { lat: 42.3, lng: -83.0, s: 0.6 },
  { lat: 38.9, lng: -77.0, s: 0.7 },
  { lat: 32.7, lng: -96.7, s: 0.7 },
  { lat: 39.7, lng: -104.9, s: 0.5 },
  { lat: 36.1, lng: -115.1, s: 0.5 },
  { lat: 45.5, lng: -73.5, s: 0.5 },
  { lat: 43.6, lng: -79.3, s: 0.6 },
  { lat: 49.2, lng: -123.1, s: 0.5 },
  { lat: 19.4, lng: -99.1, s: 0.9 },
  { lat: 20.6, lng: -87.0, s: 0.3 },
  { lat: 10.0, lng: -84.0, s: 0.3 },
  // Europe
  { lat: 51.5, lng: -0.1, s: 1.0 },
  { lat: 48.8, lng: 2.3, s: 0.9 },
  { lat: 52.5, lng: 13.4, s: 0.8 },
  { lat: 41.3, lng: 2.1, s: 0.7 },
  { lat: 41.9, lng: 12.4, s: 0.7 },
  { lat: 40.4, lng: -3.7, s: 0.7 },
  { lat: 52.3, lng: 4.8, s: 0.6 },
  { lat: 59.3, lng: 18.0, s: 0.5 },
  { lat: 55.7, lng: 12.5, s: 0.5 },
  { lat: 60.1, lng: 24.9, s: 0.4 },
  { lat: 48.2, lng: 16.3, s: 0.5 },
  { lat: 50.8, lng: 4.3, s: 0.5 },
  { lat: 53.3, lng: -6.2, s: 0.4 },
  { lat: 46.2, lng: 6.1, s: 0.5 },
  { lat: 38.7, lng: -9.1, s: 0.5 },
  { lat: 47.3, lng: 8.5, s: 0.5 },
  { lat: 50.0, lng: 14.4, s: 0.5 },
  { lat: 52.2, lng: 21.0, s: 0.5 },
  { lat: 44.4, lng: 26.1, s: 0.4 },
  { lat: 37.9, lng: 23.7, s: 0.5 },
  { lat: 45.4, lng: 9.2, s: 0.5 },
  { lat: 48.1, lng: 11.5, s: 0.5 },
  { lat: 53.5, lng: 9.9, s: 0.4 },
  { lat: 51.2, lng: 6.7, s: 0.4 },
  { lat: 43.3, lng: 5.3, s: 0.4 },
  // Asia
  { lat: 35.6, lng: 139.6, s: 1.0 },
  { lat: 31.2, lng: 121.4, s: 1.0 },
  { lat: 39.9, lng: 116.4, s: 1.0 },
  { lat: 22.3, lng: 114.1, s: 0.9 },
  { lat: 1.3, lng: 103.8, s: 0.8 },
  { lat: 37.5, lng: 126.9, s: 0.9 },
  { lat: 13.7, lng: 100.5, s: 0.7 },
  { lat: 19.0, lng: 72.8, s: 0.9 },
  { lat: 28.6, lng: 77.2, s: 0.9 },
  { lat: 23.0, lng: 113.1, s: 0.8 },
  { lat: 22.5, lng: 88.3, s: 0.7 },
  { lat: 24.8, lng: 67.0, s: 0.6 },
  { lat: 14.5, lng: 121.0, s: 0.7 },
  { lat: -6.2, lng: 106.8, s: 0.8 },
  { lat: 3.1, lng: 101.6, s: 0.7 },
  { lat: 16.8, lng: 96.1, s: 0.5 },
  { lat: 21.0, lng: 105.8, s: 0.6 },
  { lat: 25.0, lng: 121.5, s: 0.7 },
  { lat: 34.6, lng: 135.5, s: 0.8 },
  { lat: 30.5, lng: 114.3, s: 0.7 },
  { lat: 45.7, lng: 126.6, s: 0.5 },
  { lat: 43.8, lng: 87.6, s: 0.4 },
  { lat: 29.5, lng: 106.5, s: 0.7 },
  { lat: 36.0, lng: 120.3, s: 0.5 },
  { lat: 23.1, lng: 113.2, s: 0.7 },
  // Middle East
  { lat: 25.2, lng: 55.3, s: 0.8 },
  { lat: 24.4, lng: 54.6, s: 0.7 },
  { lat: 21.5, lng: 39.1, s: 0.6 },
  { lat: 24.7, lng: 46.7, s: 0.7 },
  { lat: 35.6, lng: 51.3, s: 0.7 },
  { lat: 41.0, lng: 28.9, s: 0.8 },
  { lat: 32.0, lng: 34.7, s: 0.6 },
  { lat: 33.3, lng: 44.3, s: 0.6 },
  { lat: 33.8, lng: 35.8, s: 0.5 },
  { lat: 25.3, lng: 51.5, s: 0.5 },
  // Russia / Central Asia
  { lat: 55.7, lng: 37.6, s: 0.8 },
  { lat: 59.9, lng: 30.3, s: 0.6 },
  { lat: 56.8, lng: 60.6, s: 0.4 },
  { lat: 55.0, lng: 73.3, s: 0.4 },
  { lat: 54.9, lng: 82.9, s: 0.4 },
  { lat: 43.2, lng: 76.9, s: 0.4 },
  { lat: 41.3, lng: 69.2, s: 0.4 },
  // Africa
  { lat: 30.0, lng: 31.2, s: 0.7 },
  { lat: -33.9, lng: 18.4, s: 0.6 },
  { lat: 6.4, lng: 3.4, s: 0.7 },
  { lat: -1.3, lng: 36.8, s: 0.5 },
  { lat: 33.5, lng: -7.5, s: 0.5 },
  { lat: 36.7, lng: 3.0, s: 0.5 },
  { lat: -4.3, lng: 15.3, s: 0.4 },
  { lat: -26.2, lng: 28.0, s: 0.5 },
  { lat: 5.6, lng: -0.1, s: 0.4 },
  { lat: 9.0, lng: 38.7, s: 0.5 },
  { lat: 15.5, lng: 32.5, s: 0.4 },
  { lat: -6.8, lng: 39.2, s: 0.4 },
  { lat: -15.3, lng: 28.3, s: 0.3 },
  // South America
  { lat: -23.5, lng: -46.6, s: 0.9 },
  { lat: -22.9, lng: -43.1, s: 0.8 },
  { lat: -34.6, lng: -58.3, s: 0.8 },
  { lat: -33.4, lng: -70.6, s: 0.6 },
  { lat: -12.0, lng: -77.0, s: 0.6 },
  { lat: 4.7, lng: -74.0, s: 0.5 },
  { lat: 10.5, lng: -66.9, s: 0.5 },
  { lat: -0.1, lng: -78.4, s: 0.4 },
  { lat: -15.8, lng: -47.8, s: 0.5 },
  { lat: -3.1, lng: -60.0, s: 0.3 },
  // Oceania
  { lat: -33.8, lng: 151.2, s: 0.8 },
  { lat: -37.8, lng: 144.9, s: 0.7 },
  { lat: -27.4, lng: 153.0, s: 0.5 },
  { lat: -31.9, lng: 115.8, s: 0.5 },
  { lat: -36.8, lng: 174.7, s: 0.5 },
  { lat: -41.2, lng: 174.7, s: 0.4 },
];

const INFRASTRUCTURE_SITES: InfrastructureSite[] = [
  {
    id: "jamnagar",
    name: "Jamnagar Refinery Complex",
    lat: 22.47,
    lng: 70.07,
    type: "refinery",
    region: "India",
    detail: "1.24M bpd refining hub",
  },
  {
    id: "ras-tanura",
    name: "Ras Tanura Processing",
    lat: 26.64,
    lng: 50.16,
    type: "storage",
    region: "Saudi Arabia",
    detail: "Strategic crude export terminal",
  },
  {
    id: "fujairah",
    name: "Fujairah Oil Hub",
    lat: 25.13,
    lng: 56.35,
    type: "storage",
    region: "UAE",
    detail: "Bunkering and storage cluster",
  },
  {
    id: "sabine-pass",
    name: "Sabine Pass LNG",
    lat: 29.73,
    lng: -93.88,
    type: "lng_terminal",
    region: "United States",
    detail: "Major LNG export terminal",
  },
  {
    id: "rotterdam",
    name: "Rotterdam Refining Belt",
    lat: 51.95,
    lng: 4.14,
    type: "refinery",
    region: "Netherlands",
    detail: "European downstream hub",
  },
  {
    id: "singapore-jurong",
    name: "Jurong Island",
    lat: 1.26,
    lng: 103.7,
    type: "refinery",
    region: "Singapore",
    detail: "Integrated petrochemicals cluster",
  },
  {
    id: "freeport-lng",
    name: "Freeport LNG",
    lat: 28.95,
    lng: -95.29,
    type: "lng_terminal",
    region: "United States",
    detail: "Gulf Coast export capacity",
  },
  {
    id: "yosu",
    name: "Yeosu Refinery",
    lat: 34.76,
    lng: 127.66,
    type: "refinery",
    region: "South Korea",
    detail: "Asia-Pacific fuels and chemicals node",
  },
];

const CLIMATE_HOTSPOTS: ClimateHotspot[] = [
  {
    id: "arabian-heat",
    label: "Arabian Gulf heat dome",
    lat: 25.4,
    lng: 53.9,
    type: "heat",
    severity: 0.92,
    detail: "Extreme wet-bulb stress on ports and workers",
  },
  {
    id: "india-heat",
    label: "North India power stress",
    lat: 28.8,
    lng: 77.0,
    type: "heat",
    severity: 0.84,
    detail: "Cooling demand and grid load spike",
  },
  {
    id: "med-drought",
    label: "Mediterranean drought belt",
    lat: 37.5,
    lng: 15.4,
    type: "drought",
    severity: 0.76,
    detail: "Water stress near agriculture and shipping lanes",
  },
  {
    id: "panama-drought",
    label: "Panama Canal freshwater strain",
    lat: 9.15,
    lng: -79.75,
    type: "drought",
    severity: 0.88,
    detail: "Transit constraints from reservoir shortages",
  },
  {
    id: "bay-cyclone",
    label: "Bay of Bengal cyclone watch",
    lat: 16.2,
    lng: 89.6,
    type: "storm",
    severity: 0.73,
    detail: "Storm risk to LNG and bulk routes",
  },
  {
    id: "gulf-mexico-storm",
    label: "Gulf of Mexico storm belt",
    lat: 26.1,
    lng: -89.8,
    type: "storm",
    severity: 0.81,
    detail: "Offshore production and export disruption risk",
  },
];

// ─── UTILITIES ───────────────────────────────────────────────
function latLngToVector3(
  lat: number,
  lng: number,
  radius: number,
): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    military: "#EF4444",
    cyber: "#A855F7",
    energy: "#F59E0B",
    economic: "#3B82F6",
    geopolitical: "#D4AF37",
    supply_chain: "#F97316",
    terrorism: "#DC2626",
    climate: "#10B981",
    commodities: "#F59E0B",
    technology: "#8B5CF6",
    geopolitics: "#D4AF37",
    economy: "#3B82F6",
  };
  return colors[category] || "#D4AF37";
}

function getThreatColor(score?: number): string {
  if (!score) return "#D4AF37";
  if (score >= 80) return "#EF4444";
  if (score >= 60) return "#F97316";
  if (score >= 40) return "#EAB308";
  return "#10B981";
}

function normalizeShipType(type: string): ShipTypeFilter {
  if (type === "tanker") return "tanker";
  if (type === "container") return "container";
  if (type === "lng") return "lng";
  if (type === "military") return "military";
  if (type === "bulk") return "bulk";
  if (type === "cargo") return "cargo";
  if (type === "cruise") return "cruise";
  if (type === "fishing") return "fishing";
  return "other";
}

function normalizeEventCategory(category: string): EventCategoryFilter {
  const value = category.toLowerCase();
  if (value.includes("military") || value.includes("terror")) return "military";
  if (value.includes("energy") || value.includes("commodit")) return "energy";
  if (value.includes("geo")) return "geopolitical";
  if (value.includes("econom")) return "economic";
  if (value.includes("cyber") || value.includes("tech")) return "cyber";
  if (value.includes("climate")) return "climate";
  if (
    value.includes("supply") ||
    value.includes("trade") ||
    value.includes("logistic")
  ) {
    return "supply_chain";
  }
  return "geopolitical";
}

function getInfrastructureColor(type: InfrastructureType): string {
  if (type === "refinery") return "#F97316";
  if (type === "lng_terminal") return "#22C55E";
  return "#38BDF8";
}

function getClimateColor(type: ClimateOverlayType): string {
  if (type === "heat") return "#F97316";
  if (type === "drought") return "#EAB308";
  return "#06B6D4";
}

function isShipStalled(ship: ShipData): boolean {
  return (
    ship.speed <= 1 ||
    ship.status === "anchored" ||
    ship.status === "moored" ||
    ship.status === "stopped"
  );
}

const DEFAULT_LAYER_STATE: GlobeLayerState = {
  groups: {
    events: true,
    ships: true,
    aircraft: true,
    infrastructure: true,
    climate: true,
    routes: true,
    chokepoints: true,
    satellites: true,
    cityLights: true,
  },
  shipTypes: {
    tanker: true,
    container: true,
    lng: true,
    military: true,
    bulk: true,
    cargo: true,
    cruise: true,
    fishing: true,
    other: true,
    stalled: true,
  },
  eventCategories: {
    military: true,
    energy: true,
    geopolitical: true,
    economic: true,
    cyber: true,
    climate: true,
    supply_chain: true,
  },
  infrastructureTypes: {
    refinery: true,
    lng_terminal: true,
    storage: true,
  },
  climateTypes: {
    heat: true,
    drought: true,
    storm: true,
  },
  routeGroups: {
    energy: true,
    trade: true,
    strategic: true,
  },
};

// ─── EARTH SPHERE WITH NASA TEXTURE ─────────────────────────
function EarthSphere() {
  const [dayMap, setDayMap] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let disposed = false;
    let tex: THREE.Texture | null = null;
    loadTextureWithFallback(EARTH_DAY_URLS, (texture) => {
      if (!disposed) {
        tex = texture;
        setDayMap(texture);
        console.log(
          "[WorldGlobe] Day texture loaded successfully, dimensions:",
          (texture.image as HTMLImageElement)?.width,
          "x",
          (texture.image as HTMLImageElement)?.height,
        );
      }
    });
    return () => {
      disposed = true;
      if (tex) tex.dispose();
    };
  }, []);

  return (
    <Sphere args={[GLOBE_RADIUS, 96, 96]}>
      {dayMap ? (
        <meshBasicMaterial map={dayMap} toneMapped={false} />
      ) : (
        <meshBasicMaterial color="#1a3a6a" />
      )}
    </Sphere>
  );
}

// ─── NIGHT LIGHTS TEXTURE OVERLAY ───────────────────────────
function NightLightsLayer() {
  const [nightMap, setNightMap] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let disposed = false;
    let tex: THREE.Texture | null = null;
    loadTextureWithFallback(EARTH_NIGHT_URLS, (texture) => {
      if (!disposed) {
        tex = texture;
        setNightMap(texture);
      }
    });
    return () => {
      disposed = true;
      if (tex) tex.dispose();
    };
  }, []);

  if (!nightMap) return null;

  return (
    <Sphere args={[GLOBE_RADIUS + 0.002, 96, 96]}>
      <meshBasicMaterial
        map={nightMap}
        transparent
        opacity={0.06}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </Sphere>
  );
}

// ─── CITY LIGHTS (PROCEDURAL GLOW POINTS) ───────────────────
function CityLightsLayer() {
  const pointsRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(CITY_LIGHTS.length * 3);
    CITY_LIGHTS.forEach((city, i) => {
      const v = latLngToVector3(city.lat, city.lng, GLOBE_RADIUS + 0.012);
      positions[i * 3] = v.x;
      positions[i * 3 + 1] = v.y;
      positions[i * 3 + 2] = v.z;
    });
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      const mat = pointsRef.current.material as THREE.PointsMaterial;
      mat.opacity = 0.14 + Math.sin(clock.getElapsedTime() * 0.5) * 0.03;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color="#FDB813"
        size={0.022}
        sizeAttenuation
        transparent
        opacity={0.16}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ─── BRIGHT ATMOSPHERE (TRIPLE GLOW) ────────────────────────
function BrightAtmosphere() {
  const innerRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (innerRef.current) {
      const mat = innerRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.02 + Math.sin(clock.getElapsedTime() * 0.3) * 0.006;
    }
  });

  return (
    <>
      <Sphere args={[GLOBE_RADIUS + 0.04, 64, 64]} ref={innerRef}>
        <meshBasicMaterial
          color="#4488CC"
          transparent
          opacity={0.02}
          side={THREE.BackSide}
          depthWrite={false}
          toneMapped={false}
        />
      </Sphere>
      <Sphere args={[GLOBE_RADIUS + 0.12, 64, 64]}>
        <meshBasicMaterial
          color="#2266AA"
          transparent
          opacity={0.012}
          side={THREE.BackSide}
          depthWrite={false}
          toneMapped={false}
        />
      </Sphere>
      <Sphere args={[GLOBE_RADIUS + 0.25, 64, 64]}>
        <meshBasicMaterial
          color="#1144AA"
          transparent
          opacity={0.006}
          side={THREE.BackSide}
          depthWrite={false}
          toneMapped={false}
        />
      </Sphere>
    </>
  );
}

// ─── ARC BETWEEN TWO POINTS ─────────────────────────────────
function ArcLine({
  from,
  to,
  color,
  opacity = 0.4,
}: {
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  color: string;
  opacity?: number;
}) {
  const points = useMemo(() => {
    const start = latLngToVector3(from.lat, from.lng, GLOBE_RADIUS + 0.01);
    const end = latLngToVector3(to.lat, to.lng, GLOBE_RADIUS + 0.01);
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const dist = start.distanceTo(end);
    mid.normalize().multiplyScalar(GLOBE_RADIUS + 0.01 + dist * 0.15);
    return new THREE.QuadraticBezierCurve3(start, mid, end).getPoints(50);
  }, [from, to]);

  return (
    <Line
      points={points}
      color={color}
      lineWidth={1.2}
      transparent
      opacity={opacity}
    />
  );
}

// ─── ANIMATED SHIPPING VESSEL ───────────────────────────────
function AnimatedShip({
  from,
  to,
  speed,
  offset,
  color,
}: {
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  speed: number;
  offset: number;
  color: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Mesh>(null);

  const curve = useMemo(() => {
    const start = latLngToVector3(from.lat, from.lng, GLOBE_RADIUS + 0.015);
    const end = latLngToVector3(to.lat, to.lng, GLOBE_RADIUS + 0.015);
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const dist = start.distanceTo(end);
    mid.normalize().multiplyScalar(GLOBE_RADIUS + 0.015 + dist * 0.05);
    return new THREE.QuadraticBezierCurve3(start, mid, end);
  }, [from, to]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = (clock.getElapsedTime() * speed + offset) % 1;
    const pos = curve.getPoint(t);
    meshRef.current.position.copy(pos);
    meshRef.current.lookAt(0, 0, 0);

    if (trailRef.current) {
      const tt = (clock.getElapsedTime() * speed + offset - 0.02 + 1) % 1;
      trailRef.current.position.copy(curve.getPoint(tt));
      trailRef.current.lookAt(0, 0, 0);
    }
  });

  return (
    <>
      <mesh ref={meshRef}>
        <circleGeometry args={[0.012, 3]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.95}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={trailRef}>
        <circleGeometry args={[0.006, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  );
}

// ─── ANIMATED FLIGHT ────────────────────────────────────────
function AnimatedFlight({
  from,
  to,
  speed,
  offset,
  color,
}: {
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  speed: number;
  offset: number;
  color: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const trailRefs = useRef<THREE.Mesh[]>([]);

  const curve = useMemo(() => {
    const start = latLngToVector3(from.lat, from.lng, GLOBE_RADIUS + 0.03);
    const end = latLngToVector3(to.lat, to.lng, GLOBE_RADIUS + 0.03);
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const dist = start.distanceTo(end);
    mid.normalize().multiplyScalar(GLOBE_RADIUS + 0.03 + dist * 0.25);
    return new THREE.QuadraticBezierCurve3(start, mid, end);
  }, [from, to]);

  const arcPoints = useMemo(() => curve.getPoints(60), [curve]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = (clock.getElapsedTime() * speed + offset) % 1;
    const pos = curve.getPoint(t);
    meshRef.current.position.copy(pos);
    meshRef.current.lookAt(0, 0, 0);

    trailRefs.current.forEach((trail, i) => {
      if (!trail) return;
      const tt = (t - (i + 1) * 0.015 + 1) % 1;
      trail.position.copy(curve.getPoint(tt));
      trail.lookAt(0, 0, 0);
      (trail.material as THREE.MeshBasicMaterial).opacity = 0.5 - i * 0.12;
    });
  });

  return (
    <>
      {/* Flight arc path */}
      <Line
        points={arcPoints}
        color={color}
        lineWidth={0.5}
        transparent
        opacity={0.15}
      />
      {/* Plane marker */}
      <mesh ref={meshRef}>
        <circleGeometry args={[0.01, 3]} />
        <meshBasicMaterial
          color="#FFFFFF"
          transparent
          opacity={0.95}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Trail dots */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) trailRefs.current[i] = el;
          }}
        >
          <circleGeometry args={[0.005, 8]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </>
  );
}

// ─── SATELLITE WITH SOLAR PANELS & TRAIL ────────────────────
function SatelliteWithTrail({
  inclination,
  speed,
  offset,
  altitude,
  color,
}: {
  inclination: number;
  speed: number;
  offset: number;
  altitude: number;
  color: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const trailIndex = useRef(0);

  const trailGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(40 * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed + offset;
    const r = GLOBE_RADIUS + altitude;
    const x = r * Math.cos(t) * Math.cos(inclination);
    const y = r * Math.sin(inclination) * Math.sin(t * 0.7);
    const z = r * Math.sin(t);

    if (groupRef.current) {
      groupRef.current.position.set(x, y, z);
      groupRef.current.lookAt(0, 0, 0);
    }

    const posArr = trailGeo.attributes.position.array as Float32Array;
    const idx = trailIndex.current % 40;
    posArr[idx * 3] = x;
    posArr[idx * 3 + 1] = y;
    posArr[idx * 3 + 2] = z;
    trailGeo.attributes.position.needsUpdate = true;
    trailIndex.current++;
  });

  return (
    <>
      <group ref={groupRef}>
        {/* Satellite body */}
        <mesh>
          <boxGeometry args={[0.014, 0.014, 0.014]} />
          <meshBasicMaterial color={color} transparent opacity={0.95} />
        </mesh>
        {/* Solar panel left */}
        <mesh position={[-0.024, 0, 0]}>
          <planeGeometry args={[0.022, 0.008]} />
          <meshBasicMaterial
            color="#4488FF"
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Solar panel right */}
        <mesh position={[0.024, 0, 0]}>
          <planeGeometry args={[0.022, 0.008]} />
          <meshBasicMaterial
            color="#4488FF"
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      {/* Orbital trail */}
      <points geometry={trailGeo}>
        <pointsMaterial
          color={color}
          size={0.005}
          sizeAttenuation
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </>
  );
}

// ─── ANIMATED PULSE DOT ─────────────────────────────────────
function PulsePoint({
  lat,
  lng,
  color,
  size = 0.02,
  onClick,
  label,
  threatScore,
}: {
  lat: number;
  lng: number;
  color: string;
  size?: number;
  onClick?: () => void;
  label?: string;
  threatScore?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const position = useMemo(
    () => latLngToVector3(lat, lng, GLOBE_RADIUS + POINT_ALTITUDE),
    [lat, lng],
  );

  useFrame(({ clock }) => {
    if (ringRef.current) {
      const s = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.5;
      ringRef.current.scale.set(s, s, 1);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.7 - Math.sin(clock.getElapsedTime() * 3) * 0.35;
    }
    if (meshRef.current) meshRef.current.lookAt(0, 0, 0);
    if (beamRef.current) {
      beamRef.current.lookAt(0, 0, 0);
      (beamRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.15 + Math.sin(clock.getElapsedTime() * 2) * 0.1;
    }
  });

  return (
    <group position={position}>
      {/* Glow halo */}
      <mesh ref={beamRef}>
        <circleGeometry args={[size * 4, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Core dot */}
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <circleGeometry args={[size, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.95}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Pulse ring */}
      <mesh
        ref={ringRef}
        rotation={meshRef.current?.rotation || new THREE.Euler()}
      >
        <ringGeometry args={[size * 1.5, size * 2.2, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Tooltip */}
      {hovered && label && (
        <Html distanceFactor={8} center style={{ pointerEvents: "none" }}>
          <div className="bg-black/90 border border-geo-gold/40 rounded-lg px-3 py-2 min-w-[220px] backdrop-blur-xl shadow-lg shadow-geo-gold/10">
            <div className="text-[10px] font-mono text-geo-gold mb-1">
              {label}
            </div>
            {threatScore && (
              <div className="flex items-center gap-2">
                <div className="text-[9px] text-gray-400">THREAT</div>
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${threatScore}%`,
                      backgroundColor: getThreatColor(threatScore),
                    }}
                  />
                </div>
                <div
                  className="text-[9px] font-mono font-bold"
                  style={{ color: getThreatColor(threatScore) }}
                >
                  {threatScore}
                </div>
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

// ─── CHOKEPOINT MARKER ──────────────────────────────────────
function ChokepointMarker({
  lat,
  lng,
  name,
  type,
}: {
  lat: number;
  lng: number;
  name: string;
  type: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const position = useMemo(
    () => latLngToVector3(lat, lng, GLOBE_RADIUS + 0.015),
    [lat, lng],
  );
  const color =
    type === "energy" ? "#EF4444" : type === "military" ? "#F59E0B" : "#3B82F6";

  useFrame(({ clock }) => {
    if (meshRef.current) meshRef.current.lookAt(0, 0, 0);
    if (pulseRef.current) {
      pulseRef.current.lookAt(0, 0, 0);
      const s = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.3;
      pulseRef.current.scale.set(s, s, 1);
      (pulseRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.3 - Math.sin(clock.getElapsedTime() * 2) * 0.15;
    }
  });

  return (
    <group position={position}>
      {/* Outer pulse */}
      <mesh ref={pulseRef}>
        <ringGeometry args={[0.03, 0.04, 6]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Hexagon marker */}
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <ringGeometry args={[0.015, 0.025, 6]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      {hovered && (
        <Html distanceFactor={8} center style={{ pointerEvents: "none" }}>
          <div className="bg-black/90 border border-white/20 rounded-lg px-3 py-2 backdrop-blur-xl whitespace-nowrap">
            <div className="text-[10px] font-mono text-geo-gold">{name}</div>
            <div className="text-[9px] text-gray-400 uppercase">
              {type} chokepoint
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function InfrastructureMarker({ site }: { site: InfrastructureSite }) {
  const markerRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const position = useMemo(
    () => latLngToVector3(site.lat, site.lng, GLOBE_RADIUS + 0.02),
    [site.lat, site.lng],
  );
  const color = getInfrastructureColor(site.type);

  useFrame(({ clock }) => {
    if (markerRef.current) markerRef.current.lookAt(0, 0, 0);
    if (pulseRef.current) {
      pulseRef.current.lookAt(0, 0, 0);
      const scale = 1 + Math.sin(clock.getElapsedTime() * 2.2) * 0.2;
      pulseRef.current.scale.set(scale, scale, 1);
      (pulseRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.22 + Math.sin(clock.getElapsedTime() * 2.2) * 0.08;
    }
  });

  return (
    <group position={position}>
      <mesh ref={pulseRef}>
        <ringGeometry args={[0.016, 0.028, 24]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.24}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh
        ref={markerRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <octahedronGeometry args={[0.015, 0]} />
        <meshBasicMaterial color={color} transparent opacity={0.92} />
      </mesh>
      {hovered && (
        <Html distanceFactor={8} center style={{ pointerEvents: "none" }}>
          <div className="min-w-[220px] rounded-lg border border-white/15 bg-black/90 px-3 py-2 backdrop-blur-xl">
            <div className="text-[10px] font-mono text-white">{site.name}</div>
            <div className="text-[9px] uppercase tracking-wide text-gray-400">
              {site.type.replace("_", " ")} • {site.region}
            </div>
            <div className="text-[9px] text-gray-500">{site.detail}</div>
          </div>
        </Html>
      )}
    </group>
  );
}

function ClimateOverlayPoint({ hotspot }: { hotspot: ClimateHotspot }) {
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const position = useMemo(
    () => latLngToVector3(hotspot.lat, hotspot.lng, GLOBE_RADIUS + 0.018),
    [hotspot.lat, hotspot.lng],
  );
  const color = getClimateColor(hotspot.type);

  useFrame(({ clock }) => {
    if (coreRef.current) coreRef.current.lookAt(0, 0, 0);
    if (ringRef.current) {
      ringRef.current.lookAt(0, 0, 0);
      const scale = 1 + Math.sin(clock.getElapsedTime() * 1.8) * 0.28;
      ringRef.current.scale.set(scale, scale, 1);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.22 + Math.sin(clock.getElapsedTime() * 1.8) * 0.1;
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={ringRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <circleGeometry args={[0.04 + hotspot.severity * 0.06, 24]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.24}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={coreRef}>
        <ringGeometry args={[0.012, 0.018, 20]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>
      {hovered && (
        <Html distanceFactor={8} center style={{ pointerEvents: "none" }}>
          <div className="min-w-[220px] rounded-lg border border-white/15 bg-black/90 px-3 py-2 backdrop-blur-xl">
            <div className="text-[10px] font-mono text-white">
              {hotspot.label}
            </div>
            <div className="text-[9px] uppercase tracking-wide text-gray-400">
              {hotspot.type} • severity {Math.round(hotspot.severity * 100)}
            </div>
            <div className="text-[9px] text-gray-500">{hotspot.detail}</div>
          </div>
        </Html>
      )}
    </group>
  );
}

function MaritimeCorridorsLayer({ routes }: { routes: MaritimeRoute[] }) {
  return (
    <>
      {routes.map((route) => (
        <ArcLine
          key={`route-arc-${route.id}`}
          from={route.from}
          to={route.to}
          color={route.color}
          opacity={0.22}
        />
      ))}
      {routes.map((route, index) => (
        <AnimatedShip
          key={`route-ship-${route.id}`}
          from={route.from}
          to={route.to}
          speed={0.012 + (index % 3) * 0.004}
          offset={(index * 0.17) % 1}
          color={route.color}
        />
      ))}
    </>
  );
}

// ─── CONNECTION ARCS BETWEEN EVENTS ─────────────────────────
function ConnectionArcs({ events }: { events: GlobeEvent[] }) {
  const arcs = useMemo(() => {
    const result: Array<{
      from: { lat: number; lng: number };
      to: { lat: number; lng: number };
      color: string;
    }> = [];
    const byRegion = new Map<string, GlobeEvent[]>();
    events.forEach((e) => {
      if (e.locations.length > 0) {
        if (!byRegion.has(e.region)) byRegion.set(e.region, []);
        byRegion.get(e.region)!.push(e);
      }
    });
    byRegion.forEach((regionEvents) => {
      for (let i = 0; i < Math.min(regionEvents.length - 1, 3); i++) {
        const a = regionEvents[i],
          b = regionEvents[i + 1];
        if (a.locations[0] && b.locations[0]) {
          result.push({
            from: { lat: a.locations[0].lat, lng: a.locations[0].lng },
            to: { lat: b.locations[0].lat, lng: b.locations[0].lng },
            color: getCategoryColor(a.category),
          });
        }
      }
    });
    return result.slice(0, 25);
  }, [events]);

  return (
    <>
      {arcs.map((arc, i) => (
        <ArcLine
          key={`conn-${i}`}
          from={arc.from}
          to={arc.to}
          color={arc.color}
          opacity={0.3}
        />
      ))}
    </>
  );
}

// ─── DATA FLOW PARTICLES ────────────────────────────────────
function DataFlowParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 200;

  const velocities = useRef<Float32Array>(new Float32Array(count * 3));

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const vel = velocities.current;
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = GLOBE_RADIUS + 0.05 + Math.random() * 0.3;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      vel[i * 3] = (Math.random() - 0.5) * 0.002;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.002;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame(() => {
    if (!pointsRef.current) return;
    const posArr = pointsRef.current.geometry.attributes.position
      .array as Float32Array;
    const vel = velocities.current;
    for (let i = 0; i < count; i++) {
      posArr[i * 3] += vel[i * 3];
      posArr[i * 3 + 1] += vel[i * 3 + 1];
      posArr[i * 3 + 2] += vel[i * 3 + 2];
      const dist = Math.sqrt(
        posArr[i * 3] ** 2 + posArr[i * 3 + 1] ** 2 + posArr[i * 3 + 2] ** 2,
      );
      if (dist > GLOBE_RADIUS + 0.5 || dist < GLOBE_RADIUS + 0.03) {
        vel[i * 3] *= -1;
        vel[i * 3 + 1] *= -1;
        vel[i * 3 + 2] *= -1;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color="#33BBEE"
        size={0.005}
        sizeAttenuation
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ─── REAL AIRCRAFT LAYER (OpenSky) ──────────────────────────
function RealAircraftLayer({
  aircraft,
  onAircraftClick,
}: {
  aircraft: AircraftData[];
  onAircraftClick?: (aircraft: AircraftData) => void;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const [hovered, setHovered] = useState<AircraftData | null>(null);

  const trailAircraft = useMemo(
    () =>
      aircraft
        .filter((asset) => (asset.trail?.length || 0) > 1)
        .sort(
          (left, right) =>
            (right.trail?.length || 0) - (left.trail?.length || 0),
        )
        .slice(0, 260),
    [aircraft],
  );

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(aircraft.length * 3);
    const col = new Float32Array(aircraft.length * 3);

    aircraft.forEach((ac, i) => {
      const alt = Math.max(ac.altitude || 8000, 1000);
      const heightOffset = 0.015 + (alt / 45000) * 0.06; // Scale altitude to globe
      const v = latLngToVector3(
        ac.latitude,
        ac.longitude,
        GLOBE_RADIUS + heightOffset,
      );
      pos[i * 3] = v.x;
      pos[i * 3 + 1] = v.y;
      pos[i * 3 + 2] = v.z;

      // Color by category
      const color =
        ac.category === "military"
          ? new THREE.Color("#FF4444")
          : ac.category === "cargo"
            ? new THREE.Color("#FF8800")
            : ac.category === "commercial"
              ? new THREE.Color("#00CCFF")
              : new THREE.Color("#88FF88");
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    });

    return { positions: pos, colors: col };
  }, [aircraft]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [positions, colors]);

  return (
    <>
      {trailAircraft.map((asset) => (
        <Line
          key={`flight-trail-${asset.icao24}`}
          points={(asset.trail || []).map((point) => {
            const alt = Math.max(point.altitude || 8000, 1000);
            const heightOffset = 0.015 + (alt / 45000) * 0.06;
            return latLngToVector3(
              point.latitude,
              point.longitude,
              GLOBE_RADIUS + heightOffset,
            );
          })}
          color={
            asset.category === "military"
              ? "#FF4444"
              : asset.category === "cargo"
                ? "#FF8800"
                : asset.category === "commercial"
                  ? "#00CCFF"
                  : "#88FF88"
          }
          transparent
          opacity={0.22}
          lineWidth={1}
        />
      ))}
      <points
        ref={pointsRef}
        geometry={geometry}
        onPointerMove={(event) => {
          if (event.index === undefined) return;
          event.stopPropagation();
          setHovered(aircraft[event.index] || null);
        }}
        onPointerOut={() => setHovered(null)}
        onClick={(event) => {
          if (event.index === undefined) return;
          event.stopPropagation();
          const selectedAircraft = aircraft[event.index];
          if (selectedAircraft) {
            onAircraftClick?.(selectedAircraft);
          }
        }}
      >
        <pointsMaterial
          size={0.012}
          sizeAttenuation
          transparent
          opacity={0.9}
          vertexColors
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      {hovered && (
        <Html
          position={latLngToVector3(
            hovered.latitude,
            hovered.longitude,
            GLOBE_RADIUS + 0.08,
          )}
          center
          style={{ pointerEvents: "none" }}
        >
          <div className="bg-black/90 backdrop-blur-md border border-cyan-500/40 rounded-lg px-3 py-2 text-[10px] font-mono whitespace-nowrap shadow-lg shadow-cyan-500/10">
            <div className="text-cyan-400 font-bold">
              {hovered.callsign || hovered.icao24}
            </div>
            <div className="text-gray-400">{hovered.origin_country}</div>
            <div className="text-gray-500">
              ALT: {Math.round(hovered.altitude)}m | SPD:{" "}
              {Math.round(hovered.velocity)}m/s
            </div>
          </div>
        </Html>
      )}
    </>
  );
}

// ─── REAL SHIP LAYER ────────────────────────────────────────
function RealShipLayer({
  ships,
  onShipClick,
}: {
  ships: ShipData[];
  onShipClick?: (ship: ShipData) => void;
}) {
  const [hovered, setHovered] = useState<ShipData | null>(null);

  const trailShips = useMemo(
    () =>
      ships
        .filter((ship) => (ship.trail?.length || 0) > 1)
        .sort(
          (left, right) =>
            (right.trail?.length || 0) - (left.trail?.length || 0),
        )
        .slice(0, 320),
    [ships],
  );

  const getShipColor = useCallback((ship: ShipData) => {
    if (ship.type === "tanker") return "#FF7A1A";
    if (ship.type === "container") return "#00D68F";
    if (ship.type === "military") return "#FF4D4F";
    if (ship.type === "lng") return "#FFD166";
    if (ship.type === "cruise") return "#C084FC";
    if (ship.type === "bulk") return "#60A5FA";
    if (ship.type === "fishing") return "#2DD4BF";
    return "#CBD5E1";
  }, []);

  const { positions, colors, stalledPositions } = useMemo(() => {
    const positions = new Float32Array(ships.length * 3);
    const colors = new Float32Array(ships.length * 3);
    const stalled: number[] = [];

    ships.forEach((ship, index) => {
      const pos = latLngToVector3(
        ship.latitude,
        ship.longitude,
        GLOBE_RADIUS + 0.02,
      );
      positions[index * 3] = pos.x;
      positions[index * 3 + 1] = pos.y;
      positions[index * 3 + 2] = pos.z;

      const color = new THREE.Color(getShipColor(ship));
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;

      if (isShipStalled(ship)) {
        stalled.push(pos.x, pos.y, pos.z);
      }
    });

    return {
      positions,
      colors,
      stalledPositions: new Float32Array(stalled),
    };
  }, [getShipColor, ships]);

  const shipGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geometry;
  }, [positions, colors]);

  const stalledGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(stalledPositions, 3),
    );
    return geometry;
  }, [stalledPositions]);

  return (
    <>
      {trailShips.map((ship) => (
        <Line
          key={`trail-${ship.mmsi}`}
          points={(ship.trail || []).map((point) =>
            latLngToVector3(
              point.latitude,
              point.longitude,
              GLOBE_RADIUS + 0.012,
            ),
          )}
          color={getShipColor(ship)}
          transparent
          opacity={ship.type === "tanker" ? 0.45 : 0.26}
          lineWidth={ship.type === "tanker" ? 1.6 : 1.1}
        />
      ))}
      <points
        geometry={shipGeometry}
        onPointerMove={(event) => {
          if (event.index === undefined) return;
          event.stopPropagation();
          setHovered(ships[event.index] || null);
        }}
        onPointerOut={() => setHovered(null)}
        onClick={(event) => {
          if (event.index === undefined) return;
          event.stopPropagation();
          const selectedShip = ships[event.index];
          if (selectedShip) {
            onShipClick?.(selectedShip);
          }
        }}
      >
        <pointsMaterial
          size={0.03}
          sizeAttenuation
          transparent
          opacity={0.95}
          vertexColors
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      {stalledPositions.length > 0 && (
        <points geometry={stalledGeometry}>
          <pointsMaterial
            size={0.05}
            sizeAttenuation
            transparent
            opacity={0.7}
            color="#FDE047"
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      )}
      {hovered && (
        <Html
          position={latLngToVector3(
            hovered.latitude,
            hovered.longitude,
            GLOBE_RADIUS + 0.06,
          )}
          center
          style={{ pointerEvents: "none" }}
        >
          <div className="bg-black/90 backdrop-blur-md border border-orange-500/40 rounded-lg px-3 py-2 text-[10px] font-mono whitespace-nowrap shadow-lg shadow-orange-500/10">
            <div className="text-orange-400 font-bold">{hovered.name}</div>
            <div className="flex items-center gap-2 text-gray-400">
              <span>
                {hovered.flagEmoji} {hovered.flag}
              </span>
              <span className="text-gray-600">•</span>
              <span className="uppercase">{hovered.type}</span>
            </div>
            <div className="text-gray-500">
              SPD: {hovered.speed.toFixed(1)}kn | → {hovered.destination}
            </div>
            <div className="text-gray-600">L: {hovered.length}m</div>
            {hovered.zone && (
              <div className="text-gray-600">ZONE: {hovered.zone}</div>
            )}
            {isShipStalled(hovered) && (
              <div className="text-[9px] font-semibold text-yellow-300">
                STALLED / CONSTRAINED
              </div>
            )}
          </div>
        </Html>
      )}
    </>
  );
}

// ─── ZOOM DETECTION ─────────────────────────────────────────
function ZoomDetector({
  onZoomChange,
}: {
  onZoomChange?: (zoom: number) => void;
}) {
  const { camera } = useThree();
  const lastZoom = useRef(0);

  useFrame(() => {
    const dist = camera.position.length();
    const rounded = Math.round(dist * 10) / 10;
    if (rounded !== lastZoom.current) {
      lastZoom.current = rounded;
      onZoomChange?.(rounded);
    }
  });

  return null;
}

function FocusController({
  focusTarget,
  controlsRef,
}: {
  focusTarget?: GlobeFocusTarget | null;
  controlsRef: React.MutableRefObject<any>;
}) {
  const { camera } = useThree();
  const desiredPosition = useRef(new THREE.Vector3());
  const desiredTarget = useRef(new THREE.Vector3());
  const animationActive = useRef(false);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls?.addEventListener) {
      return;
    }

    const stopFocusAnimation = () => {
      animationActive.current = false;
    };

    controls.addEventListener("start", stopFocusAnimation);
    return () => {
      controls.removeEventListener("start", stopFocusAnimation);
    };
  }, [controlsRef]);

  useEffect(() => {
    if (!focusTarget) {
      return;
    }

    const surfacePoint = latLngToVector3(
      focusTarget.lat,
      focusTarget.lng,
      GLOBE_RADIUS + 0.04,
    );
    const cameraDistance = focusTarget.distance ?? 2.85;
    const targetDepth = focusTarget.targetDepth ?? 0.7;

    desiredTarget.current.copy(
      surfacePoint.clone().multiplyScalar(targetDepth),
    );
    desiredPosition.current.copy(
      surfacePoint.clone().normalize().multiplyScalar(cameraDistance),
    );
    animationActive.current = true;
  }, [focusTarget]);

  useFrame(() => {
    if (!animationActive.current) {
      return;
    }

    camera.position.lerp(desiredPosition.current, 0.18);

    if (controlsRef.current?.target) {
      controlsRef.current.target.lerp(desiredTarget.current, 0.2);
      controlsRef.current.update?.();
    } else {
      camera.lookAt(desiredTarget.current);
    }

    const targetDistance = camera.position.distanceTo(desiredPosition.current);
    const controlsTargetDistance = controlsRef.current?.target
      ? controlsRef.current.target.distanceTo(desiredTarget.current)
      : 0;

    if (targetDistance < 0.02 && controlsTargetDistance < 0.02) {
      camera.position.copy(desiredPosition.current);
      if (controlsRef.current?.target) {
        controlsRef.current.target.copy(desiredTarget.current);
        controlsRef.current.update?.();
      }
      animationActive.current = false;
    }
  });

  return null;
}

// ─── MAIN GLOBE SCENE ───────────────────────────────────────
function GlobeScene({
  events,
  onEventClick,
  onAircraftClick,
  onShipClick,
  selectedEvent,
  aircraft,
  ships,
  focusTarget,
  onZoomChange,
  layerState = DEFAULT_LAYER_STATE,
}: GlobeProps) {
  const globeRef = useRef<THREE.Group>(null);
  const controlsRef = useRef<any>(null);
  const userInteractingRef = useRef(false);

  const filteredEvents = useMemo(
    () =>
      events.filter(
        (event) =>
          layerState.groups.events &&
          layerState.eventCategories[normalizeEventCategory(event.category)],
      ),
    [events, layerState],
  );

  const filteredShips = useMemo(
    () =>
      (ships || []).filter((ship) => {
        if (!layerState.groups.ships) {
          return false;
        }
        const type = normalizeShipType(ship.type);
        const stalled = isShipStalled(ship);
        return (
          layerState.shipTypes[type] &&
          (layerState.shipTypes.stalled || !stalled)
        );
      }),
    [layerState, ships],
  );

  const filteredInfrastructure = useMemo(
    () =>
      INFRASTRUCTURE_SITES.filter(
        (site) =>
          layerState.groups.infrastructure &&
          layerState.infrastructureTypes[site.type],
      ),
    [layerState],
  );

  const filteredClimate = useMemo(
    () =>
      CLIMATE_HOTSPOTS.filter(
        (hotspot) =>
          layerState.groups.climate && layerState.climateTypes[hotspot.type],
      ),
    [layerState],
  );

  const filteredRoutes = useMemo(
    () =>
      MARITIME_ROUTES.filter(
        (route) =>
          layerState.groups.routes && layerState.routeGroups[route.group],
      ),
    [layerState],
  );

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls?.addEventListener) {
      return;
    }

    const handleStart = () => {
      userInteractingRef.current = true;
    };

    const handleEnd = () => {
      userInteractingRef.current = false;
    };

    controls.addEventListener("start", handleStart);
    controls.addEventListener("end", handleEnd);

    return () => {
      controls.removeEventListener("start", handleStart);
      controls.removeEventListener("end", handleEnd);
    };
  }, []);

  useFrame(({ clock }) => {
    if (globeRef.current && !focusTarget && !userInteractingRef.current) {
      globeRef.current.rotation.y = clock.getElapsedTime() * 0.02;
    }
  });

  const gridLines = useMemo(() => {
    const lines: THREE.Vector3[][] = [];
    for (let lat = -60; lat <= 60; lat += 30) {
      const pts: THREE.Vector3[] = [];
      for (let lng = -180; lng <= 180; lng += 5) {
        pts.push(latLngToVector3(lat, lng, GLOBE_RADIUS + 0.006));
      }
      lines.push(pts);
    }
    for (let lng = -180; lng < 180; lng += 30) {
      const pts: THREE.Vector3[] = [];
      for (let lat = -90; lat <= 90; lat += 5) {
        pts.push(latLngToVector3(lat, lng, GLOBE_RADIUS + 0.006));
      }
      lines.push(pts);
    }
    return lines;
  }, []);

  return (
    <>
      {/* Lighting — subtle, Earth uses meshBasicMaterial so unaffected */}
      <ambientLight intensity={1.0} />
      <directionalLight position={[5, 3, 5]} intensity={0.4} color="#FFFFFF" />

      {/* Starfield */}
      <Stars
        radius={60}
        depth={60}
        count={5500}
        factor={3.5}
        saturation={0.4}
        fade
        speed={0.3}
      />

      {/* Data flow particles around the globe */}
      <DataFlowParticles />

      <group ref={globeRef}>
        {/* Bright Earth with NASA Blue Marble texture */}
        <EarthSphere />

        {/* Night city lights texture overlay */}
        <NightLightsLayer />

        {/* Procedural city light points */}
        {layerState.groups.cityLights && <CityLightsLayer />}

        {/* Grid wireframe */}
        {gridLines.map((pts, i) => (
          <Line
            key={`grid-${i}`}
            points={pts}
            color="#55AACC"
            lineWidth={0.5}
            transparent
            opacity={0.18}
          />
        ))}

        {/* Triple atmosphere glow */}
        <BrightAtmosphere />

        {/* Climate and infrastructure overlays */}
        {filteredClimate.map((hotspot) => (
          <ClimateOverlayPoint key={hotspot.id} hotspot={hotspot} />
        ))}
        {filteredInfrastructure.map((site) => (
          <InfrastructureMarker key={site.id} site={site} />
        ))}

        {/* Animated maritime corridors */}
        {filteredRoutes.length > 0 && (
          <MaritimeCorridorsLayer routes={filteredRoutes} />
        )}

        {/* Chokepoint markers */}
        {layerState.groups.chokepoints &&
          CHOKEPOINTS.map((cp) => (
            <ChokepointMarker
              key={cp.name}
              lat={cp.lat}
              lng={cp.lng}
              name={cp.name}
              type={cp.type}
            />
          ))}

        {/* Event points from OSINT / articles */}
        {filteredEvents.map((event) =>
          event.locations.map((loc, li) => (
            <PulsePoint
              key={`${event.id}-${li}`}
              lat={loc.lat}
              lng={loc.lng}
              color={
                event.threatScore
                  ? getThreatColor(event.threatScore)
                  : getCategoryColor(event.category)
              }
              size={
                event.threatScore
                  ? Math.max(0.018, (event.threatScore / 100) * 0.045)
                  : 0.022
              }
              onClick={() => onEventClick?.(event)}
              label={event.title}
              threatScore={event.threatScore}
            />
          )),
        )}

        {/* Connection arcs between related events */}
        {layerState.groups.events && <ConnectionArcs events={filteredEvents} />}

        {/* REAL AIRCRAFT from OpenSky Network */}
        {layerState.groups.aircraft && aircraft && aircraft.length > 0 && (
          <RealAircraftLayer
            aircraft={aircraft}
            onAircraftClick={onAircraftClick}
          />
        )}

        {/* REAL-TIME SHIP TRACKING */}
        {filteredShips.length > 0 && (
          <RealShipLayer ships={filteredShips} onShipClick={onShipClick} />
        )}

        {/* Enhanced satellites with solar panels & trails */}
        {layerState.groups.satellites &&
          SATELLITE_ORBITS.map((orbit, i) => (
            <SatelliteWithTrail key={`sat-${i}`} {...orbit} />
          ))}
      </group>

      {/* Zoom level detection */}
      <ZoomDetector onZoomChange={onZoomChange} />
      <FocusController focusTarget={focusTarget} controlsRef={controlsRef} />

      <OrbitControls
        ref={controlsRef}
        enableZoom
        enablePan={false}
        minDistance={2.5}
        maxDistance={8}
        autoRotate={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={1.1}
        zoomSpeed={0.9}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_ROTATE,
        }}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE,
        }}
      />
    </>
  );
}

// ─── EXPORTED GLOBE WRAPPER ─────────────────────────────────
export default function WorldGlobe({
  events,
  onEventClick,
  onAircraftClick,
  onShipClick,
  selectedEvent,
  aircraft,
  ships,
  focusTarget,
  onZoomChange,
}: GlobeProps) {
  const [contextLost, setContextLost] = useState(false);
  const [key, setKey] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [isCompactPointer, setIsCompactPointer] = useState(false);
  const [layerState, setLayerState] =
    useState<GlobeLayerState>(DEFAULT_LAYER_STATE);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia("(max-width: 1024px), (pointer: coarse)");
    const updatePointerMode = () => {
      setIsCompactPointer(media.matches);
    };

    updatePointerMode();

    if (media.addEventListener) {
      media.addEventListener("change", updatePointerMode);
      return () => media.removeEventListener("change", updatePointerMode);
    }

    media.addListener(updatePointerMode);
    return () => media.removeListener(updatePointerMode);
  }, []);

  const shipCounts = useMemo(() => {
    const counts = {
      tanker: 0,
      container: 0,
      lng: 0,
      military: 0,
      stalled: 0,
    };

    (ships || []).forEach((ship) => {
      const type = normalizeShipType(ship.type);
      if (type in counts) {
        counts[type as keyof typeof counts] += 1;
      }
      if (isShipStalled(ship)) {
        counts.stalled += 1;
      }
    });

    return counts;
  }, [ships]);

  const eventCounts = useMemo(() => {
    const counts = {
      military: 0,
      energy: 0,
      geopolitical: 0,
      economic: 0,
      cyber: 0,
      climate: 0,
      supply_chain: 0,
    };

    events.forEach((event) => {
      const key = normalizeEventCategory(event.category);
      counts[key] += 1;
    });

    return counts;
  }, [events]);

  const toggleGroup = (group: keyof GlobeLayerState["groups"]) => {
    setLayerState((current) => ({
      ...current,
      groups: {
        ...current.groups,
        [group]: !current.groups[group],
      },
    }));
  };

  const toggleShipType = (type: ShipTypeFilter) => {
    setLayerState((current) => ({
      ...current,
      shipTypes: {
        ...current.shipTypes,
        [type]: !current.shipTypes[type],
      },
    }));
  };

  const toggleEventCategory = (category: EventCategoryFilter) => {
    setLayerState((current) => ({
      ...current,
      eventCategories: {
        ...current.eventCategories,
        [category]: !current.eventCategories[category],
      },
    }));
  };

  const toggleInfrastructureType = (type: InfrastructureType) => {
    setLayerState((current) => ({
      ...current,
      infrastructureTypes: {
        ...current.infrastructureTypes,
        [type]: !current.infrastructureTypes[type],
      },
    }));
  };

  const toggleClimateType = (type: ClimateOverlayType) => {
    setLayerState((current) => ({
      ...current,
      climateTypes: {
        ...current.climateTypes,
        [type]: !current.climateTypes[type],
      },
    }));
  };

  const toggleRouteGroup = (group: RouteGroup) => {
    setLayerState((current) => ({
      ...current,
      routeGroups: {
        ...current.routeGroups,
        [group]: !current.routeGroups[group],
      },
    }));
  };

  // Handle WebGL context loss and auto-recover
  const onCreated = (state: { gl: THREE.WebGLRenderer }) => {
    const canvas = state.gl.domElement;
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      console.warn("[WorldGlobe] WebGL context lost, will restore...");
      setContextLost(true);
    });
    canvas.addEventListener("webglcontextrestored", () => {
      console.log("[WorldGlobe] WebGL context restored");
      setContextLost(false);
    });
  };

  // Auto-remount Canvas if context is permanently lost
  useEffect(() => {
    if (contextLost) {
      const timer = setTimeout(() => {
        setKey((k) => k + 1);
        setContextLost(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [contextLost]);

  if (contextLost) {
    return (
      <div className="w-full h-full relative flex items-center justify-center bg-black/40">
        <div className="text-cyan-400 font-mono text-sm animate-pulse">
          Restoring 3D context...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <Canvas
        key={key}
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          failIfMajorPerformanceCaveat: false,
        }}
        style={{ background: "transparent", touchAction: "none" }}
        dpr={
          typeof window === "undefined"
            ? 1
            : Math.min(window.devicePixelRatio, isCompactPointer ? 1.25 : 1.5)
        }
        onCreated={onCreated}
      >
        <GlobeScene
          events={events}
          onEventClick={onEventClick}
          onAircraftClick={onAircraftClick}
          onShipClick={onShipClick}
          selectedEvent={selectedEvent}
          aircraft={aircraft}
          ships={ships}
          focusTarget={focusTarget}
          onZoomChange={onZoomChange}
          layerState={layerState}
        />
      </Canvas>

      {/* Live tracking indicator */}
      <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 backdrop-blur-sm sm:left-4 sm:top-4">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[10px] font-mono text-green-400">
          OPS GLOBE • {ships?.length || 0} VESSELS
        </span>
      </div>

      <div
        className={`absolute rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl shadow-2xl shadow-black/30 ${isCompactPointer ? "bottom-3 right-3 left-3" : "bottom-4 left-[6.5rem] w-[min(24rem,calc(100%-7.5rem))]"}`}
      >
        <button
          type="button"
          onClick={() => setPanelOpen((open) => !open)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <div>
            <div className="text-[10px] font-mono tracking-[0.25em] text-gray-400">
              LEGEND / FILTERS
            </div>
            <div className="text-xs text-white">
              Maritime, climate, infrastructure
            </div>
          </div>
          <div className="text-lg leading-none text-gray-300">
            {panelOpen ? "−" : "+"}
          </div>
        </button>

        {panelOpen && (
          <div
            className={`space-y-3 overflow-y-auto border-t border-white/5 px-4 py-3 text-[10px] ${isCompactPointer ? "max-h-[38vh]" : "max-h-[45vh]"}`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[9px] font-mono tracking-[0.2em] text-gray-500">
                <span>CORE LAYERS</span>
                <span>{events.length} SIGNALS</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["events", "OSINT / NEWS"],
                  ["ships", "LIVE VESSELS"],
                  ["aircraft", "AIRCRAFT"],
                  ["infrastructure", "REFINERIES"],
                  ["climate", "CLIMATE"],
                  ["routes", "SHIPPING ROUTES"],
                  ["chokepoints", "CHOKEPOINTS"],
                  ["satellites", "SATELLITES"],
                  ["cityLights", "CITY LIGHTS"],
                ].map(([key, label]) => {
                  const groupKey = key as keyof GlobeLayerState["groups"];
                  const enabled = layerState.groups[groupKey];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleGroup(groupKey)}
                      className={`rounded-lg border px-2.5 py-2 text-left transition ${
                        enabled
                          ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-100"
                          : "border-white/10 bg-white/5 text-gray-500"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[9px] font-mono tracking-[0.2em] text-gray-500">
                VESSEL CATEGORIES
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  ["tanker", `Tankers ${shipCounts.tanker}`],
                  ["container", `Containers ${shipCounts.container}`],
                  ["lng", `LNG ${shipCounts.lng}`],
                  ["military", `Military ${shipCounts.military}`],
                  ["stalled", `Stalled ${shipCounts.stalled}`],
                ].map(([key, label]) => {
                  const shipKey = key as ShipTypeFilter;
                  const enabled = layerState.shipTypes[shipKey];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleShipType(shipKey)}
                      className={`rounded-full border px-2.5 py-1.5 transition ${
                        enabled
                          ? "border-orange-400/40 bg-orange-400/10 text-orange-100"
                          : "border-white/10 bg-white/5 text-gray-500"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[9px] font-mono tracking-[0.2em] text-gray-500">
                INTELLIGENCE CATEGORIES
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  ["energy", `Energy ${eventCounts.energy}`],
                  ["military", `Military ${eventCounts.military}`],
                  ["geopolitical", `Geopolitical ${eventCounts.geopolitical}`],
                  ["economic", `Economic ${eventCounts.economic}`],
                  ["cyber", `Cyber ${eventCounts.cyber}`],
                  ["climate", `Climate ${eventCounts.climate}`],
                  ["supply_chain", `Supply ${eventCounts.supply_chain}`],
                ].map(([key, label]) => {
                  const categoryKey = key as EventCategoryFilter;
                  const enabled = layerState.eventCategories[categoryKey];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleEventCategory(categoryKey)}
                      className={`rounded-full border px-2.5 py-1.5 transition ${
                        enabled
                          ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-100"
                          : "border-white/10 bg-white/5 text-gray-500"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[9px] font-mono tracking-[0.2em] text-gray-500">
                INFRASTRUCTURE / CLIMATE / ROUTES
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  ["refinery", "Refineries"],
                  ["lng_terminal", "LNG terminals"],
                  ["storage", "Storage hubs"],
                ].map(([key, label]) => {
                  const infraKey = key as InfrastructureType;
                  const enabled = layerState.infrastructureTypes[infraKey];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleInfrastructureType(infraKey)}
                      className={`rounded-full border px-2.5 py-1.5 transition ${
                        enabled
                          ? "border-orange-400/40 bg-orange-400/10 text-orange-100"
                          : "border-white/10 bg-white/5 text-gray-500"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  ["heat", "Extreme heat"],
                  ["drought", "Drought stress"],
                  ["storm", "Storm watch"],
                ].map(([key, label]) => {
                  const climateKey = key as ClimateOverlayType;
                  const enabled = layerState.climateTypes[climateKey];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleClimateType(climateKey)}
                      className={`rounded-full border px-2.5 py-1.5 transition ${
                        enabled
                          ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                          : "border-white/10 bg-white/5 text-gray-500"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  ["energy", "Energy lanes"],
                  ["trade", "Trade lanes"],
                  ["strategic", "Strategic lanes"],
                ].map(([key, label]) => {
                  const routeKey = key as RouteGroup;
                  const enabled = layerState.routeGroups[routeKey];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleRouteGroup(routeKey)}
                      className={`rounded-full border px-2.5 py-1.5 transition ${
                        enabled
                          ? "border-sky-400/40 bg-sky-400/10 text-sky-100"
                          : "border-white/10 bg-white/5 text-gray-500"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
