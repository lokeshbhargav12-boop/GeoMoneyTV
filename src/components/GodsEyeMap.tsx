"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  CircleMarker,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { AircraftData, ShipData } from "./WorldGlobe";
import {
  LIVE_WEBCAMS,
  STREETVIEW_LOCATIONS,
  getStreetViewDirectUrl,
  getStreetViewEmbedUrl,
  type Webcam,
} from "@/lib/world-monitor-geo";

// ─── DARK MAP TILES ──────────────────────────────────────────
const DARK_TILES =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const SATELLITE_TILES =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

// ─── CUSTOM AIRCRAFT ICON ────────────────────────────────────
function createAircraftIcon(heading: number, category: string) {
  const color =
    category === "military"
      ? "#ef4444"
      : category === "cargo"
        ? "#f97316"
        : category === "commercial"
          ? "#06b6d4"
          : category === "private"
            ? "#22c55e"
            : "#9ca3af";
  return L.divIcon({
    className: "aircraft-icon",
    html: `<div style="transform:rotate(${heading}deg);color:${color};font-size:16px;filter:drop-shadow(0 0 4px ${color});">✈</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

// ─── CUSTOM SHIP ICON ────────────────────────────────────────
function createShipIcon(type: string) {
  const color =
    type === "military"
      ? "#ef4444"
      : type === "tanker"
        ? "#f97316"
        : type === "container"
          ? "#22c55e"
          : type === "lng"
            ? "#eab308"
            : type === "cruise"
              ? "#a855f7"
              : "#3b82f6";
  return L.divIcon({
    className: "ship-icon",
    html: `<div style="color:${color};font-size:14px;filter:drop-shadow(0 0 4px ${color});">🚢</div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

// ─── MAP CONTROLLER ──────────────────────────────────────────
function MapController({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [map, center, zoom]);
  return null;
}

// ─── CLICK-TO-STREETVIEW ─────────────────────────────────────
function StreetViewClickHandler({
  active,
  onDropPin,
}: {
  active: boolean;
  onDropPin: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (active) {
        onDropPin(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// ─── SCANNING LINE OVERLAY ───────────────────────────────────
function ScanOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none z-[1000] overflow-hidden">
      <div
        className="absolute left-0 right-0 h-[2px] opacity-30"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, #06b6d4 50%, transparent 100%)",
          animation: "scanDown 4s ease-in-out infinite",
        }}
      />
      <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-cyan-500/40" />
      <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-cyan-500/40" />
      <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-cyan-500/40" />
      <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-cyan-500/40" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-8 h-8 border border-cyan-500/20 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 border border-cyan-500/40 rounded-full" />
      </div>
      <style jsx>{`
        @keyframes scanDown {
          0%,
          100% {
            top: 0%;
          }
          50% {
            top: 100%;
          }
        }
      `}</style>
    </div>
  );
}

// ─── PEGMAN ICON (Street View cursor) ────────────────────────
function PegmanCursor({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="absolute inset-0 z-[999] pointer-events-none">
      <style jsx global>{`
        .leaflet-container.streetview-cursor {
          cursor:
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ctext x='4' y='20' font-size='20'%3E🚶%3C/text%3E%3C/svg%3E")
              12 24,
            crosshair !important;
        }
      `}</style>
    </div>
  );
}

// ─── PROPS ───────────────────────────────────────────────────
interface GodsEyeMapProps {
  aircraft: AircraftData[];
  ships: ShipData[];
  visible: boolean;
  onClose: () => void;
  selectedWebcam: Webcam | null;
  onSelectWebcam: (w: Webcam | null) => void;
}

// ─── MAIN COMPONENT ─────────────────────────────────────────
export default function GodsEyeMap({
  aircraft,
  ships,
  visible,
  onClose,
  selectedWebcam,
  onSelectWebcam,
}: GodsEyeMapProps) {
  const [mapMode, setMapMode] = useState<"dark" | "satellite">("dark");
  const [mapCenter, setMapCenter] = useState<[number, number]>([25, 42]);
  const [mapZoom, setMapZoom] = useState(3);
  const [showAircraft, setShowAircraft] = useState(true);
  const [showShips, setShowShips] = useState(true);
  const [showWebcams, setShowWebcams] = useState(true);

  // Street View state
  const [streetViewActive, setStreetViewActive] = useState(false);
  const [streetViewLocation, setStreetViewLocation] = useState<{
    lat: number;
    lng: number;
    heading?: number;
  } | null>(null);
  const [streetViewHeading, setStreetViewHeading] = useState(0);
  const [streetViewPitch, setStreetViewPitch] = useState(0);
  const [streetViewFov, setStreetViewFov] = useState(90);

  // Sidebar tab
  const [sidebarTab, setSidebarTab] = useState<"cameras" | "streetview">(
    "cameras",
  );

  // Ref for map container class toggling
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Toggle pegman cursor on map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const container =
      mapContainerRef.current.querySelector(".leaflet-container");
    if (container) {
      if (streetViewActive && !streetViewLocation) {
        container.classList.add("streetview-cursor");
      } else {
        container.classList.remove("streetview-cursor");
      }
    }
  }, [streetViewActive, streetViewLocation]);

  // Fly to webcam on selection
  useEffect(() => {
    if (selectedWebcam) {
      setMapCenter([selectedWebcam.lat, selectedWebcam.lng]);
      setMapZoom(14);
      setStreetViewLocation(null); // Close street view when selecting cam
    }
  }, [selectedWebcam]);

  const handleStreetViewDrop = useCallback(
    (lat: number, lng: number) => {
      setStreetViewLocation({ lat, lng, heading: 0 });
      setStreetViewHeading(0);
      setStreetViewPitch(0);
      setStreetViewFov(90);
      onSelectWebcam(null); // Close any webcam
    },
    [onSelectWebcam],
  );

  const handleStreetViewPreset = useCallback(
    (loc: (typeof STREETVIEW_LOCATIONS)[0]) => {
      setMapCenter([loc.lat, loc.lng]);
      setMapZoom(16);
      setStreetViewLocation({
        lat: loc.lat,
        lng: loc.lng,
        heading: loc.heading,
      });
      setStreetViewHeading(loc.heading);
      setStreetViewPitch(0);
      setStreetViewActive(true);
      onSelectWebcam(null);
    },
    [onSelectWebcam],
  );

  // Google Maps Street View — use @lat,lng,3a format which works without API key
  const streetViewIframeUrl = streetViewLocation
    ? getStreetViewEmbedUrl(
        streetViewLocation.lat,
        streetViewLocation.lng,
        streetViewHeading,
        streetViewPitch,
      )
    : null;

  // Direct link for "Full Google Maps" button
  const streetViewDirectUrl = streetViewLocation
    ? getStreetViewDirectUrl(
        streetViewLocation.lat,
        streetViewLocation.lng,
        streetViewHeading,
        streetViewPitch,
        streetViewFov,
      )
    : null;

  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-30 flex">
      {/* ═══ MAP AREA ════════════════════════════════════════ */}
      <div className="flex-1 relative" ref={mapContainerRef}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          className="w-full h-full"
          zoomControl={false}
          attributionControl={false}
          style={{ background: "#0a0a0a" }}
        >
          <MapController center={mapCenter} zoom={mapZoom} />
          <StreetViewClickHandler
            active={streetViewActive && !streetViewLocation}
            onDropPin={handleStreetViewDrop}
          />

          {/* Tile Layer */}
          <TileLayer
            url={mapMode === "dark" ? DARK_TILES : SATELLITE_TILES}
            maxZoom={19}
          />

          {/* Aircraft markers */}
          {showAircraft &&
            aircraft.slice(0, 500).map((ac) => (
              <Marker
                key={ac.icao24}
                position={[ac.latitude, ac.longitude]}
                icon={createAircraftIcon(ac.heading, ac.category)}
              >
                <Popup>
                  <div className="text-xs font-mono bg-gray-900 text-white p-2 rounded -m-3 min-w-[180px]">
                    <div className="font-bold text-cyan-400">
                      {ac.callsign || ac.icao24}
                    </div>
                    <div className="text-gray-400">{ac.origin_country}</div>
                    <div className="grid grid-cols-2 gap-1 mt-1 text-[10px]">
                      <span>Alt: {Math.round(ac.altitude)}m</span>
                      <span>Spd: {Math.round(ac.velocity)}m/s</span>
                      <span>Hdg: {Math.round(ac.heading)}°</span>
                      <span className="uppercase">{ac.category}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Ship markers */}
          {showShips &&
            ships.map((ship) => (
              <Marker
                key={ship.mmsi}
                position={[ship.latitude, ship.longitude]}
                icon={createShipIcon(ship.type)}
              >
                <Popup>
                  <div className="text-xs font-mono bg-gray-900 text-white p-2 rounded -m-3 min-w-[180px]">
                    <div className="font-bold text-orange-400">{ship.name}</div>
                    <div className="text-gray-400">
                      {ship.flagEmoji} {ship.flag} · {ship.type}
                    </div>
                    <div className="grid grid-cols-2 gap-1 mt-1 text-[10px]">
                      <span>Speed: {ship.speed.toFixed(1)}kn</span>
                      <span>Len: {ship.length}m</span>
                      <span className="col-span-2">→ {ship.destination}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Webcam markers */}
          {showWebcams &&
            LIVE_WEBCAMS.map((cam) => (
              <CircleMarker
                key={cam.id}
                center={[cam.lat, cam.lng]}
                radius={6}
                pathOptions={{
                  color: "#a855f7",
                  fillColor: "#a855f7",
                  fillOpacity: 0.6,
                  weight: 2,
                }}
                eventHandlers={{ click: () => onSelectWebcam(cam) }}
              >
                <Popup>
                  <div className="text-xs font-mono bg-gray-900 text-white p-2 rounded -m-3">
                    <div className="font-bold text-purple-400">{cam.title}</div>
                    <div className="text-gray-400">{cam.country}</div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

          {/* Street View drop pin */}
          {streetViewLocation && (
            <CircleMarker
              center={[streetViewLocation.lat, streetViewLocation.lng]}
              radius={8}
              pathOptions={{
                color: "#facc15",
                fillColor: "#facc15",
                fillOpacity: 0.8,
                weight: 3,
              }}
            />
          )}
        </MapContainer>

        {/* Scan overlay */}
        <ScanOverlay />
        <PegmanCursor active={streetViewActive && !streetViewLocation} />

        {/* ─── STREET VIEW GUIDE (when pegman mode active) ── */}
        {streetViewActive && !streetViewLocation && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1001] pointer-events-none">
            <div className="bg-black/70 backdrop-blur-2xl border border-yellow-500/30 rounded-2xl px-6 py-4 text-center">
              <div className="text-3xl mb-2">🚶</div>
              <div className="text-sm font-bold text-yellow-400 mb-1">
                Street View Mode
              </div>
              <div className="text-[11px] text-gray-400">
                Click anywhere on the map to drop into Street View
              </div>
            </div>
          </div>
        )}

        {/* ─── TOP BAR (Vision Pro glass) ─────────────────── */}
        <div className="absolute top-3 left-3 right-3 z-[1001] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-black/50 backdrop-blur-2xl border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[11px] font-mono text-cyan-400 tracking-wider">
                GEOMONEY APERTURE ACTIVE
              </span>
            </div>
            <div className="bg-black/50 backdrop-blur-2xl border border-white/10 rounded-2xl px-3 py-2 flex items-center gap-2">
              <span className="text-[10px] text-gray-400 font-mono">
                {aircraft.length.toLocaleString()} AIRCRAFT
              </span>
              <span className="text-white/20">|</span>
              <span className="text-[10px] text-gray-400 font-mono">
                {ships.length} VESSELS
              </span>
              <span className="text-white/20">|</span>
              <span className="text-[10px] text-gray-400 font-mono">
                {LIVE_WEBCAMS.length} STREAMS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Layer toggles */}
            <div className="bg-black/50 backdrop-blur-2xl border border-white/10 rounded-2xl px-1 py-1 flex items-center gap-1">
              {[
                {
                  label: "✈",
                  active: showAircraft,
                  toggle: () => setShowAircraft(!showAircraft),
                },
                {
                  label: "🚢",
                  active: showShips,
                  toggle: () => setShowShips(!showShips),
                },
                {
                  label: "📷",
                  active: showWebcams,
                  toggle: () => setShowWebcams(!showWebcams),
                },
              ].map((t) => (
                <button
                  key={t.label}
                  onClick={t.toggle}
                  className={`px-2.5 py-1.5 rounded-xl text-sm transition-all ${
                    t.active
                      ? "bg-white/10 border border-white/20"
                      : "opacity-40 hover:opacity-70"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Street View toggle (Pegman) */}
            <button
              onClick={() => {
                if (streetViewActive) {
                  setStreetViewActive(false);
                  setStreetViewLocation(null);
                } else {
                  setStreetViewActive(true);
                  setSidebarTab("streetview");
                }
              }}
              className={`bg-black/50 backdrop-blur-2xl border rounded-2xl px-3 py-2 flex items-center gap-2 transition-all ${
                streetViewActive
                  ? "border-yellow-500/40 bg-yellow-500/10"
                  : "border-white/10 hover:border-yellow-500/20"
              }`}
            >
              <span className="text-base">🚶</span>
              <span
                className={`text-[10px] font-mono ${streetViewActive ? "text-yellow-400" : "text-gray-400"}`}
              >
                STREET VIEW
              </span>
            </button>

            {/* Map mode */}
            <div className="bg-black/50 backdrop-blur-2xl border border-white/10 rounded-2xl px-1 py-1 flex items-center gap-1">
              <button
                onClick={() => setMapMode("dark")}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-mono transition-all ${
                  mapMode === "dark"
                    ? "bg-white/10 text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                DARK
              </button>
              <button
                onClick={() => setMapMode("satellite")}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-mono transition-all ${
                  mapMode === "satellite"
                    ? "bg-white/10 text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                SAT
              </button>
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="bg-black/50 backdrop-blur-2xl border border-white/10 rounded-2xl w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:border-red-500/30 transition-all"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ─── QUICK JUMP BUTTONS (bottom) ────────────────── */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1001]">
          <div className="bg-black/50 backdrop-blur-2xl border border-white/10 rounded-2xl px-2 py-2 flex items-center gap-1">
            {[
              { label: "Hormuz", lat: 26.5, lng: 56.2, z: 7 },
              { label: "Malacca", lat: 2.5, lng: 101.5, z: 7 },
              { label: "Suez", lat: 30.4, lng: 32.3, z: 8 },
              { label: "Taiwan", lat: 24.0, lng: 119.5, z: 6 },
              { label: "Europe", lat: 50, lng: 10, z: 4 },
              { label: "USA", lat: 39, lng: -98, z: 4 },
              { label: "Middle East", lat: 28, lng: 46, z: 5 },
              { label: "Global", lat: 25, lng: 42, z: 2 },
            ].map((loc) => (
              <button
                key={loc.label}
                onClick={() => {
                  setMapCenter([loc.lat, loc.lng]);
                  setMapZoom(loc.z);
                }}
                className="px-3 py-1.5 rounded-xl text-[10px] font-mono text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                {loc.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── LIVE STREAM Picture-in-Picture ─────────────── */}
        {selectedWebcam && !streetViewLocation && (
          <div className="absolute bottom-16 right-4 z-[1001] w-[420px]">
            <div className="bg-black/80 backdrop-blur-2xl border border-purple-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/10">
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-red-400 tracking-wider">
                    ● LIVE STREAM
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 font-mono">
                    {selectedWebcam.title}
                  </span>
                  <button
                    onClick={() => onSelectWebcam(null)}
                    className="text-gray-500 hover:text-white text-xs ml-2"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="relative aspect-video bg-gray-950">
                <iframe
                  src={selectedWebcam.embedUrl}
                  className="w-full h-full"
                  allow="autoplay; encrypted-media; accelerometer; gyroscope"
                  allowFullScreen
                  title={selectedWebcam.title}
                  style={{ border: "none" }}
                />
                {/* CRT scan lines */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-[0.06]"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 4px)",
                  }}
                />
                {/* LIVE badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600/90 px-2 py-0.5 rounded text-[9px] font-mono text-white">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  LIVE
                </div>
                {/* Timestamp */}
                <div className="absolute bottom-2 right-2 text-[9px] font-mono text-gray-400 bg-black/60 px-2 py-0.5 rounded">
                  {new Date().toLocaleTimeString()} UTC
                </div>
              </div>
              {/* Open in Street View button */}
              <div className="px-3 py-2 flex items-center justify-between bg-black/40">
                <span className="text-[9px] text-gray-600 font-mono">
                  {selectedWebcam.lat.toFixed(4)}°,{" "}
                  {selectedWebcam.lng.toFixed(4)}°
                </span>
                <button
                  onClick={() => {
                    handleStreetViewDrop(
                      selectedWebcam.lat,
                      selectedWebcam.lng,
                    );
                    setStreetViewActive(true);
                    onSelectWebcam(null);
                  }}
                  className="text-[9px] font-mono text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                >
                  🚶 Open Street View
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── STREET VIEW Panel (overlays on map) ────────── */}
        {streetViewLocation && (
          <div className="absolute bottom-16 right-4 z-[1001] w-[480px]">
            <div className="bg-black/80 backdrop-blur-2xl border border-yellow-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-yellow-500/10">
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-base">🚶</span>
                  <span className="text-[10px] font-mono text-yellow-400 tracking-wider">
                    STREET VIEW
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 font-mono">
                    {streetViewLocation.lat.toFixed(4)}°,{" "}
                    {streetViewLocation.lng.toFixed(4)}°
                  </span>
                  <button
                    onClick={() => {
                      setStreetViewLocation(null);
                      setStreetViewActive(false);
                    }}
                    className="text-gray-500 hover:text-white text-xs ml-2"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Street View iframe */}
              <div className="relative aspect-[16/10] bg-gray-950">
                <iframe
                  key={`sv-${streetViewLocation.lat}-${streetViewLocation.lng}-${streetViewHeading}-${streetViewPitch}`}
                  src={streetViewIframeUrl || ""}
                  className="w-full h-full"
                  allow="autoplay; encrypted-media; accelerometer; gyroscope"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Street View"
                  style={{ border: "none" }}
                />
                {/* Street View badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-yellow-600/90 px-2 py-0.5 rounded text-[9px] font-mono text-white">
                  🚶 STREET VIEW
                </div>
              </div>

              {/* Controls */}
              <div className="px-3 py-2 border-t border-white/10 bg-black/40">
                <div className="flex items-center justify-between">
                  {/* Heading controls */}
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-gray-600 font-mono mr-1">
                      HEADING:
                    </span>
                    {[0, 90, 180, 270].map((h) => (
                      <button
                        key={h}
                        onClick={() => setStreetViewHeading(h)}
                        className={`px-2 py-0.5 rounded text-[9px] font-mono transition-all ${
                          streetViewHeading === h
                            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                            : "text-gray-500 hover:text-white"
                        }`}
                      >
                        {h === 0 ? "N" : h === 90 ? "E" : h === 180 ? "S" : "W"}
                      </button>
                    ))}
                  </div>
                  {/* Full screen link */}
                  <a
                    href={streetViewDirectUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    ↗ Full Google Maps
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ SIDEBAR ═══════════════════════════════════════ */}
      <div className="w-[270px] bg-black/70 backdrop-blur-2xl border-l border-white/5 flex flex-col shrink-0">
        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setSidebarTab("cameras")}
            className={`flex-1 py-2.5 text-[10px] font-mono tracking-wider transition-all ${
              sidebarTab === "cameras"
                ? "text-purple-400 border-b-2 border-purple-400 bg-purple-500/5"
                : "text-gray-500 hover:text-white"
            }`}
          >
            📡 LIVE STREAMS
          </button>
          <button
            onClick={() => setSidebarTab("streetview")}
            className={`flex-1 py-2.5 text-[10px] font-mono tracking-wider transition-all ${
              sidebarTab === "streetview"
                ? "text-yellow-400 border-b-2 border-yellow-400 bg-yellow-500/5"
                : "text-gray-500 hover:text-white"
            }`}
          >
            🚶 STREET VIEW
          </button>
        </div>

        {/* ─── CAMERAS TAB ────────────────────────────────── */}
        {sidebarTab === "cameras" && (
          <>
            <div className="px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-sm">📡</span>
                <span className="text-[11px] font-bold tracking-wider">
                  SURVEILLANCE FEEDS
                </span>
              </div>
              <p className="text-[9px] text-gray-600 mt-0.5 font-mono">
                {LIVE_WEBCAMS.length} LIVE GLOBAL STREAMS
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {LIVE_WEBCAMS.map((cam) => (
                <button
                  key={cam.id}
                  onClick={() => onSelectWebcam(cam)}
                  className={`w-full text-left px-3 py-2.5 border-b border-white/5 hover:bg-white/5 transition-all ${
                    selectedWebcam?.id === cam.id ? "bg-purple-500/10" : ""
                  }`}
                >
                  <div className="flex gap-2.5">
                    <div className="w-16 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-800 relative">
                      <img
                        src={cam.thumbnail}
                        alt={cam.title}
                        className="w-full h-full object-cover"
                      />
                      {/* Live indicator */}
                      <div className="absolute top-0.5 left-0.5 flex items-center gap-0.5 bg-red-600/90 px-1 rounded text-[7px] font-mono text-white">
                        <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
                        LIVE
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold text-white truncate">
                        {cam.title}
                      </div>
                      <div className="text-[9px] text-gray-500 font-mono">
                        {cam.country} · {cam.lat.toFixed(2)}°,{" "}
                        {cam.lng.toFixed(2)}°
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[8px] text-red-400 font-mono">
                          STREAMING
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ─── STREET VIEW TAB ────────────────────────────── */}
        {sidebarTab === "streetview" && (
          <>
            <div className="px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-sm">🚶</span>
                <span className="text-[11px] font-bold tracking-wider">
                  STREET VIEW
                </span>
              </div>
              <p className="text-[9px] text-gray-600 mt-0.5 font-mono">
                WALK ANYWHERE ON EARTH
              </p>
            </div>

            {/* Drop pin instruction */}
            <div className="px-4 py-3 border-b border-white/5">
              <button
                onClick={() => {
                  setStreetViewActive(!streetViewActive);
                  if (streetViewActive) setStreetViewLocation(null);
                }}
                className={`w-full py-2.5 rounded-xl text-[11px] font-mono font-bold tracking-wider transition-all flex items-center justify-center gap-2 ${
                  streetViewActive
                    ? "bg-yellow-500/20 border border-yellow-500/40 text-yellow-400"
                    : "bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-yellow-500/20"
                }`}
              >
                <span className="text-lg">🚶</span>
                {streetViewActive
                  ? "PEGMAN ACTIVE — Click Map"
                  : "DROP PEGMAN ON MAP"}
              </button>
            </div>

            {/* Strategic locations */}
            <div className="px-4 py-3 border-b border-white/5">
              <div className="text-[9px] text-gray-600 font-mono uppercase mb-2">
                STRATEGIC LOCATIONS
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {STREETVIEW_LOCATIONS.map((loc) => (
                  <button
                    key={loc.label}
                    onClick={() => handleStreetViewPreset(loc)}
                    className={`px-2 py-1.5 rounded-lg text-[9px] font-mono text-left transition-all border ${
                      streetViewLocation &&
                      Math.abs(streetViewLocation.lat - loc.lat) < 0.01 &&
                      Math.abs(streetViewLocation.lng - loc.lng) < 0.01
                        ? "bg-yellow-500/15 border-yellow-500/30 text-yellow-400"
                        : "bg-white/5 border-white/5 text-gray-400 hover:text-white hover:border-yellow-500/20"
                    }`}
                  >
                    {loc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Current coordinates */}
            {streetViewLocation && (
              <div className="px-4 py-3 border-b border-white/5">
                <div className="text-[9px] text-gray-600 font-mono uppercase mb-2">
                  CURRENT POSITION
                </div>
                <div className="bg-white/5 rounded-lg p-2 space-y-1">
                  <div className="flex justify-between text-[9px] font-mono">
                    <span className="text-gray-500">LAT</span>
                    <span className="text-yellow-400">
                      {streetViewLocation.lat.toFixed(6)}°
                    </span>
                  </div>
                  <div className="flex justify-between text-[9px] font-mono">
                    <span className="text-gray-500">LNG</span>
                    <span className="text-yellow-400">
                      {streetViewLocation.lng.toFixed(6)}°
                    </span>
                  </div>
                  <div className="flex justify-between text-[9px] font-mono">
                    <span className="text-gray-500">HDG</span>
                    <span className="text-yellow-400">
                      {streetViewHeading}°
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="px-4 py-3 flex-1">
              <div className="text-[9px] text-gray-700 font-mono space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600">1.</span>
                  <span>
                    Click &quot;Drop Pegman&quot; or select a strategic location
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600">2.</span>
                  <span>Click any point on the map to enter Street View</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600">3.</span>
                  <span>Use N/E/S/W buttons to rotate view direction</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600">4.</span>
                  <span>
                    Navigate inside the Street View panel or open full Google
                    Maps
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export type { Webcam };
