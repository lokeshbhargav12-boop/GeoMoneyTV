import { describe, it, before, beforeEach, afterEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '@/lib/prisma';
import { AiProviderError, callOpenRouter, callOpenRouterJson, getAiFailure } from '@/lib/openrouter';
import { isSlowOrStopped, resolveQueryRegion, selectQueryEvidence } from '@/lib/aperture-query';
import { getNearbyWebcams } from '@/lib/world-monitor-geo';
import { liveVideoFromChannelHtml, streamErrorMessage, youtubeVideoId } from '@/lib/public-streams';
import { POST as brief } from '@/app/api/world-monitor/ai-brief/route';
import { GET as streams } from '@/app/api/world-monitor/streams/route';

const originalFetch = global.fetch;
const originalLookup = prisma.siteSettings.findUnique;
const originalKey = process.env.OPENROUTER_API_KEY;
const originalPublicKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
const options = { preferredModels: ['test/first', 'test/second'], maxAttempts: 2, caller: 'aperture-test' };
let requests: Array<Record<string, any>>;
let respond: (body: Record<string, any>, signal?: AbortSignal | null) => Promise<Response>;

function evidenceRequest(query = 'Hormuz') {
  return new Request('http://localhost/api/world-monitor/ai-brief', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
    query, events: [], sourceStatus: { aircraft: { mode: 'live', observedAt: '2026-10-04T12:00:00Z' }, vessels: { mode: 'unavailable' } },
    assetContext: { aircraft: { visibleNow: 2, sample: [null, { latitude: 26, longitude: 56, callsign: 'TEST' }] }, vessels: { visibleNow: 500, sample: [{ latitude: 26, longitude: 56 }] } },
  }) });
}

describe('Aperture provider reliability', { concurrency: false }, () => {
  before(() => { prisma.siteSettings.findUnique = (async () => null) as typeof originalLookup; });
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = 'test-key-not-real'; delete process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    requests = [];
    respond = async () => Response.json({ choices: [{ message: { content: JSON.stringify({ headline: 'Observed coverage', summary: 'Only sourced observations.', queryAnswer: 'Only sourced regional observations are available.' }) } }] });
    global.fetch = (async (input, init) => {
      if (String(input).endsWith('/models')) return Response.json({ data: ['test/first', 'test/second', 'google/gemma-4-31b-it:free'].map((id) => ({ id, supported_parameters: ['reasoning', 'response_format'] })) });
      const body = JSON.parse(String(init?.body)); requests.push(body);
      return respond(body, init?.signal);
    }) as typeof fetch;
  });
  afterEach(() => { global.fetch = originalFetch; });
  after(async () => {
    prisma.siteSettings.findUnique = originalLookup;
    if (originalKey === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = originalKey;
    if (originalPublicKey === undefined) delete process.env.NEXT_PUBLIC_OPENROUTER_API_KEY; else process.env.NEXT_PUBLIC_OPENROUTER_API_KEY = originalPublicKey;
    await prisma.$disconnect();
  });

  it('validates schema within fallback and requests JSON only for compatible models', async () => {
    respond = async (body) => Response.json({ choices: [{ message: { content: body.model === 'test/first' ? '{"wrong":true}' : '{"answer":"valid"}' } }] });
    const result = await callOpenRouterJson<{ answer: string }>('test', { ...options, validate: (data) => { if (!data.answer) throw new Error('Missing answer'); return data; } });
    assert.equal(result.model, 'test/second'); assert.equal(result.data.answer, 'valid');
    assert.deepEqual(requests[0].response_format, { type: 'json_object' });
    assert.deepEqual(requests[0].reasoning, { enabled: false });
  });
  it('stops immediately for authentication failures', async () => {
    respond = async () => new Response('secret upstream message', { status: 401 });
    await assert.rejects(callOpenRouter('test', options), (error: unknown) => error instanceof AiProviderError && error.code === 'authentication');
    assert.equal(requests.length, 1);
  });
  it('preserves quota failure and retry hints after bounded fallback', async () => {
    respond = async () => new Response('limited', { status: 429, headers: { 'retry-after': '90' } });
    await assert.rejects(callOpenRouter('test', options), (error: unknown) => error instanceof AiProviderError && error.code === 'rate_limit' && error.retryAfter === 90);
    assert.equal(requests.length, 2);
  });
  it('bounds body reads, not only the time to receive headers', async () => {
    respond = async (_body, signal) => ({ ok: true, json: () => new Promise((_resolve, reject) => { signal?.addEventListener('abort', () => reject(new Error('Aborted')), { once: true }); }) }) as unknown as Response;
    const start = Date.now();
    await assert.rejects(callOpenRouter('test', { ...options, maxAttempts: 1, timeoutMs: 80, modelTimeoutMs: 40 }), (error: unknown) => error instanceof AiProviderError && error.code === 'timeout');
    assert.ok(Date.now() - start < 1000);
  });
  it('does not call providers for a cancelled request', async () => {
    const controller = new AbortController(); controller.abort();
    await assert.rejects(callOpenRouter('test', { ...options, signal: controller.signal })); assert.equal(requests.length, 0);
  });
  it('returns safe configuration errors from the briefing route', async () => {
    delete process.env.OPENROUTER_API_KEY;
    const response = await brief(evidenceRequest()); const data = await response.json();
    assert.equal(response.status, 503); assert.equal(data.code, 'configuration'); assert.equal(data.retryable, false);
    assert.ok(!JSON.stringify(data).includes('test-key')); assert.equal(requests.length, 0);
  });
  it('handles malformed samples and excludes unavailable asset claims', async () => {
    const response = await brief(evidenceRequest('hormuz test evidence'));
    assert.equal(response.status, 200);
    const prompt = requests[0].messages[0].content;
    assert.match(prompt, /Strait of Hormuz/); assert.ok(!prompt.includes('"visibleNow": 500'));
    assert.match(prompt, /NOT establish that a vessel is stranded/);
  });
  it('maps provider failures without leaking their message', () => {
    const failure = getAiFailure(new AiProviderError('invalid_output', 'private prompt'));
    assert.equal(failure.code, 'invalid_output'); assert.ok(!failure.error.includes('private prompt'));
  });
});

describe('Regional evidence and public feeds', () => {
  it('selects the whole regional population before sampling and excludes distant assets', () => {
    const local = Array.from({ length: 35 }, (_, index) => ({ latitude: 26.5, longitude: 56.2, index }));
    const result = selectQueryEvidence('hormuz', [], [{ latitude: 40, longitude: -74 }], [...local, { latitude: 40, longitude: -74, index: 99 }]);
    assert.equal(result.ships.length, 35); assert.equal(result.aircraft.length, 0); assert.equal(result.region?.name, 'Strait of Hormuz');
    assert.equal(resolveQueryRegion('Show activity around the Middle East')?.name, 'Middle East');
    assert.equal(resolveQueryRegion('Which chokepoint is busiest?'), null);
  });
  it('uses position or named reports for regional events', () => {
    const result = selectQueryEvidence('hormuz', [{ title: 'Port report', locations: [{ lat: 26.5, lng: 56.2, name: 'Oman' }] }, { title: 'Hormuz report', locations: [] }, { title: 'US report', locations: [] }], [], []);
    assert.equal(result.events.length, 2);
  });
  it('labels speed/status observations without proving stranding', () => {
    assert.equal(isSlowOrStopped({ speed: 0.5 }), true); assert.equal(isSlowOrStopped({ speed: NaN }), false);
    assert.equal(isSlowOrStopped({ speed: 2, status: 'anchored' }), true);
  });
  it('never presents a broadcaster headquarters as a nearby location camera', () => {
    assert.equal(getNearbyWebcams(25.2854, 51.531).length, 0);
    assert.equal(getNearbyWebcams(35.6944, 139.7026)[0]?.feedType, 'camera');
  });
  it('accepts only known YouTube video URLs and verifies current live metadata', () => {
    assert.equal(youtubeVideoId('https://evil.test/embed/DjdUEyjx8GM'), null);
    assert.equal(youtubeVideoId('https://www.youtube.com/embed/DjdUEyjx8GM'), 'DjdUEyjx8GM');
    const html = '<link rel="canonical" href="https://www.youtube.com/watch?v=DjdUEyjx8GM">{"isLiveNow":true}';
    assert.equal(liveVideoFromChannelHtml(html), 'DjdUEyjx8GM');
    assert.equal(liveVideoFromChannelHtml(html.replace('true', 'false')), null);
  });
  it('distinguishes embed restrictions, removed videos and origin errors', () => {
    assert.match(streamErrorMessage(100), /removed/); assert.match(streamErrorMessage(150), /does not allow/); assert.match(streamErrorMessage(153), /origin/);
  });
  it('rejects arbitrary stream IDs without fetching user-supplied URLs', async () => {
    const response = await streams(new Request('http://localhost/api/world-monitor/streams?id=https://evil.test'));
    assert.equal(response.status, 404);
  });
});