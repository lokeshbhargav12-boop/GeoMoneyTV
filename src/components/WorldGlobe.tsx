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
}

export interface ShipData {
  mmsi: string;
  name: string;
  type: string;
  flag: string;
  flagEmoji: string;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  destination: string;
  length: number;
}

interface GlobeProps {
  events: GlobeEvent[];
  onEventClick?: (event: GlobeEvent) => void;
  selectedEvent?: GlobeEvent | null;
  aircraft?: AircraftData[];
  ships?: ShipData[];
  onZoomChange?: (zoom: number) => void;
}

// ─── CONSTANTS ───────────────────────────────────────────────
const GLOBE_RADIUS = 2;
const POINT_ALTITUDE = 0.02;

// Multiple CDN sources for texture reliability
const EARTH_DAY_URLS = [
  "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
  "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg",
  "https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-blue-marble.jpg",
];
const EARTH_NIGHT_URLS = [
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
        <meshStandardMaterial
          map={dayMap}
          roughness={1}
          metalness={0}
          envMapIntensity={0}
        />
      ) : (
        <meshStandardMaterial color="#1a3a6a" roughness={1} metalness={0} />
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
        opacity={0.15}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
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
      mat.opacity = 0.35 + Math.sin(clock.getElapsedTime() * 0.5) * 0.05;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color="#FDB813"
        size={0.03}
        sizeAttenuation
        transparent
        opacity={0.35}
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
      mat.opacity = 0.08 + Math.sin(clock.getElapsedTime() * 0.3) * 0.02;
    }
  });

  return (
    <>
      <Sphere args={[GLOBE_RADIUS + 0.04, 64, 64]} ref={innerRef}>
        <meshBasicMaterial
          color="#4488CC"
          transparent
          opacity={0.04}
          side={THREE.BackSide}
        />
      </Sphere>
      <Sphere args={[GLOBE_RADIUS + 0.12, 64, 64]}>
        <meshBasicMaterial
          color="#2266AA"
          transparent
          opacity={0.025}
          side={THREE.BackSide}
        />
      </Sphere>
      <Sphere args={[GLOBE_RADIUS + 0.25, 64, 64]}>
        <meshBasicMaterial
          color="#1144AA"
          transparent
          opacity={0.012}
          side={THREE.BackSide}
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
function RealAircraftLayer({ aircraft }: { aircraft: AircraftData[] }) {
  const pointsRef = useRef<THREE.Points>(null);
  const [hovered, setHovered] = useState<AircraftData | null>(null);

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
      <points ref={pointsRef} geometry={geometry}>
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
function RealShipLayer({ ships }: { ships: ShipData[] }) {
  const [hovered, setHovered] = useState<ShipData | null>(null);

  const shipMeshes = useMemo(() => {
    return ships.map((ship) => {
      const pos = latLngToVector3(
        ship.latitude,
        ship.longitude,
        GLOBE_RADIUS + 0.008,
      );
      const color =
        ship.type === "tanker"
          ? "#FF6600"
          : ship.type === "container"
            ? "#00CC88"
            : ship.type === "military"
              ? "#FF2222"
              : ship.type === "lng"
                ? "#FFAA00"
                : ship.type === "cruise"
                  ? "#CC66FF"
                  : ship.type === "bulk"
                    ? "#6688CC"
                    : ship.type === "fishing"
                      ? "#44AAAA"
                      : "#888888";
      return { ship, pos, color };
    });
  }, [ships]);

  return (
    <>
      {shipMeshes.map(({ ship, pos, color }) => (
        <group key={ship.mmsi} position={pos}>
          <mesh
            onPointerOver={() => setHovered(ship)}
            onPointerOut={() => setHovered(null)}
          >
            <coneGeometry args={[0.012, 0.025, 3]} />
            <meshBasicMaterial color={color} transparent opacity={0.9} />
          </mesh>
          {/* Ship glow */}
          <mesh>
            <sphereGeometry args={[0.008, 8, 8]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.3}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      ))}
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

// ─── MAIN GLOBE SCENE ───────────────────────────────────────
function GlobeScene({
  events,
  onEventClick,
  selectedEvent,
  aircraft,
  ships,
  onZoomChange,
}: GlobeProps) {
  const globeRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (globeRef.current) {
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

  const shipAnimations = useMemo(
    () =>
      SHIPPING_ROUTES.map((route, i) => ({
        ...route,
        speed: 0.03 + Math.random() * 0.04,
        offset: i * 0.7,
      })),
    [],
  );

  const flightAnimations = useMemo(
    () =>
      FLIGHT_ROUTES.map((route, i) => ({
        ...route,
        offset: i * 0.5 + Math.random() * 2,
      })),
    [],
  );

  return (
    <>
      {/* Lighting — for meshStandardMaterial with flat (NoToneMapping) */}
      <ambientLight intensity={1.8} />
      <directionalLight position={[5, 3, 5]} intensity={0.8} color="#FFFFFF" />

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
        <CityLightsLayer />

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

        {/* Shipping route arcs */}
        {SHIPPING_ROUTES.map((route, i) => (
          <ArcLine
            key={`route-${i}`}
            from={route.from}
            to={route.to}
            color={route.color}
            opacity={0.55}
          />
        ))}

        {/* Animated ship markers moving along routes */}
        {shipAnimations.map((ship, i) => (
          <AnimatedShip
            key={`ship-${i}`}
            from={ship.from}
            to={ship.to}
            speed={ship.speed}
            offset={ship.offset}
            color={ship.color}
          />
        ))}

        {/* Animated flight markers on air corridors */}
        {flightAnimations.map((flight, i) => (
          <AnimatedFlight
            key={`flight-${i}`}
            from={flight.from}
            to={flight.to}
            speed={flight.speed}
            offset={flight.offset}
            color={flight.color}
          />
        ))}

        {/* Chokepoint markers */}
        {CHOKEPOINTS.map((cp) => (
          <ChokepointMarker
            key={cp.name}
            lat={cp.lat}
            lng={cp.lng}
            name={cp.name}
            type={cp.type}
          />
        ))}

        {/* Event points from OSINT / articles */}
        {events.map((event) =>
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
        <ConnectionArcs events={events} />

        {/* REAL AIRCRAFT from OpenSky Network */}
        {aircraft && aircraft.length > 0 && (
          <RealAircraftLayer aircraft={aircraft} />
        )}

        {/* REAL-TIME SHIP TRACKING */}
        {ships && ships.length > 0 && <RealShipLayer ships={ships} />}

        {/* Enhanced satellites with solar panels & trails */}
        {SATELLITE_ORBITS.map((orbit, i) => (
          <SatelliteWithTrail key={`sat-${i}`} {...orbit} />
        ))}
      </group>

      {/* Zoom level detection */}
      <ZoomDetector onZoomChange={onZoomChange} />

      <OrbitControls
        enableZoom
        enablePan={false}
        minDistance={2.5}
        maxDistance={8}
        autoRotate={false}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
      />
    </>
  );
}

// ─── EXPORTED GLOBE WRAPPER ─────────────────────────────────
export default function WorldGlobe({
  events,
  onEventClick,
  selectedEvent,
  aircraft,
  ships,
  onZoomChange,
}: GlobeProps) {
  const [contextLost, setContextLost] = useState(false);
  const [key, setKey] = useState(0);

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
        flat
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          failIfMajorPerformanceCaveat: false,
        }}
        style={{ background: "transparent" }}
        dpr={Math.min(window.devicePixelRatio, 1.5)}
        onCreated={onCreated}
      >
        <GlobeScene
          events={events}
          onEventClick={onEventClick}
          selectedEvent={selectedEvent}
          aircraft={aircraft}
          ships={ships}
          onZoomChange={onZoomChange}
        />
      </Canvas>

      {/* Live tracking indicator */}
      <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[10px] font-mono text-green-400">
          LIVE TRACKING
        </span>
      </div>

      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-xl border border-white/10 rounded-xl p-3 text-[10px] space-y-1.5">
        <div className="text-gray-400 font-mono tracking-wider mb-2 text-[9px]">
          LEGEND
        </div>
        {[
          { color: "bg-red-500", label: "Military / Critical" },
          { color: "bg-orange-500", label: "Energy / Supply Chain" },
          { color: "bg-yellow-500", label: "Geopolitical" },
          { color: "bg-blue-500", label: "Economic" },
          { color: "bg-purple-500", label: "Cyber / Technology" },
          { color: "bg-emerald-500", label: "Climate / Stable" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${color}`}
              style={{ boxShadow: "0 0 4px currentColor" }}
            />
            <span className="text-gray-400">{label}</span>
          </div>
        ))}
        <div className="border-t border-white/5 mt-2 pt-2 space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-geo-gold/60" />
            <span className="text-gray-400">Shipping Routes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-l-transparent border-r-transparent border-b-green-400" />
            <span className="text-gray-400">Active Vessels</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-cyan-400/60" />
            <span className="text-gray-400">Flight Corridors</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-l-transparent border-r-transparent border-b-white" />
            <span className="text-gray-400">Active Flights</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rotate-45 border border-red-500" />
            <span className="text-gray-400">Chokepoints</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-400" />
            <span className="text-gray-400">Satellites</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full bg-amber-400"
              style={{ boxShadow: "0 0 4px #FDB813" }}
            />
            <span className="text-gray-400">City Lights</span>
          </div>
        </div>
      </div>
    </div>
  );
}
