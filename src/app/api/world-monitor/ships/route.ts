import { NextResponse } from "next/server";

// ─── TYPES ──────────────────────────────────────────────────
export interface ShipState {
    mmsi: string;
    name: string;
    imo: string;
    callsign: string;
    type: "tanker" | "container" | "bulk" | "lng" | "military" | "cargo" | "cruise" | "fishing";
    flag: string;
    flagEmoji: string;
    latitude: number;
    longitude: number;
    heading: number;
    speed: number; // knots
    destination: string;
    status: "underway" | "anchored" | "moored";
    length: number; // meters
    draught: number; // meters
}

// ─── REALISTIC VESSEL DATABASE ──────────────────────────────
// Real vessel names operating on major shipping lanes
const VESSEL_DB: Omit<ShipState, "latitude" | "longitude" | "heading">[] = [
    { mmsi: "477325700", name: "EVER GIVEN", imo: "9811000", callsign: "VRJB8", type: "container", flag: "Panama", flagEmoji: "🇵🇦", speed: 13.2, destination: "ROTTERDAM", status: "underway", length: 400, draught: 16 },
    { mmsi: "636092297", name: "FRONT ALTA", imo: "9806379", callsign: "D5QA9", type: "tanker", flag: "Liberia", flagEmoji: "🇱🇷", speed: 12.8, destination: "FUJAIRAH", status: "underway", length: 336, draught: 21.5 },
    { mmsi: "538008552", name: "MSC IRINA", imo: "9930198", callsign: "V7A5999", type: "container", flag: "Marshall Is.", flagEmoji: "🇲🇭", speed: 17.4, destination: "SINGAPORE", status: "underway", length: 399, draught: 16.5 },
    { mmsi: "311000311", name: "HARMONY OF THE SEAS", imo: "9682875", callsign: "C6BA5", type: "cruise", flag: "Bahamas", flagEmoji: "🇧🇸", speed: 18.1, destination: "MIAMI", status: "underway", length: 362, draught: 9.3 },
    { mmsi: "477508100", name: "PACIFIC BREEZE", imo: "9880165", callsign: "VRKG5", type: "lng", flag: "Hong Kong", flagEmoji: "🇭🇰", speed: 15.6, destination: "YOKOHAMA", status: "underway", length: 299, draught: 11.8 },
    { mmsi: "249471000", name: "MARE JONIO", imo: "8306389", callsign: "9HA2059", type: "cargo", flag: "Malta", flagEmoji: "🇲🇹", speed: 10.3, destination: "PIRAEUS", status: "underway", length: 149, draught: 5.2 },
    { mmsi: "636021649", name: "TI OCEANIA", imo: "9235268", callsign: "A8QI6", type: "tanker", flag: "Liberia", flagEmoji: "🇱🇷", speed: 11.7, destination: "ROTTERDAM", status: "underway", length: 380, draught: 24.5 },
    { mmsi: "210573000", name: "COSCO SHIPPING UNIVERSE", imo: "9795610", callsign: "5EKR", type: "container", flag: "Cyprus", flagEmoji: "🇨🇾", speed: 14.2, destination: "SHANGHAI", status: "underway", length: 400, draught: 16 },
    { mmsi: "352002596", name: "GOLAR TUNDRA", imo: "9628875", callsign: "3FKE5", type: "lng", flag: "Panama", flagEmoji: "🇵🇦", speed: 13.8, destination: "PIOMBINO", status: "underway", length: 294, draught: 12.1 },
    { mmsi: "538090677", name: "VALE BRASIL", imo: "9501548", callsign: "V7BG2", type: "bulk", flag: "Marshall Is.", flagEmoji: "🇲🇭", speed: 11.5, destination: "DALIAN", status: "underway", length: 362, draught: 23 },
    { mmsi: "477774200", name: "CSCL GLOBE", imo: "9695121", callsign: "VRMA7", type: "container", flag: "Hong Kong", flagEmoji: "🇭🇰", speed: 16.1, destination: "FELIXSTOWE", status: "underway", length: 400, draught: 15.5 },
    { mmsi: "636019747", name: "OVERSEAS CHINOOK", imo: "9852450", callsign: "A8JN8", type: "tanker", flag: "Liberia", flagEmoji: "🇱🇷", speed: 14.0, destination: "HOUSTON", status: "underway", length: 274, draught: 17.2 },
    { mmsi: "229439000", name: "BW RHINE", imo: "9685387", callsign: "9HA3755", type: "tanker", flag: "Malta", flagEmoji: "🇲🇹", speed: 12.3, destination: "JEDDAH", status: "underway", length: 183, draught: 11.5 },
    { mmsi: "371938000", name: "PACIFIC PEARL", imo: "9213007", callsign: "3EPO7", type: "bulk", flag: "Panama", flagEmoji: "🇵🇦", speed: 10.8, destination: "NEWCASTLE", status: "underway", length: 289, draught: 18.2 },
    { mmsi: "538006751", name: "HYUNDAI LOYALTY", imo: "9706367", callsign: "V7JR9", type: "container", flag: "Marshall Is.", flagEmoji: "🇲🇭", speed: 15.9, destination: "BUSAN", status: "underway", length: 366, draught: 14.5 },
    { mmsi: "256399000", name: "AEGEAN DIGNITY", imo: "9624000", callsign: "9HA5000", type: "tanker", flag: "Malta", flagEmoji: "🇲🇹", speed: 13.1, destination: "SUEZ CANAL", status: "underway", length: 274, draught: 17.8 },
    { mmsi: "477997500", name: "OOCL HONG KONG", imo: "9776171", callsign: "VRMC6", type: "container", flag: "Hong Kong", flagEmoji: "🇭🇰", speed: 16.8, destination: "LONG BEACH", status: "underway", length: 399, draught: 16 },
    { mmsi: "248044900", name: "LNG JUROJIN", imo: "9262185", callsign: "9HA2445", type: "lng", flag: "Malta", flagEmoji: "🇲🇹", speed: 14.5, destination: "DAHEJ", status: "underway", length: 289, draught: 11.3 },
    { mmsi: "240456000", name: "MINERVA HELEN", imo: "9435063", callsign: "SVDC", type: "tanker", flag: "Greece", flagEmoji: "🇬🇷", speed: 12.6, destination: "SKAW", status: "underway", length: 274, draught: 17 },
    { mmsi: "413456789", name: "ZHENG HE", imo: "0000001", callsign: "BPLA1", type: "military", flag: "China", flagEmoji: "🇨🇳", speed: 16.0, destination: "CLASSIFIED", status: "underway", length: 175, draught: 6.5 },
    { mmsi: "367999888", name: "USS GERALD R. FORD", imo: "0000002", callsign: "NAVY1", type: "military", flag: "USA", flagEmoji: "🇺🇸", speed: 25.0, destination: "CLASSIFIED", status: "underway", length: 337, draught: 12 },
    { mmsi: "234567890", name: "HMS QUEEN ELIZABETH", imo: "0000003", callsign: "DRAX1", type: "military", flag: "UK", flagEmoji: "🇬🇧", speed: 22.0, destination: "CLASSIFIED", status: "underway", length: 284, draught: 11 },
    { mmsi: "636091234", name: "ATLANTIC SUNRISE", imo: "9850001", callsign: "A8PQ3", type: "lng", flag: "Liberia", flagEmoji: "🇱🇷", speed: 14.3, destination: "ZEEBRUGGE", status: "underway", length: 295, draught: 11.5 },
    { mmsi: "477888999", name: "TOKYO TRIUMPH", imo: "9812345", callsign: "VRXA8", type: "bulk", flag: "Hong Kong", flagEmoji: "🇭🇰", speed: 11.2, destination: "SANTOS", status: "underway", length: 300, draught: 18.5 },
    { mmsi: "538007654", name: "MAERSK EDINBURGH", imo: "9778780", callsign: "V7FD2", type: "container", flag: "Marshall Is.", flagEmoji: "🇲🇭", speed: 17.2, destination: "TANJUNG PELEPAS", status: "underway", length: 399, draught: 16 },
    { mmsi: "311222333", name: "NAVIGATOR OF THE SEAS", imo: "9227510", callsign: "C6AB7", type: "cruise", flag: "Bahamas", flagEmoji: "🇧🇸", speed: 19.5, destination: "COZUMEL", status: "underway", length: 311, draught: 8.6 },
    { mmsi: "247444555", name: "GRAN CANARIA", imo: "9899001", callsign: "IBPT5", type: "fishing", flag: "Spain", flagEmoji: "🇪🇸", speed: 4.2, destination: "LAS PALMAS", status: "underway", length: 42, draught: 3.8 },
    { mmsi: "246333222", name: "NORDFJORD", imo: "9877002", callsign: "PIMU4", type: "fishing", flag: "Netherlands", flagEmoji: "🇳🇱", speed: 3.8, destination: "IJMUIDEN", status: "underway", length: 38, draught: 3.5 },
    { mmsi: "412345000", name: "DALIAN VENTURE", imo: "9845678", callsign: "BPKQ2", type: "tanker", flag: "China", flagEmoji: "🇨🇳", speed: 13.5, destination: "NINGBO", status: "underway", length: 333, draught: 22 },
    { mmsi: "636095555", name: "STAR POLARIS", imo: "9855555", callsign: "A8UV6", type: "bulk", flag: "Liberia", flagEmoji: "🇱🇷", speed: 10.5, destination: "TUBARAO", status: "underway", length: 340, draught: 21 },
];

// ─── SHIPPING ROUTES (lat/lng waypoints) ────────────────────
const ROUTES: { name: string; waypoints: [number, number][] }[] = [
    { name: "Suez-Mediterranean", waypoints: [[30.0, 32.5], [33.0, 28.0], [35.0, 24.0], [37.0, 15.0], [36.0, 5.0], [36.0, -5.5]] },
    { name: "Persian Gulf-India", waypoints: [[26.0, 56.5], [22.0, 60.0], [18.0, 65.0], [15.0, 72.0], [19.0, 72.8]] },
    { name: "Malacca Strait-China", waypoints: [[1.5, 104.0], [5.0, 108.0], [10.0, 112.0], [18.0, 114.0], [22.0, 114.5], [30.0, 122.0]] },
    { name: "Trans-Pacific North", waypoints: [[35.0, 140.0], [40.0, 170.0], [42.0, -170.0], [40.0, -150.0], [37.0, -122.5]] },
    { name: "Trans-Pacific South", waypoints: [[22.0, 114.0], [15.0, 135.0], [10.0, 160.0], [5.0, -170.0], [8.0, -80.0]] },
    { name: "North Atlantic", waypoints: [[51.0, -5.0], [52.0, -20.0], [48.0, -40.0], [42.0, -55.0], [40.7, -74.0]] },
    { name: "South Atlantic", waypoints: [[-23.0, -43.0], [-15.0, -25.0], [-5.0, -10.0], [5.0, -1.0], [36.0, -5.5]] },
    { name: "Indian Ocean", waypoints: [[-34.0, 18.5], [-25.0, 40.0], [-12.0, 49.0], [5.0, 60.0], [12.0, 45.0]] },
    { name: "Arabian Sea", waypoints: [[25.0, 55.0], [20.0, 60.0], [15.0, 68.0], [9.0, 76.0], [6.0, 80.0]] },
    { name: "East China Sea", waypoints: [[35.4, 129.4], [33.0, 126.0], [30.5, 122.0], [28.0, 121.5], [22.3, 114.2]] },
    { name: "Baltic Trade", waypoints: [[59.4, 24.7], [56.0, 18.0], [54.3, 10.1], [53.5, 9.9], [51.9, 4.5]] },
    { name: "Mediterranean East-West", waypoints: [[33.3, 35.5], [34.0, 30.0], [35.5, 24.0], [37.0, 15.5], [40.0, 9.0], [39.5, 2.8]] },
    { name: "West Africa Patrol", waypoints: [[6.4, 3.4], [4.0, 5.0], [2.0, 7.0], [0.0, 9.0], [-4.0, 11.8]] },
    { name: "Red Sea Corridor", waypoints: [[12.6, 43.1], [15.0, 42.0], [20.0, 38.5], [27.0, 34.5], [30.0, 32.5]] },
    { name: "Cape of Good Hope", waypoints: [[1.3, 103.8], [-5.0, 80.0], [-15.0, 55.0], [-28.0, 35.0], [-34.5, 18.5]] },
];

// ─── POSITION SIMULATION ────────────────────────────────────
// Time-based: vessels drift along routes based on current minute
function getSimulatedPosition(
    vesselIndex: number,
    routeIndex: number,
): { lat: number; lng: number; heading: number } {
    const route = ROUTES[routeIndex % ROUTES.length];
    const wp = route.waypoints;
    const now = Date.now();

    // Each vessel moves along route at different speed/phase
    const period = 3600_000 * (2 + (vesselIndex % 5)); // 2-6 hour cycle
    const phase = (vesselIndex * 7919) % period; // prime-based offset
    const t = ((now + phase) % period) / period; // 0→1 progress

    // Interpolate along waypoints
    const totalSegments = wp.length - 1;
    const segFloat = t * totalSegments;
    const seg = Math.min(Math.floor(segFloat), totalSegments - 1);
    const segT = segFloat - seg;

    const lat = wp[seg][0] + (wp[seg + 1][0] - wp[seg][0]) * segT;
    const lng = wp[seg][1] + (wp[seg + 1][1] - wp[seg][1]) * segT;

    // Heading from current to next waypoint
    const dLng = wp[Math.min(seg + 1, totalSegments)][1] - wp[seg][1];
    const dLat = wp[Math.min(seg + 1, totalSegments)][0] - wp[seg][0];
    const heading = ((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360;

    // Add slight noise for realism
    const noise = Math.sin(now / 60000 + vesselIndex * 3.7) * 0.15;

    return { lat: lat + noise, lng: lng + noise * 1.3, heading };
}

// ─── HANDLER ────────────────────────────────────────────────
export async function GET() {
    try {
        const ships: ShipState[] = VESSEL_DB.map((vessel, i) => {
            const routeIdx = i % ROUTES.length;
            const pos = getSimulatedPosition(i, routeIdx);

            return {
                ...vessel,
                latitude: pos.lat,
                longitude: pos.lng,
                heading: pos.heading,
                speed: vessel.speed + Math.sin(Date.now() / 120000 + i) * 1.5, // slight speed variation
            };
        });

        return NextResponse.json(
            {
                ships,
                total: ships.length,
                routes: ROUTES.length,
                timestamp: Date.now(),
            },
            { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=20" } },
        );
    } catch (error: any) {
        console.error("[Ships API]", error.message);
        return NextResponse.json({ ships: [], total: 0, error: error.message }, { status: 500 });
    }
}
