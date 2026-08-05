"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
// @ts-ignore: Leaflet CSS side-effect import
import "leaflet/dist/leaflet.css";
import { renderToStaticMarkup } from "react-dom/server";
import { Ship, AlertTriangle, Train, Mountain } from "lucide-react";

export interface CoalRoute {
  id: string;
  name: string;
  mode: string;
  origin: [number, number];
  destination: [number, number];
  waypoints: [number, number][];
  exposure: string;
  watch: string;
  vesselCount: number;
  congestion: "low" | "moderate" | "high";
}

export interface CoalVessel {
  mmsi: string;
  name?: string;
  type: string;
  latitude: number;
  longitude: number;
  speed?: number;
  destination?: string;
  status?: string;
}

interface CoalRouteMapProps {
  routes: CoalRoute[];
  vessels: CoalVessel[];
  climate?: any[];
  height?: string;
  selectedRoute?: string | null;
  onRouteClick?: (id: string) => void;
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 1 });
  }, [center, zoom, map]);
  return null;
}

function createIcon(iconMarkup: React.ReactNode, addClass = "") {
  return L.divIcon({
    html: renderToStaticMarkup(iconMarkup),
    className: `bg-transparent ${addClass}`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

const congestionColor = {
  low: "#10b981",
  moderate: "#f59e0b",
  high: "#ef4444",
};

export default function CoalRouteMap({
  routes,
  vessels,
  climate = [],
  height = "520px",
  selectedRoute,
  onRouteClick,
}: CoalRouteMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>([10, 60]);
  const [mapZoom, setMapZoom] = useState(3);

  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
  }, []);

  const bulkVessels = useMemo(
    () =>
      vessels.filter(
        (v) =>
          (v.type || "").toLowerCase() === "bulk" ||
          (v.destination || "").toLowerCase().includes("coal"),
      ),
    [vessels],
  );

  const vesselIcon = createIcon(
    <div className="relative group">
      <div className="absolute inset-0 bg-amber-500 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500" />
      <Ship className="text-amber-400 w-5 h-5 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
    </div>,
  );

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
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png" attribution="" />

        {routes.map((route) => (
          <Polyline
            key={route.id}
            positions={route.waypoints}
            color={congestionColor[route.congestion]}
            weight={selectedRoute === route.id ? 5 : 3}
            opacity={selectedRoute && selectedRoute !== route.id ? 0.3 : 0.85}
            dashArray={route.congestion === "high" ? "6,6" : "0"}
            eventHandlers={{
              click: () => {
                setMapCenter(route.origin);
                setMapZoom(4);
                onRouteClick?.(route.id);
              },
            }}
          >
            <Popup className="geo-popup" autoPan={false}>
              <div className="bg-black/90 border border-white/10 p-3 rounded-xl text-white text-xs min-w-[220px]">
                <div className="flex items-center gap-2 mb-2">
                  <Train className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-sm">{route.name}</span>
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">{route.mode}</div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between"><span className="text-gray-500">Vessels nearby:</span><span className="text-white">{route.vesselCount}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Congestion:</span><span style={{ color: congestionColor[route.congestion] }} className="capitalize">{route.congestion}</span></div>
                </div>
                <div className="mt-2 pt-2 border-t border-white/10">
                  <div className="text-[10px] text-amber-400 font-medium mb-1">Primary exposure</div>
                  <p className="text-[11px] text-gray-300">{route.exposure}</p>
                </div>
              </div>
            </Popup>
          </Polyline>
        ))}

        {bulkVessels.map((vessel, idx) => (
          <Marker
            key={`coal-vessel-${vessel.mmsi || idx}`}
            position={[vessel.latitude, vessel.longitude]}
            icon={vesselIcon}
          >
            <Popup className="geo-popup" autoPan={false}>
              <div className="bg-black/90 border border-amber-500/30 p-3 rounded-xl text-white text-xs min-w-[180px]">
                <div className="font-bold text-sm text-amber-400 mb-1">{vessel.name || "Bulk Vessel"}</div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between"><span className="text-gray-500">Type:</span><span className="text-gray-200 capitalize">{vessel.type}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Speed:</span><span className="text-gray-200">{vessel.speed ?? "N/A"} kn</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Destination:</span><span className="text-gray-200">{vessel.destination || "N/A"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Status:</span><span className="text-gray-200 capitalize">{vessel.status || "N/A"}</span></div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {climate.map((event) => {
          const color = event.severity >= 70 ? "#ef4444" : event.severity >= 40 ? "#f59e0b" : "#3b82f6";
          return (
            <CircleMarker
              key={`climate-${event.id}`}
              center={[event.lat, event.lng]}
              radius={6 + event.severity / 12}
              pathOptions={{ fillColor: color, color, fillOpacity: 0.35, weight: 1 }}
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
      </MapContainer>

      <div className="absolute top-3 right-3 z-[500] flex flex-col gap-2">
        <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-3 text-xs">
          <div className="text-gray-400 mb-2 font-medium">Route congestion</div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Low</div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Moderate</div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> High</div>
          </div>
        </div>
      </div>
    </div>
  );
}
