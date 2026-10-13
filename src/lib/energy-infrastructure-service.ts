import { callOpenRouter } from "@/lib/openrouter";
import { getStoredTickerData } from "@/lib/ticker-service";
import { finiteEnergyValue, quoteStatus, type EnergyDataStatus } from "@/lib/energy-data";
import prisma from "@/lib/prisma";

// ─── TYPES ──────────────────────────────────────────────────

export interface LiveCommodity {
  symbol: string;
  label: string;
  price: number;
  change: number;
  changePercent: number;
  marketStatus: string;
  lastTradingTimestamp: string | null;
  dataStatus: EnergyDataStatus;
  source: string;
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

export interface GridStressPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  loadGW: number | null;       // live hourly demand (GW); null = no live feed
  capacityGW: number;          // reference nameplate capacity (GW)
  loadPercent: number | null;  // derived 0-100; null if load unknown
  alert: "normal" | "elevated" | "critical";
  asOf: string | null;          // ISO timestamp of latest demand reading
  source: string;               // "EIA" | "reference"
}

export interface InterdependencySignal {
  id: string;
  label: string;
  value: number | null;
  unit: string;
  direction: "bullish" | "bearish" | "neutral";
  note: string;
}

export interface InterdependencyData {
  pressureIndex: number; // 0-100
  corridorStress: number; // 0-100
  oilGasSpread: number | null;
  marketBias: "Bullish Energy" | "Bearish Energy" | "Balanced";
  traderStance: string;
  signals: InterdependencySignal[];
}

export interface SupplyDemandBalanceData {
  globalCrudeSupplyMMBPD: number;
  globalCrudeDemandMMBPD: number;
  netCrudeBalanceMMBPD: number; // negative = deficit
  globalLngSupplyMtpa: number;
  globalLngDemandMtpa: number;
  netLngBalanceMtpa: number;
  crudeDaysOfCover: number;
  euGasStoragePercent: number;
  usWorkingGasBcf: number;
  sprInventoryMMBBL: number;
}

export interface MacroIndicatorsData {
  energyCpiScore: number; // 0-100 (high = inflationary pressure)
  crackSpread321: number; // $/bbl (refining margin)
  tankerFreightIndex: number; // Worldscale rate for VLCC
  lngCharterDayRate: number; // $/day for TFDE LNG carrier
  geopoliticalRiskPremium: number; // $/bbl estimated premium
  globalGridStressIndex: number; // 0-100
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
  gridStress: GridStressPoint[];
  interdependency: InterdependencyData;
  supplyDemandBalance: SupplyDemandBalanceData;
  macroIndicators: MacroIndicatorsData;
  notice: string;
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

export function extractEnergyEiaValue(item: Record<string, unknown>): number | null {
  for (const key of ["value", "generation", "stocks", "production", "utilization", "withdrawal", "demand"]) {
    const value = finiteEnergyValue(item[key]);
    if (value !== null) return value;
  }
  return null;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toISOString();
  } catch {
    return "";
  }
}

// ─── COMMODITIES ────────────────────────────────────────────

async function fetchCommodities(): Promise<LiveCommodity[]> {
  try {
    const items = await getStoredTickerData().catch(() => []);
    const map = new Map<string, LiveCommodity>();
    for (const item of items) {
      const sym = item.symbol?.toUpperCase();
      const price = finiteEnergyValue(item.price);
      const observedAt = item.lastTradingTimestamp || null;
      // The ticker service includes demonstration defaults without timestamps.
      // Never promote those defaults into observed Energy quotes.
      if (!sym || price === null || quoteStatus(observedAt) === "unavailable") continue;
      map.set(sym, {
        symbol: item.symbol,
        label: item.label || item.symbol,
        price,
        change: finiteEnergyValue(item.change) ?? 0,
        changePercent: finiteEnergyValue(item.changePercent) ?? 0,
        marketStatus: item.marketStatus || "UNKNOWN",
        lastTradingTimestamp: observedAt,
        dataStatus: quoteStatus(observedAt),
        source: "Stored market quote",
      });
    }

    return Array.from(map.values());
  } catch (error) {
    console.warn("[EnergyInfra] Commodities unavailable:", error);
    return [];
  }
}

// ─── EIA ────────────────────────────────────────────────────

async function fetchEiaSeries(seriesId: string, frequency = "weekly"): Promise<any | null> {
  if (!EIA_API_KEY) return null;
  try {
    const url = `${EIA_BASE}/seriesid/${seriesId}?api_key=${EIA_API_KEY}&frequency=${frequency}&sort[0][column]=period&sort[0][direction]=desc&offset=0&length=2`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`EIA ${seriesId} HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn(`[EnergyInfra] EIA ${seriesId} failed:`, error);
    return null;
  }
}

async function fetchEiaStorage(): Promise<EiaStorage[]> {
  return Promise.all(EIA_SERIES.map(async (series) => {
    const data = await fetchEiaSeries(series.id);
    const items = data?.response?.data || [];
    const current = items[0];
    const previous = items[1];
    const scale = series.unit.startsWith("M bbl") ? 0.001 : 1;
    const rawValue = current ? extractEnergyEiaValue(current) : null;
    const rawPrev = previous ? extractEnergyEiaValue(previous) : null;
    const value = rawValue === null ? null : rawValue * scale;
    const prev = rawPrev === null ? null : rawPrev * scale;
    const change = value !== null && prev !== null ? value - prev : null;
    const changePercent = value !== null && prev !== null && prev !== 0 ? ((value - prev) / Math.abs(prev)) * 100 : null;
    return {
      name: series.name,
      value,
      unit: series.unit,
      change,
      changePercent,
      date: current ? formatDate(current.period) : "",
      source: "EIA",
    };
  }));
}

async function fetchEiaGrid(): Promise<EiaGrid[]> {
  return Promise.all(EIA_GRID_SERIES.map(async (series) => {
    const data = await fetchEiaSeries(series.id, "monthly");
    const items = data?.response?.data || [];
    const current = items[0];
    return {
      name: series.name,
      value: current ? extractEnergyEiaValue(current) : null,
      unit: series.unit,
      date: current ? formatDate(current.period) : "",
      source: "EIA",
    };
  }));
}

// ─── GRID STRESS (per-ISO live load) ────────────────────────────
// Live hourly demand comes from the EIA Electricity Grid Monitor (EBA series).
// Capacity is nameplate (it does not change hourly), so capacityGW is a static
// reference value per balancing authority — only the LOAD is live. Non-US grids
// (UK / DE) have no EIA feed and are shown honestly with loadGW = null rather
// than fabricated numbers.

const GRID_STRESS_NODES = [
  { id: "ercot", name: "ERCOT", lat: 31.0, lng: -99.0, ba: "ERCO", capacityGW: 85 },
  { id: "caiso", name: "CAISO", lat: 37.5, lng: -121.5, ba: "CISO", capacityGW: 55 },
  { id: "pjm", name: "PJM", lat: 39.9, lng: -77.6, ba: "PJM", capacityGW: 185 },
  { id: "isone", name: "ISO-NE", lat: 42.3, lng: -71.6, ba: "ISNE", capacityGW: 32 },
  { id: "miso", name: "MISO", lat: 41.5, lng: -89.5, ba: "MISO", capacityGW: 210 },
  { id: "uk-grid", name: "National Grid UK", lat: 52.5, lng: -1.5, ba: null, capacityGW: 60 },
  { id: "germany-north", name: "DE North", lat: 53.0, lng: 9.0, ba: null, capacityGW: 55 },
] as const;

function alertFromLoad(pct: number | null): GridStressPoint["alert"] {
  if (pct == null) return "normal"; // no live feed → not flagged
  if (pct >= 90) return "critical";
  if (pct >= 85) return "elevated"; // PRD threshold: >85% → elevated
  return "normal";
}

async function fetchEiaHourlyDemand(
  ba: string,
): Promise<{ loadGW: number; asOf: string } | null> {
  if (!EIA_API_KEY) return null;
  try {
    const url = `${EIA_BASE}/seriesid/EBA.EBA-${ba}-ALL.D.H?api_key=${EIA_API_KEY}&frequency=hourly&data[0]=value&sort[0][column]=period&sort[0][direction]=desc&offset=0&length=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`EIA EBA ${ba} HTTP ${res.status}`);
    const data = await res.json();
    const item = data?.response?.data?.[0];
    if (!item) return null;
    const mwh = extractEnergyEiaValue(item);
    if (mwh == null) return null;
    return { loadGW: mwh / 1000, asOf: formatDate(item.period) };
  } catch (error) {
    console.warn(`[EnergyInfra] EIA EBA ${ba} failed:`, error);
    return null;
  }
}

async function fetchEiaGridStress(): Promise<GridStressPoint[]> {
  return Promise.all(
    GRID_STRESS_NODES.map(async (n) => {
      let loadGW: number | null = null;
      let asOf: string | null = null;
      let source = "reference";
      if (n.ba) {
        const d = await fetchEiaHourlyDemand(n.ba);
        if (d) {
          loadGW = d.loadGW;
          asOf = d.asOf;
          source = "EIA";
        }
      }
      const loadPercent =
        loadGW != null ? (loadGW / n.capacityGW) * 100 : null;
      return {
        id: n.id,
        name: n.name,
        lat: n.lat,
        lng: n.lng,
        loadGW,
        capacityGW: n.capacityGW,
        loadPercent,
        alert: alertFromLoad(loadPercent),
        asOf,
        source,
      } satisfies GridStressPoint;
    }),
  );
}

async function fetchClimate(): Promise<ClimateEventLite[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch("https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=15", {
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (res.ok) {
      const data = await res.json();
      const mapped = (data.events || []).flatMap((e: any) => {
        const geom = e.geometry?.at(-1);
        if (geom?.type !== "Point" || !geom.coordinates || geom.coordinates.length !== 2) return [];
        return [{
          id: e.id || `eonet-${Math.random()}`,
          title: e.title,
          type: e.categories?.[0]?.title?.toLowerCase() || "natural event",
          severity: 50, // Displayed as an unverified planning score, not provider severity.
          lat: geom.coordinates[1],
          lng: geom.coordinates[0],
          region: "Global",
          timestamp: geom.date || "",
        }];
      });
      if (mapped.length > 0) {
        return mapped;
      }
    }
  } catch {
    // Missing observations remain unavailable; never insert demonstration events.
  }
  return [];
}

async function fetchOsint(): Promise<OsintEventLite[]> {
  try {
    const dbArticles = await prisma.article.findMany({
      where: { category: { contains: "energy" } },
      take: 4,
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, category: true, createdAt: true },
    }).catch(() => []);

    const fromDb: OsintEventLite[] = dbArticles.map((a) => ({
      id: a.id,
      title: a.title,
      category: a.category?.toLowerCase().includes("energy") ? "energy" : "geopolitical",
      threatScore: 50, // News is not a verified threat assessment.
      region: "Global",
      timestamp: a.createdAt.toISOString(),
    }));

    if (fromDb.length > 0) {
      return fromDb;
    }
  } catch {
    // Failover
  }
  return [];
}

async function fetchShipCounts(): Promise<ShipCount[]> {
  // No position provider is wired to this service. Unknown is not zero traffic.
  return [];
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
        const observed = storage.filter((s) => s.value !== null && s.date && Date.now() - Date.parse(s.date) < 14 * 86400_000).length;
        score = observed >= 4 ? 10 : observed > 0 ? 50 : 100;
        evidence = `${observed} recent storage observations; missing values are not evidence`;
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

  const [commodities, storage, grid, climate, osint, shipCounts, gridStress] = await Promise.all([
    fetchCommodities(),
    fetchEiaStorage(),
    fetchEiaGrid(),
    fetchClimate(),
    fetchOsint(),
    fetchShipCounts(),
    fetchEiaGridStress(),
  ]);

  const assets = ASSET_IDS.map((id) => buildAssetLiveData(id, commodities, storage, climate, shipCounts, osint));

  // --- INTERDEPENDENCY CALCULATION (trader-grade signals) ---
  const crude = commodities.find(c => c.symbol === "CRUDE");
  const natgas = commodities.find(c => c.symbol === "NATGAS");
  const copper = commodities.find(c => c.symbol === "COPPER");
  const uranium = commodities.find(c => c.symbol === "URANIUM");
  const gold = commodities.find(c => c.symbol === "GOLD");
  const silver = commodities.find(c => c.symbol === "SILVER");

  // crude oil vs natural gas price spread (approximate ratio)
  const oilGasSpread =
    crude != null && natgas != null && crude.price !== null && natgas.price !== null
      ? Number((crude.price / natgas.price).toFixed(2))
      : null;

  // storage pressure from inventory changes (negative change = drawdown = bullish)
  const gasStorage = storage.find(s => s.name === "US Working Natural Gas");
  const crudeStorage = storage.find(s => s.name === "US Crude Oil Stocks");
  const refUtil = storage.find(s => s.name === "US Refinery Utilization");
  const storagePressure =
    (gasStorage?.change ?? 0) < 0 ||
    (crudeStorage?.change ?? 0) < 0 ||
    (refUtil?.value ?? 0) > 90
      ? 75
      : (gasStorage?.change ?? 0) > 0 ||
        (crudeStorage?.change ?? 0) > 0 ||
        (refUtil?.value ?? 0) < 80
        ? 25
        : 50;

  // corridor congestion proxy from ship counts in key chokepoints
  const hormuz = shipCounts.find(s => s.region === "Strait of Hormuz");
  const singaporemia = shipCounts.find(s => s.region === "Singapore / Malacca");
  const corridorStress =
    ((hormuz?.total ?? 0) > 8 || (singaporemia?.total ?? 0) > 12)
      ? 80
      : ((hormuz?.total ?? 0) > 4 || (singaporemia?.total ?? 0) > 6)
        ? 50
        : 20;

  // market bias from price momentum vs storage
  const crudeMom = crude?.changePercent ?? 0;
  const gasMom = natgas?.changePercent ?? 0;
  const marketBias =
    crudeMom > 2 && gasMom > 2
      ? "Bullish Energy"
      : crudeMom < -2 && gasMom < -2
        ? "Bearish Energy"
        : "Balanced";

  // trader stance synthesis
  const traderStance =
    marketBias === "Bullish Energy" && storagePressure > 60
      ? "Long physical, short futures"
      : marketBias === "Bearish Energy" && storagePressure < 40
        ? "Short physical, long futures"
        : "Spread/arbitrage";

  const signals: InterdependencySignal[] = [
    {
      id: "oil-gas-spread",
      label: "Oil/NatGas Spread",
      value: oilGasSpread,
      unit: "ratio",
      direction:
        oilGasSpread !== null && oilGasSpread > 20
          ? "bullish"
          : oilGasSpread !== null && oilGasSpread < 10
            ? "bearish"
            : "neutral",
      note: `WTI: $${crude?.price?.toFixed(2) ?? "--"} vs NG: $${natgas?.price?.toFixed(2) ?? "--"}`,
    },
    {
      id: "storage-pressure",
      label: "Storage Pressure",
      value: storagePressure,
      unit: "index",
      direction:
        storagePressure > 70
          ? "bullish"
          : storagePressure < 30
            ? "bearish"
            : "neutral",
      note: `Gas Δ:${gasStorage?.change?.toFixed(1) ?? "--"} Bcf | Crude Δ:${crudeStorage?.change?.toFixed(1) ?? "--"} Mb`,
    },
    {
      id: "corridor-stress",
      label: "Chokepoint Stress",
      value: corridorStress,
      unit: "index",
      direction:
        corridorStress > 70
          ? "bullish"
          : corridorStress < 30
            ? "bearish"
            : "neutral",
      note: `Hormuz:${hormuz?.total ?? 0} tankers | S/M:${singaporemia?.total ?? 0} LNG`,
    },
  ];

  const interdependency: InterdependencyData = {
    pressureIndex: storagePressure,
    corridorStress,
    oilGasSpread,
    marketBias,
    traderStance,
    signals,
  };

  const crudePrice = crude?.price ?? 78.40;
  const crack321 = Number((crudePrice * 0.28 + 4.5).toFixed(2));
  const cpiScore = Math.min(100, Math.round((crudePrice / 100) * 60 + (corridorStress / 100) * 40));

  const supplyDemandBalance: SupplyDemandBalanceData = {
    globalCrudeSupplyMMBPD: 102.7,
    globalCrudeDemandMMBPD: 103.4,
    netCrudeBalanceMMBPD: -0.7,
    globalLngSupplyMtpa: 416.0,
    globalLngDemandMtpa: 422.5,
    netLngBalanceMtpa: -6.5,
    crudeDaysOfCover: 54.2,
    euGasStoragePercent: 68.4,
    usWorkingGasBcf: 2840,
    sprInventoryMMBBL: 392.5,
  };

  const macroIndicators: MacroIndicatorsData = {
    energyCpiScore: cpiScore,
    crackSpread321: crack321,
    tankerFreightIndex: 64.5,
    lngCharterDayRate: 72000,
    geopoliticalRiskPremium: 4.65,
    globalGridStressIndex: Math.round((storagePressure + corridorStress) / 2),
  };

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
    gridStress,
    interdependency,
    supplyDemandBalance,
    macroIndicators,
    notice: "Quotes are delayed/stale observations. Assets and corridors are reference data. Output histories, supply/demand and macro indicators are illustrative planning models, not observed telemetry. Vessel coverage is unavailable. News and natural events are not verified threat assessments.",
  };

  cache = { data, ts: Date.now() };
  return data;
}

export function clearEnergyInfrastructureCache() {
  cache = null;
}
