// Test cases for the coal data layer.
//
// Run (from project root):
//   $env:EIA_API_KEY='test'; $env:DATABASE_URL='mysql://test:test@127.0.0.1:3306/test'; $env:OPENROUTER_AI_MODEL='fake/model'; npx --no-install tsx --test --test-force-exit scripts/test/coal-data.test.ts
//
// These tests exercise the REAL modules (tsx resolves the @/* tsconfig paths).
// No network is required: EIA + OpenRouter calls are intercepted by a mocked
// global fetch; the AI brief stale-if-error path is triggered deterministically
// by leaving OPENROUTER_API_KEY unset (callOpenRouterJson throws before any
// network/DB access), and the cache file is seeded under ./cache.
import { describe, it, beforeEach, afterEach, after } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, rmSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

import {
  getCoalMarketData,
  clearCoalMarketCache,
  generateCoalCommentary,
  clearCoalAiBriefCache,
  type CoalMarketPayload,
} from "@/lib/coal-market-service";
import {
  EGRID_COAL_EMISSION_FACTORS,
  US_COAL_EMISSION_FACTOR_AVG,
  getEmissionFactor,
} from "@/data/coal/emission-factors";

const CACHE_DIR = join(process.cwd(), "cache");
const BRIEF_CACHE_FILE = join(CACHE_DIR, "coal-ai-brief.json");
const ORIG_FETCH = globalThis.fetch;

function makeRes(payload: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  } as unknown as Response;
}

function urlOf(input: RequestInfo | URL): URL {
  if (typeof input === "string") return new URL(input);
  if (input instanceof URL) return new URL(input.href);
  return new URL((input as Request).url);
}

// EIA v2 series-shaped payloads keyed by seriesId.
const EIA_MOCK: Record<string, { response: { data: { period: string; value: string }[] } }> = {
  "COAL.SPOT.CAPP.W": { response: { data: [{ period: "2026-08-28", value: "62.4" }, { period: "2026-08-21", value: "61.0" }] } },
  "COAL.SPOT.PRBS.W": { response: { data: [{ period: "2026-08-28", value: "13.2" }, { period: "2026-08-21", value: "13.0" }] } },
  "COAL.SPOT.ILB.W": { response: { data: [{ period: "2026-08-28", value: "40.5" }, { period: "2026-08-21", value: "40.0" }] } },
  "COAL.SPOT.UINTA.W": { response: { data: [{ period: "2026-08-28", value: "33.0" }, { period: "2026-08-21", value: "32.8" }] } },
  "ELEC.GEN.COW-US-99.M": { response: { data: [{ period: "2026-08", value: "80000" }] } },
  "COAL.STOCKS-TOTAL.US": { response: { data: [{ period: "2026-08", value: "120000" }] } },
  "COAL.PRODUCTION-TOTAL.US": { response: { data: [{ period: "2026-08", value: "95000" }] } },
  "COAL.EXPORTS-TOTAL.US": { response: { data: [{ period: "2026-08", value: "15000" }] } },
};
const EIA_DEFAULT = { response: { data: [] } };

function eiaDispatchFetch(input: RequestInfo | URL, _init?: RequestInit): Promise<Response> {
  const url = urlOf(input);
  if (url.hostname === "api.eia.gov") {
    const m = url.pathname.match(/seriesid\/(.+)$/);
    const sid = m ? decodeURIComponent(m[1]) : "";
    return Promise.resolve(makeRes(EIA_MOCK[sid] ?? EIA_DEFAULT));
  }
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    if (url.pathname === "/api/ticker") return Promise.resolve(makeRes([]));
    if (url.pathname === "/api/world-monitor/ships") return Promise.resolve(makeRes({ ships: [] }));
    if (url.pathname === "/api/world-monitor/osint") return Promise.resolve(makeRes({ events: [] }));
    if (url.pathname === "/api/world-monitor/climate") return Promise.resolve(makeRes({ events: [] }));
  }
  return Promise.resolve(makeRes({}));
}

const STALE_BRIEF_FILE = {
  summary: "STALE BRIEF FROM CACHE FILE",
  priceOutlook: "outlook-from-file",
  routeRisks: [] as { route: string; risk: string; severity: "low" | "moderate" | "high" }[],
  watchpoints: ["w-file"],
  confidence: "Low" as const,
  fetchedAt: "2020-01-01T00:00:00.000Z",
};

function seedBriefFile(data: unknown) {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(BRIEF_CACHE_FILE, JSON.stringify(data), "utf8");
}
function removeBriefFile() {
  try {
    if (existsSync(BRIEF_CACHE_FILE)) rmSync(BRIEF_CACHE_FILE, { force: true });
  } catch {
    /* ignore */
  }
}

const MIN_PAYLOAD: CoalMarketPayload = {
  timestamp: new Date().toISOString(),
  benchmarks: [
    { label: "Central Appalachia", symbol: "CAPP", price: 62.4, change: 1.4, changePercent: 2.29, unit: "$/t", note: "x", live: false, asOf: "2026-08-28" },
  ],
  eia: { coalGeneration: 80000, coalStocks: 120000, coalProduction: 95000, coalExports: 15000 },
  routes: [],
  osint: [],
  climate: [],
  vessels: [],
};

// ─── 1. eGRID emission factors (pure) ────────────────────────
describe("emission-factors", () => {
  it("exposes a US national average", () => {
    assert.equal(US_COAL_EMISSION_FACTOR_AVG, 1.0);
  });

  it("returns the configured factor for known subregions", () => {
    assert.equal(getEmissionFactor("US"), 1.0);
    assert.equal(getEmissionFactor("RFCW"), 1.05);
    assert.equal(getEmissionFactor("SRMW"), 1.08);
    assert.equal(getEmissionFactor("NWPP"), 1.18);
  });

  it("falls back to the US average for unknown subregions", () => {
    assert.equal(getEmissionFactor("NOPE"), US_COAL_EMISSION_FACTOR_AVG);
    assert.equal(getEmissionFactor(""), US_COAL_EMISSION_FACTOR_AVG);
  });

  it("has unique subregion codes and all factors > 0", () => {
    const codes = EGRID_COAL_EMISSION_FACTORS.map((e) => e.subregion);
    assert.equal(new Set(codes).size, codes.length, "subregion codes must be unique");
    for (const e of EGRID_COAL_EMISSION_FACTORS) {
      assert.ok(e.factor > 0, `${e.subregion} factor must be positive`);
      assert.ok(typeof e.name === "string" && e.name.length > 0);
    }
  });
});

// ─── 2. EIA basin spot-price normalization ───────────────────
describe("getCoalMarketData — EIA basin normalization", () => {
  beforeEach(() => {
    globalThis.fetch = eiaDispatchFetch as typeof fetch;
    clearCoalMarketCache();
  });
  afterEach(() => {
    globalThis.fetch = ORIG_FETCH;
  });

  it("fills CAPP/PRB/UINTA benchmarks from EIA weekly series with asOf", async () => {
    const data = await getCoalMarketData();
    const capp = data.benchmarks.find((b) => b.symbol === "CAPP");
    assert.ok(capp, "CAPP benchmark missing");
    assert.equal(capp!.price, 62.4);
    assert.equal(capp!.asOf, "2026-08-28");
    assert.ok(Math.abs((capp!.change ?? 0) - 1.4) < 1e-6, `change ${capp!.change}`);
    assert.ok(Math.abs((capp!.changePercent ?? 0) - 2.29508) < 0.01, `changePercent ${capp!.changePercent}`);
    assert.match(capp!.note, /EIA weekly/i);

    const prb = data.benchmarks.find((b) => b.symbol === "PRB");
    assert.ok(prb && prb.price === 13.2 && prb.asOf === "2026-08-28");

    const uinta = data.benchmarks.find((b) => b.symbol === "UINTA");
    assert.ok(uinta && uinta.price === 33.0 && uinta.asOf === "2026-08-28");
  });

  it("populates the EIA aggregate fields from the monthly series", async () => {
    const data = await getCoalMarketData();
    assert.equal(data.eia.coalGeneration, 80000);
    assert.equal(data.eia.coalStocks, 120000);
    assert.equal(data.eia.coalProduction, 95000);
    assert.equal(data.eia.coalExports, 15000);
  });

  it("does NOT mark EIA basin benchmarks as live (EIA is weekly-published)", async () => {
    const data = await getCoalMarketData();
    const capp = data.benchmarks.find((b) => b.symbol === "CAPP");
    assert.equal(capp!.live, false);
  });
});

// ─── 3. AI brief stale-if-error (no key → throws → file fallback) ──
describe("generateCoalCommentary — stale-if-error", () => {
  beforeEach(() => {
    // No OpenRouter key → callOpenRouterJson throws deterministically before
    // any network or DB access, exercising the stale-if-error branch.
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    clearCoalAiBriefCache();
    seedBriefFile(STALE_BRIEF_FILE);
  });
  afterEach(() => {
    removeBriefFile();
  });

  it("serves the last-good brief from the cache file when the AI call fails", async () => {
    const result = await generateCoalCommentary(MIN_PAYLOAD);
    assert.equal(result.summary, STALE_BRIEF_FILE.summary);
    assert.equal(result.confidence, "Low");
    assert.ok(result.fetchedAt, "stale-if-error response should still carry a fetchedAt");
  });
});

// ─── 4. AI brief TTL cache + fetchedAt on success ─────────────
describe("generateCoalCommentary — TTL cache", () => {
  let openRouterCalls = 0;
  const SUCCESS_BRIEF = {
    summary: "FRESH BRIEF FROM MOCK",
    priceOutlook: "up",
    routeRisks: [] as { route: string; risk: string; severity: "low" | "moderate" | "high" }[],
    watchpoints: ["w1"],
    confidence: "Moderate" as const,
  };

  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = "test-key";
    openRouterCalls = 0;
    clearCoalAiBriefCache();
    removeBriefFile();
    globalThis.fetch = ((input: RequestInfo | URL) => {
      const url = urlOf(input);
      if (url.hostname === "openrouter.ai") {
        openRouterCalls++;
        return Promise.resolve(makeRes({ choices: [{ message: { content: JSON.stringify(SUCCESS_BRIEF) } }] }));
      }
      return Promise.resolve(makeRes({}));
    }) as typeof fetch;
  });
  afterEach(() => {
    globalThis.fetch = ORIG_FETCH;
    delete process.env.OPENROUTER_API_KEY;
    removeBriefFile();
  });

  it("generates a fresh brief with fetchedAt and caches it for the TTL", async () => {
    const first = await generateCoalCommentary(MIN_PAYLOAD);
    assert.equal(first.summary, SUCCESS_BRIEF.summary);
    assert.equal(first.confidence, "Moderate");
    assert.ok(first.fetchedAt, "fresh brief must carry fetchedAt");
    assert.equal(openRouterCalls, 1, "first call should hit OpenRouter once");

    // Second call within the TTL must be served from memory (no extra fetch).
    const second = await generateCoalCommentary(MIN_PAYLOAD);
    assert.equal(second.summary, SUCCESS_BRIEF.summary);
    assert.equal(openRouterCalls, 1, "second call must be served from cache, not OpenRouter");
    assert.equal(second.fetchedAt, first.fetchedAt);
  });
});

after(() => {
  globalThis.fetch = ORIG_FETCH;
  removeBriefFile();
});
