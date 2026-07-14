"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  Polyline,
  useMap,
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
} from "lucide-react";

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
  | "osint";

interface MapAsset {
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

interface MapCorridor {
  id: string;
  name: string;
  kind: "pipeline" | "transmission" | "shipping" | "rail";
  path: [number, number][];
  throughput: string;
  status: string;
}

interface MapEvent {
  id: string;
  title: string;
  type: string;
  severity: number;
  lat: number;
  lng: number;
  region: string;
  timestamp?: string;
}

interface MapShip {
  mmsi: string;
  name?: string;
  type: string;
  latitude: number;
  longitude: number;
  speed?: number;
  destination?: string;
}

interface EnergyInfrastructureMapProps {
  activeLayer?: InfraLayer;
  overlays?: MapOverlay[];
  assets?: MapAsset[];
  corridors?: MapCorridor[];
  climate?: MapEvent[];
  osint?: MapEvent[];
  ships?: MapShip[];
  height?: string;
  onAssetClick?: (asset: MapAsset) => void;
  onCorridorClick?: (corridor: MapCorridor) => void;
}

// ─── MOCK ASSET DATASET (OpenGrid-style global energy nodes) ──

const DEFAULT_ASSETS: MapAsset[] = [
  // Extraction / Generation
  { id: "ghawar", name: "Ghawar Field", layer: "extraction", tech: "Oil", lat: 25.9, lng: 49.6, capacity: "3.8 MMBPD", status: "Operating", pressure: "Mature giant field", region: "Saudi Arabia" },
  { id: "permian", name: "Permian Basin", layer: "extraction", tech: "Oil & Gas", lat: 31.8, lng: -102.5, capacity: "5.4 MMBPD eq", status: "Operating", pressure: "Takeaway constraints", region: "USA" },
  { id: "marcellus", name: "Marcellus Shale", layer: "extraction", tech: "Gas", lat: 41.2, lng: -77.2, capacity: "32 BCFD", status: "Operating", pressure: "Pipeline takeaway", region: "USA" },
  { id: "gudrun", name: "Gudrun Platform", layer: "extraction", tech: "Oil & Gas", lat: 61.3, lng: 2.0, capacity: "110 kbpd", status: "Operating", pressure: "Maintenance windows", region: "North Sea" },
  { id: "powder-river", name: "Powder River Basin", layer: "extraction", tech: "Coal", lat: 43.6, lng: -105.9, capacity: "4200 MW eq", status: "Declining", pressure: "Rail throughput", region: "USA" },
  { id: "hambach", name: "Hambach Lignite", layer: "extraction", tech: "Coal", lat: 50.9, lng: 6.5, capacity: "2900 MW", status: "Phasing", pressure: "Retirement schedule", region: "Germany" },
  { id: "goliat", name: "Goliat FPSO", layer: "extraction", tech: "Oil", lat: 71.5, lng: 22.3, capacity: "100 kbpd", status: "Operating", pressure: "Arctic logistics", region: "Norway" },
  // Renewables
  { id: "tengger", name: "Tengger Desert Solar", layer: "extraction", tech: "Solar", lat: 37.5, lng: 105.0, capacity: "1.5 GW", status: "Operating", pressure: "Grid curtailment", region: "China" },
  { id: "hornsea", name: "Hornsea Wind", layer: "extraction", tech: "Wind", lat: 53.9, lng: 1.5, capacity: "2.4 GW", status: "Operating", pressure: "Cable maintenance", region: "UK" },
  { id: "itaipu", name: "Itaipu Dam", layer: "extraction", tech: "Hydro", lat: -25.4, lng: -54.6, capacity: "14 GW", status: "Operating", pressure: "Drought cycles", region: "Brazil/Paraguay" },
  { id: "geysers", name: "The Geysers", layer: "extraction", tech: "Geothermal", lat: 38.8, lng: -122.8, capacity: "1.5 GW", status: "Operating", pressure: "Steam decline", region: "USA" },
  // Processing
  { id: "ras-tanura", name: "Ras Tanura Refinery", layer: "processing", tech: "Oil", lat: 26.65, lng: 50.0, capacity: "550 kbpd", status: "Operating", pressure: "Export loading", region: "Saudi Arabia" },
  { id: "jamnagar", name: "Jamnagar Refinery", layer: "processing", tech: "Oil", lat: 22.4, lng: 69.8, capacity: "1.24 MMBPD", status: "Operating", pressure: "Feedstock sourcing", region: "India" },
  { id: "rotterdam-ref", name: "Rotterdam Refining Hub", layer: "processing", tech: "Oil", lat: 51.9, lng: 4.1, capacity: "800 kbpd", status: "Operating", pressure: "Carbon border rules", region: "Netherlands" },
  { id: "qatar-lng", name: "Qatar North Field LNG", layer: "processing", tech: "LNG", lat: 25.9, lng: 51.5, capacity: "110 mtpa", status: "Expanding", pressure: "Train construction", region: "Qatar" },
  { id: "cheniere", name: "Cheniere Sabine Pass", layer: "processing", tech: "LNG", lat: 29.9, lng: -93.9, capacity: "45 mtpa", status: "Operating", pressure: "Feedgas demand", region: "USA" },
  { id: "neom-green", name: "NEOM Green Hydrogen", layer: "processing", tech: "Hydrogen", lat: 28.0, lng: 35.0, capacity: "600 t/d", status: "Construction", pressure: "Electrolyzer supply", region: "Saudi Arabia" },
  // Transport / Transmission
  { id: "hormuz", name: "Strait of Hormuz Chokepoint", layer: "transport", tech: "Shipping", lat: 26.5, lng: 56.2, capacity: "21 MMBPD", status: "Open", pressure: "Geopolitical risk", region: "Persian Gulf" },
  { id: "malacca", name: "Strait of Malacca", layer: "transport", tech: "Shipping", lat: 3.2, lng: 101.0, capacity: "16 MMBPD", status: "Open", pressure: "Piracy / congestion", region: "Malaysia" },
  { id: "suez", name: "Suez Canal", layer: "transport", tech: "Shipping", lat: 30.0, lng: 32.5, capacity: "10% seaborne trade", status: "Open", pressure: "Drought / blockage risk", region: "Egypt" },
  { id: "panama", name: "Panama Canal", layer: "transport", tech: "Shipping", lat: 9.0, lng: -79.5, capacity: "3% global trade", status: "Restricted", pressure: "Water levels", region: "Panama" },
  { id: "transwest", name: "TransWest Express HVDC", layer: "transport", tech: "Grid", lat: 41.5, lng: -107.0, capacity: "3 GW", status: "Permitting", pressure: "Permitting delays", region: "USA" },
  { id: "nordlink", name: "NordLink HVDC", layer: "transport", tech: "Grid", lat: 58.0, lng: 7.0, capacity: "1.4 GW", status: "Operating", pressure: "Price arbitrage", region: "Norway/Germany" },
  // Storage
  { id: "cushing", name: "Cushing Storage Hub", layer: "storage", tech: "Oil", lat: 35.9, lng: -96.7, capacity: "80 MMBBL", status: "Cycling", pressure: "Inventory draws", region: "USA" },
  { id: "spr", name: "US Strategic Petroleum Reserve", layer: "storage", tech: "Oil", lat: 30.0, lng: -91.0, capacity: "~400 MMBBL", status: "Reserve", pressure: "Political releases", region: "USA" },
  { id: "rehden", name: "Rehden Gas Storage", layer: "storage", tech: "Gas", lat: 52.6, lng: 8.5, capacity: "4.2 BCM", status: "Operating", pressure: "Fill rate", region: "Germany" },
  { id: "hornsdale", name: "Hornsdale Power Reserve", layer: "storage", tech: "Batteries", lat: -33.8, lng: 138.1, capacity: "194 MWh", status: "Operating", pressure: "FCAS market", region: "Australia" },
  { id: "bath-county", name: "Bath County Pumped Hydro", layer: "storage", tech: "Pumped Hydro", lat: 38.2, lng: -79.8, capacity: "24 GWh", status: "Operating", pressure: "Drought exposure", region: "USA" },
  // Import / Export
  { id: "newcastle", name: "Newcastle Coal Terminal", layer: "import-export", tech: "Coal", lat: -32.9, lng: 151.8, capacity: "211 mtpa", status: "Operating", pressure: "Channel queues", region: "Australia" },
  { id: "richards-bay", name: "Richards Bay Coal Terminal", layer: "import-export", tech: "Coal", lat: -28.7, lng: 32.1, capacity: "91 mtpa", status: "Operating", pressure: "Rail theft", region: "South Africa" },
  { id: "singapore-lng", name: "Singapore LNG Terminal", layer: "import-export", tech: "LNG", lat: 1.3, lng: 103.9, capacity: "11 mtpa", status: "Operating", pressure: "Spot demand", region: "Singapore" },
  { id: "zeebrugge", name: "Zeebrugge LNG", layer: "import-export", tech: "LNG", lat: 51.3, lng: 3.2, capacity: "9.2 mtpa", status: "Operating", pressure: "Northeast Asian competition", region: "Belgium" },
  // Distribution
  { id: "texas-ercot", name: "ERCOT Distribution Zone", layer: "distribution", tech: "Grid", lat: 31.0, lng: -99.0, capacity: "78 GW peak", status: "Operating", pressure: "Heatwave stress", region: "USA" },
  { id: "california-iso", name: "California ISO", layer: "distribution", tech: "Grid", lat: 37.5, lng: -121.5, capacity: "52 GW peak", status: "Operating", pressure: "Duck curve", region: "USA" },
  { id: "national-grid", name: "National Grid UK", layer: "distribution", tech: "Grid", lat: 52.5, lng: -1.5, capacity: "60 GW peak", status: "Operating", pressure: "Interconnector flows", region: "UK" },
  // Control
  { id: "pjm", name: "PJM Interconnection", layer: "control", tech: "Grid Ops", lat: 39.9, lng: -77.6, capacity: "185 GW", status: "Operating", pressure: "Capacity auctions", region: "USA" },
  { id: "national-grid-ops", name: "National Grid ESO", layer: "control", tech: "Grid Ops", lat: 51.5, lng: -0.1, capacity: "60 GW", status: "Operating", pressure: "Balancing costs", region: "UK" },
];

const DEFAULT_CORRIDORS: MapCorridor[] = [
  { id: "hormuz-route", name: "Hormuz Exit Lane", kind: "shipping", path: [[26.5, 56.2], [24.0, 58.0], [20.0, 60.0]], throughput: "21 MMBPD", status: "Open" },
  { id: "malacca-route", name: "Malacca Passage", kind: "shipping", path: [[5.5, 98.0], [1.2, 103.5], [-5.0, 106.0]], throughput: "16 MMBPD", status: "Open" },
  { id: "suez-route", name: "Suez Canal", kind: "shipping", path: [[29.9, 32.5], [27.7, 34.0], [25.0, 35.0]], throughput: "10% trade", status: "Open" },
  { id: "panama-route", name: "Panama Canal", kind: "shipping", path: [[9.0, -79.5], [8.5, -80.0], [8.0, -79.0]], throughput: "3% trade", status: "Restricted" },
  { id: "transwest-route", name: "TransWest Express", kind: "transmission", path: [[41.5, -107.0], [39.0, -110.0], [36.0, -115.0]], throughput: "3 GW", status: "Permitting" },
  { id: "nordlink-route", name: "NordLink", kind: "transmission", path: [[58.0, 7.0], [56.0, 8.0], [54.0, 9.0]], throughput: "1.4 GW", status: "Operating" },
  { id: "druzhba-route", name: "Druzhba Pipeline", kind: "pipeline", path: [[54.0, 37.0], [52.0, 20.0], [50.0, 14.0]], throughput: "1 MMBPD", status: "Disrupted" },
  { id: "magistral-route", name: "Central Asia Gas", kind: "pipeline", path: [[41.0, 65.0], [45.0, 60.0], [50.0, 40.0]], throughput: "55 BCM", status: "Operating" },
];

// ─── MAP CONTROLLER ───────────────────────────────────────────

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 1 });
  }, [center, zoom, map]);
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
    <Marker
      position={[asset.lat, asset.lng]}
      icon={icon}
      eventHandlers={{
        click: () => onClick?.(asset),
      }}
    >
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
          eventHandlers={{
            click: () => onClick?.(corridor),
          }}
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

function WeatherTileLayer() {
  const owmKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  if (!owmKey) return null;
  return (
    <TileLayer
      url={`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${owmKey}`}
      opacity={0.45}
    />
  );
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
  height = "600px",
  onAssetClick,
  onCorridorClick,
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
      >
        <MapController center={mapCenter} zoom={mapZoom} />

        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          attribution=""
        />

        {overlays.includes("weather") && <WeatherTileLayer />}
        {overlays.includes("corridors") && <CorridorLayer corridors={corridors} onClick={onCorridorClick} />}
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

export { DEFAULT_ASSETS, DEFAULT_CORRIDORS };
