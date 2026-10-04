// Deterministic UI regression checks. Provider responses are intercepted, not
// represented as live evidence. Set APERTURE_TEST_URL to a running local server.
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  const requests = [];
  const base = process.env.APERTURE_TEST_URL || 'http://localhost:3010';
  const now = Date.now();
  const json = (request, body, status = 200) => request.respond({ status, contentType: 'application/json', body: JSON.stringify(body) });
  const clickText = async (page, text) => {
    const clicked = await page.evaluate((text) => {
      const button = Array.from(document.querySelectorAll('button')).find((node) => node.textContent.trim() === text && node.getClientRects().length);
      if (!button) return false;
      button.click(); return true;
    }, text);
    assert.ok(clicked, `Visible button: ${text}`);
  };
  const page = await browser.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem('geomoney_wm_tutorial_seen', '1'); } catch {} });
  await page.setRequestInterception(true);
  page.on('request', async (request) => {
    const url = new URL(request.url());
    if (url.pathname === '/api/world-monitor/ai-brief') {
      const body = JSON.parse(request.postData()); requests.push(body);
      return json(request, body.query ? { code: 'rate_limit', error: 'The AI provider is rate limited. Please retry later.', retryable: true } : { headline: 'UI test briefing', summary: 'Test fixture, not live intelligence.', queryAnswer: '', generatedAt: new Date(now).toISOString(), dataAsOf: new Date(now).toISOString(), model: 'ui-test', hotspots: [] }, body.query ? 429 : 200);
    }
    if (url.pathname === '/api/world-monitor/streams') return json(request, { videoId: 'xDWQ3LkccY8', liveVerified: false, checkedAt: new Date(now).toISOString(), notice: 'Test: live status unverified.' });
    if (url.pathname === '/api/analyze-bbox') return json(request, { code: 'timeout', error: 'The AI provider did not finish within the request deadline. Please retry.' }, 504);
    if (url.pathname === '/api/world-monitor/aircraft') return json(request, { timestamp: now, total: 2, aircraft: [
      { icao24: 'test01', callsign: 'TEST', origin_country: 'Test', latitude: 26.5, longitude: 56.2, altitude: 10000, heading: 0, velocity: 200, vertical_rate: 0, category: 'commercial' },
      { icao24: 'test02', callsign: 'DISTANT', origin_country: 'Test', latitude: 40, longitude: -74, altitude: 10000, heading: 0, velocity: 200, vertical_rate: 0, category: 'commercial' },
    ] });
    if (url.pathname === '/api/world-monitor/ships') return json(request, { timestamp: now, total: 1, live: true, source: 'UI test AIS', ships: [{ mmsi: 'test', name: 'UI test ship', type: 'tanker', flag: 'Test', flagEmoji: '🌐', latitude: 26.5, longitude: 56.2, heading: 0, speed: 0.5, destination: 'Test', length: 100, live: true }] });
    if (url.pathname === '/api/world-monitor/osint') return json(request, { success: true, events: [{ id: 'test', title: 'Hormuz UI test report', source: 'test', category: 'energy', region: 'Middle East', timestamp: new Date(now).toISOString(), locations: [{ name: 'Hormuz', lat: 26.5, lng: 56.2, region: 'Middle East' }] }] });
    if (url.pathname.startsWith('/api/')) return json(request, { success: true, events: [], tickers: [], data: [], articles: [] });
    if (url.href === 'https://www.youtube.com/iframe_api') return request.respond({ contentType: 'text/javascript', body: `window.YT={Player:function(el,options){this.destroy=function(){el.remove()};this.pauseVideo=function(){};setTimeout(function(){options.events.onError({data:150})},50)}};window.onYouTubeIframeAPIReady();` });
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) return request.abort();
    return request.continue();
  });

  try {
    for (const width of [320, 375, 390, 430, 768]) {
      await page.setViewport({ width, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
      await page.goto(`${base}/world-monitor`, { waitUntil: 'domcontentloaded', timeout: 120000 });
      // The tutorial storage key may change; dismiss its actual control as well.
      await page.waitForFunction(() => Array.from(document.querySelectorAll('button')).some((button) => button.textContent.trim() === 'Filters'), { timeout: 120000 });
      await page.evaluate(() => { const dismiss = Array.from(document.querySelectorAll('button')).find((button) => /skip tutorial|skip tour|got it/i.test(button.textContent)); dismiss?.click(); });
      await page.waitForFunction(() => document.body.textContent.includes('2 aircraft'), { timeout: 15000 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${width}px: no document overflow`);
      await clickText(page, 'Filters');
      await page.waitForSelector('[role="dialog"][aria-label="Map filters"]');
      const layer = await page.$('[role="dialog"] button[aria-pressed]');
      assert.ok(layer, 'Filter toggles available');
      const before = await layer.evaluate((button) => button.getAttribute('aria-pressed'));
      await layer.click(); assert.notEqual(await layer.evaluate((button) => button.getAttribute('aria-pressed')), before);
      await page.click('[aria-label="Close Map filters"]');
      await clickText(page, 'Filters');
      await page.waitForSelector('[role="dialog"] button[aria-pressed]');
      assert.notEqual(await page.$eval('[role="dialog"] button[aria-pressed]', (button) => button.getAttribute('aria-pressed')), before, 'Filter persists across close');
      await page.click('[aria-label="Close Map filters"]');
      await clickText(page, 'AI');
      await page.waitForSelector('[role="dialog"][aria-label="AI Navigator"] input');
      await page.type('[role="dialog"] input', 'hormuz');
      await page.focus('[role="dialog"] input');
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.querySelector('[role="dialog"]')?.textContent.includes('rate limited'));
      const query = requests.filter((request) => request.query === 'hormuz').at(-1);
      assert.equal(query.assetContext.aircraft.visibleNow, 1); assert.equal(query.assetContext.vessels.slowOrStopped, 1);
      await page.click('[aria-label="Close AI Navigator"]');
      await clickText(page, 'Feeds');
      await page.waitForFunction(() => document.querySelector('[role="dialog"]')?.textContent.includes('does not allow this stream'));
      assert.ok(await page.$('[role="dialog"] a[target="_blank"]'), 'External provider fallback');
      await page.click('[aria-label="Close Public feeds"]');
      await clickText(page, 'Map');
      await page.waitForFunction(() => document.querySelector('.leaflet-container'));
      await clickText(page, 'Filters');
      await page.waitForSelector('[role="dialog"][aria-label="Map filters and tools"]');
      assert.ok(await page.evaluate(() => document.querySelector('[role="dialog"]').getBoundingClientRect().width <= innerWidth), '2D filters fit viewport');
      await page.click('[aria-label="Close Map filters and tools"]');
      if (width === 390) {
        await clickText(page, 'Select region');
        const rect = await page.$eval('.leaflet-container', (element) => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
        await page.touchscreen.tap(rect.x + rect.width * .3, rect.y + rect.height * .4);
        await page.touchscreen.tap(rect.x + rect.width * .7, rect.y + rect.height * .7);
        await page.waitForFunction(() => Array.from(document.querySelectorAll('button')).some((button) => button.textContent.trim() === 'Analyze area'));
        await clickText(page, 'Analyze area');
        await page.waitForFunction(() => document.querySelector('[role="dialog"][aria-label="Region analysis"]')?.textContent.includes('request deadline'));
        await page.click('[aria-label="Close Region analysis"]');
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${width}px: 2D map no overflow`);
      console.log(`PASS ${width}px: visible filters, persistent toggles, regional AI/error, feed fallback, 2D controls`);
    }
    await page.setViewport({ width: 1440, height: 1000, isMobile: false, hasTouch: false });
    await page.goto(`${base}/world-monitor`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => document.body.textContent.includes('TOPSIDE AI NAVIGATOR'));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Desktop no overflow');
    assert.deepEqual(errors, [], 'No page runtime errors');
    console.log('PASS desktop and no page runtime errors');
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });