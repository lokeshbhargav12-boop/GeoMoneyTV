import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
    trail?: AircraftTrackPoint[];
}

interface AircraftTrackPoint {
    latitude: number;
    longitude: number;
    altitude: number;
    heading: number;
    velocity: number;
    timestamp: number;
}

// ─── CACHE ──────────────────────────────────────────────────
let cache: { data: AircraftState[]; timestamp: number } | null = null;
const CACHE_TTL = 20_000; // 20s — OpenSky anonymous rate limit is ~10 req/min
const FLIGHT_TRACK_LOOKBACK_MS = Math.max(
    60 * 60 * 1000,
    Number(process.env.FLIGHT_TRACK_LOOKBACK_MS || `${6 * 60 * 60 * 1000}`),
);
const FLIGHT_TRACK_HISTORY_LIMIT = Math.max(
    4,
    Number(process.env.FLIGHT_TRACK_HISTORY_LIMIT || "12"),
);
const FLIGHT_TRACK_MIN_PERSIST_INTERVAL_MS = Math.max(
    60_000,
    Number(process.env.FLIGHT_TRACK_MIN_PERSIST_INTERVAL_MS || `${2 * 60 * 1000}`),
);
const lastPersistedByAircraft = new Map<
    string,
    { latitude: number; longitude: number; timestamp: number }
>();

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

async function persistAircraftTracks(aircraft: AircraftState[]): Promise<void> {
    const writeCandidates = aircraft.filter((asset) => {
        const previous = lastPersistedByAircraft.get(asset.icao24);
        if (!previous) {
            return true;
        }

        const elapsed = Date.now() - previous.timestamp;
        if (elapsed >= FLIGHT_TRACK_MIN_PERSIST_INTERVAL_MS) {
            return true;
        }

        return (
            distanceKm(
                previous.latitude,
                previous.longitude,
                asset.latitude,
                asset.longitude,
            ) >= 10
        );
    });

    if (!writeCandidates.length) {
        return;
    }

    try {
        await (prisma as any).flightTrack.createMany({
            data: writeCandidates.map((asset) => ({
                icao24: asset.icao24,
                callsign: asset.callsign,
                latitude: asset.latitude,
                longitude: asset.longitude,
                altitude: asset.altitude,
                heading: asset.heading,
                velocity: asset.velocity,
                source: "OpenSky Network",
                recordedAt: new Date(),
            })),
        });

        const now = Date.now();
        for (const asset of writeCandidates) {
            lastPersistedByAircraft.set(asset.icao24, {
                latitude: asset.latitude,
                longitude: asset.longitude,
                timestamp: now,
            });
        }
    } catch (error) {
        // Silently catch missing table error to prevent console spam
        // console.warn(
        //     "[Aircraft API] Flight track persistence unavailable:",
        //     error instanceof Error ? error.message : String(error),
        // );
    }
}

async function hydrateAircraftTracks(aircraft: AircraftState[]): Promise<AircraftState[]> {
    if (!aircraft.length) {
        return aircraft;
    }

    try {
        const records = await (prisma as any).flightTrack.findMany({
            where: {
                icao24: { in: aircraft.map((asset) => asset.icao24) },
                recordedAt: { gte: new Date(Date.now() - FLIGHT_TRACK_LOOKBACK_MS) },
            },
            orderBy: [{ recordedAt: "desc" }],
            take: Math.min(aircraft.length * FLIGHT_TRACK_HISTORY_LIMIT * 4, 12000),
        });

        const grouped = new Map<string, AircraftTrackPoint[]>();
        for (const record of records) {
            const items = grouped.get(record.icao24) || [];
            if (items.length >= FLIGHT_TRACK_HISTORY_LIMIT) {
                continue;
            }
            items.push({
                latitude: record.latitude,
                longitude: record.longitude,
                altitude: record.altitude ?? 0,
                heading: record.heading ?? 0,
                velocity: record.velocity ?? 0,
                timestamp: new Date(record.recordedAt).getTime(),
            });
            grouped.set(record.icao24, items);
        }

        return aircraft.map((asset) => ({
            ...asset,
            trail: [
                ...(grouped.get(asset.icao24) || []),
                {
                    latitude: asset.latitude,
                    longitude: asset.longitude,
                    altitude: asset.altitude,
                    heading: asset.heading,
                    velocity: asset.velocity,
                    timestamp: Date.now(),
                },
            ]
                .filter(
                    (point, index, points) =>
                        points.findIndex(
                            (candidate) => candidate.timestamp === point.timestamp,
                        ) === index,
                )
                .sort((left, right) => left.timestamp - right.timestamp),
        }));
    } catch (error) {
        console.warn(
            "[Aircraft API] Flight track history unavailable:",
            error instanceof Error ? error.message : String(error),
        );
        return aircraft;
    }
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

        await persistAircraftTracks(aircraft);
        const hydratedAircraft = await hydrateAircraftTracks(aircraft);

        cache = { data: hydratedAircraft, timestamp: Date.now() };

        const filtered = filterBounds(hydratedAircraft, bounds);

        return NextResponse.json(
            {
                aircraft: filtered,
                total: hydratedAircraft.length,
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
