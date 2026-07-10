import { callOpenRouter } from "@/lib/openrouter";

// ─── TYPES ──────────────────────────────────────────────────

export interface LiveCommodity {
  symbol: string;
  label: string;
  price: number;
  change: number;
  changePercent: number;
  marketStatus: string;
  lastTradingTimestamp: string | null;
}

export interface EiaStorage {
  name: string;
  value: number | null;
  unit: string;
  change: number | null;
  changePercent: number | null;
  date: string;
  source: string;
}

export interface EiaGrid {
  name: string;
  value: number | null;
  unit: string;
  date: string;
  source: string;
}

export interface ClimateEventLite {
  id: string;
  title: string;
  type: string;
  severity: number;
  lat: number;
  lng: number;
  region: string;
  timestamp: string;
}

export interface OsintEventLite {
  id: string;
  title: string;
  category: string;
  threatScore: number;
  region: string;
  timestamp: string;
}

export interface ShipCount {
  region: string;
  tanker: number;
  lng: number;
  total: number;
}

export interface AssetLiveData {
  id: string;
  price?: LiveCommodity | null;
  storage?: EiaStorage | null;
  weather?: ClimateEventLite | null;
  shipCount?: ShipCount | null;
  headline?: string | null;
}

export interface ConstraintLiveData {
  label: string;
  sev: "high" | "medium" | "variable";
  desc: string;
  score: number;
  evidence: string[];
}

export interface ResilienceLiveData {
  dim: string;
  score: number; // 0 = low concern, 100 = high concern
  status: "Low Concern" | "Moderate Concern" | "High Concern";
  low: string;
  high: string;
  evidence: string;
}

export interface ScenarioLiveData {
  id: string;
  label: string;
  desc: string;
  affected: string[];
  impact?: string;
}

export interface EnergyInfrastructurePayload {
  timestamp: string;
  commodities: LiveCommodity[];
  storage: EiaStorage[];
  grid: EiaGrid[];
  climate: ClimateEventLite[];
  osint: OsintEventLite[];
  shipCounts: ShipCount[];
  assets: AssetLiveData[];
  constraints: ConstraintLiveData[];
  resilience: ResilienceLiveData[];
  scenarios: ScenarioLiveData[];
}

// ─── CACHE ──────────────────────────────────────────────────

let cache: { data: EnergyInfrastructurePayload; ts: number } | null = null;
const CACHE_TTL = 120_000; // 2 minutes

// ─── EIA CONFIG ─────────────────────────────────────────────

const EIA_API_KEY = process.env.EIA_API_KEY || "";
const EIA_BASE = "https://api.eia.gov/v2";

const EIA_SERIES: { id: string; name: string; unit: string }[] = [
  { id: "PET.WCESTUS1.W", name: "US Crude Oil Stocks", unit: "M bbl" },
  { id: "PET.WGTSTUS1.W", name: "US Gasoline Stocks", unit: "M bbl" },
  { id: "NG.NW2_EPG0_SWO_R48_BCF.W", name: "US Working Natural Gas", unit: "B cf" },
  { id: "PET.WPULEUS3.W", name: "US Refinery Utilization", unit: "%" },
  { id: "PET.WCRFPUS2.W", name: "US Crude Field Production", unit: "M bbl/d" },
];

const EIA_GRID_SERIES: { id: string; name: string; unit: string }[] = [
  { id: "ELEC.GEN.ALL-US-99.M", name: "US Total Net Generation", unit: "GWh" },
  { id: "ELEC.GEN.NG-US-99.M", name: "US Natural Gas Generation", unit: "GWh" },
  { id: "ELEC.GEN.COW-US-99.M", name: "US Coal Generation", unit: "GWh" },
  { id: "ELEC.GEN.WND-US-99.M", name: "US Wind Generation", unit: "GWh" },
  { id: "ELEC.GEN.SUN-US-99.M", name: "US Solar Generation", unit: "GWh" },
];

// ─── HELPERS ────────────────────────────────────────────────

function toFiniteNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

// ─── COMMODITIES ────────────────────────────────────────────

async function fetchCommodities(): Promise<LiveCommodity[]> {
  try {
    const res = await fetch("http://localhost:3000/api/ticker", {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Ticker API failed");
    const data = (await res.json()) as any[];
    const wanted = ["CRUDE", "NATGAS", "GOLD", "SILVER", "COPPER", "URANIUM", "LITHIUM"];
    return data
      .filter((item) => wanted.includes(item.symbol?.toUpperCase()))
      .map((item) => ({
        symbol: item.symbol,
        label: item.label,
        price: Number(item.price) || 0,
        change: Number(item.change) || 0,
        changePercent: Number(item.changePercent) || 0,
        marketStatus: item.marketStatus || "UNKNOWN",
        lastTradingTimestamp: item.lastTradingTimestamp || null,
      }));
  } catch (error) {
    console.warn("[EnergyInfra] Commodities fetch failed:", error);
    return [];
  }
}

// ─── EIA ────────────────────────────────────────────────────

async function fetchEiaSeries(seriesId: string): Promise<any | null> {
  if (!EIA_API_KEY) return null;
  try {
    const url = `${EIA_BASE}/seriesid/${seriesId}?api_key=${EIA_API_KEY}&frequency=weekly&data[0]=value&sort[0][column]=period&sort[0][direction]=desc&offset=0&length=2`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`EIA ${seriesId} HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn(`[EnergyInfra] EIA ${seriesId} failed:`, error);
    return null;
  }
}

async function fetchEiaStorage(): Promise<EiaStorage[]> {
  const results: EiaStorage[] = [];
  for (const series of EIA_SERIES) {
    const data = await fetchEiaSeries(series.id);
    const items = data?.response?.data || [];
    const current = items[0];
    const previous = items[1];
    const value = current ? toFiniteNumber(current.value) : null;
    const prev = previous ? toFiniteNumber(previous.value) : null;
    const change = value !== null && prev !== null ? value - prev : null;
    const changePercent = value !== null && prev !== null && prev !== 0 ? ((value - prev) / Math.abs(prev)) * 100 : null;
    results.push({
      name: series.name,
      value,
      unit: series.unit,
      change,
      changePercent,
      date: current ? formatDate(current.period) : new Date().toISOString(),
      source: "EIA",
    });
  }
  return results;
}

async function fetchEiaGrid(): Promise<EiaGrid[]> {
  const results: EiaGrid[] = [];
  for (const series of EIA_GRID_SERIES) {
    const data = await fetchEiaSeries(series.id);
    const items = data?.response?.data || [];
    const current = items[0];
    results.push({
      name: series.name,
      value: current ? toFiniteNumber(current.value) : null,
      unit: series.unit,
      date: current ? formatDate(current.period) : new Date().toISOString(),
      source: "EIA",
    });
  }
  return results;
}

// ─── CLIMATE ────────────────────────────────────────────────

async function fetchClimate(): Promise<ClimateEventLite[]> {
  try {
    const res = await fetch("http://localhost:3000/api/world-monitor/climate", {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Climate API failed");
    const data = await res.json();
    return (data.events || [])
      .slice(0, 12)
      .map((e: any) => ({
        id: e.id,
        title: e.title,
        type: e.type,
        severity: e.severity,
        lat: e.lat,
        lng: e.lng,
        region: e.region,
        timestamp: e.timestamp,
      }));
  } catch (error) {
    console.warn("[EnergyInfra] Climate fetch failed:", error);
    return [];
  }
}

// ─── OSINT ──────────────────────────────────────────────────

async function fetchOsint(): Promise<OsintEventLite[]> {
  try {
    const res = await fetch("http://localhost:3000/api/world-monitor/osint", {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("OSINT API failed");
    const data = await res.json();
    const events = (data.events || []) as any[];
    return events
      .filter((e) => ["energy", "supply_chain", "climate", "economic", "geopolitical"].includes(e.category))
      .slice(0, 10)
      .map((e) => ({
        id: e.id,
        title: e.title,
        category: e.category,
        threatScore: e.threatScore,
        region: e.region,
        timestamp: e.timestamp,
      }));
  } catch (error) {
    console.warn("[EnergyInfra] OSINT fetch failed:", error);
    return [];
  }
}

// ─── SHIPS ───────────────────────────────────────────────────

const CORRIDORS = [
  { name: "Strait of Hormuz", bounds: { minLat: 24, maxLat: 28, minLng: 54, maxLng: 58 } },
  { name: "Euro ARA Hubs", bounds: { minLat: 49, maxLat: 54, minLng: 1, maxLng: 6 } },
  { name: "US Gulf Coast", bounds: { minLat: 25, maxLat: 31, minLng: -98, maxLng: -88 } },
  { name: "Singapore / Malacca", bounds: { minLat: -2, maxLat: 8, minLng: 95, maxLng: 108 } },
  { name: "South China Sea", bounds: { minLat: 5, maxLat: 23, minLng: 105, maxLng: 120 } },
];

async function fetchShipCounts(): Promise<ShipCount[]> {
  try {
    const res = await fetch("http://localhost:3000/api/world-monitor/ships", {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Ships API failed");
    const data = await res.json();
    const ships = (data.ships || []) as any[];
    return CORRIDORS.map((corridor) => {
      const inRegion = ships.filter(
        (s) =>
          s.latitude >= corridor.bounds.minLat &&
          s.latitude <= corridor.bounds.maxLat &&
          s.longitude >= corridor.bounds.minLng &&
          s.longitude <= corridor.bounds.maxLng,
      );
      const tanker = inRegion.filter((s) => (s.type || "").toLowerCase() === "tanker").length;
      const lng = inRegion.filter((s) => (s.type || "").toLowerCase() === "lng").length;
      return {
        region: corridor.name,
        tanker,
        lng,
        total: inRegion.length,
      };
    });
  } catch (error) {
    console.warn("[EnergyInfra] Ship counts failed:", error);
    return [];
  }
}

// ─── ASSET MAPPING ──────────────────────────────────────────

const ASSET_IDS = [
  "oil-fields",
  "gas-fields",
  "solar-farms",
  "wind-farms",
  "refineries",
  "lng",
  "pipelines",
  "transmission",
  "bess",
  "ugs",
  "electrolyzers",
  "coal-export",
];

function buildAssetLiveData(
  id: string,
  commodities: LiveCommodity[],
  storage: EiaStorage[],
  climate: ClimateEventLite[],
  shipCounts: ShipCount[],
  osint: OsintEventLite[],
): AssetLiveData {
  const crude = commodities.find((c) => c.symbol === "CRUDE");
  const natgas = commodities.find((c) => c.symbol === "NATGAS");
  const copper = commodities.find((c) => c.symbol === "COPPER");
  const lithium = commodities.find((c) => c.symbol === "LITHIUM");
  const uranium = commodities.find((c) => c.symbol === "URANIUM");

  const crudeStorage = storage.find((s) => s.name === "US Crude Oil Stocks");
  const gasStorage = storage.find((s) => s.name === "US Working Natural Gas");
  const refUtil = storage.find((s) => s.name === "US Refinery Utilization");
  const crudeProd = storage.find((s) => s.name === "US Crude Field Production");

  const energyHeadline = osint.find((o) => o.category === "energy");

  switch (id) {
    case "oil-fields":
      return { id, price: crude, storage: crudeProd, headline: energyHeadline?.title };
    case "gas-fields":
      return { id, price: natgas, storage: gasStorage, headline: energyHeadline?.title };
    case "solar-farms":
      return { id, price: copper, headline: osint.find((o) => o.title.toLowerCase().includes("solar"))?.title };
    case "wind-farms":
      return { id, price: copper, headline: osint.find((o) => o.title.toLowerCase().includes("wind"))?.title };
    case "refineries":
      return { id, price: crude, storage: refUtil, headline: osint.find((o) => o.title.toLowerCase().includes("refiner"))?.title };
    case "lng":
      return { id, price: natgas, storage: gasStorage, shipCount: shipCounts.find((s) => s.region === "Singapore / Malacca") };
    case "pipelines":
      return { id, price: crude, shipCount: shipCounts.find((s) => s.region === "Strait of Hormuz") };
    case "transmission":
      return { id, price: copper, weather: climate.find((c) => c.type === "storm" || c.type === "heat") };
    case "bess":
      return { id, price: lithium, headline: osint.find((o) => o.title.toLowerCase().includes("battery"))?.title };
    case "ugs":
      return { id, price: natgas, storage: gasStorage };
    case "electrolyzers":
      return { id, price: natgas, headline: osint.find((o) => o.title.toLowerCase().includes("hydrogen"))?.title };
    case "coal-export":
      return { id, price: commodities.find((c) => c.symbol === "GOLD"), headline: osint.find((o) => o.title.toLowerCase().includes("coal"))?.title };
    default:
      return { id };
  }
}

// ─── CONSTRAINTS ────────────────────────────────────────────

const CONSTRAINT_BASE = [
  { label: "Physical Capacity", sev: "high" as const, desc: "Infrastructure at or near nameplate capacity.", keywords: ["capacity", "utilization", "production"] },
  { label: "Interconnection Limits", sev: "high" as const, desc: "Queue delays for new generation and storage.", keywords: ["grid", "interconnection", "transmission", "renewable"] },
  { label: "Permitting", sev: "medium" as const, desc: "Regulatory processes delaying development.", keywords: ["permit", "regulation", "policy", "license"] },
  { label: "Maintenance", sev: "medium" as const, desc: "Outages reduce capacity during critical periods.", keywords: ["maintenance", "outage", "shutdown", "repair"] },
  { label: "Weather Exposure", sev: "variable" as const, desc: "Extreme weather can disrupt operations.", keywords: ["storm", "heat", "flood", "hurricane", "cold", "wildfire"] },
  { label: "Logistics", sev: "medium" as const, desc: "Rail, truck, barge, and port constraints.", keywords: ["shipping", "port", "rail", "logistics", "chokepoint"] },
  { label: "Equipment Supply", sev: "medium" as const, desc: "Transformer, turbine, and cable shortages.", keywords: ["transformer", "turbine", "equipment", "supply chain"] },
  { label: "Storage Limits", sev: "variable" as const, desc: "Depleted buffers reduce system flexibility.", keywords: ["storage", "stockpile", "inventory", "reserve"] },
];

function buildConstraints(
  storage: EiaStorage[],
  climate: ClimateEventLite[],
  shipCounts: ShipCount[],
  osint: OsintEventLite[],
): ConstraintLiveData[] {
  return CONSTRAINT_BASE.map((base) => {
    let score = base.sev === "high" ? 70 : base.sev === "medium" ? 50 : 35;
    const evidence: string[] = [];

    const relevantOsint = osint.filter((o) =>
      base.keywords.some((k) => o.title.toLowerCase().includes(k)),
    );
    if (relevantOsint.length > 0) {
      score += Math.min(20, relevantOsint.length * 5);
      evidence.push(relevantOsint[0].title);
    }

    if (base.label === "Weather Exposure") {
      const severe = climate.filter((c) => c.severity >= 60);
      if (severe.length > 0) {
        score += Math.min(25, severe.length * 5);
        evidence.push(`${severe.length} severe weather events active`);
      }
    }

    if (base.label === "Logistics") {
      const congested = shipCounts.filter((s) => s.total >= 5);
      if (congested.length > 0) {
        score += Math.min(20, congested.length * 4);
        evidence.push(`${congested.length} corridors with elevated vessel traffic`);
      }
    }

    if (base.label === "Storage Limits") {
      const lowStorage = storage.find((s) => s.name === "US Working Natural Gas" && s.change !== null && s.change! < 0);
      if (lowStorage) {
        score += 15;
        evidence.push(`Gas storage change: ${lowStorage.change?.toFixed(1)} ${lowStorage.unit}`);
      }
    }

    if (base.label === "Physical Capacity") {
      const refUtil = storage.find((s) => s.name === "US Refinery Utilization");
      if (refUtil && refUtil.value !== null && refUtil.value > 90) {
        score += 15;
        evidence.push(`Refinery utilization at ${refUtil.value.toFixed(1)}%`);
      }
    }

    score = Math.min(100, Math.max(0, score));
    let sev = base.sev;
    if (score >= 75) sev = "high";
    else if (score >= 50) sev = "medium";
    else sev = "variable";

    return {
      label: base.label,
      sev,
      desc: base.desc,
      score,
      evidence,
    };
  });
}

// ─── RESILIENCE ─────────────────────────────────────────────

const RESILIENCE_BASE = [
  { dim: "Redundancy", low: "Multiple alternatives", high: "Single-point dependency" },
  { dim: "Spare Capacity", low: "Ample unused capacity", high: "Sustained high utilization" },
  { dim: "Storage Buffer", low: "Adequate reserve duration", high: "Low storage with limited refill" },
  { dim: "Repair Time", low: "Short repair cycle", high: "Long repair, supply-chain dependency" },
  { dim: "Weather Exposure", low: "Low climate exposure", high: "High exposure, limited mitigation" },
  { dim: "Data Confidence", low: "Recent, source-backed", high: "Sparse or unavailable data" },
];

function buildResilience(
  storage: EiaStorage[],
  climate: ClimateEventLite[],
  shipCounts: ShipCount[],
  osint: OsintEventLite[],
): ResilienceLiveData[] {
  const gasStorage = storage.find((s) => s.name === "US Working Natural Gas");
  const crudeStorage = storage.find((s) => s.name === "US Crude Oil Stocks");
  const severeWeather = climate.filter((c) => c.severity >= 60).length;
  const congested = shipCounts.filter((s) => s.total >= 5).length;
  const supplyChainOsint = osint.filter((o) => o.category === "supply_chain").length;

  return RESILIENCE_BASE.map((r) => {
    let score = 0;
    let evidence = "";

    switch (r.dim) {
      case "Redundancy":
        score = congested > 2 ? 60 : congested > 0 ? 35 : 15;
        evidence = `${congested} corridors with elevated traffic`;
        break;
      case "Spare Capacity":
        const refUtil = storage.find((s) => s.name === "US Refinery Utilization");
        score = refUtil && refUtil.value !== null ? Math.max(0, (refUtil.value - 70) * 1.5) : 30;
        evidence = refUtil ? `Refinery utilization ${refUtil.value?.toFixed(1)}%` : "No data";
        break;
      case "Storage Buffer":
        score = gasStorage && gasStorage.change !== null ? (gasStorage.change < 0 ? 65 : 25) : 40;
        evidence = gasStorage ? `Gas storage change ${gasStorage.change?.toFixed(1)} ${gasStorage.unit}` : "No data";
        break;
      case "Repair Time":
        score = supplyChainOsint > 0 ? 60 : 25;
        evidence = `${supplyChainOsint} supply-chain related OSINT events`;
        break;
      case "Weather Exposure":
        score = severeWeather > 3 ? 70 : severeWeather > 0 ? 40 : 15;
        evidence = `${severeWeather} severe weather events`;
        break;
      case "Data Confidence":
        score = storage.length > 3 && climate.length > 0 ? 10 : 50;
        evidence = `${storage.length} storage series, ${climate.length} climate events`;
        break;
    }

    score = Math.min(100, Math.max(0, Math.round(score)));
    let status: ResilienceLiveData["status"] = "Low Concern";
    if (score >= 60) status = "High Concern";
    else if (score >= 35) status = "Moderate Concern";

    return {
      dim: r.dim,
      score,
      status,
      low: r.low,
      high: r.high,
      evidence,
    };
  });
}

// ─── SCENARIOS ────────────────────────────────────────────────

const SCENARIO_BASE = [
  { id: "refinery", label: "Major Refinery Outage", desc: "500,000+ bbl/d refinery shutdown for 4-6 weeks.", affected: ["Refining capacity", "Product supply", "Crude storage"] },
  { id: "transmission", label: "Transmission Congestion", desc: "Major corridor at 100% loading during heatwave.", affected: ["Power flows", "Generator dispatch", "Curtailment"] },
  { id: "gas-storage", label: "Gas Storage Drawdown", desc: "Record withdrawals reduce buffer to critical minimum.", affected: ["Gas supply", "LNG imports", "Power generation"] },
  { id: "port", label: "Port Disruption", desc: "Key export port shut for 2 weeks due to weather.", affected: ["Export volumes", "Rail delivery", "Storage fill"] },
];

function buildScenarios(): ScenarioLiveData[] {
  return SCENARIO_BASE.map((s) => ({ ...s }));
}

// ─── LLM ENRICHMENT ───────────────────────────────────────────

export async function enrichScenarioImpact(
  scenarioId: string,
  payload: EnergyInfrastructurePayload,
): Promise<string> {
  const scenario = SCENARIO_BASE.find((s) => s.id === scenarioId);
  if (!scenario) return "Scenario not found.";

  const crude = payload.commodities.find((c) => c.symbol === "CRUDE");
  const natgas = payload.commodities.find((c) => c.symbol === "NATGAS");
  const storageSummary = payload.storage
    .map((s) => `${s.name}: ${s.value?.toFixed(2) ?? "N/A"} ${s.unit} (change ${s.change?.toFixed(2) ?? "N/A"})`)
    .join("; ");
  const headlines = payload.osint.slice(0, 3).map((o) => o.title).join(" | ");

  const prompt = `
You are a senior energy infrastructure analyst for GeoMoney TV.
Analyze the following stress scenario in the context of current market and operational data.

SCENARIO: ${scenario.label}
DESCRIPTION: ${scenario.desc}
AFFECTED LAYERS: ${scenario.affected.join(", ")}

CURRENT DATA:
- Crude Oil: $${crude?.price?.toFixed(2) ?? "N/A"} (${crude?.changePercent?.toFixed(2) ?? "N/A"}%)
- Natural Gas: $${natgas?.price?.toFixed(2) ?? "N/A"} (${natgas?.changePercent?.toFixed(2) ?? "N/A"}%)
- Storage: ${storageSummary}
- Recent Headlines: ${headlines}

Respond with ONLY a 2-3 sentence executive impact summary. Be factual, concise, and mention specific markets or regions if relevant.
`;

  try {
    const { content } = await callOpenRouter(prompt, {
      temperature: 0.3,
      maxTokens: 200,
      caller: "energy-infrastructure-scenario",
    });
    return content.trim();
  } catch (error) {
    console.warn("[EnergyInfra] Scenario LLM enrichment failed:", error);
    return `Current data suggests ${scenario.label.toLowerCase()} would stress ${scenario.affected.join(", ")}. Monitor live commodity prices and storage reports for real-time impact.`;
  }
}

// ─── AGGREGATOR ───────────────────────────────────────────────

export async function getEnergyInfrastructureData(): Promise<EnergyInfrastructurePayload> {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return cache.data;
  }

  const [commodities, storage, grid, climate, osint, shipCounts] = await Promise.all([
    fetchCommodities(),
    fetchEiaStorage(),
    fetchEiaGrid(),
    fetchClimate(),
    fetchOsint(),
    fetchShipCounts(),
  ]);

  const assets = ASSET_IDS.map((id) => buildAssetLiveData(id, commodities, storage, climate, shipCounts, osint));
  const constraints = buildConstraints(storage, climate, shipCounts, osint);
  const resilience = buildResilience(storage, climate, shipCounts, osint);
  const scenarios = buildScenarios();

  const data: EnergyInfrastructurePayload = {
    timestamp: new Date().toISOString(),
    commodities,
    storage,
    grid,
    climate,
    osint,
    shipCounts,
    assets,
    constraints,
    resilience,
    scenarios,
  };

  cache = { data, ts: Date.now() };
  return data;
}

export function clearEnergyInfrastructureCache() {
  cache = null;
}
