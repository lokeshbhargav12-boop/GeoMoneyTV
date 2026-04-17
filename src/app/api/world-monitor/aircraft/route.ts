import { NextResponse } from "next/server";

// ─── TYPES ──────────────────────────────────────────────────
export interface AircraftState {
    icao24: string;
    callsign: string;
    origin_country: string;
    longitude: number;
    latitude: number;
    altitude: number; // meters
    velocity: number; // m/s
    heading: number; // degrees
    vertical_rate: number; // m/s
    on_ground: boolean;
    squawk: string;
    category: "commercial" | "cargo" | "military" | "private" | "unknown";
}

// ─── CACHE ──────────────────────────────────────────────────
let cache: { data: AircraftState[]; timestamp: number } | null = null;
const CACHE_TTL = 20_000; // 20s — OpenSky anonymous rate limit is ~10 req/min

// ─── AIRLINE PREFIX → CATEGORY ──────────────────────────────
const MILITARY_PREFIXES = [
    "RCH",
    "DUKE",
    "EVAC",
    "RRR",
    "NAVY",
    "TOPCAT",
    "REACH",
    "FORGE",
    "CASA",
    "CNV",
    "PAT",
    "GOTHAM",
    "JAKE",
    "IRON",
];
const CARGO_PREFIXES = ["FDX", "UPS", "GTI", "CLX", "CKS", "ABW", "MPH", "BOX", "GEC"];

function classifyAircraft(callsign: string, country: string): AircraftState["category"] {
    const cs = callsign.toUpperCase();
    if (MILITARY_PREFIXES.some((p) => cs.startsWith(p))) return "military";
    if (CARGO_PREFIXES.some((p) => cs.startsWith(p))) return "cargo";
    // 3-letter ICAO airline code followed by digits = commercial
    if (/^[A-Z]{3}\d/.test(cs)) return "commercial";
    // Short callsigns with only letters/numbers likely private
    if (cs.length <= 6 && /^[A-Z0-9-]+$/.test(cs)) return "private";
    return "unknown";
}

// ─── HANDLER ────────────────────────────────────────────────
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const bounds = {
            lamin: parseFloat(searchParams.get("lamin") || "-90"),
            lamax: parseFloat(searchParams.get("lamax") || "90"),
            lomin: parseFloat(searchParams.get("lomin") || "-180"),
            lomax: parseFloat(searchParams.get("lomax") || "180"),
        };

        // Return cached data if fresh
        if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
            const filtered = filterBounds(cache.data, bounds);
            return NextResponse.json(
                {
                    aircraft: filtered,
                    total: cache.data.length,
                    cached: true,
                    timestamp: cache.timestamp,
                },
                { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" } },
            );
        }

        // Fetch from OpenSky Network (free, no auth)
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10_000);

        const res = await fetch("https://opensky-network.org/api/states/all", {
            signal: controller.signal,
            headers: { Accept: "application/json" },
        }).finally(() => clearTimeout(timeout));

        if (!res.ok) {
            throw new Error(`OpenSky HTTP ${res.status}`);
        }

        const raw = await res.json();
        const states: any[] = raw.states || [];

        const aircraft: AircraftState[] = states
            .filter(
                (s: any[]) =>
                    s[5] != null && // longitude
                    s[6] != null && // latitude
                    !s[8] && // not on ground
                    s[5] >= -180 &&
                    s[5] <= 180 &&
                    s[6] >= -90 &&
                    s[6] <= 90,
            )
            .map((s: any[]) => ({
                icao24: s[0] || "",
                callsign: (s[1] || "").trim(),
                origin_country: s[2] || "",
                longitude: s[5],
                latitude: s[6],
                altitude: s[13] ?? s[7] ?? 10000, // geo_altitude → baro_altitude → default
                velocity: s[9] ?? 0,
                heading: s[10] ?? 0,
                vertical_rate: s[11] ?? 0,
                on_ground: false,
                squawk: s[14] || "",
                category: classifyAircraft((s[1] || "").trim(), s[2] || ""),
            }));

        cache = { data: aircraft, timestamp: Date.now() };

        const filtered = filterBounds(aircraft, bounds);

        return NextResponse.json(
            {
                aircraft: filtered,
                total: aircraft.length,
                cached: false,
                timestamp: Date.now(),
            },
            { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" } },
        );
    } catch (error: any) {
        console.warn("[Aircraft API]", error.message);

        // Return stale cache on error
        if (cache) {
            return NextResponse.json({
                aircraft: cache.data.slice(0, 500),
                total: cache.data.length,
                cached: true,
                stale: true,
                timestamp: cache.timestamp,
            });
        }

        return NextResponse.json(
            { aircraft: [], total: 0, error: error.message },
            { status: 502 },
        );
    }
}

function filterBounds(
    aircraft: AircraftState[],
    bounds: { lamin: number; lamax: number; lomin: number; lomax: number },
): AircraftState[] {
    if (
        bounds.lamin === -90 &&
        bounds.lamax === 90 &&
        bounds.lomin === -180 &&
        bounds.lomax === 180
    ) {
        return aircraft;
    }
    return aircraft.filter(
        (a) =>
            a.latitude >= bounds.lamin &&
            a.latitude <= bounds.lamax &&
            a.longitude >= bounds.lomin &&
            a.longitude <= bounds.lomax,
    );
}
