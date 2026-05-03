import { NextResponse } from "next/server";
import { createRequire } from "node:module";
import prisma from "@/lib/prisma";

process.env.WS_NO_BUFFER_UTIL ??= "1";
process.env.WS_NO_UTF_8_VALIDATE ??= "1";

const require = createRequire(import.meta.url);
const WebSocket = require("ws") as typeof import("ws")["default"];

export const runtime = "nodejs";

// ─── TYPES ──────────────────────────────────────────────────
export interface ShipState {
    mmsi: string;
    name: string;
    imo: string;
    callsign: string;
    type:
    | "tanker"
    | "container"
    | "bulk"
    | "lng"
    | "military"
    | "cargo"
    | "cruise"
    | "fishing";
    flag: string;
    flagEmoji: string;
    latitude: number;
    longitude: number;
    heading: number;
    speed: number;
    destination: string;
    status: "underway" | "anchored" | "moored";
    length: number;
    draught: number;
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
    trail?: ShipTrackPoint[];
}

interface ShipTrackPoint {
    latitude: number;
    longitude: number;
    heading: number;
    speed: number;
    timestamp: number;
}

interface CachedResponse {
    ships: ShipState[];
    total: number;
    routes?: number;
    timestamp: number;
    live: boolean;
    demo: boolean;
    source: string;
    notice?: string;
}

interface LiveShipSnapshot {
    ships: ShipState[];
    source: string;
    timestamp: number;
}

interface CoverageRegion {
    id: string;
    name: string;
    bounds: [[number, number], [number, number]];
    minSlots: number;
}

type AisEnvelope = {
    MessageType?: string;
    Message?: Record<string, any>;
    MetaData?: Record<string, any>;
    Metadata?: Record<string, any>;
    error?: string;
};

let cache: { response: CachedResponse; timestamp: number } | null = null;
let inflightSnapshot: Promise<LiveShipSnapshot | null> | null = null;

const CACHE_TTL = 15_000;
const LEGACY_AIS_URL = process.env.AIS_API_URL;
const LEGACY_AIS_KEY = process.env.AIS_API_KEY;
const LEGACY_AIS_AUTH_HEADER =
    process.env.AIS_API_AUTH_HEADER || "Authorization";
const LEGACY_AIS_SOURCE =
    process.env.AIS_API_SOURCE || "Configured AIS provider";

const AISTREAM_URL =
    process.env.AISTREAM_STREAM_URL || "wss://stream.aisstream.io/v0/stream";
const AISTREAM_API_KEY = process.env.AISTREAM_API_KEY || "";
const AISTREAM_SOURCE = "AISStream.io websocket feed";
const VESSELFINDER_API_KEY = process.env.VESSELFINDER_API_KEY || "";
const VESSELFINDER_LIVEDATA_URL =
    process.env.VESSELFINDER_LIVEDATA_URL || "https://api.vesselfinder.com/livedata";
const VESSELFINDER_INTERVAL_MINUTES = Math.max(
    1,
    Number(process.env.VESSELFINDER_INTERVAL_MINUTES || "10"),
);
const AISTREAM_SAMPLE_MS = Math.max(
    3000,
    Number(process.env.AISTREAM_SAMPLE_MS || "7000"),
);
const AISTREAM_MAX_VESSELS = Math.max(
    250,
    Number(process.env.AISTREAM_MAX_VESSELS || "3500"),
);
const TRACK_LOOKBACK_MS = Math.max(
    60 * 60 * 1000,
    Number(process.env.VESSEL_TRACK_LOOKBACK_MS || `${12 * 60 * 60 * 1000}`),
);
const TRACK_HISTORY_LIMIT = Math.max(
    4,
    Number(process.env.VESSEL_TRACK_HISTORY_LIMIT || "14"),
);
const TRACK_MIN_PERSIST_INTERVAL_MS = Math.max(
    60_000,
    Number(process.env.VESSEL_TRACK_MIN_PERSIST_INTERVAL_MS || `${2 * 60 * 1000}`),
);
const DEFAULT_AISTREAM_TYPES = [
    "PositionReport",
    "StandardClassBPositionReport",
    "ExtendedClassBPositionReport",
    "LongRangeAisBroadcastMessage",
    "ShipStaticData",
    "StaticDataReport",
];

const DEFAULT_COVERAGE_REGIONS: CoverageRegion[] = [
    {
        id: "middle-east",
        name: "Middle East / Strait of Hormuz",
        bounds: [[12, 43], [31.5, 61.5]],
        minSlots: 450,
    },
    {
        id: "red-sea",
        name: "Red Sea / Suez",
        bounds: [[8, 30], [33.5, 44.5]],
        minSlots: 300,
    },
    {
        id: "arabian-sea",
        name: "Arabian Sea / West India",
        bounds: [[5, 58], [26, 78]],
        minSlots: 280,
    },
    {
        id: "mediterranean",
        name: "Mediterranean",
        bounds: [[28, -7], [47, 37]],
        minSlots: 320,
    },
    {
        id: "north-sea",
        name: "North Sea / Baltic",
        bounds: [[48, -10], [63, 20]],
        minSlots: 320,
    },
    {
        id: "west-africa",
        name: "West Africa",
        bounds: [[-10, -20], [25, 20]],
        minSlots: 220,
    },
    {
        id: "singapore-malacca",
        name: "Singapore / Malacca",
        bounds: [[-2, 95], [15, 110]],
        minSlots: 320,
    },
    {
        id: "south-china-sea",
        name: "South China Sea",
        bounds: [[0, 105], [28, 125]],
        minSlots: 320,
    },
    {
        id: "east-asia",
        name: "East Asia",
        bounds: [[28, 120], [46, 146]],
        minSlots: 280,
    },
    {
        id: "americas",
        name: "Americas",
        bounds: [[5, -100], [45, -65]],
        minSlots: 260,
    },
];

const lastPersistedByShip = new Map<
    string,
    { latitude: number; longitude: number; timestamp: number }
>();

function parseBoundingBoxes(): number[][][] {
    const raw = process.env.AISTREAM_BOUNDING_BOXES;
    if (!raw) {
        return DEFAULT_COVERAGE_REGIONS.map((region) => region.bounds);
    }

    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
        }
    } catch (error) {
        console.warn("[Ships API] Invalid AISTREAM_BOUNDING_BOXES:", error);
    }

    return DEFAULT_COVERAGE_REGIONS.map((region) => region.bounds);
}

function parseMessageTypes(): string[] {
    const raw = process.env.AISTREAM_MESSAGE_TYPES;
    if (!raw) {
        return DEFAULT_AISTREAM_TYPES;
    }

    const values = raw
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

    return values.length ? values : DEFAULT_AISTREAM_TYPES;
}

const AISTREAM_BOUNDING_BOXES = parseBoundingBoxes();
const AISTREAM_MESSAGE_TYPES = parseMessageTypes();

// ─── REALISTIC VESSEL DATABASE ──────────────────────────────
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

function getSimulatedPosition(
    vesselIndex: number,
    routeIndex: number,
): { lat: number; lng: number; heading: number } {
    const route = ROUTES[routeIndex % ROUTES.length];
    const wp = route.waypoints;
    const now = Date.now();
    const period = 3600_000 * (2 + (vesselIndex % 5));
    const phase = (vesselIndex * 7919) % period;
    const t = ((now + phase) % period) / period;
    const totalSegments = wp.length - 1;
    const segFloat = t * totalSegments;
    const seg = Math.min(Math.floor(segFloat), totalSegments - 1);
    const segT = segFloat - seg;
    const lat = wp[seg][0] + (wp[seg + 1][0] - wp[seg][0]) * segT;
    const lng = wp[seg][1] + (wp[seg + 1][1] - wp[seg][1]) * segT;
    const dLng = wp[Math.min(seg + 1, totalSegments)][1] - wp[seg][1];
    const dLat = wp[Math.min(seg + 1, totalSegments)][0] - wp[seg][0];
    const heading = ((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360;
    const noise = Math.sin(now / 60000 + vesselIndex * 3.7) * 0.15;

    return { lat: lat + noise, lng: lng + noise * 1.3, heading };
}

function firstString(...values: unknown[]): string {
    for (const value of values) {
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }
    return "";
}

function toNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string" && value.trim()) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

function sanitizeAisText(value: string): string {
    return value.replace(/@+/g, " ").replace(/\s+/g, " ").trim();
}

function resolveFlagEmoji(flag: string): string {
    const countryCodeMap: Record<string, string> = {
        bahamas: "BS",
        china: "CN",
        cyprus: "CY",
        greece: "GR",
        "hong kong": "HK",
        liberia: "LR",
        malta: "MT",
        netherlands: "NL",
        panama: "PA",
        spain: "ES",
        uk: "GB",
        usa: "US",
        "united kingdom": "GB",
        "united states": "US",
    };

    const code = countryCodeMap[flag.toLowerCase()];
    if (!code) {
        return "";
    }

    return code
        .toUpperCase()
        .split("")
        .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
        .join("");
}

function normalizeShipType(value: unknown): ShipState["type"] {
    if (typeof value === "number") {
        if (value === 35) return "military";
        if (value >= 80 && value < 90) return "tanker";
        if (value >= 70 && value < 80) return "cargo";
        if (value >= 60 && value < 70) return "cruise";
        if (value === 30) return "fishing";
    }

    const input = String(value || "").toLowerCase();
    if (input.includes("military") || input.includes("navy") || input.includes("war")) return "military";
    if (input.includes("tanker") || input.includes("oil")) return "tanker";
    if (input.includes("container")) return "container";
    if (input.includes("bulk")) return "bulk";
    if (input.includes("lng") || input.includes("gas")) return "lng";
    if (input.includes("cruise") || input.includes("passenger")) return "cruise";
    if (input.includes("fish")) return "fishing";
    return "cargo";
}

function normalizeShipStatus(value: unknown): ShipState["status"] {
    if (typeof value === "number") {
        if (value === 1 || value === 5 || value === 6) return "anchored";
        if (value === 7 || value === 8) return "moored";
        return "underway";
    }

    const input = String(value || "").toLowerCase();
    if (input.includes("anchor") || input.includes("stopped")) return "anchored";
    if (input.includes("moor")) return "moored";
    return "underway";
}

function isWithinBounds(
    latitude: number,
    longitude: number,
    bounds: [[number, number], [number, number]],
): boolean {
    return (
        latitude >= bounds[0][0] &&
        latitude <= bounds[1][0] &&
        longitude >= bounds[0][1] &&
        longitude <= bounds[1][1]
    );
}

function getCoverageRegion(ship: ShipState): CoverageRegion | null {
    for (const region of DEFAULT_COVERAGE_REGIONS) {
        if (isWithinBounds(ship.latitude, ship.longitude, region.bounds)) {
            return region;
        }
    }
    return null;
}

function selectCoverageBalancedShips(ships: ShipState[]): ShipState[] {
    if (ships.length <= AISTREAM_MAX_VESSELS) {
        return ships;
    }

    const selected = new Map<string, ShipState>();

    for (const region of DEFAULT_COVERAGE_REGIONS) {
        const regionalShips = ships
            .filter((ship) => isWithinBounds(ship.latitude, ship.longitude, region.bounds))
            .sort((left, right) => (right.lastUpdate ?? 0) - (left.lastUpdate ?? 0))
            .slice(0, region.minSlots);

        for (const ship of regionalShips) {
            selected.set(ship.mmsi, ship);
        }
    }

    for (const ship of ships) {
        if (selected.size >= AISTREAM_MAX_VESSELS) {
            break;
        }
        selected.set(ship.mmsi, ship);
    }

    return Array.from(selected.values())
        .sort((left, right) => (right.lastUpdate ?? 0) - (left.lastUpdate ?? 0))
        .slice(0, AISTREAM_MAX_VESSELS);
}

function mergeShipDetails(base: ShipState, incoming: ShipState): ShipState {
    return {
        ...base,
        ...incoming,
        name: incoming.name || base.name,
        imo: incoming.imo || base.imo,
        callsign: incoming.callsign || base.callsign,
        flag: incoming.flag || base.flag,
        flagEmoji: incoming.flagEmoji || base.flagEmoji,
        destination: incoming.destination || base.destination,
        zone: incoming.zone || base.zone,
        lastPort: incoming.lastPort || base.lastPort,
        owner: incoming.owner || base.owner,
        manager: incoming.manager || base.manager,
        built: incoming.built || base.built,
        beam: incoming.beam || base.beam,
        deadweight: incoming.deadweight || base.deadweight,
        source: incoming.source || base.source,
        lastUpdate: Math.max(incoming.lastUpdate ?? 0, base.lastUpdate ?? 0),
    };
}

function mergeShipSnapshots(
    snapshots: Array<LiveShipSnapshot | null>,
): LiveShipSnapshot | null {
    const available = snapshots.filter(
        (snapshot): snapshot is LiveShipSnapshot => snapshot !== null,
    );

    if (!available.length) {
        return null;
    }

    const merged = new Map<string, ShipState>();
    let newestTimestamp = 0;

    for (const snapshot of available) {
        newestTimestamp = Math.max(newestTimestamp, snapshot.timestamp);
        for (const ship of snapshot.ships) {
            const existing = merged.get(ship.mmsi);
            merged.set(ship.mmsi, existing ? mergeShipDetails(existing, ship) : ship);
        }
    }

    const ships = selectCoverageBalancedShips(
        Array.from(merged.values()).sort(
            (left, right) => (right.lastUpdate ?? 0) - (left.lastUpdate ?? 0),
        ),
    );

    return {
        ships,
        source: available.map((snapshot) => snapshot.source).join(" + "),
        timestamp: newestTimestamp || Date.now(),
    };
}

function toRadians(value: number): number {
    return (value * Math.PI) / 180;
}

function distanceKm(
    leftLat: number,
    leftLng: number,
    rightLat: number,
    rightLng: number,
): number {
    const earthRadiusKm = 6371;
    const dLat = toRadians(rightLat - leftLat);
    const dLng = toRadians(rightLng - leftLng);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(leftLat)) *
        Math.cos(toRadians(rightLat)) *
        Math.sin(dLng / 2) ** 2;

    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function extractShipEntries(payload: any): any[] {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.ships)) return payload.ships;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.results)) return payload.results;
    if (Array.isArray(payload?.vessels)) return payload.vessels;
    return [];
}

function normalizeProviderShip(entry: any, timestamp: number): ShipState | null {
    const latitude = toNumber(entry.latitude ?? entry.lat ?? entry.position?.lat);
    const longitude = toNumber(
        entry.longitude ??
        entry.lng ??
        entry.lon ??
        entry.position?.lng ??
        entry.position?.lon,
    );

    if (latitude == null || longitude == null) {
        return null;
    }

    const mmsi = firstString(entry.mmsi, entry.MMSI, entry.vesselMmsi, entry.id);
    const name =
        firstString(entry.name, entry.vesselName, entry.shipname, entry.shipName) ||
        "Unknown vessel";
    const flag =
        firstString(entry.flag, entry.flagCountry, entry.country, entry.flag_name) ||
        "Unknown";

    return {
        mmsi: mmsi || `live-${name}-${latitude}-${longitude}`,
        name,
        imo: firstString(entry.imo, entry.IMO),
        callsign: firstString(entry.callsign, entry.callSign),
        type: normalizeShipType(
            entry.type ?? entry.shipType ?? entry.vesselType ?? entry.cargo_type,
        ),
        flag,
        flagEmoji: firstString(entry.flagEmoji) || resolveFlagEmoji(flag),
        latitude,
        longitude,
        heading: toNumber(entry.heading ?? entry.cog ?? entry.course) ?? 0,
        speed: toNumber(entry.speed ?? entry.sog ?? entry.speedKnots) ?? 0,
        destination:
            firstString(entry.destination, entry.destinationPort, entry.nextPort) ||
            "Unknown",
        status: normalizeShipStatus(entry.status ?? entry.navStatus),
        length: toNumber(entry.length ?? entry.vesselLength) ?? 0,
        draught: toNumber(entry.draught ?? entry.draft) ?? 0,
        live: true,
        source: LEGACY_AIS_SOURCE,
        lastUpdate: timestamp,
        zone: firstString(entry.zone, entry.region),
    };
}

function normalizeVesselFinderShip(entry: any, timestamp: number): ShipState | null {
    const ais = entry?.AIS ?? {};
    const master = entry?.MASTERDATA ?? {};
    const voyage = entry?.VOYAGE ?? {};

    const latitude = toNumber(ais.LATITUDE);
    const longitude = toNumber(ais.LONGITUDE);
    if (latitude == null || longitude == null) {
        return null;
    }

    const parsedTimestamp = new Date(firstString(ais.TIMESTAMP)).getTime();
    const lastUpdate = Number.isFinite(parsedTimestamp) ? parsedTimestamp : timestamp;
    const flag = firstString(master.FLAG, ais.FLAG, "Unknown");
    const type = normalizeShipType(master.TYPE ?? ais.TYPE);
    const length =
        toNumber(master.LENGTH) ??
        ((toNumber(ais.A) ?? 0) + (toNumber(ais.B) ?? 0));

    return {
        mmsi: firstString(ais.MMSI) || `vf-${latitude}-${longitude}`,
        name: sanitizeAisText(firstString(master.NAME, ais.NAME, "Unknown vessel")),
        imo: firstString(master.IMO, ais.IMO),
        callsign: sanitizeAisText(firstString(ais.CALLSIGN)),
        type,
        flag,
        flagEmoji: resolveFlagEmoji(flag),
        latitude,
        longitude,
        heading: toNumber(ais.HEADING) ?? toNumber(ais.COURSE) ?? 0,
        speed: toNumber(ais.SPEED) ?? 0,
        destination: sanitizeAisText(firstString(ais.DESTINATION, "Unknown")),
        status: normalizeShipStatus(ais.NAVSTAT),
        length,
        draught: toNumber(master.MAXDRAUGHT) ?? toNumber(ais.DRAUGHT) ?? 0,
        live: true,
        source: `VesselFinder ${ais.SRC === "SAT" ? "satellite" : "terrestrial"}`,
        lastUpdate,
        zone: firstString(ais.ZONE),
        lastPort: firstString(voyage.LASTPORT),
        owner: firstString(master.OWNER),
        manager: firstString(master.MANAGER),
        built: toNumber(master.BUILT) ?? undefined,
        beam: toNumber(master.BEAM) ?? undefined,
        deadweight: toNumber(master.DWT) ?? undefined,
    };
}

function getEnvelopeMetadata(envelope: AisEnvelope): Record<string, any> {
    return envelope.MetaData ?? envelope.Metadata ?? {};
}

function getEnvelopeBody(envelope: AisEnvelope): Record<string, any> {
    if (!envelope.MessageType || !envelope.Message) {
        return {};
    }

    return envelope.Message[envelope.MessageType] ?? {};
}

function getLengthMeters(body: Record<string, any>): number {
    const dimension = body.Dimension ?? body.dimension;
    if (dimension && typeof dimension === "object") {
        const a = toNumber(dimension.A ?? dimension.a) ?? 0;
        const b = toNumber(dimension.B ?? dimension.b) ?? 0;
        return a + b;
    }
    return 0;
}

function getDraftMeters(body: Record<string, any>): number {
    return (
        toNumber(body.MaximumStaticDraught ?? body.maximumStaticDraught) ??
        toNumber(body.Draught ?? body.draught) ??
        0
    );
}

function upsertAisShip(
    vessels: Map<string, ShipState>,
    envelope: AisEnvelope,
    timestamp: number,
): void {
    const metadata = getEnvelopeMetadata(envelope);
    const body = getEnvelopeBody(envelope);
    const messageType = envelope.MessageType || "Unknown";

    const mmsi = String(
        toNumber(metadata.MMSI ?? metadata.mmsi ?? body.UserID ?? body.userId) ?? "",
    );
    if (!mmsi) {
        return;
    }

    const existing = vessels.get(mmsi);
    const latitude =
        toNumber(
            metadata.latitude ??
            metadata.Latitude ??
            metadata.lat ??
            body.Latitude ??
            body.latitude,
        ) ?? existing?.latitude;
    const longitude =
        toNumber(
            metadata.longitude ??
            metadata.Longitude ??
            metadata.lng ??
            metadata.lon ??
            body.Longitude ??
            body.longitude,
        ) ?? existing?.longitude;

    const name = sanitizeAisText(
        firstString(
            metadata.ShipName,
            metadata.shipName,
            body.Name,
            body.name,
            body.ReportA?.Name,
            existing?.name,
        ) || "Unknown vessel",
    );
    const flag = firstString(
        metadata.Flag,
        metadata.flag,
        metadata.Country,
        metadata.country,
        existing?.flag,
        "Unknown",
    );
    const destination = sanitizeAisText(
        firstString(body.Destination, body.destination, existing?.destination, "Unknown"),
    );
    const shipType = normalizeShipType(
        body.Type ?? body.type ?? body.ShipType ?? body.ReportB?.ShipType ?? existing?.type,
    );
    const status = normalizeShipStatus(
        body.NavigationalStatus ?? body.navigationalStatus ?? existing?.status,
    );
    const parsedTimestamp = new Date(
        firstString(metadata.time_utc, metadata.TimeUTC, metadata.timestamp),
    ).getTime();
    const messageTimestamp = Number.isFinite(parsedTimestamp)
        ? parsedTimestamp
        : timestamp;

    if (latitude == null || longitude == null) {
        return;
    }

    const ship: ShipState = {
        mmsi,
        name,
        imo: firstString(body.ImoNumber, body.IMO, existing?.imo),
        callsign: sanitizeAisText(
            firstString(
                body.CallSign,
                body.callSign,
                body.ReportB?.CallSign,
                existing?.callsign,
            ),
        ),
        type: shipType,
        flag,
        flagEmoji: resolveFlagEmoji(flag) || existing?.flagEmoji || "",
        latitude,
        longitude,
        heading:
            toNumber(body.TrueHeading ?? body.trueHeading ?? body.Cog ?? body.cog) ??
            existing?.heading ??
            0,
        speed:
            toNumber(body.Sog ?? body.sog ?? body.Speed ?? body.speed) ??
            existing?.speed ??
            0,
        destination,
        status,
        length: getLengthMeters(body) || existing?.length || 0,
        draught: getDraftMeters(body) || existing?.draught || 0,
        live: true,
        source: `${AISTREAM_SOURCE} • ${messageType}`,
        lastUpdate: messageTimestamp,
    };

    vessels.set(mmsi, ship);
}

async function fetchConfiguredProviderShips(): Promise<LiveShipSnapshot | null> {
    if (!LEGACY_AIS_URL) {
        return null;
    }

    const headers: Record<string, string> = { Accept: "application/json" };
    if (LEGACY_AIS_KEY) {
        headers[LEGACY_AIS_AUTH_HEADER] =
            LEGACY_AIS_AUTH_HEADER.toLowerCase() === "authorization" &&
                !LEGACY_AIS_KEY.includes(" ")
                ? `Bearer ${LEGACY_AIS_KEY}`
                : LEGACY_AIS_KEY;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);

    try {
        const res = await fetch(LEGACY_AIS_URL, {
            headers,
            signal: controller.signal,
            cache: "no-store",
        });
        if (!res.ok) {
            throw new Error(`AIS provider HTTP ${res.status}`);
        }

        const payload = await res.json();
        const timestamp = Date.now();
        const ships = extractShipEntries(payload)
            .map((entry) => normalizeProviderShip(entry, timestamp))
            .filter((ship): ship is ShipState => ship !== null);

        if (!ships.length) {
            throw new Error("AIS provider returned no usable vessel positions");
        }

        return { ships, source: LEGACY_AIS_SOURCE, timestamp };
    } finally {
        clearTimeout(timeout);
    }
}

async function fetchVesselFinderShips(): Promise<LiveShipSnapshot | null> {
    if (!VESSELFINDER_API_KEY) {
        return null;
    }

    const requestUrl = new URL(VESSELFINDER_LIVEDATA_URL);
    requestUrl.searchParams.set("userkey", VESSELFINDER_API_KEY);
    requestUrl.searchParams.set("format", "json");
    requestUrl.searchParams.set("interval", String(VESSELFINDER_INTERVAL_MINUTES));
    requestUrl.searchParams.set("errormode", "409");
    if (!requestUrl.searchParams.has("extradata")) {
        requestUrl.searchParams.set("extradata", "voyage,master");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);

    try {
        const res = await fetch(requestUrl, {
            headers: { Accept: "application/json" },
            signal: controller.signal,
            cache: "no-store",
        });

        if (!res.ok) {
            throw new Error(`VesselFinder HTTP ${res.status}`);
        }

        const payload = await res.json();
        if (!Array.isArray(payload)) {
            if (payload?.error) {
                throw new Error(String(payload.error));
            }
            throw new Error("VesselFinder returned an unexpected payload");
        }

        const timestamp = Date.now();
        const ships = payload
            .map((entry) => normalizeVesselFinderShip(entry, timestamp))
            .filter((ship): ship is ShipState => ship !== null);

        if (!ships.length) {
            throw new Error("VesselFinder returned no usable vessel positions");
        }

        return {
            ships,
            source: "VesselFinder live data",
            timestamp,
        };
    } finally {
        clearTimeout(timeout);
    }
}

async function collectAisStreamSnapshot(): Promise<LiveShipSnapshot | null> {
    if (!AISTREAM_API_KEY) {
        return null;
    }

    if (inflightSnapshot) {
        return inflightSnapshot;
    }

    inflightSnapshot = new Promise<LiveShipSnapshot | null>((resolve, reject) => {
        const vessels = new Map<string, ShipState>();
        const ws = new WebSocket(AISTREAM_URL);
        const startedAt = Date.now();
        let settled = false;

        const finish = (error?: Error) => {
            if (settled) {
                return;
            }
            settled = true;
            clearTimeout(sampleTimer);
            clearTimeout(hardTimeout);

            if (
                ws.readyState === WebSocket.OPEN ||
                ws.readyState === WebSocket.CONNECTING
            ) {
                try {
                    ws.close();
                } catch {
                    // ignore cleanup close errors
                }
            }

            const ships = selectCoverageBalancedShips(
                Array.from(vessels.values()).sort(
                    (left, right) => (right.lastUpdate ?? 0) - (left.lastUpdate ?? 0),
                ),
            );

            if (ships.length > 0) {
                resolve({
                    ships,
                    source: `${AISTREAM_SOURCE} • ${AISTREAM_BOUNDING_BOXES.length} bounding box${AISTREAM_BOUNDING_BOXES.length === 1 ? "" : "es"}`,
                    timestamp: Date.now(),
                });
            } else {
                reject(error ?? new Error("AISStream returned no usable vessel positions"));
            }
        };

        const sampleTimer = setTimeout(() => finish(), AISTREAM_SAMPLE_MS);
        const hardTimeout = setTimeout(
            () => finish(new Error("AISStream sample window timed out")),
            AISTREAM_SAMPLE_MS + 4000,
        );

        ws.on("open", () => {
            ws.send(
                JSON.stringify({
                    APIKey: AISTREAM_API_KEY,
                    BoundingBoxes: AISTREAM_BOUNDING_BOXES,
                    FilterMessageTypes: AISTREAM_MESSAGE_TYPES,
                }),
            );
        });

        ws.on("message", (raw) => {
            try {
                const envelope = JSON.parse(raw.toString()) as AisEnvelope;
                if (envelope.error) {
                    finish(new Error(envelope.error));
                    return;
                }

                upsertAisShip(vessels, envelope, Date.now());
                if (vessels.size >= AISTREAM_MAX_VESSELS) {
                    finish();
                }
            } catch (error) {
                console.warn("[Ships API] Failed to parse AISStream message:", error);
            }
        });

        ws.on("error", (error) => {
            finish(error instanceof Error ? error : new Error(String(error)));
        });

        ws.on("close", () => {
            if (!settled && Date.now() - startedAt > 1000) {
                finish();
            }
        });
    }).finally(() => {
        inflightSnapshot = null;
    });

    return inflightSnapshot;
}

async function persistShipTracks(ships: ShipState[]): Promise<void> {
    if (!ships.length) {
        return;
    }

    const writeCandidates = ships.filter((ship) => {
        const previous = lastPersistedByShip.get(ship.mmsi);
        if (!previous) {
            return true;
        }

        const elapsed = (ship.lastUpdate ?? Date.now()) - previous.timestamp;
        if (elapsed >= TRACK_MIN_PERSIST_INTERVAL_MS) {
            return true;
        }

        return (
            distanceKm(
                previous.latitude,
                previous.longitude,
                ship.latitude,
                ship.longitude,
            ) >= 2.5
        );
    });

    if (!writeCandidates.length) {
        return;
    }

    try {
        await (prisma as any).vesselTrack.createMany({
            data: writeCandidates.map((ship) => ({
                mmsi: ship.mmsi,
                shipName: ship.name,
                latitude: ship.latitude,
                longitude: ship.longitude,
                heading: ship.heading,
                speed: ship.speed,
                source: ship.source,
                recordedAt: new Date(ship.lastUpdate ?? Date.now()),
            })),
        });

        for (const ship of writeCandidates) {
            lastPersistedByShip.set(ship.mmsi, {
                latitude: ship.latitude,
                longitude: ship.longitude,
                timestamp: ship.lastUpdate ?? Date.now(),
            });
        }
    } catch (error) {
        // Silently catch missing table error to prevent console spam
        // console.warn(
        //     "[Ships API] Vessel track persistence unavailable:",
        //     error instanceof Error ? error.message : String(error),
        // );
    }
}

async function hydrateShipTracks(ships: ShipState[]): Promise<ShipState[]> {
    if (!ships.length) {
        return ships;
    }

    try {
        const records = await (prisma as any).vesselTrack.findMany({
            where: {
                mmsi: { in: ships.map((ship) => ship.mmsi) },
                recordedAt: { gte: new Date(Date.now() - TRACK_LOOKBACK_MS) },
            },
            orderBy: [{ recordedAt: "desc" }],
            take: Math.min(ships.length * TRACK_HISTORY_LIMIT * 4, 12000),
        });

        const grouped = new Map<string, ShipTrackPoint[]>();
        for (const record of records) {
            const items = grouped.get(record.mmsi) || [];
            if (items.length >= TRACK_HISTORY_LIMIT) {
                continue;
            }
            items.push({
                latitude: record.latitude,
                longitude: record.longitude,
                heading: record.heading ?? 0,
                speed: record.speed ?? 0,
                timestamp: new Date(record.recordedAt).getTime(),
            });
            grouped.set(record.mmsi, items);
        }

        return ships.map((ship) => {
            const history = grouped.get(ship.mmsi) || [];
            const livePoint: ShipTrackPoint = {
                latitude: ship.latitude,
                longitude: ship.longitude,
                heading: ship.heading,
                speed: ship.speed,
                timestamp: ship.lastUpdate ?? Date.now(),
            };

            const deduped = [
                ...history,
                livePoint,
            ].filter(
                (point, index, points) =>
                    points.findIndex(
                        (candidate) => candidate.timestamp === point.timestamp,
                    ) === index,
            );

            return {
                ...ship,
                trail: deduped.sort((left, right) => left.timestamp - right.timestamp),
            };
        });
    } catch (error) {
        console.warn(
            "[Ships API] Vessel track history unavailable:",
            error instanceof Error ? error.message : String(error),
        );
        return ships;
    }
}

function buildDemoShips(timestamp: number): ShipState[] {
    return VESSEL_DB.map((vessel, index) => {
        const position = getSimulatedPosition(index, index % ROUTES.length);
        return {
            ...vessel,
            latitude: position.lat,
            longitude: position.lng,
            heading: position.heading,
            speed: vessel.speed + Math.sin(Date.now() / 120000 + index) * 1.5,
            live: false,
            source: "Demo traffic model",
            lastUpdate: timestamp,
        };
    });
}

async function buildResponseFromSnapshot(
    snapshot: LiveShipSnapshot,
): Promise<CachedResponse> {
    await persistShipTracks(snapshot.ships);
    const ships = await hydrateShipTracks(snapshot.ships);
    const regionCounts = ships.reduce<Record<string, number>>((accumulator, ship) => {
        const region = getCoverageRegion(ship)?.name || ship.zone || "Open ocean";
        accumulator[region] = (accumulator[region] || 0) + 1;
        return accumulator;
    }, {});

    return {
        ships,
        total: ships.length,
        timestamp: snapshot.timestamp,
        live: true,
        demo: false,
        source: snapshot.source,
        notice: Object.entries(regionCounts)
            .sort((left, right) => right[1] - left[1])
            .slice(0, 4)
            .map(([region, count]) => `${region}: ${count}`)
            .join(" • "),
    };
}

export async function GET() {
    try {
        if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
            return NextResponse.json(cache.response, {
                headers: {
                    "Cache-Control": "public, s-maxage=10, stale-while-revalidate=20",
                },
            });
        }

        const liveSnapshot = await collectAisStreamSnapshot().catch((error: Error) => {
            console.warn("[Ships API] AISStream unavailable:", error.message);
            return null;
        });

        const vesselFinderSnapshot = await fetchVesselFinderShips().catch(
            (error: Error) => {
                console.warn("[Ships API] VesselFinder unavailable:", error.message);
                return null;
            },
        );

        const legacySnapshot = await fetchConfiguredProviderShips().catch((error: Error) => {
            console.warn("[Ships API] Legacy AIS provider unavailable:", error.message);
            return null;
        });

        const mergedSnapshot = mergeShipSnapshots([
            liveSnapshot,
            legacySnapshot,
            vesselFinderSnapshot,
        ]);

        if (mergedSnapshot) {
            const response = await buildResponseFromSnapshot(mergedSnapshot);
            cache = { response, timestamp: Date.now() };

            return NextResponse.json(response, {
                headers: {
                    "Cache-Control": "public, s-maxage=10, stale-while-revalidate=20",
                },
            });
        }

        const timestamp = Date.now();
        const ships = buildDemoShips(timestamp);
        const response: CachedResponse = {
            ships,
            total: ships.length,
            routes: ROUTES.length,
            timestamp,
            live: false,
            demo: true,
            source: "Demo traffic model",
            notice:
                "Configure AISTREAM_API_KEY for regional AISStream coverage and optionally VESSELFINDER_API_KEY to merge denser commercial traffic snapshots. Vessel history persists once the VesselTrack table is migrated.",
        };

        cache = { response, timestamp: Date.now() };

        return NextResponse.json(response, {
            headers: {
                "Cache-Control": "public, s-maxage=10, stale-while-revalidate=20",
            },
        });
    } catch (error: any) {
        console.error("[Ships API]", error.message);
        return NextResponse.json(
            { ships: [], total: 0, error: error.message },
            { status: 500 },
        );
    }
}
