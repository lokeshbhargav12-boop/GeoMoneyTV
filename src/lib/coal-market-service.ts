import { callOpenRouterJson } from "@/lib/openrouter";

// ─── TYPES ──────────────────────────────────────────────────

export interface CoalBenchmark {
  label: string;
  symbol: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  unit: string;
  note: string;
  live: boolean;
}

export interface CoalRouteStatus {
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

export interface CoalMarketPayload {
  timestamp: string;
  benchmarks: CoalBenchmark[];
  eia: {
    coalGeneration: number | null;
    coalStocks: number | null;
    coalProduction: number | null;
    coalExports: number | null;
  };
  routes: CoalRouteStatus[];
  osint: any[];
  climate: any[];
  vessels: any[];
}

// ─── COAL BENCHMARK CONFIG ──────────────────────────────────

const COAL_BENCHMARK_CONFIG: CoalBenchmark[] = [
  {
    label: "Newcastle 6,000 kcal",
    symbol: "NEWCASTLE",
    price: null,
    change: null,
    changePercent: null,
    unit: "$/t",
    note: "Asia-Pacific benchmark for seaborne thermal coal.",
    live: false,
  },
  {
    label: "API2 Rotterdam",
    symbol: "API2",
    price: null,
    change: null,
    changePercent: null,
    unit: "$/t",
    note: "European delivered benchmark tied to power and carbon spreads.",
    live: false,
  },
  {
    label: "Illinois Basin",
    symbol: "ILLINOIS",
    price: null,
    change: null,
    changePercent: null,
    unit: "$/t",
    note: "US inland benchmark for domestic utility procurement.",
    live: false,
  },
  {
    label: "Met Coal FOB Australia",
    symbol: "METCOAL",
    price: null,
    change: null,
    changePercent: null,
    unit: "$/t",
    note: "Steelmaking benchmark sensitive to mine outages and rail flows.",
    live: false,
  },
];

// ─── COAL ROUTES ────────────────────────────────────────────

const COAL_ROUTES: CoalRouteStatus[] = [
  {
    id: "newcastle-asia",
    name: "Newcastle Seaborne Arc",
    mode: "Mine, rail, and port chain",
    origin: [-32.9, 151.8],
    destination: [37.5, 105.0],
    waypoints: [[-32.9, 151.8], [-20.0, 140.0], [5.0, 110.0], [22.0, 114.0], [37.5, 105.0]],
    exposure: "Rainfall, channel queues, and maintenance windows",
    watch: "Australian weather still sets the tone for thermal coal pricing across Asia.",
    vesselCount: 0,
    congestion: "low",
  },
  {
    id: "richards-bay-eu",
    name: "Richards Bay Export Loop",
    mode: "Rail and bulk vessel corridor",
    origin: [-28.7, 32.1],
    destination: [51.3, 3.2],
    waypoints: [[-28.7, 32.1], [-20.0, 10.0], [10.0, -10.0], [36.0, -5.5], [51.3, 3.2]],
    exposure: "Power availability and rail theft disruptions",
    watch: "South African throughput remains a swing factor for Atlantic Basin supply.",
    vesselCount: 0,
    congestion: "low",
  },
  {
    id: "us-gulf-asia",
    name: "US Gulf to Asia",
    mode: "Rail and export terminal",
    origin: [29.9, -93.9],
    destination: [22.0, 114.0],
    waypoints: [[29.9, -93.9], [15.0, -80.0], [-5.0, -80.0], [5.0, 100.0], [22.0, 114.0]],
    exposure: "Rail congestion and terminal slotting",
    watch: "Track stockpile draw vs. BNSF loadouts during export demand spikes.",
    vesselCount: 0,
    congestion: "low",
  },
  {
    id: "indonesia-india",
    name: "Indonesian Barge Network",
    mode: "River barge and coastal export",
    origin: [-0.7, 113.9],
    destination: [20.5, 78.9],
    waypoints: [[-0.7, 113.9], [5.0, 100.0], [10.0, 85.0], [15.0, 80.0], [20.5, 78.9]],
    exposure: "Water levels, monsoon timing, and loading queues",
    watch: "Low-calorie thermal cargoes remain crucial for India and China shortfalls.",
    vesselCount: 0,
    congestion: "low",
  },
];

// ─── EIA COAL SERIES ────────────────────────────────────────

const EIA_COAL_SERIES: { id: string; name: string; unit: string }[] = [
  { id: "ELEC.GEN.COW-US-99.M", name: "US Coal Generation", unit: "GWh" },
  { id: "COAL.STOCKS-TOTAL.US", name: "US Coal Stocks", unit: "thousand tons" },
  { id: "COAL.PRODUCTION-TOTAL.US", name: "US Coal Production", unit: "thousand tons" },
  { id: "COAL.EXPORTS-TOTAL.US", name: "US Coal Exports", unit: "thousand tons" },
];

const EIA_API_KEY = process.env.EIA_API_KEY || "";
const EIA_BASE = "https://api.eia.gov/v2";

async function fetchEiaSeries(seriesId: string): Promise<any | null> {
  if (!EIA_API_KEY) return null;
  try {
    const url = `${EIA_BASE}/seriesid/${seriesId}?api_key=${EIA_API_KEY}&frequency=monthly&data[0]=value&sort[0][column]=period&sort[0][direction]=desc&offset=0&length=2`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`EIA ${seriesId} HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn(`[CoalMarket] EIA ${seriesId} failed:`, error);
    return null;
  }
}

async function fetchEiaCoalData() {
  const results: Record<string, number | null> = {};
  for (const series of EIA_COAL_SERIES) {
    const data = await fetchEiaSeries(series.id);
    const items = data?.response?.data || [];
    const current = items[0];
    const value = current ? Number(current.value) : null;
    results[series.name] = Number.isFinite(value) ? value : null;
  }
  return {
    coalGeneration: results["US Coal Generation"] ?? null,
    coalStocks: results["US Coal Stocks"] ?? null,
    coalProduction: results["US Coal Production"] ?? null,
    coalExports: results["US Coal Exports"] ?? null,
  };
}

// ─── TICKER BENCHMARKS ──────────────────────────────────────

async function fetchCoalBenchmarks(): Promise<CoalBenchmark[]> {
  try {
    const res = await fetch("http://localhost:3000/api/ticker", { cache: "no-store" });
    if (!res.ok) throw new Error("Ticker API failed");
    const data = (await res.json()) as any[];

    return COAL_BENCHMARK_CONFIG.map((base) => {
      const live = data.find(
        (item) =>
          item.symbol?.toUpperCase() === base.symbol.toUpperCase() ||
          item.label?.toUpperCase().includes(base.symbol.toUpperCase()),
      );
      if (live && typeof live.price === "number") {
        return {
          ...base,
          price: live.price,
          change: live.change ?? 0,
          changePercent: live.changePercent ?? 0,
          live: true,
        };
      }
      return base;
    });
  } catch (error) {
    console.warn("[CoalMarket] Benchmark fetch failed:", error);
    // Fallback: try direct Yahoo Finance quote for each coal symbol
    const directSymbols: Record<string, string> = {
      NEWCASTLE: "MTF=F",
      API2: "ATW=F",
      ILLINOIS: "ILB=F",
      METCOAL: "MCC=F",
    };
    const yahooFinance = (await import("yahoo-finance2")).default;
    const results = await Promise.all(
      COAL_BENCHMARK_CONFIG.map(async (base) => {
        const yahooSymbol = directSymbols[base.symbol];
        if (!yahooSymbol) return base;
        try {
          const quote = (await yahooFinance.quote(yahooSymbol)) as Record<string, unknown>;
          const price = Number(quote.regularMarketPrice) || Number(quote.postMarketPrice) || Number(quote.preMarketPrice) || null;
          const change = Number(quote.regularMarketChange) || 0;
          const previousClose = Number(quote.regularMarketPreviousClose) || price || 0;
          const changePercent = previousClose && price ? ((price - previousClose) / previousClose) * 100 : 0;
          if (price && Number.isFinite(price)) {
            return { ...base, price, change, changePercent, live: true };
          }
        } catch (e) {
          console.warn(`[CoalMarket] Direct quote failed for ${base.symbol}:`, e);
        }
        return base;
      }),
    );
    return results;
  }
}

// ─── VESSEL ROUTE COUNTS ────────────────────────────────────

function isPointNearRoute(
  lat: number,
  lng: number,
  waypoints: [number, number][],
  thresholdKm: number = 200,
): boolean {
  for (let i = 0; i < waypoints.length - 1; i++) {
    const [lat1, lng1] = waypoints[i];
    const [lat2, lng2] = waypoints[i + 1];
    const d = pointToSegmentDistance(lat, lng, lat1, lng1, lat2, lng2);
    if (d <= thresholdKm) return true;
  }
  return false;
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pointToSegmentDistance(
  lat: number,
  lng: number,
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const A = lat - lat1;
  const B = lng - lng1;
  const C = lat2 - lat1;
  const D = lng2 - lng1;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = 0;
  if (lenSq !== 0) param = dot / lenSq;
  let xx: number, yy: number;
  if (param < 0) {
    xx = lat1;
    yy = lng1;
  } else if (param > 1) {
    xx = lat2;
    yy = lng2;
  } else {
    xx = lat1 + param * C;
    yy = lng1 + param * D;
  }
  return haversineKm(lat, lng, xx, yy);
}

async function fetchVesselsAndComputeRoutes(): Promise<{
  routes: CoalRouteStatus[];
  vessels: any[];
}> {
  try {
    const res = await fetch("http://localhost:3000/api/world-monitor/ships", {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Ships API failed");
    const data = await res.json();
    const vessels = (data.ships || []) as any[];

    const bulkVessels = vessels.filter(
      (v) =>
        (v.type || "").toLowerCase() === "bulk" ||
        (v.destination || "").toLowerCase().includes("coal") ||
        (v.name || "").toLowerCase().includes("coal"),
    );

    const routes = COAL_ROUTES.map((route) => {
      const nearVessels = bulkVessels.filter((v) =>
        isPointNearRoute(v.latitude, v.longitude, route.waypoints, 250),
      );
      const count = nearVessels.length;
      let congestion: CoalRouteStatus["congestion"] = "low";
      if (count >= 8) congestion = "high";
      else if (count >= 4) congestion = "moderate";
      return { ...route, vesselCount: count, congestion };
    });

    return { routes, vessels: bulkVessels.slice(0, 100) };
  } catch (error) {
    console.warn("[CoalMarket] Vessel fetch failed:", error);
    return { routes: COAL_ROUTES, vessels: [] };
  }
}

// ─── OSINT / CLIMATE FILTERS ────────────────────────────────

const COAL_KEYWORDS = [
  "coal",
  "newcastle",
  "richards bay",
  "thermal coal",
  "met coal",
  "coking coal",
  "indonesia coal",
  "australia coal",
  "china coal",
  "india coal",
  "powder river",
  "illinois basin",
  "bnsf",
  "coal rail",
  "coal port",
  "coal imports",
  "coal exports",
];

function isCoalRelevant(item: any): boolean {
  const text = `${item.title || ""} ${item.description || ""} ${item.category || ""}`.toLowerCase();
  return COAL_KEYWORDS.some((kw) => text.includes(kw));
}

function isCoalRegionClimate(event: any): boolean {
  const coalRegions = [
    { name: "Australia", minLat: -44, maxLat: -10, minLng: 112, maxLng: 154 },
    { name: "Indonesia", minLat: -11, maxLat: 6, minLng: 95, maxLng: 141 },
    { name: "South Africa", minLat: -35, maxLat: -22, minLng: 16, maxLng: 33 },
    { name: "India", minLat: 6, maxLat: 37, minLng: 68, maxLng: 97 },
    { name: "US Powder River", minLat: 42, maxLat: 45, minLng: -108, maxLng: -104 },
  ];
  return coalRegions.some(
    (r) =>
      event.lat >= r.minLat &&
      event.lat <= r.maxLat &&
      event.lng >= r.minLng &&
      event.lng <= r.maxLng,
  );
}

async function fetchCoalOsint(): Promise<any[]> {
  try {
    const res = await fetch("http://localhost:3000/api/world-monitor/osint", {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("OSINT API failed");
    const data = await res.json();
    return (data.events || []).filter(isCoalRelevant).slice(0, 10);
  } catch (error) {
    console.warn("[CoalMarket] OSINT fetch failed:", error);
    return [];
  }
}

async function fetchCoalClimate(): Promise<any[]> {
  try {
    const res = await fetch("http://localhost:3000/api/world-monitor/climate", {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Climate API failed");
    const data = await res.json();
    return (data.events || []).filter(isCoalRegionClimate).slice(0, 10);
  } catch (error) {
    console.warn("[CoalMarket] Climate fetch failed:", error);
    return [];
  }
}

// ─── CACHE ──────────────────────────────────────────────────

let cache: { data: CoalMarketPayload; ts: number } | null = null;
const CACHE_TTL = 120_000; // 2 minutes

// ─── AGGREGATOR ─────────────────────────────────────────────

export async function getCoalMarketData(): Promise<CoalMarketPayload> {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return cache.data;
  }

  const [benchmarks, eia, { routes, vessels }, osint, climate] = await Promise.all([
    fetchCoalBenchmarks(),
    fetchEiaCoalData(),
    fetchVesselsAndComputeRoutes(),
    fetchCoalOsint(),
    fetchCoalClimate(),
  ]);

  const data: CoalMarketPayload = {
    timestamp: new Date().toISOString(),
    benchmarks,
    eia,
    routes,
    osint,
    climate,
    vessels,
  };

  cache = { data, ts: Date.now() };
  return data;
}

export function clearCoalMarketCache() {
  cache = null;
}

// ─── AI COAL COMMENTARY ─────────────────────────────────────

export interface CoalCommentary {
  summary: string;
  priceOutlook: string;
  routeRisks: { route: string; risk: string; severity: "low" | "moderate" | "high" }[];
  watchpoints: string[];
  confidence: "Low" | "Moderate" | "High";
}

export async function generateCoalCommentary(
  payload: CoalMarketPayload,
): Promise<CoalCommentary> {
  const benchmarkSummary = payload.benchmarks
    .map(
      (b) =>
        `${b.label} (${b.symbol}): ${b.price !== null ? `$${b.price.toFixed(2)}` : "N/A"} ${b.changePercent !== null ? `(${b.changePercent >= 0 ? "+" : ""}${b.changePercent.toFixed(2)}%)` : ""}`,
    )
    .join("; ");

  const routeSummary = payload.routes
    .map((r) => `${r.name}: ${r.vesselCount} bulk vessels nearby, congestion ${r.congestion}`)
    .join("; ");

  const eiaSummary = `US coal generation: ${payload.eia.coalGeneration ?? "N/A"} GWh; stocks: ${payload.eia.coalStocks ?? "N/A"} ktons; production: ${payload.eia.coalProduction ?? "N/A"} ktons; exports: ${payload.eia.coalExports ?? "N/A"} ktons.`;

  const osintHeadlines = payload.osint.slice(0, 5).map((o) => `- ${o.title}`).join("\n");
  const climateHeadlines = payload.climate.slice(0, 5).map((c) => `- ${c.title} (${c.severity}/100)`).join("\n");

  const prompt = `
You are a senior coal market analyst for GeoMoney TV.
Analyze the following live coal market data and produce a structured briefing.

LIVE BENCHMARKS:
${benchmarkSummary}

EIA COAL DATA:
${eiaSummary}

ROUTE STATUS:
${routeSummary}

RECENT COAL-RELEVANT OSINT:
${osintHeadlines || "No major coal headlines."}

COAL-REGION CLIMATE EVENTS:
${climateHeadlines || "No significant coal-region weather events."}

Respond with ONLY a JSON object in this exact shape:
{
  "summary": "2-3 sentence executive summary",
  "priceOutlook": "1-2 sentence price outlook",
  "routeRisks": [
    { "route": "Route name", "risk": "Specific risk sentence", "severity": "low|moderate|high" }
  ],
  "watchpoints": ["watchpoint 1", "watchpoint 2", "watchpoint 3"],
  "confidence": "Low|Moderate|High"
}
`;

  try {
    const { data } = await callOpenRouterJson<CoalCommentary>(prompt, {
      temperature: 0.3,
      maxTokens: 800,
      caller: "coal-commentary",
    });
    return {
      summary: data.summary || "Coal market briefing unavailable.",
      priceOutlook: data.priceOutlook || "Outlook unavailable.",
      routeRisks: Array.isArray(data.routeRisks) ? data.routeRisks : [],
      watchpoints: Array.isArray(data.watchpoints) ? data.watchpoints : [],
      confidence: data.confidence || "Low",
    };
  } catch (error) {
    console.warn("[CoalMarket] AI commentary failed:", error);
    return {
      summary: "AI commentary is temporarily unavailable. Live data above remains current.",
      priceOutlook: "Please check live benchmarks and route status for the latest signals.",
      routeRisks: payload.routes.map((r) => ({
        route: r.name,
        risk: r.exposure,
        severity: r.congestion,
      })),
      watchpoints: ["Monitor benchmark price action", "Watch coal corridor vessel counts", "Track EIA coal stocks and generation"],
      confidence: "Low",
    };
  }
}
