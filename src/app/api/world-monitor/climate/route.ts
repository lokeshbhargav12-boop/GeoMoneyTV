import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ─── TYPES ──────────────────────────────────────────────────
export interface ClimateEvent {
    id: string;
    title: string;
    description: string;
    type: "heat" | "drought" | "storm" | "wildfire" | "flood" | "volcano" | "earthquake" | "ice";
    severity: number;          // 0–100
    lat: number;
    lng: number;
    region: string;
    source: string;
    url: string;
    timestamp: string;
    active: boolean;
}

// ─── CACHE ──────────────────────────────────────────────────
let cache: { data: ClimateEvent[]; ts: number } | null = null;
const CACHE_TTL = 120_000; // 2 min

// ─── REGION RESOLVER ────────────────────────────────────────
function resolveRegion(lat: number, lng: number): string {
    if (lat > 60) return "Arctic";
    if (lat < -60) return "Antarctic";
    if (lat > 25 && lat < 50 && lng > -130 && lng < -60) return "North America";
    if (lat > -60 && lat < 15 && lng > -90 && lng < -30) return "South America";
    if (lat > 35 && lat < 72 && lng > -12 && lng < 45) return "Europe";
    if (lat > -40 && lat < 38 && lng > -20 && lng < 55) return "Africa";
    if (lat > 10 && lat < 45 && lng > 25 && lng < 65) return "Middle East";
    if (lat > -50 && lat < 55 && lng > 60 && lng < 180) return "Asia-Pacific";
    return "Global";
}

// ─── NASA EONET ─────────────────────────────────────────────
function eonetCategoryToType(catId: string): ClimateEvent["type"] {
    const map: Record<string, ClimateEvent["type"]> = {
        wildfires: "wildfire",
        severeStorms: "storm",
        volcanoes: "volcano",
        earthquakes: "earthquake",
        floods: "flood",
        drought: "drought",
        seaLakeIce: "ice",
        snow: "storm",
        landslides: "flood",
        tempExtremes: "heat",
        dustHaze: "drought",
        waterColor: "flood",
        manmade: "wildfire",
    };
    return map[catId] || "storm";
}

function eonetSeverity(catId: string, magValue: number | null): number {
    const base: Record<string, number> = {
        wildfires: 60,
        severeStorms: 65,
        volcanoes: 75,
        earthquakes: 70,
        floods: 55,
        drought: 50,
        seaLakeIce: 30,
    };
    let s = base[catId] ?? 50;
    if (magValue !== null && magValue > 0) {
        s = Math.min(100, s + Math.round(magValue * 3));
    }
    return s;
}

async function fetchNasaEONET(): Promise<ClimateEvent[]> {
    const results: ClimateEvent[] = [];
    try {
        const res = await fetch(
            "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=60",
            { signal: AbortSignal.timeout(10000) },
        );
        if (!res.ok) return [];
        const data = await res.json();

        for (const event of data.events || []) {
            const catId = event.categories?.[0]?.id || "unknown";
            const geo = event.geometry?.[event.geometry.length - 1];
            if (!geo?.coordinates) continue;

            const [lng, lat] = geo.coordinates;
            if (typeof lat !== "number" || typeof lng !== "number") continue;

            const magValue = geo.magnitudeValue ?? null;

            results.push({
                id: `eonet-${event.id}`,
                title: event.title || "Climate event",
                description: `${event.title} — Source: ${event.sources?.[0]?.id || "NASA EONET"}`,
                type: eonetCategoryToType(catId),
                severity: eonetSeverity(catId, magValue),
                lat,
                lng,
                region: resolveRegion(lat, lng),
                source: "NASA EONET",
                url: event.sources?.[0]?.url || event.link || "https://eonet.gsfc.nasa.gov",
                timestamp: geo.date || new Date().toISOString(),
                active: true,
            });
        }
    } catch (e) {
        console.warn("[Climate] NASA EONET fetch failed:", e);
    }
    return results;
}

// ─── OPEN-METEO EXTREME WEATHER ─────────────────────────────
const EXTREME_TEMP_CITIES = [
    { name: "Phoenix", lat: 33.44, lng: -112.07 },
    { name: "Dubai", lat: 25.27, lng: 55.29 },
    { name: "New Delhi", lat: 28.61, lng: 77.21 },
    { name: "Baghdad", lat: 33.31, lng: 44.37 },
    { name: "Riyadh", lat: 24.71, lng: 46.68 },
    { name: "Cairo", lat: 30.04, lng: 31.24 },
    { name: "São Paulo", lat: -23.55, lng: -46.63 },
    { name: "Jakarta", lat: -6.21, lng: 106.85 },
    { name: "Moscow", lat: 55.76, lng: 37.62 },
    { name: "London", lat: 51.51, lng: -0.13 },
    { name: "Tokyo", lat: 35.68, lng: 139.69 },
    { name: "Sydney", lat: -33.87, lng: 151.21 },
    { name: "Nairobi", lat: -1.29, lng: 36.82 },
    { name: "Lagos", lat: 6.45, lng: 3.40 },
    { name: "Shanghai", lat: 31.23, lng: 121.47 },
];

async function fetchExtremeWeather(): Promise<ClimateEvent[]> {
    const results: ClimateEvent[] = [];
    try {
        const lats = EXTREME_TEMP_CITIES.map((c) => c.lat).join(",");
        const lngs = EXTREME_TEMP_CITIES.map((c) => c.lng).join(",");
        const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current=temperature_2m,wind_speed_10m,weather_code&timezone=auto`,
            { signal: AbortSignal.timeout(8000) },
        );
        if (!res.ok) return [];
        const data = await res.json();

        const entries = Array.isArray(data) ? data : [data];
        for (let i = 0; i < entries.length && i < EXTREME_TEMP_CITIES.length; i++) {
            const city = EXTREME_TEMP_CITIES[i];
            const current = entries[i]?.current;
            if (!current) continue;

            const temp = current.temperature_2m;
            const wind = current.wind_speed_10m;
            const weatherCode = current.weather_code;

            // Flag extreme conditions
            let type: ClimateEvent["type"] = "heat";
            let severity = 0;
            let isExtreme = false;

            if (temp >= 42) {
                severity = 85 + Math.min(15, (temp - 42) * 3);
                type = "heat";
                isExtreme = true;
            } else if (temp >= 38) {
                severity = 60 + Math.min(25, (temp - 38) * 5);
                type = "heat";
                isExtreme = true;
            } else if (temp <= -25) {
                severity = 70 + Math.min(20, Math.abs(temp + 25) * 2);
                type = "ice";
                isExtreme = true;
            } else if (wind >= 80) {
                severity = 80;
                type = "storm";
                isExtreme = true;
            } else if (weatherCode >= 95) {
                severity = 65;
                type = "storm";
                isExtreme = true;
            }

            if (isExtreme) {
                results.push({
                    id: `weather-${city.name.toLowerCase()}`,
                    title: `${type === "heat" ? "Extreme heat" : type === "ice" ? "Extreme cold" : "Severe weather"} — ${city.name}`,
                    description: `Temperature: ${temp}°C, Wind: ${wind} km/h, Weather code: ${weatherCode}`,
                    type,
                    severity: Math.round(Math.min(100, severity)),
                    lat: city.lat,
                    lng: city.lng,
                    region: resolveRegion(city.lat, city.lng),
                    source: "Open-Meteo",
                    url: "https://open-meteo.com",
                    timestamp: new Date().toISOString(),
                    active: true,
                });
            }
        }
    } catch (e) {
        console.warn("[Climate] Open-Meteo fetch failed:", e);
    }
    return results;
}

// ─── AGGREGATOR ─────────────────────────────────────────────
async function aggregateClimate(): Promise<ClimateEvent[]> {
    const [eonet, weather] = await Promise.all([
        fetchNasaEONET().catch(() => []),
        fetchExtremeWeather().catch(() => []),
    ]);

    const all = [...eonet, ...weather];

    // Deduplicate by proximity (within 50km)
    const deduped: ClimateEvent[] = [];
    for (const event of all) {
        const isDupe = deduped.some(
            (existing) =>
                Math.abs(existing.lat - event.lat) < 0.5 &&
                Math.abs(existing.lng - event.lng) < 0.5 &&
                existing.type === event.type,
        );
        if (!isDupe) deduped.push(event);
    }

    deduped.sort((a, b) => b.severity - a.severity);
    return deduped.slice(0, 100);
}

// ─── HANDLER ────────────────────────────────────────────────
export async function GET() {
    try {
        if (cache && Date.now() - cache.ts < CACHE_TTL) {
            return NextResponse.json({
                success: true,
                cached: true,
                total: cache.data.length,
                events: cache.data,
                timestamp: new Date().toISOString(),
            });
        }

        const events = await aggregateClimate();
        cache = { data: events, ts: Date.now() };

        return NextResponse.json({
            success: true,
            cached: false,
            total: events.length,
            events,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("[Climate API]", error);
        return NextResponse.json({
            success: false,
            total: cache?.data.length || 0,
            events: cache?.data || [],
            timestamp: new Date().toISOString(),
        });
    }
}
