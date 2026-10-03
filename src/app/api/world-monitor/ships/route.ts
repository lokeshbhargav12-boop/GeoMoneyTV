import { NextResponse } from "next/server";
import { createRequire } from "node:module";
import prisma from "@/lib/prisma";

process.env.WS_NO_BUFFER_UTIL ??= "1";
process.env.WS_NO_UTF_8_VALIDATE ??= "1";

const require = createRequire(import.meta.url);
const WebSocket = require("ws") as typeof import("ws")["default"];

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    const observedAt = Math.max(
        0,
        ...ships.map((ship) => ship.lastUpdate || 0),
    ) || snapshot.timestamp;

    return {
        ships,
        total: ships.length,
        timestamp: observedAt,
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
        const response: CachedResponse = {
            ships: [],
            total: 0,
            timestamp,
            live: false,
            demo: false,
            source: "AIS unavailable",
            notice: "No configured AIS provider returned a current observation. Simulated vessel traffic is disabled.",
        };
        cache = { response, timestamp };
        return NextResponse.json(response, {
            headers: { "Cache-Control": "no-store" },
        });
    } catch (error: any) {
        console.error("[Ships API]", error.message);
        return NextResponse.json(
            { ships: [], total: 0, error: error.message },
            { status: 500 },
        );
    }
}
