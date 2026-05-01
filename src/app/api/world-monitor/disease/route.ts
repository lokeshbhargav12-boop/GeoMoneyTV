import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ─── TYPES ──────────────────────────────────────────────────
export interface DiseaseEvent {
    id: string;
    title: string;
    description: string;
    pathogen: string;
    type: "outbreak" | "epidemic" | "pandemic" | "alert" | "update";
    severity: number;         // 0–100
    lat: number;
    lng: number;
    region: string;
    country: string;
    cases?: number;
    deaths?: number;
    source: string;
    url: string;
    timestamp: string;
    active: boolean;
}

// ─── CACHE ──────────────────────────────────────────────────
let cache: { data: DiseaseEvent[]; ts: number } | null = null;
const CACHE_TTL = 300_000; // 5 min

// ─── LOCATION MAP ───────────────────────────────────────────
const COUNTRY_COORDS: Record<string, { lat: number; lng: number; region: string }> = {
    "democratic republic of the congo": { lat: -4.0, lng: 21.7, region: "Africa" },
    "drc": { lat: -4.0, lng: 21.7, region: "Africa" },
    "congo": { lat: -4.0, lng: 21.7, region: "Africa" },
    "sudan": { lat: 12.8, lng: 30.2, region: "Africa" },
    "south sudan": { lat: 6.8, lng: 31.6, region: "Africa" },
    "nigeria": { lat: 9.0, lng: 8.6, region: "Africa" },
    "ethiopia": { lat: 9.1, lng: 40.4, region: "Africa" },
    "kenya": { lat: -0.0, lng: 37.9, region: "Africa" },
    "uganda": { lat: 1.3, lng: 32.3, region: "Africa" },
    "mozambique": { lat: -18.6, lng: 35.5, region: "Africa" },
    "mali": { lat: 17.5, lng: -3.9, region: "Africa" },
    "niger": { lat: 17.6, lng: 8.0, region: "Africa" },
    "chad": { lat: 15.4, lng: 18.7, region: "Africa" },
    "somalia": { lat: 5.1, lng: 46.1, region: "Africa" },
    "egypt": { lat: 26.8, lng: 30.8, region: "Africa" },
    "south africa": { lat: -30.5, lng: 22.9, region: "Africa" },
    "angola": { lat: -11.2, lng: 17.8, region: "Africa" },
    "tanzania": { lat: -6.3, lng: 34.8, region: "Africa" },
    "ghana": { lat: 7.9, lng: -1.0, region: "Africa" },
    "cameroon": { lat: 7.3, lng: 12.3, region: "Africa" },
    "guinea": { lat: 9.9, lng: -9.7, region: "Africa" },
    "sierra leone": { lat: 8.4, lng: -11.7, region: "Africa" },
    "liberia": { lat: 6.4, lng: -9.4, region: "Africa" },
    "india": { lat: 20.5, lng: 78.9, region: "Asia-Pacific" },
    "china": { lat: 35.8, lng: 104.1, region: "Asia-Pacific" },
    "indonesia": { lat: -0.7, lng: 113.9, region: "Asia-Pacific" },
    "bangladesh": { lat: 23.6, lng: 90.3, region: "Asia-Pacific" },
    "pakistan": { lat: 30.3, lng: 69.3, region: "Asia-Pacific" },
    "philippines": { lat: 12.8, lng: 121.7, region: "Asia-Pacific" },
    "vietnam": { lat: 14.0, lng: 108.2, region: "Asia-Pacific" },
    "myanmar": { lat: 19.7, lng: 96.0, region: "Asia-Pacific" },
    "japan": { lat: 36.2, lng: 138.2, region: "Asia-Pacific" },
    "thailand": { lat: 15.8, lng: 100.9, region: "Asia-Pacific" },
    "malaysia": { lat: 4.2, lng: 101.9, region: "Asia-Pacific" },
    "afghanistan": { lat: 33.9, lng: 67.7, region: "Asia-Pacific" },
    "nepal": { lat: 28.3, lng: 84.1, region: "Asia-Pacific" },
    "brazil": { lat: -14.2, lng: -51.9, region: "South America" },
    "peru": { lat: -9.1, lng: -75.0, region: "South America" },
    "colombia": { lat: 4.5, lng: -74.2, region: "South America" },
    "venezuela": { lat: 6.4, lng: -66.5, region: "South America" },
    "argentina": { lat: -38.4, lng: -63.6, region: "South America" },
    "mexico": { lat: 23.6, lng: -102.5, region: "North America" },
    "united states": { lat: 39.8, lng: -98.5, region: "North America" },
    "usa": { lat: 39.8, lng: -98.5, region: "North America" },
    "canada": { lat: 56.1, lng: -106.3, region: "North America" },
    "haiti": { lat: 18.9, lng: -72.0, region: "North America" },
    "saudi arabia": { lat: 23.8, lng: 45.0, region: "Middle East" },
    "iraq": { lat: 33.2, lng: 43.6, region: "Middle East" },
    "iran": { lat: 32.4, lng: 53.6, region: "Middle East" },
    "syria": { lat: 34.8, lng: 38.9, region: "Middle East" },
    "yemen": { lat: 15.5, lng: 48.5, region: "Middle East" },
    "turkey": { lat: 38.9, lng: 35.2, region: "Middle East" },
    "jordan": { lat: 31.2, lng: 36.5, region: "Middle East" },
    "uk": { lat: 55.3, lng: -3.4, region: "Europe" },
    "france": { lat: 46.2, lng: 2.2, region: "Europe" },
    "germany": { lat: 51.1, lng: 10.4, region: "Europe" },
    "italy": { lat: 41.8, lng: 12.5, region: "Europe" },
    "spain": { lat: 40.4, lng: -3.7, region: "Europe" },
    "ukraine": { lat: 48.3, lng: 31.1, region: "Europe" },
    "poland": { lat: 51.9, lng: 19.1, region: "Europe" },
    "romania": { lat: 45.9, lng: 24.9, region: "Europe" },
    "australia": { lat: -25.2, lng: 133.7, region: "Asia-Pacific" },
};

function findCountryCoords(text: string): { lat: number; lng: number; region: string; country: string } | null {
    const lower = text.toLowerCase();
    const entries = Object.entries(COUNTRY_COORDS).sort((a, b) => b[0].length - a[0].length);
    for (const [key, coords] of entries) {
        if (lower.includes(key)) {
            return { ...coords, country: key.charAt(0).toUpperCase() + key.slice(1) };
        }
    }
    return null;
}

// ─── PATHOGEN EXTRACTION ────────────────────────────────────
const PATHOGEN_PATTERNS: Record<string, RegExp> = {
    "Mpox": /mpox|monkeypox/i,
    "Ebola": /ebola/i,
    "Cholera": /cholera/i,
    "Dengue": /dengue/i,
    "Marburg": /marburg/i,
    "Avian Flu": /avian|bird flu|h5n1|h7n9/i,
    "COVID-19": /covid|sars-cov|coronavirus/i,
    "Measles": /measles/i,
    "Polio": /polio/i,
    "Yellow Fever": /yellow fever/i,
    "Malaria": /malaria/i,
    "Plague": /plague|yersinia/i,
    "Diphtheria": /diphtheria/i,
    "Meningitis": /meningitis/i,
    "Lassa Fever": /lassa/i,
    "Nipah": /nipah/i,
    "Zika": /zika/i,
    "Chikungunya": /chikungunya/i,
    "MERS": /mers/i,
    "Hepatitis": /hepatitis/i,
    "Tuberculosis": /tuberculosis|tb outbreak/i,
    "Rift Valley Fever": /rift valley/i,
};

function extractPathogen(text: string): string {
    for (const [name, pattern] of Object.entries(PATHOGEN_PATTERNS)) {
        if (pattern.test(text)) return name;
    }
    return "Unknown pathogen";
}

function classifySeverity(text: string, pathogen: string): { type: DiseaseEvent["type"]; severity: number } {
    const lower = text.toLowerCase();
    const highSeverity = ["ebola", "marburg", "plague", "nipah"];
    const medSeverity = ["cholera", "mpox", "avian flu", "lassa fever"];

    let severity = 40;
    let type: DiseaseEvent["type"] = "alert";

    if (highSeverity.includes(pathogen.toLowerCase())) severity = 80;
    else if (medSeverity.includes(pathogen.toLowerCase())) severity = 60;

    if (lower.includes("pandemic")) { type = "pandemic"; severity = Math.max(severity, 90); }
    else if (lower.includes("epidemic")) { type = "epidemic"; severity = Math.max(severity, 70); }
    else if (lower.includes("outbreak")) { type = "outbreak"; severity = Math.max(severity, 55); }
    else if (lower.includes("update") || lower.includes("situation report")) { type = "update"; }

    if (lower.includes("death") || lower.includes("fatal")) severity = Math.min(100, severity + 15);
    if (lower.includes("spreading") || lower.includes("surge")) severity = Math.min(100, severity + 10);

    return { type, severity };
}

// ─── WHO DISEASE OUTBREAK NEWS ──────────────────────────────
function parseRSSItems(xml: string): Array<{ title: string; link: string; description: string; pubDate: string }> {
    const items: Array<{ title: string; link: string; description: string; pubDate: string }> = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
        const x = match[1];
        const title = x.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() || "";
        const link = x.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i)?.[1]?.trim() || "";
        const desc = x.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]?.trim() || "";
        const pubDate = x.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim() || "";
        if (title) items.push({ title, link, description: desc.replace(/<[^>]*>/g, "").substring(0, 400), pubDate });
    }
    return items;
}

async function fetchWHO(): Promise<DiseaseEvent[]> {
    const results: DiseaseEvent[] = [];
    try {
        const res = await fetch(
            "https://www.who.int/feeds/entity/don/en/rss.xml",
            {
                headers: { "User-Agent": "GeoMoney-Intelligence/2.0" },
                signal: AbortSignal.timeout(10000),
            },
        );
        if (!res.ok) return [];
        const xml = await res.text();
        const items = parseRSSItems(xml);

        for (const item of items.slice(0, 20)) {
            const combined = `${item.title} ${item.description}`;
            const coords = findCountryCoords(combined);
            if (!coords) continue;

            const pathogen = extractPathogen(combined);
            const { type, severity } = classifySeverity(combined, pathogen);

            results.push({
                id: `who-${Buffer.from(item.link || item.title).toString("base64url").substring(0, 20)}`,
                title: item.title,
                description: item.description.substring(0, 300),
                pathogen,
                type,
                severity,
                lat: coords.lat,
                lng: coords.lng,
                region: coords.region,
                country: coords.country,
                source: "WHO DON",
                url: item.link || "https://www.who.int/emergencies/disease-outbreak-news",
                timestamp: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                active: true,
            });
        }
    } catch (e) {
        console.warn("[Disease] WHO DON fetch failed:", e);
    }
    return results;
}

// ─── PROMED ─────────────────────────────────────────────────
async function fetchProMED(): Promise<DiseaseEvent[]> {
    const results: DiseaseEvent[] = [];
    try {
        const res = await fetch(
            "https://promedmail.org/feed/",
            {
                headers: { "User-Agent": "GeoMoney-Intelligence/2.0", "Accept": "application/rss+xml, application/xml, text/xml" },
                signal: AbortSignal.timeout(8000),
            },
        );
        if (!res.ok) return [];
        const xml = await res.text();
        const items = parseRSSItems(xml);

        for (const item of items.slice(0, 15)) {
            const combined = `${item.title} ${item.description}`;
            const coords = findCountryCoords(combined);
            if (!coords) continue;

            const pathogen = extractPathogen(combined);
            const { type, severity } = classifySeverity(combined, pathogen);

            results.push({
                id: `promed-${Buffer.from(item.link || item.title).toString("base64url").substring(0, 20)}`,
                title: item.title,
                description: item.description.substring(0, 300),
                pathogen,
                type,
                severity,
                lat: coords.lat,
                lng: coords.lng,
                region: coords.region,
                country: coords.country,
                source: "ProMED",
                url: item.link || "https://promedmail.org",
                timestamp: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                active: true,
            });
        }
    } catch (e) {
        console.warn("[Disease] ProMED fetch failed:", e);
    }
    return results;
}

// ─── disease.sh (Open Disease Data) ─────────────────────────
async function fetchDiseaseAPI(): Promise<DiseaseEvent[]> {
    const results: DiseaseEvent[] = [];
    try {
        const res = await fetch(
            "https://disease.sh/v3/covid-19/countries?sort=todayCases",
            { signal: AbortSignal.timeout(8000) },
        );
        if (!res.ok) return [];
        const countries: any[] = await res.json();

        // Only include countries with significant daily cases
        for (const entry of countries.slice(0, 10)) {
            if (entry.todayCases < 100) continue;

            const lat = entry.countryInfo?.lat;
            const lng = entry.countryInfo?.long;
            if (typeof lat !== "number" || typeof lng !== "number") continue;

            const severity = entry.todayCases > 10000 ? 70 : entry.todayCases > 1000 ? 55 : 40;

            results.push({
                id: `covid-${entry.countryInfo?.iso2 || entry.country}`,
                title: `COVID-19 surge — ${entry.country}`,
                description: `${entry.todayCases.toLocaleString()} new cases today, ${entry.todayDeaths.toLocaleString()} deaths. Total: ${entry.cases.toLocaleString()} cases.`,
                pathogen: "COVID-19",
                type: entry.todayCases > 5000 ? "epidemic" : "update",
                severity,
                lat,
                lng,
                region: COUNTRY_COORDS[entry.country.toLowerCase()]?.region || "Global",
                country: entry.country,
                cases: entry.todayCases,
                deaths: entry.todayDeaths,
                source: "disease.sh",
                url: "https://www.worldometers.info/coronavirus/",
                timestamp: new Date(entry.updated).toISOString(),
                active: true,
            });
        }
    } catch (e) {
        console.warn("[Disease] disease.sh fetch failed:", e);
    }
    return results;
}

// ─── AGGREGATOR ─────────────────────────────────────────────
async function aggregateDisease(): Promise<DiseaseEvent[]> {
    const [who, promed, diseaseApi] = await Promise.all([
        fetchWHO().catch(() => []),
        fetchProMED().catch(() => []),
        fetchDiseaseAPI().catch(() => []),
    ]);

    const all = [...who, ...promed, ...diseaseApi];

    // Dedup by title similarity
    const seen = new Set<string>();
    const deduped = all.filter((e) => {
        const key = e.title.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 40);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    deduped.sort((a, b) => b.severity - a.severity);
    return deduped.slice(0, 80);
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

        const events = await aggregateDisease();
        cache = { data: events, ts: Date.now() };

        return NextResponse.json({
            success: true,
            cached: false,
            total: events.length,
            events,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("[Disease API]", error);
        return NextResponse.json({
            success: false,
            total: cache?.data.length || 0,
            events: cache?.data || [],
            timestamp: new Date().toISOString(),
        });
    }
}
