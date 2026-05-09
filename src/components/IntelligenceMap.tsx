"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  Polyline,
  useMapEvents,
  useMap,
  Rectangle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Ship, Crosshair, Thermometer } from "lucide-react";
// @ts-ignore: Suppress remote build type error for react-dom/server
import { renderToStaticMarkup } from "react-dom/server";

// --- MOCK DATA FOR REFINERIES & CHOKEPOINTS ---
const THERMAL_REFINERIES = [
  {
    id: 1,
    pos: [26.65, 50.0] as [number, number],
    name: "Ras Tanura",
    output: "Highest",
    diff: "+4%",
  },
  {
    id: 2,
    pos: [22.4, 69.8] as [number, number],
    name: "Jamnagar",
    output: "Stable",
    diff: "-1%",
  },
  {
    id: 3,
    pos: [51.9, 4.1] as [number, number],
    name: "Rotterdam Comb.",
    output: "Low",
    diff: "-12%",
  },
  {
    id: 4,
    pos: [29.7, -95.2] as [number, number],
    name: "Houston Ship Ch.",
    output: "Elevated",
    diff: "+8%",
  },
  {
    id: 5,
    pos: [35.5, 129.3] as [number, number],
    name: "Ulsan",
    output: "Stable",
    diff: "0%",
  },
];

const MAJOR_ROUTES = [
  {
    id: "hormuz",
    path: [
      [26.5, 56.2],
      [24.0, 58.0],
    ] as [number, number][],
    name: "Strait of Hormuz",
  },
  {
    id: "malacca",
    path: [
      [5.5, 98.0],
      [1.2, 103.5],
    ] as [number, number][],
    name: "Strait of Malacca",
  },
  {
    id: "suez",
    path: [
      [29.9, 32.5],
      [27.7, 34.0],
      [25.0, 35.0],
    ] as [number, number][],
    name: "Suez Canal Corridor",
  },
];

// ─── BOUNDING BOX SELECTION TOOL ─────────────────────────────
function BboxDrawer({
  active,
  currentBbox,
  onBboxChange,
}: {
  active: boolean;
  currentBbox: L.LatLngBounds | null;
  onBboxChange: (bounds: L.LatLngBounds | null) => void;
}) {
  const map = useMap();
  const [start, setStart] = useState<L.LatLng | null>(null);
  const [end, setEnd] = useState<L.LatLng | null>(null);

  useEffect(() => {
    if (active) {
      map.dragging.disable();
    } else {
      map.dragging.enable();
      setStart(null);
      setEnd(null);
    }
  }, [active, map]);

  useMapEvents({
    mousedown(e) {
      if (!active) return;
      setStart(e.latlng);
      setEnd(e.latlng);
      onBboxChange(null);
    },
    mousemove(e) {
      if (!active || !start) return;
      setEnd(e.latlng);
    },
    mouseup(e) {
      if (!active || !start || !end) return;
      const bounds = L.latLngBounds(start, end);
      onBboxChange(bounds);
      setStart(null);
      setEnd(null);
    },
  });

  if (start && end) {
    return <Rectangle bounds={L.latLngBounds(start, end)} pathOptions={{ color: '#06b6d4', weight: 2, fillOpacity: 0.2 }} />;
  }
  
  if (currentBbox) {
    return <Rectangle bounds={currentBbox} pathOptions={{ color: '#06b6d4', weight: 2, fillOpacity: 0.1 }} />;
  }

  return null;
}

export default function IntelligenceMap({
  activeLayer,
  ships = [],
  bboxMode = false,
  selectedBbox = null,
  setSelectedBbox = () => {},
}: {
  activeLayer: string;
  ships?: any[];
  bboxMode?: boolean;
  selectedBbox?: L.LatLngBounds | null;
  setSelectedBbox?: (bounds: L.LatLngBounds | null) => void;
}) {
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
  }, []);

  const createIcon = (iconMarkup: React.ReactNode, addClass: string = "") =>
    L.divIcon({
      html: renderToStaticMarkup(iconMarkup),
      className: `bg-transparent ${addClass}`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

  const shipIcon = createIcon(
    <div className="relative group">
      <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500" />
      <Ship className="text-blue-500 w-5 h-5 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
    </div>,
  );

  const shadowIcon = createIcon(
    <div className="relative">
      <div className="absolute inset-0 bg-purple-600 rounded-full animate-ping opacity-30" />
      <Crosshair className="text-purple-400 w-6 h-6 animate-pulse" />
    </div>,
  );

  const thermalIcon = createIcon(
    <Thermometer className="text-orange-500 w-6 h-6 drop-shadow-[0_0_10px_rgba(249,115,22,1)]" />,
  );

  // Real-time anomalies logic for shadow fleets
  const anomalousShips = ships.filter(
    (s) =>
      (s.speed === 0 && s.status === "underway") ||
      (s.type === "cargo" && s.speed > 25),
  );

  const owmKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  return (
    <MapContainer
      center={[25, 0]}
      zoom={3}
      zoomControl={true}
      scrollWheelZoom={true}
      dragging={true}
      className="h-full w-full bg-black/90"
      attributionControl={false}
    >
      <BboxDrawer active={bboxMode} currentBbox={selectedBbox} onBboxChange={setSelectedBbox} />

      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
        attribution=""
      />

      {/* WEATHER LAYERS FROM OPENWEATHERMAP */}
      {activeLayer === "temp" && owmKey && (
        <TileLayer
          url={`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${owmKey}`}
          opacity={0.6}
        />
      )}
      {activeLayer === "wind" && owmKey && (
        <TileLayer
          url={`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${owmKey}`}
          opacity={0.6}
        />
      )}
      {activeLayer === "rain" && owmKey && (
        <TileLayer
          url={`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${owmKey}`}
          opacity={0.6}
        />
      )}
      {activeLayer === "storm" && owmKey && (
        <TileLayer
          url={`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${owmKey}`}
          opacity={0.6}
        />
      )}

      {/* AIS LAYER USING REAL SHIP DATA */}
      {activeLayer === "ais" &&
        ships.map((vessel: any, idx) => (
          <Marker
            key={`ais-${vessel.mmsi || idx}`}
            position={[vessel.latitude, vessel.longitude]}
            icon={shipIcon}
          >
            <Popup className="geo-popup">
              <div className="bg-black/90 border border-blue-500/30 p-2 rounded-lg text-white text-xs">
                <span className="text-blue-400 font-bold">
                  {vessel.name} ({vessel.type})
                </span>
                <br />
                SPD: {vessel.speed} kn | DST: {vessel.destination || "N/A"}
                <br />
                <span className="text-[10px] text-zinc-500 mt-1 inline-block">
                  MMSI: {vessel.mmsi}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}

      {/* SHADOW MODE LAYER */}
      {activeLayer === "shadow" &&
        anomalousShips.map((vessel: any, idx) => (
          <Marker
            key={`shadow-${vessel.mmsi || idx}`}
            position={[vessel.latitude, vessel.longitude]}
            icon={shadowIcon}
          >
            <Popup className="geo-popup" autoPan={false}>
              <div className="bg-purple-900/60 border border-purple-500/30 p-2 rounded-lg text-purple-200 text-xs font-bold tracking-wider">
                [CLASSIFIED TARGET]
                <br />
                <span className="text-red-400/80 font-normal">
                  ANOMALY DETECTED
                </span>
                <br />
                MMSI: {vessel.mmsi} | SPD: {vessel.speed} kn
              </div>
            </Popup>
          </Marker>
        ))}

      {/* THERMAL / INFRASTRUCTURE LAYER */}
      {activeLayer === "thermal" &&
        THERMAL_REFINERIES.map((ref) => (
          <Marker
            key={`thermal-${ref.id}`}
            position={ref.pos}
            icon={thermalIcon}
          >
            <Popup className="geo-popup" autoPan={false}>
              <div className="bg-orange-950/80 border border-orange-500/40 p-2 rounded-lg text-orange-200 text-xs">
                <span className="font-bold border-b border-orange-500/30 pb-1 mb-1 block">
                  {ref.name}
                </span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <span>Sign:</span>
                  <span
                    className={
                      ref.diff.startsWith("+")
                        ? "text-red-400"
                        : "text-blue-400"
                    }
                  >
                    {ref.output}
                  </span>
                  <span>Var:</span>
                  <span>{ref.diff}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

      {/* SHIP TRAILS / ROUTES (Lines) */}
      {(activeLayer === "ais" || activeLayer === "shadow") &&
        MAJOR_ROUTES.map((route) => (
          <Polyline
            key={route.id}
            positions={route.path}
            color="#3b82f6"
            weight={2}
            dashArray="5, 10"
            opacity={0.5}
          />
        ))}
    </MapContainer>
  );
}
