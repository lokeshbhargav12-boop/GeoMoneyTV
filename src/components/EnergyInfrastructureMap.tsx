"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  Polyline,
  Rectangle,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
// @ts-ignore: Leaflet CSS side-effect import
import "leaflet/dist/leaflet.css";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Factory,
  Flame,
  Fuel,
  Battery,
  Warehouse,
  Container,
  Cable,
  Server,
  Globe2,
  AlertTriangle,
  Mountain,
  Ship,
  BoxSelect,
  Route,
  Wind,
  Zap,
  Thermometer,
} from "lucide-react";
import { getCartoTileUrl } from "@/lib/carto-tiles";
import {
  DEFAULT_ASSETS,
  DEFAULT_CORRIDORS,
  DEFAULT_FLOWS,
  DEFAULT_GRID_STRESS,
} from "./energy-infrastructure/infraDefaults";

// ─── TYPES ────────────────────────────────────────────────────

export type InfraLayer =
  | "all"
  | "resource-input"
  | "extraction"
  | "processing"
  | "transport"
  | "storage"
  | "import-export"
  | "distribution"
  | "control";

export type MapOverlay =
  | "assets"
  | "corridors"
  | "weather"
  | "ships"
  | "climate"
  | "osint"
  | "flows"
  | "grid-stress";

export interface MapAsset {
  id: string;
  name: string;
  layer: InfraLayer;
  tech: string;
  lat: number;
  lng: number;
  capacity?: string;
  status?: string;
  pressure?: string;
  region: string;
}

export interface MapCorridor {
  id: string;
  name: string;
  kind: "pipeline" | "transmission" | "shipping" | "rail";
  path: [number, number][];
  throughput: string;
  status: string;
}

export interface MapEvent {
  id: string;
  title: string;
  type: string;
  severity: number;
  lat: number;
  lng: number;
  region: string;
  timestamp?: string;
}

export interface MapShip {
  mmsi: string;
  name?: string;
  type: string;
  latitude: number;
  longitude: number;
  speed?: number;
  destination?: string;
}

export interface FlowRoute {
  id: string;
  origin: [number, number];
  destination: [number, number];
  label: string;
  volume: string;
  commodity: string;
  color?: string;
}

export interface GridStressNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  loadPercent: number | null;
  capacityGW: number;
  alert: "normal" | "elevated" | "critical";
}

interface EnergyInfrastructureMapProps {
  activeLayer?: InfraLayer;
  overlays?: MapOverlay[];
  assets?: MapAsset[];
  corridors?: MapCorridor[];
  climate?: MapEvent[];
  osint?: MapEvent[];
  ships?: MapShip[];
  flows?: FlowRoute[];
  gridStress?: GridStressNode[];
  height?: string;
  bboxMode?: boolean;
  presetBbox?: L.LatLngBoundsExpression | null;
  onAssetClick?: (asset: MapAsset) => void;
  onCorridorClick?: (corridor: MapCorridor) => void;
  onBboxChange?: (bounds: L.LatLngBounds | null) => void;
  onMapClick?: (lat: number, lng: number) => void;
}

// ─── MOCK DATASETS ────────────────────────────────────────────






// ─── MAP CONTROLLER ───────────────────────────────────────────

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 1 });
  }, [center, zoom, map]);
  return null;
}

// ─── BBOX DRAWER ──────────────────────────────────────────────

function BboxDrawer({
  active,
  onBboxChange,
}: {
  active: boolean;
  onBboxChange?: (bounds: L.LatLngBounds | null) => void;
}) {
  const map = useMap();
  const [start, setStart] = useState<L.LatLng | null>(null);
  const [end, setEnd] = useState<L.LatLng | null>(null);
  const [currentBbox, setCurrentBbox] = useState<L.LatLngBounds | null>(null);

  useEffect(() => {
    if (active) {
      map.dragging.disable();
    } else {
      map.dragging.enable();
      setStart(null);
      setEnd(null);
      setCurrentBbox(null);
      onBboxChange?.(null);
    }
  }, [active, map, onBboxChange]);

  useMapEvents({
    mousedown(e) {
      if (!active) return;
      setStart(e.latlng);
      setEnd(e.latlng);
      setCurrentBbox(null);
      onBboxChange?.(null);
    },
    mousemove(e) {
      if (!active || !start) return;
      setEnd(e.latlng);
    },
    mouseup(e) {
      if (!active || !start) return;
      const bounds = L.latLngBounds(start, e.latlng);
      setCurrentBbox(bounds);
      onBboxChange?.(bounds);
      setStart(null);
      setEnd(null);
    },
  });

  if (start && end) {
    return <Rectangle bounds={L.latLngBounds(start, end)} pathOptions={{ color: "#06b6d4", weight: 2, fillOpacity: 0.15 }} />;
  }
  if (currentBbox) {
    return <Rectangle bounds={currentBbox} pathOptions={{ color: "#06b6d4", weight: 2, fillOpacity: 0.08 }} />;
  }
  return null;
}

// ─── ICON BUILDER ─────────────────────────────────────────────

function createIcon(iconMarkup: React.ReactNode, addClass = "") {
  return L.divIcon({
    html: renderToStaticMarkup(iconMarkup),
    className: `bg-transparent ${addClass}`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

const LAYER_ICONS: Record<InfraLayer, React.ReactNode> = {
  "all": <Globe2 className="w-5 h-5 text-gray-300" />,
  "resource-input": <Mountain className="w-5 h-5 text-emerald-400" />,
  "extraction": <Factory className="w-5 h-5 text-blue-400" />,
  "processing": <Flame className="w-5 h-5 text-amber-400" />,
  "transport": <Container className="w-5 h-5 text-cyan-400" />,
  "storage": <Warehouse className="w-5 h-5 text-purple-400" />,
  "import-export": <Fuel className="w-5 h-5 text-rose-400" />,
  "distribution": <Cable className="w-5 h-5 text-teal-400" />,
  "control": <Server className="w-5 h-5 text-indigo-400" />,
};

const TECH_COLORS: Record<string, string> = {
  Oil: "from-red-400 to-orange-500",
  Gas: "from-cyan-400 to-blue-500",
  Coal: "from-stone-400 to-amber-500",
  Solar: "from-yellow-400 to-orange-500",
  Wind: "from-cyan-400 to-emerald-500",
  Hydro: "from-blue-400 to-indigo-500",
  "Pumped Hydro": "from-blue-400 to-indigo-500",
  Batteries: "from-purple-400 to-fuchsia-500",
  Hydrogen: "from-emerald-400 to-teal-500",
  Geothermal: "from-red-500 to-rose-600",
  LNG: "from-violet-400 to-fuchsia-500",
  Grid: "from-teal-400 to-cyan-500",
  "Grid Ops": "from-indigo-400 to-violet-500",
  Shipping: "from-cyan-400 to-blue-500",
  "Oil & Gas": "from-orange-400 to-red-500",
};

function AssetMarker({ asset, onClick }: { asset: MapAsset; onClick?: (a: MapAsset) => void }) {
  const color = TECH_COLORS[asset.tech] || "from-gray-400 to-gray-500";
  const icon = createIcon(
    <div className="relative group">
      <div className={`absolute inset-0 rounded-full opacity-30 blur-sm bg-gradient-to-br ${color}`} />
      <div className={`w-7 h-7 rounded-full border border-white/30 bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
        <span className="scale-75">{LAYER_ICONS[asset.layer]}</span>
      </div>
    </div>,
    "energy-asset-marker",
  );

  return (
    <Marker position={[asset.lat, asset.lng]} icon={icon} eventHandlers={{ click: () => onClick?.(asset) }}>
      <Popup className="geo-popup" autoPan={false}>
        <div className="bg-black/90 border border-white/10 p-3 rounded-xl text-white text-xs min-w-[220px]">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${color} flex items-center justify-center`}>
              {LAYER_ICONS[asset.layer]}
            </div>
            <div>
              <div className="font-bold text-sm">{asset.name}</div>
              <div className="text-[10px] text-gray-500">{asset.region} • {asset.tech}</div>
            </div>
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between"><span className="text-gray-500">Capacity:</span><span className="text-gray-200">{asset.capacity}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Status:</span><span className="text-emerald-400">{asset.status}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Layer:</span><span className="text-gray-200 capitalize">{asset.layer.replace("-", " ")}</span></div>
          </div>
          {asset.pressure && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <div className="text-[10px] text-amber-400 font-medium mb-1">System Pressure</div>
              <p className="text-[11px] text-gray-300">{asset.pressure}</p>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

function CorridorLayer({ corridors, onClick }: { corridors: MapCorridor[]; onClick?: (c: MapCorridor) => void }) {
  const colors: Record<MapCorridor["kind"], string> = {
    pipeline: "#06b6d4",
    transmission: "#f59e0b",
    shipping: "#3b82f6",
    rail: "#a8a29e",
  };

  return (
    <>
      {corridors.map((corridor) => (
        <Polyline
          key={corridor.id}
          positions={corridor.path}
          color={colors[corridor.kind]}
          weight={corridor.kind === "shipping" ? 2 : 3}
          opacity={0.7}
          dashArray={corridor.status === "Disrupted" ? "6,6" : corridor.status === "Permitting" ? "4,4" : "0"}
          eventHandlers={{ click: () => onClick?.(corridor) }}
        >
          <Popup className="geo-popup" autoPan={false}>
            <div className="bg-black/90 border border-white/10 p-3 rounded-xl text-white text-xs min-w-[180px]">
              <div className="font-bold text-sm mb-1">{corridor.name}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">{corridor.kind}</div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between"><span className="text-gray-500">Throughput:</span><span className="text-gray-200">{corridor.throughput}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Status:</span>
                  <span className={corridor.status === "Disrupted" ? "text-red-400" : corridor.status === "Restricted" ? "text-amber-400" : "text-emerald-400"}>
                    {corridor.status}
                  </span>
                </div>
              </div>
            </div>
          </Popup>
        </Polyline>
      ))}
    </>
  );
}

function ClimateLayer({ events }: { events: MapEvent[] }) {
  return (
    <>
      {events.map((event) => {
        const color = event.severity >= 70 ? "#ef4444" : event.severity >= 40 ? "#f59e0b" : "#3b82f6";
        return (
          <CircleMarker
            key={event.id}
            center={[event.lat, event.lng]}
            radius={8 + event.severity / 10}
            pathOptions={{ fillColor: color, color: color, fillOpacity: 0.35, weight: 1 }}
          >
            <Popup className="geo-popup" autoPan={false}>
              <div className="bg-black/90 border border-white/10 p-3 rounded-xl text-white text-xs min-w-[180px]">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="font-bold text-sm">{event.title}</span>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between"><span className="text-gray-500">Type:</span><span className="text-gray-200 capitalize">{event.type}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Severity:</span><span className="text-red-400">{event.severity}/100</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Region:</span><span className="text-gray-200">{event.region}</span></div>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}

function ShipLayer({ ships }: { ships: MapShip[] }) {
  const shipIcon = createIcon(
    <div className="relative group">
      <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500" />
      <Ship className="text-blue-400 w-5 h-5 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
    </div>,
  );

  return (
    <>
      {ships.map((vessel, idx) => (
        <Marker key={`ship-${vessel.mmsi || idx}`} position={[vessel.latitude, vessel.longitude]} icon={shipIcon}>
          <Popup className="geo-popup" autoPan={false}>
            <div className="bg-black/90 border border-blue-500/30 p-3 rounded-xl text-white text-xs min-w-[180px]">
              <div className="font-bold text-sm text-blue-400 mb-1">{vessel.name || "Vessel"}</div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between"><span className="text-gray-500">Type:</span><span className="text-gray-200 capitalize">{vessel.type}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Speed:</span><span className="text-gray-200">{vessel.speed ?? "N/A"} kn</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Destination:</span><span className="text-gray-200">{vessel.destination || "N/A"}</span></div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

function FlowLayer({ flows }: { flows: FlowRoute[] }) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-[400]">
      <defs>
        {flows.map((flow) => (
          <marker key={`arrow-${flow.id}`} id={`arrow-${flow.id}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L6,3 z" fill={flow.color || "#3b82f6"} />
          </marker>
        ))}
      </defs>
      {flows.map((flow) => {
        // We render flows as curved polylines via Leaflet below; this SVG is a fallback visual placeholder.
        return null;
      })}
    </svg>
  );
}

function FlowArcs({ flows }: { flows: FlowRoute[] }) {
  // Leaflet-based curved flow arcs using quadratic bezier approximation
  const map = useMap();
  const [paths, setPaths] = useState<{ id: string; d: string; color: string }[]>([]);

  useEffect(() => {
    const update = () => {
      const newPaths = flows.map((flow) => {
        const start = map.latLngToLayerPoint(L.latLng(flow.origin));
        const end = map.latLngToLayerPoint(L.latLng(flow.destination));
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2 - 80; // arc height
        const d = `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
        return { id: flow.id, d, color: flow.color || "#3b82f6" };
      });
      setPaths(newPaths);
    };
    update();
    map.on("move zoom", update);
    return () => {
      map.off("move zoom", update);
    };
  }, [flows, map]);

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-[400] overflow-visible">
      {paths.map((p) => (
        <g key={p.id}>
          <path d={p.d} fill="none" stroke={p.color} strokeWidth="2" opacity="0.6" strokeDasharray="4 4">
            <animate attributeName="stroke-dashoffset" from="100" to="0" dur="2s" repeatCount="indefinite" />
          </path>
          <circle r="3" fill={p.color} opacity="0.9">
            <animateMotion dur="2s" repeatCount="indefinite" path={p.d} />
          </circle>
        </g>
      ))}
    </svg>
  );
}

function GridStressLayer({ nodes }: { nodes: GridStressNode[] }) {
  return (
    <>
      {nodes.map((node) => {
        const noLive = node.loadPercent == null;
        const color = node.alert === "critical" ? "#ef4444" : node.alert === "elevated" ? "#f59e0b" : "#10b981";
        const radius = noLive ? 8 : 8 + (node.loadPercent ?? 0) / 6;
        return (
          <CircleMarker
            key={node.id}
            center={[node.lat, node.lng]}
            radius={radius}
            pathOptions={{ fillColor: color, color: color, fillOpacity: noLive ? 0.12 : 0.25, weight: 2 }}
          >
            <Popup className="geo-popup" autoPan={false}>
              <div className="bg-black/90 border border-white/10 p-3 rounded-xl text-white text-xs min-w-[180px]">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4" style={{ color }} />
                  <span className="font-bold text-sm">{node.name}</span>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between"><span className="text-gray-500">Load:</span><span style={{ color }}>{noLive ? "no live feed" : `${Math.round(node.loadPercent as number)}%`}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Capacity:</span><span className="text-gray-200">{node.capacityGW} GW</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Alert:</span><span style={{ color }} className="capitalize">{noLive ? "n/a" : node.alert}</span></div>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}

function WeatherTileLayer() {
  const owmKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  if (!owmKey) return null;
  return <TileLayer url={`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${owmKey}`} opacity={0.45} />;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────

export default function EnergyInfrastructureMap({
  activeLayer = "all",
  overlays = ["assets", "corridors"],
  assets = DEFAULT_ASSETS,
  corridors = DEFAULT_CORRIDORS,
  climate = [],
  osint = [],
  ships = [],
  flows = DEFAULT_FLOWS,
  gridStress = DEFAULT_GRID_STRESS,
  height = "600px",
  bboxMode = false,
  presetBbox = null,
  onAssetClick,
  onCorridorClick,
  onBboxChange,
  onMapClick,
}: EnergyInfrastructureMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>([25, 10]);
  const [mapZoom, setMapZoom] = useState(3);
  const [selectedAsset, setSelectedAsset] = useState<MapAsset | null>(null);

  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
  }, []);

  const filteredAssets = useMemo(() => {
    if (activeLayer === "all") return assets;
    return assets.filter((a) => a.layer === activeLayer);
  }, [assets, activeLayer]);

  const handleAssetClick = (asset: MapAsset) => {
    setSelectedAsset(asset);
    setMapCenter([asset.lat, asset.lng]);
    setMapZoom(6);
    onAssetClick?.(asset);
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-black/50" style={{ height }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        zoomControl={true}
        scrollWheelZoom={true}
        dragging={true}
        className="h-full w-full bg-black/90"
        attributionControl={false}
        worldCopyJump={false}
        maxBounds={[
          [-90, -180],
          [90, 180],
        ]}
      >
        <MapController center={mapCenter} zoom={mapZoom} />
        <BboxDrawer active={bboxMode} onBboxChange={onBboxChange} />
        {presetBbox && !bboxMode && (
          <Rectangle
            bounds={presetBbox}
            pathOptions={{ color: "#22d3ee", weight: 2, fillOpacity: 0.08, dashArray: "6 4" }}
          />
        )}

        <TileLayer
          url={getCartoTileUrl("darkNoLabels")}
          attribution=""
          noWrap={true}
          bounds={[
            [-90, -180],
            [90, 180],
          ]}
        />

        {overlays.includes("weather") && <WeatherTileLayer />}
        {overlays.includes("corridors") && <CorridorLayer corridors={corridors} onClick={onCorridorClick} />}
        {overlays.includes("flows") && <FlowArcs flows={flows} />}
        {overlays.includes("grid-stress") && <GridStressLayer nodes={gridStress} />}
        {overlays.includes("assets") && filteredAssets.map((asset) => (
          <AssetMarker key={asset.id} asset={asset} onClick={handleAssetClick} />
        ))}
        {overlays.includes("climate") && <ClimateLayer events={climate} />}
        {overlays.includes("osint") && <ClimateLayer events={osint} />}
        {overlays.includes("ships") && <ShipLayer ships={ships} />}
      </MapContainer>

      {selectedAsset && (
        <div className="absolute bottom-4 left-4 z-[500] max-w-sm w-full">
          <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider">{selectedAsset.region}</div>
                <div className="font-bold text-white">{selectedAsset.name}</div>
              </div>
              <button onClick={() => setSelectedAsset(null)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <div className="space-y-1 text-xs text-gray-300 mb-3">
              <div className="flex justify-between"><span className="text-gray-500">Technology:</span><span>{selectedAsset.tech}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Capacity:</span><span>{selectedAsset.capacity}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status:</span><span className="text-emerald-400">{selectedAsset.status}</span></div>
            </div>
            {selectedAsset.pressure && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2">
                <div className="text-[10px] text-amber-400 font-medium mb-1">System Pressure</div>
                <p className="text-xs text-gray-300">{selectedAsset.pressure}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export { DEFAULT_ASSETS, DEFAULT_CORRIDORS, DEFAULT_FLOWS, DEFAULT_GRID_STRESS };
