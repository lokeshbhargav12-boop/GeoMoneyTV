// UI fixtures are intercepted and explicitly NOT live provider evidence.
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
const base = process.env.ENERGY_TEST_URL || 'http://localhost:3010';
const timestamp = new Date().toISOString();
const fixture = { timestamp, commodities: [], storage: [], grid: [], climate: [], osint: [], shipCounts: [], assets: [], constraints: [], resilience: [], scenarios: [], gridStress: [], interdependency: null, notice: 'UI fixture: reference layers, no provider observations.' };
const clickText = async (page, text) => {
  await page.waitForFunction((text) => {
    const el = [...document.querySelectorAll('button,a')].find((node) => node.textContent.trim() === text && node.getClientRects().length);
    return el && Object.keys(el).some((key) => key.startsWith('__reactProps$') && typeof el[key]?.onClick === 'function');
  }, { timeout: 90000 }, text);
  const handle = await page.evaluateHandle((text) => [...document.querySelectorAll('button,a')].find((el) => el.textContent.trim() === text && el.getClientRects().length), text);
  const element = handle.asElement();
  assert.ok(element, `Visible control: ${text}`);
  await element.click();
  await handle.dispose();
};
const setInput = async (page, selector, value) => {
  await page.$eval(selector, (el, value) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
};

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  const page = await browser.newPage();
  let refreshes = 0;
  let failRefresh = false;
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const url = new URL(request.url());
    const json = (body, status = 200) => request.respond({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (url.pathname === '/api/energy/infrastructure') {
      if (url.searchParams.has('refresh')) refreshes++;
      return failRefresh ? json({ error: 'Test outage' }, 503) : json(fixture);
    }
    if (url.pathname === '/api/coal/market') return json({ timestamp, benchmarks: [{ label: 'API2 Rotterdam', symbol: 'API2', price: null, change: null, changePercent: null, unit: '$/t', note: 'UI fixture', live: false }], eia: {}, routes: [{ id: 'test', name: 'Test route', origin: [0, 0], destination: [20, 20], mode: 'UI fixture', vesselCount: 0, congestion: 'unavailable', watch: 'Coverage unavailable' }], osint: [], climate: [], vessels: [] });
    if (url.pathname === '/api/ai/coal-commentary') return json({ error: 'UI fixture: briefing unavailable' }, 503);
    if (url.pathname === '/api/world-monitor/ships') return json({ timestamp: Date.now(), live: false, source: 'UI fixture', ships: [], notice: 'Coverage unavailable' });
    if (url.pathname === '/api/map/power-plants') return json({ type: 'FeatureCollection', features: [] });
    if (url.pathname === '/api/map/boundaries') return json({ type: 'FeatureCollection', features: [] });
    if (url.pathname.startsWith('/api/')) return json({ success: true, events: [], tickers: [], data: [], articles: [] });
    if (url.hostname !== new URL(base).hostname) return request.abort();
    request.continue();
  });
  try {
    for (const width of [390, 1440]) {
      await page.setViewport({ width, height: 1000, isMobile: width < 600, hasTouch: width < 600 });
      const goto = async (route, expected) => {
        await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 180000 });
        await page.waitForFunction((text) => document.body.textContent.includes(text), { timeout: 90000 }, expected);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} ${width}px no horizontal overflow`);
      };
      await goto('/energy', 'Solar Economics Calculator');
      await page.waitForFunction(() => document.body.textContent.includes('Provider snapshot'));
      await clickText(page, 'Calculate ROI');
      await page.waitForFunction(() => [...document.querySelectorAll('[role="alert"]')].some((el) => el.textContent.includes('System size')));
      await setInput(page, '#energy-field-1', '10');
      await setInput(page, '#energy-field-3', '0');
      await clickText(page, 'Calculate ROI');
      await page.waitForFunction(() => document.body.textContent.includes('No payback at zero savings'));
      assert.ok(!await page.evaluate(() => document.body.textContent.includes('NaN')));
      assert.ok(await page.$eval('#energy-field-1', (el) => el.labels.length > 0));
      await goto('/energy/fossil-energy', 'Reference: WRI');
      await clickText(page, 'Construction');
      await page.waitForFunction(() => document.body.textContent.includes('No construction records'));
      assert.equal(await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Construction').getAttribute('aria-pressed')), 'true');
      await goto('/energy/infrastructure', 'UI fixture: reference layers');
      await clickText(page, 'Supply / Demand');
      await page.waitForFunction(() => document.body.textContent.includes('Illustrative planning assumptions'));
      await clickText(page, 'Fleet Matrix');
      await page.waitForFunction(() => document.querySelector('[aria-label="Search infrastructure assets"]'));
      await clickText(page, 'Refresh Feeds');
      await page.waitForFunction(() => ![...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Refresh Feeds').disabled);
      assert.ok(await page.$('[aria-label="Search infrastructure assets"]'), 'Refresh preserves workspace tab');
      failRefresh = true;
      await clickText(page, 'Refresh Feeds');
      await page.waitForFunction(() => document.body.textContent.includes('Refresh failed'));
      failRefresh = false;
      await clickText(page, 'Asset Inspector');
      await page.waitForFunction(() => document.body.textContent.includes('Simulation: output'));
      await clickText(page, '3D Globe');
      await page.waitForFunction(() => document.querySelector('#global-map canvas'));
      await clickText(page, 'Processing');
      assert.equal(await page.evaluate(() => [...document.querySelectorAll('#global-map button')].find((b) => b.textContent.trim() === 'Processing').getAttribute('aria-pressed')), 'true');
      await clickText(page, '2D Map');
      await page.waitForFunction(() => document.querySelector('#global-map .leaflet-container'));
      assert.equal(await page.evaluate(() => [...document.querySelectorAll('#global-map button')].find((b) => b.textContent.trim() === 'Processing').getAttribute('aria-pressed')), 'true');
      await goto('/energy/oil-and-gas', 'Storage Visualization Demo');
      await page.waitForFunction(() => document.body.textContent.includes('SIMULATED'));
      assert.ok(!await page.evaluate(() => document.body.textContent.includes('AI-detected Dark Ships')));
      await clickText(page, 'Movement Heuristics');
      assert.equal(await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Movement Heuristics').getAttribute('aria-pressed')), 'true');
      await goto('/energy/coal', 'Coverage unavailable');
      await clickText(page, 'Coal plants');
      const plantButton = await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Coal plants').getAttribute('aria-pressed'));
      assert.equal(plantButton, 'false');
      await setInput(page, '[id="burn-Capacity Factor (%)"]', '101');
      await page.waitForFunction(() => [...document.querySelectorAll('[role="alert"]')].some((el) => el.textContent.includes('Capacity factor')));
      console.log(`PASS ${width}px: five pages, calculator validation, source notices, fossil status, workspace navigation, refresh persistence, accessible toggles`);
    }
    assert.ok(refreshes >= 4);
    assert.deepEqual(errors, [], 'No page runtime errors');
    console.log('PASS no page runtime errors');
  } catch (error) {
    console.error('Page runtime errors:', errors);
    console.error('Page text:', await page.evaluate(() => document.body.textContent.slice(-6000)));
    throw error;
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });