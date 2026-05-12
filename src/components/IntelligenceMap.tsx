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
import { Ship, Crosshair, Thermometer, AlertTriangle } from "lucide-react";
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

// --- MOCK WEATHER DATA FOR KEY CITIES ---
const WEATHER_HUBS = [
  {
    id: 1,
    pos: [29.7, -95.2] as [number, number],
    name: "Houston",
    temp: "32°C",
    wind: "18 km/h",
    rain: "0 mm",
  },
  {
    id: 2,
    pos: [51.9, 4.1] as [number, number],
    name: "Rotterdam",
    temp: "14°C",
    wind: "25 km/h",
    rain: "5 mm",
  },
  {
    id: 3,
    pos: [26.3, 50.1] as [number, number],
    name: "Dammam",
    temp: "42°C",
    wind: "12 km/h",
    rain: "0 mm",
  },
  {
    id: 4,
    pos: [1.3, 103.8] as [number, number],
    name: "Singapore",
    temp: "29°C",
    wind: "8 km/h",
    rain: "12 mm",
  },
  {
    id: 5,
    pos: [35.5, 129.3] as [number, number],
    name: "Ulsan",
    temp: "22°C",
    wind: "15 km/h",
    rain: "2 mm",
  },
  {
    id: 6,
    pos: [40.7, -74.0] as [number, number],
    name: "New York",
    temp: "18°C",
    wind: "22 km/h",
    rain: "8 mm",
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
    return (
      <Rectangle
        bounds={L.latLngBounds(start, end)}
        pathOptions={{ color: "#06b6d4", weight: 2, fillOpacity: 0.2 }}
      />
    );
  }

  if (currentBbox) {
    return (
      <Rectangle
        bounds={currentBbox}
        pathOptions={{ color: "#06b6d4", weight: 2, fillOpacity: 0.1 }}
      />
    );
  }

  return null;
}

// Sub-component for fetching and displaying current weather on click
function WeatherClickInspector({
  active,
  owmKey,
}: {
  active: boolean;
  owmKey?: string;
}) {
  const map = useMap();
  const [clickedPos, setClickedPos] = useState<L.LatLng | null>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useMapEvents({
    click: async (e) => {
      // Don't interfere if they are drawing a bbox
      if (active) return;
      if (!owmKey) return;

      setClickedPos(e.latlng);
      setWeatherData(null);
      setLoading(true);

      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${e.latlng.lat}&lon=${e.latlng.lng}&appid=${owmKey}&units=metric`,
        );
        const data = await res.json();
        setWeatherData(data);
      } catch (err) {
        console.error("Failed to fetch location weather", err);
      } finally {
        setLoading(false);
      }
    },
  });

  if (!clickedPos) return null;

  return (
    <Popup 
      position={clickedPos} 
      eventHandlers={{ remove: () => setClickedPos(null) }}
    >
      <div className="bg-black/90 border border-emerald-500/30 p-3 rounded-xl text-white text-xs min-w-[200px] shadow-2xl">
        {loading ? (
          <div className="flex items-center gap-2 text-emerald-400">
            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            Scanning Atmosphere...
          </div>
        ) : weatherData && weatherData.main ? (
          <>
            <span className="text-emerald-400 font-bold block border-b border-white/10 pb-2 mb-2 text-sm uppercase tracking-wider">
              {weatherData.name || "Remote Location"},{" "}
              {weatherData.sys?.country || "N/A"}
            </span>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              <div>
                <span className="text-gray-500 block text-[10px]">TEMP</span>
                <span className="font-mono text-gray-200">
                  {weatherData.main.temp}°C
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">WIND</span>
                <span className="font-mono text-gray-200">
                  {weatherData.wind.speed} m/s
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">CONDITIONS</span>
                <span className="font-mono text-cyan-400 capitalize">
                  {weatherData.weather?.[0]?.description || "Clear"}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">HUMIDITY</span>
                <span className="font-mono text-gray-200">
                  {weatherData.main.humidity}%
                </span>
              </div>
            </div>
          </>
        ) : (
          <span className="text-red-400">No atmospheric data available</span>
        )}
      </div>
    </Popup>
  );
}

export default function IntelligenceMap({
  activeLayer,
  ships = [],
  bboxMode = false,
  selectedBbox = null,
  setSelectedBbox = () => {},
  simulationMode = false,
  onSimulationDrag = () => {},
}: {
  activeLayer: string;
  ships?: any[];
  bboxMode?: boolean;
  selectedBbox?: L.LatLngBounds | null;
  setSelectedBbox?: (bounds: L.LatLngBounds | null) => void;
  simulationMode?: boolean;
  onSimulationDrag?: () => void;
}) {
  const [simMarkers, setSimMarkers] = useState([
    {
      id: "sim-hormuz",
      pos: [26.0, 56.5] as [number, number],
      name: "Hormuz Blockade Sim",
    },
    {
      id: "sim-malacca",
      pos: [2.5, 101.5] as [number, number],
      name: "Malacca Blockade Sim",
    },
  ]);

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

  const blockadeIcon = createIcon(
    <div className="relative group cursor-grab active:cursor-grabbing">
      <div className="absolute inset-0 bg-amber-500 rounded-full animate-ping opacity-30" />
      <AlertTriangle className="text-amber-500 w-8 h-8 drop-shadow-[0_0_15px_rgba(245,158,11,1)]" />
    </div>,
    "blockade-marker",
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
      <BboxDrawer
        active={bboxMode}
        currentBbox={selectedBbox}
        onBboxChange={setSelectedBbox}
      />
      <WeatherClickInspector active={bboxMode} owmKey={owmKey} />

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

      {/* WEATHER HUBS DATA LAYER */}
      {["temp", "wind", "rain", "storm"].includes(activeLayer) &&
        WEATHER_HUBS.map((hub) => {
          let displayValue = "";
          let iconColor = "text-gray-300";

          if (activeLayer === "temp") {
            displayValue = hub.temp;
            iconColor =
              "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]";
          }
          if (activeLayer === "wind") {
            displayValue = hub.wind;
            iconColor =
              "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]";
          }
          if (activeLayer === "rain" || activeLayer === "storm") {
            displayValue = hub.rain;
            iconColor =
              "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]";
          }

          const weatherIcon = createIcon(
            <div className="relative group">
              <div
                className={`absolute -top-3 -left-3 ${iconColor} bg-black/60 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold whitespace-nowrap border border-white/10`}
              >
                {displayValue}
              </div>
              <div className="w-2 h-2 rounded-full bg-white/50 border border-white mt-1 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
            </div>,
            "weather-hub-marker",
          );

          return (
            <Marker
              key={`weather-${hub.id}`}
              position={hub.pos}
              icon={weatherIcon}
            >
              <Popup className="geo-popup" autoPan={false}>
                <div className="bg-slate-900/80 border border-slate-500/40 p-2 rounded-lg text-slate-200 text-xs shadow-xl">
                  <span className="font-bold border-b border-slate-500/30 pb-1 mb-1 block">
                    {hub.name}
                  </span>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-1 font-mono">
                    <span className="text-gray-400">Temp:</span>
                    <span className="text-orange-400">{hub.temp}</span>
                    <span className="text-gray-400">Wind:</span>
                    <span className="text-cyan-400">{hub.wind}</span>
                    <span className="text-gray-400">Precip:</span>
                    <span className="text-blue-400">{hub.rain}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

      {/* SIMULATION MODE BLOCKADE DRAGGABLE MARKERS */}
      {simulationMode &&
        simMarkers.map((sim, i) => (
          <Marker
            key={sim.id}
            position={sim.pos}
            icon={blockadeIcon}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const position = marker.getLatLng();
                const newMarkers = [...simMarkers];
                newMarkers[i].pos = [position.lat, position.lng];
                setSimMarkers(newMarkers);
                onSimulationDrag();
              },
            }}
          >
            <Popup className="geo-popup" autoPan={false}>
              <div className="bg-amber-950/90 border border-amber-500/50 p-2 rounded-lg text-amber-200 text-xs">
                <span className="font-bold block text-amber-500 tracking-wider">
                  ⚠️ SIMULATED BLOCKADE
                </span>
                <span className="text-amber-100/70 mt-1 block">
                  Drag this marker over key chokepoints to model price impact.
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
