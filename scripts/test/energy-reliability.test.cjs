// Deterministic Energy checks. No database, provider network or cache writes.
require('./register.cjs');
const { describe, it, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const { solarEstimate, windEstimate, carbonEstimate } = require('../../src/lib/energy-calculations.ts');
const { finiteEnergyValue, quoteStatus, energyApiUrl } = require('../../src/lib/energy-data.ts');
const plants = require('../../src/lib/map/powerPlantsSource.ts');
const originalLoad = Module._load;
const originalFetch = global.fetch;
const originalKey = process.env.EIA_API_KEY;
process.env.EIA_API_KEY = 'test-only';
let ticker = [];
Module._load = function (request, ...args) {
  if (request === '@/lib/ticker-service') return { getStoredTickerData: async () => ticker };
  if (request === '@/lib/prisma') return { __esModule: true, default: { article: { findMany: async () => [] } } };
  if (request === 'yahoo-finance2') return { __esModule: true, default: class { async quote() { return {}; } } };
  return originalLoad.call(this, request, ...args);
};
const infra = require('../../src/lib/energy-infrastructure-service.ts');
const coal = require('../../src/lib/coal-market-service.ts');
// Keep the Yahoo stub until all dynamic import fallbacks have completed.
after(() => {
  Module._load = originalLoad;
  global.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.EIA_API_KEY; else process.env.EIA_API_KEY = originalKey;
});

describe('Energy planning models', () => {
  it('computes normal solar arithmetic and preserves zero tariff/sun hours', () => {
    const result = solarEstimate('10', '2.5', '0.14', '5');
    assert.equal(result.annualProduction, 18250);
    assert.ok(Math.abs(result.savings25 - 38875) < 1e-8);
    assert.equal(solarEstimate('10', '2.5', '0', '5').payback, null);
    assert.equal(solarEstimate('10', '2.5', '0.14', '0').annualProduction, 0);
  });
  it('rejects empty, non-finite, zero-sized and negative installations', () => {
    for (const size of ['', '0', '-10', 'Infinity', '10junk']) assert.throws(() => solarEstimate(size, '2.5', '0.14', '5'));
    assert.throws(() => solarEstimate('10', '2.5', '0.14', '25'));
  });
  it('preserves zero wind factor and rejects impossible factors/fractional turbines', () => {
    assert.equal(windEstimate('10', '3', '0').annualOutput, 0);
    assert.equal(windEstimate('10', '3', '35').annualOutput, 91980);
    for (const factor of ['-1', '101', '']) assert.throws(() => windEstimate('10', '3', factor));
    assert.throws(() => windEstimate('1.5', '3', '35'));
  });
  it('validates carbon input and labels the model through explicit assumptions', () => {
    assert.equal(carbonEstimate('0', 'solar').co2Offset, 0);
    assert.throws(() => carbonEstimate('-1', 'solar'));
    assert.throws(() => carbonEstimate('10', 'invalid'));
  });
});

describe('Energy source reliability', { concurrency: false }, () => {
  beforeEach(() => {
    ticker = [];
    infra.clearEnergyInfrastructureCache(); coal.clearCoalMarketCache();
    global.fetch = async () => Response.json({ events: [], response: { data: [] } });
  });
  it('does not turn missing numeric values into zero', () => {
    assert.equal(finiteEnergyValue(null), null);
    assert.equal(finiteEnergyValue(''), null);
    assert.equal(finiteEnergyValue('0'), 0);
    assert.equal(infra.extractEnergyEiaValue({ generation: '123', sectorid: '99' }), 123);
  });
  it('preserves zero quote changes and excludes untimestamped sample prices', async () => {
    ticker = [
      { symbol: 'CRUDE', price: 70, change: 0, changePercent: 0, lastTradingTimestamp: new Date().toISOString(), marketStatus: 'CLOSED' },
      { symbol: 'BRENT', price: 82.15, change: 0.92, lastTradingTimestamp: null },
    ];
    const data = await infra.getEnergyInfrastructureData();
    assert.equal(data.commodities.length, 1);
    assert.equal(data.commodities[0].changePercent, 0);
    assert.equal(data.commodities[0].dataStatus, 'delayed');
    assert.deepEqual(data.shipCounts, []);
  });
  it('does not fabricate events or high data confidence on provider failure', async () => {
    const data = await infra.getEnergyInfrastructureData();
    assert.deepEqual(data.climate, []); assert.deepEqual(data.osint, []);
    assert.equal(data.resilience.find((row) => row.dim === 'Data Confidence').score, 100);
    assert.ok(data.storage.every((row) => row.value === null && row.date === ''));
    assert.match(data.notice, /illustrative planning models/);
  });
  it('normalizes EIA field names, units and monthly frequency', async () => {
    const requests = [];
    global.fetch = async (input) => {
      const url = new URL(input); requests.push(url);
      if (url.pathname.includes('PET.WCESTUS1.W')) return Response.json({ response: { data: [{ period: '2026-10-02', value: '420000' }, { period: '2026-09-25', value: '421000' }] } });
      if (url.pathname.includes('ELEC.GEN.ALL')) return Response.json({ response: { data: [{ period: '2026-08', generation: '300000' }] } });
      return Response.json({ events: [], response: { data: [] } });
    };
    const data = await infra.getEnergyInfrastructureData();
    assert.equal(data.storage[0].value, 420); assert.equal(data.storage[0].change, -1);
    assert.equal(data.grid[0].value, 300000);
    assert.equal(requests.find((url) => url.pathname.includes('ELEC.GEN.ALL')).searchParams.get('frequency'), 'monthly');
  });
  it('keeps NASA event categories and the latest geolocated observation', async () => {
    global.fetch = async (input) => String(input).includes('eonet') ? Response.json({ events: [{ id: 'fire', title: 'Provider fire', categories: [{ title: 'Wildfires' }], geometry: [{ type: 'Point', coordinates: [1, 2], date: '2026-09-01' }, { type: 'Point', coordinates: [3, 4], date: '2026-10-01' }] }] }) : Response.json({ response: { data: [] } });
    const data = await infra.getEnergyInfrastructureData();
    assert.equal(data.climate[0].type, 'wildfires'); assert.equal(data.climate[0].lat, 4);
  });
  it('uses request origin for Coal and distinguishes missing coverage from low congestion', async () => {
    const urls = [];
    global.fetch = async (input) => { urls.push(String(input)); return String(input).endsWith('/api/ticker') ? Response.json([]) : Response.json({ ships: [], live: false, events: [], response: { data: [] } }); };
    const data = await coal.getCoalMarketData('http://127.0.0.1:3010');
    assert.ok(urls.some((url) => url.startsWith('http://127.0.0.1:3010/api/world-monitor/ships')));
    assert.ok(data.routes.every((row) => row.congestion === 'unavailable'));
    assert.deepEqual(data.vessels, []);
  });
  it('reports stale timestamps without inventing observation times', () => {
    assert.equal(quoteStatus(null), 'unavailable');
    assert.equal(quoteStatus('2020-01-01'), 'stale');
    assert.equal(energyApiUrl('/api/ticker', 'http://localhost:3010'), 'http://localhost:3010/api/ticker');
  });
});

describe('Reference plant inventory', () => {
  it('filters all fossil fuels without admitting renewables or nuclear', () => {
    const data = plants.queryPowerPlants({ fuels: ['Coal', 'Gas', 'Oil'], minMW: 50 });
    assert.ok(data.features.length > 0);
    assert.ok(data.features.every((f) => ['Coal', 'Gas', 'Oil'].includes(f.properties.fuel)));
  });
  it('does not invent construction records in the operating-only source', () => {
    assert.equal(plants.queryPowerPlants({ statuses: ['construction'] }).features.length, 0);
  });
});