import { callOpenRouterJson } from "@/lib/openrouter";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

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
  asOf?: string;
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
  {
    label: "Central Appalachia",
    symbol: "CAPP",
    price: null,
    change: null,
    changePercent: null,
    unit: "$/t",
    note: "EIA weekly coal spot price. EIA publishes weekly; refreshed daily.",
    live: false,
  },
  {
    label: "Powder River Basin",
    symbol: "PRB",
    price: null,
    change: null,
    changePercent: null,
    unit: "$/t",
    note: "EIA weekly coal spot price. EIA publishes weekly; refreshed daily.",
    live: false,
  },
  {
    label: "Uinta Basin",
    symbol: "UINTA",
    price: null,
    change: null,
    changePercent: null,
    unit: "$/t",
    note: "EIA weekly coal spot price. EIA publishes weekly; refreshed daily.",
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
  { id: "ELEC.STOCKS.COW-US-99.M", name: "US Coal Stocks", unit: "thousand tons" },
  { id: "ELEC.RECEIPTS.COW-US-99.M", name: "US Coal Receipts", unit: "thousand tons" },
  { id: "ELEC.COST.COW-US-99.M", name: "US Coal Cost", unit: "$/MMBtu" },
];

const EIA_API_KEY = process.env.EIA_API_KEY || "";
const EIA_BASE = "https://api.eia.gov/v2";

async function fetchEiaSeries(
  seriesId: string,
  frequency: string = "monthly",
  length: number = 2,
): Promise<any | null> {
  if (!EIA_API_KEY) return null;
  try {
    const url = `${EIA_BASE}/seriesid/${seriesId}?api_key=${EIA_API_KEY}&frequency=${frequency}&sort[0][column]=period&sort[0][direction]=desc&offset=0&length=${length}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`EIA ${seriesId} HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn(`[CoalMarket] EIA ${seriesId} failed:`, error);
    return null;
  }
}

// ─── EIA COAL BASIN SPOT PRICES ───────────────────────────────
// EIA publishes weekly coal spot prices by basin. EIA itself only refreshes
// these weekly, so the as-of date is surfaced to users (honest staleness) — we
// refresh the cache daily but never imply higher-than-weekly freshness.
// Series IDs are EIA v2 weekly coal-spot series; if any is mis-keyed the
// fetch degrades gracefully (returns null → benchmarks keep ticker/Yahoo).

interface EiaBasinPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  asOf: string;
}

const COAL_BASIN_SERIES: { symbol: string; seriesId: string }[] = [
  // EIA v2 API doesn't expose weekly basin spot prices as simple series IDs.
  // The COAL.SPOT.* IDs are invalid; coal market sales prices are available
  // under the v2 /coal/market-sales-price route (annual, by region/rank).
  // Basin benchmarks rely on Yahoo Finance (NEWCASTLE via MTF=F works).
  // To add real EIA basin prices, query the v2 coal/price-by-rank route.
];

async function fetchEiaBasinPrices(): Promise<Map<string, EiaBasinPrice>> {
  const out = new Map<string, EiaBasinPrice>();
  if (!EIA_API_KEY) return out;
  await Promise.all(
    COAL_BASIN_SERIES.map(async (series) => {
      const data = await fetchEiaSeries(series.seriesId, "weekly", 2);
      const items = data?.response?.data || [];
      const current = items[0];
      const previous = items[1];
      if (!current) return;
      const price = extractEiaValue(current);
      if (price === null || !Number.isFinite(price)) return;
      const prevPrice = previous ? (extractEiaValue(previous) ?? price) : price;
      const change = Number.isFinite(prevPrice) ? price - prevPrice : 0;
      const changePercent = prevPrice ? (change / prevPrice) * 100 : 0;
      out.set(series.symbol, {
        symbol: series.symbol,
        price,
        change,
        changePercent,
        asOf: String(current.period || ""),
      });
    }),
  );
  return out;
}

function extractEiaValue(item: any): number | null {
  if (!item) return null;
  // The EIA v2 API returns the value in a series-specific field name
  // (e.g. "generation", "stocks", "receipts", "cost") rather than a generic
  // "value" field. Extract the first non-metadata numeric field.
  const META = new Set([
    "period", "location", "stateDescription", "sectorid",
    "sectorDescription", "fueltypeid", "fuelTypeDescription",
    "region", "state", "plantCode", "plantName",
  ]);
  for (const key of Object.keys(item)) {
    if (META.has(key) || key.endsWith("-units") || key.endsWith("Units")) continue;
    const v = Number(item[key]);
    if (Number.isFinite(v)) return v;
  }
  return null;
}

async function fetchEiaCoalData() {
  const results: Record<string, number | null> = {};
  for (const series of EIA_COAL_SERIES) {
    const data = await fetchEiaSeries(series.id);
    const items = data?.response?.data || [];
    const current = items[0];
    const value = current ? extractEiaValue(current) : null;
    results[series.name] = value;
  }
  return {
    coalGeneration: results["US Coal Generation"] ?? null,
    coalStocks: results["US Coal Stocks"] ?? null,
    coalProduction: results["US Coal Receipts"] ?? null,
    coalExports: null,
  };
}

// ─── TICKER BENCHMARKS ──────────────────────────────────────

async function fetchCoalBenchmarks(): Promise<CoalBenchmark[]> {
  let benchmarks: CoalBenchmark[];

  try {
    const res = await fetch("http://localhost:3000/api/ticker", { cache: "no-store" });
    if (!res.ok) throw new Error("Ticker API failed");
    const data = (await res.json()) as any[];

    benchmarks = COAL_BENCHMARK_CONFIG.map((base) => {
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
    benchmarks = COAL_BENCHMARK_CONFIG.map((b) => ({ ...b }));
  }

  // ─── Direct Yahoo Finance for any benchmark still without a price ────────
  // The ticker API often doesn't include coal symbols (they may not be synced
  // to the DB), so we fetch live Yahoo quotes directly for the ones it missed.
  // This runs regardless of whether the ticker call succeeded or failed.
  const directSymbols: Record<string, string> = {
    NEWCASTLE: "MTF=F",
    API2: "ATW=F",
    ILLINOIS: "ILB=F",
    METCOAL: "MCC=F",
  };
  const needsYahoo = benchmarks.filter((b) => b.price === null && directSymbols[b.symbol]);
  if (needsYahoo.length > 0) {
    try {
      const YahooFinance = (await import("yahoo-finance2")).default;
      const yahooFinance = new YahooFinance();
      const yahooResults = await Promise.all(
        needsYahoo.map(async (base) => {
          try {
            const quote = (await yahooFinance.quote(directSymbols[base.symbol])) as Record<string, unknown>;
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
      const yahooMap = new Map(yahooResults.map((b) => [b.symbol, b]));
      benchmarks = benchmarks.map((b) => yahooMap.get(b.symbol) ?? b);
    } catch (error) {
      console.warn("[CoalMarket] Yahoo Finance fallback failed:", error);
    }
  }

  // ─── EIA basin spot prices fill any benchmark still without a price ───────
  // EIA publishes weekly; we keep these non-live and surface the as-of date so
  // staleness is honest rather than hidden.
  const eiaBasin = await fetchEiaBasinPrices();
  if (eiaBasin.size > 0) {
    benchmarks = benchmarks.map((base) => {
      if (base.price !== null) return base;
      const eia = eiaBasin.get(base.symbol);
      if (!eia) return base;
      return {
        ...base,
        price: eia.price,
        change: eia.change,
        changePercent: eia.changePercent,
        asOf: eia.asOf,
        note: eia.asOf
          ? `EIA weekly spot price (as of ${eia.asOf}). EIA publishes weekly; refreshed daily.`
          : base.note,
      };
    });
  }

  return benchmarks;
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
        ["bulk", "cargo"].includes((v.type || "").toLowerCase()) ||
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

// ─── AI BRIEF CACHE (stale-if-error) ──────────────────────────
// The brief is regenerated on a schedule (not per pageview) to protect the
// shared free-model OpenRouter rate limit. On failure we serve the last good
// brief from memory (then a flat JSON file) so the UI never breaks, and we
// surface its own fetchedAt so staleness is honest rather than hidden.

const AI_BRIEF_TTL = 4 * 60 * 60 * 1000; // 4 hours
let aiBriefCache: { data: CoalCommentary; ts: number } | null = null;

const CACHE_DIR = join(process.cwd(), "cache");
const BRIEF_CACHE_FILE = join(CACHE_DIR, "coal-ai-brief.json");

function readBriefCacheFile(): CoalCommentary | null {
  try {
    if (!existsSync(BRIEF_CACHE_FILE)) return null;
    const raw = readFileSync(BRIEF_CACHE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object"
      ? (parsed as CoalCommentary)
      : null;
  } catch {
    return null;
  }
}

function writeBriefCacheFile(data: CoalCommentary): void {
  try {
    if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(BRIEF_CACHE_FILE, JSON.stringify(data), "utf8");
  } catch (error) {
    console.warn("[CoalMarket] Failed to write AI brief cache file:", error);
  }
}

export function clearCoalAiBriefCache() {
  aiBriefCache = null;
}

// ─── AI COAL COMMENTARY ─────────────────────────────────────

export interface CoalCommentary {
  summary: string;
  priceOutlook: string;
  routeRisks: { route: string; risk: string; severity: "low" | "moderate" | "high" }[];
  watchpoints: string[];
  confidence: "Low" | "Moderate" | "High";
  fetchedAt?: string;
}

export async function generateCoalCommentary(
  payload: CoalMarketPayload,
): Promise<CoalCommentary> {
  // Serve a fresh cached brief within the TTL so we don't hit OpenRouter per
  // pageview (protects the shared free-model rate limit, ~20 req/min).
  if (aiBriefCache && Date.now() - aiBriefCache.ts < AI_BRIEF_TTL) {
    return { ...aiBriefCache.data };
  }

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
    const normalized: CoalCommentary = {
      summary: data.summary || "Coal market briefing unavailable.",
      priceOutlook: data.priceOutlook || "Outlook unavailable.",
      routeRisks: Array.isArray(data.routeRisks) ? data.routeRisks : [],
      watchpoints: Array.isArray(data.watchpoints) ? data.watchpoints : [],
      confidence: data.confidence || "Low",
      fetchedAt: new Date().toISOString(),
    };
    aiBriefCache = { data: normalized, ts: Date.now() };
    writeBriefCacheFile(normalized);
    return normalized;
  } catch (error) {
    console.warn("[CoalMarket] AI commentary failed:", error);
    // Stale-if-error: serve the last good brief (memory, then file) with its
    // own fetchedAt so staleness is honest rather than hidden.
    const stale = aiBriefCache?.data ?? readBriefCacheFile();
    if (stale) {
      return { ...stale };
    }
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
      fetchedAt: new Date().toISOString(),
    };
  }
}
