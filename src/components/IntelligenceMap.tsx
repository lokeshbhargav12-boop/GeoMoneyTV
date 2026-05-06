'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Ship, Crosshair, Thermometer } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

// --- MOCK DATA ---
const AIS_VESSELS = [
    { id: 1, pos: [24.5, -80.0] as [number, number], name: 'Tanker A' },
    { id: 2, pos: [23.1, -78.5] as [number, number], name: 'Cargo B' },
    { id: 3, pos: [45.2, -10.5] as [number, number], name: 'Tanker C' },
    { id: 4, pos: [34.0, 15.0] as [number, number], name: 'Vessel D' },
    { id: 5, pos: [12.0, 48.0] as [number, number], name: 'Tanker E' },
    { id: 6, pos: [-34.5, 18.0] as [number, number], name: 'Cargo F' },
    { id: 7, pos: [1.2, 103.5] as [number, number], name: 'Tanker G (Malacca)' },
];

const SHADOW_FLEETS = [
    { id: 1, pos: [0.5, 5.0] as [number, number], name: 'Gulf of Guinea Anomaly', count: 14 },
    { id: 2, pos: [26.0, 56.0] as [number, number], name: 'Hormuz Ghost Group', count: 6 },
    { id: 3, pos: [12.0, -68.0] as [number, number], name: 'Caribbean Dark Transfer', count: 9 },
];

const THERMAL_REFINERIES = [
    { id: 1, pos: [26.7, 50.0] as [number, number], name: 'Ras Tanura', status: 'COOLING DETECTED' },
    { id: 2, pos: [29.7, -95.2] as [number, number], name: 'Houston Complex', status: 'HIGH THERMAL' },
    { id: 3, pos: [51.9, 4.1] as [number, number], name: 'Rotterdam Port', status: 'NORMAL' },
    { id: 4, pos: [22.0, 71.0] as [number, number], name: 'Jamnagar', status: 'HIGH THERMAL' },
];

const createCustomIcon = (iconElement: JSX.Element, className: string) => {
    return L.divIcon({
        html: renderToStaticMarkup(
            <div className={`p-1 rounded-full bg-black/60 border ${className} backdrop-blur-sm flex items-center justify-center`}>
                {iconElement}
            </div>
        ),
        className: 'custom-leaflet-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });
};

export default function IntelligenceMap({ activeLayer }: { activeLayer: string }) {
    // Leaflet icons
    const shipIcon = createCustomIcon(<Ship className="w-4 h-4 text-blue-400" />, 'border-blue-500/50');
    const shadowIcon = createCustomIcon(<Crosshair className="w-5 h-5 text-purple-400 animate-spin-slow" />, 'border-purple-500/50 ring-2 ring-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.5)]');

    return (
        <MapContainer
            center={[20, 0]}
            zoom={3}
            scrollWheelZoom={true}
            className="w-full h-full bg-black/90 font-sans z-0"
            zoomControl={false}
        >
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />

            {/* AIS LAYER */}
            {activeLayer === 'ais' && AIS_VESSELS.map(vessel => (
                <Marker key={`ais-${vessel.id}`} position={vessel.pos} icon={shipIcon}>
                    <Popup className="geo-popup">
                        <div className="bg-black/90 border border-blue-500/30 p-2 rounded-lg text-white text-xs">
                            <span className="text-blue-400 font-bold">{vessel.name}</span>
                            <br />
                            STATUS: EN ROUTE
                        </div>
                    </Popup>
                </Marker>
            ))}

            {/* SHADOW MODE LAYER */}
            {activeLayer === 'shadow' && SHADOW_FLEETS.map(fleet => (
                <Marker key={`shadow-${fleet.id}`} position={fleet.pos} icon={shadowIcon}>
                    <Popup className="geo-popup" autoPan={false}>
                        <div className="bg-purple-900/60 border border-purple-500/30 p-2 rounded-lg text-purple-200 text-xs font-bold tracking-wider">
                            SHADOW FLEET DETECTED: {fleet.count} VESSELS<br/>
                            <span className="text-[10px] text-purple-400">{fleet.name}</span>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {/* THERMAL PULSE LAYER */}
            {activeLayer === 'thermal' && THERMAL_REFINERIES.map(refinery => (
                <CircleMarker
                    key={`thermal-${refinery.id}`}
                    center={refinery.pos}
                    radius={15}
                    pathOptions={{
                        color: refinery.status.includes('COOLING') ? '#f87171' : '#ef4444',
                        fillColor: refinery.status.includes('COOLING') ? '#ef4444' : '#b91c1c',
                        fillOpacity: 0.6,
                        weight: 2
                    }}
                >
                    <Popup className="geo-popup">
                        <div className="bg-red-900/60 border border-red-500/30 p-2 rounded-lg text-red-200 text-xs font-bold tracking-wider flex items-center gap-2">
                            <Thermometer className="w-4 h-4 text-red-400" />
                            {refinery.name}<br/>
                            {refinery.status}
                        </div>
                    </Popup>
                </CircleMarker>
            ))}

        </MapContainer>
    );
}
