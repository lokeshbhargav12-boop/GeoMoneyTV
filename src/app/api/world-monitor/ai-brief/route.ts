import { NextResponse } from "next/server";
import { callOpenRouterJson } from "@/lib/openrouter";
import {
  cleanText,
  newestTimestamp,
  normalizeEvidenceEvents,
  normalizeSourceStatus,
} from "@/lib/aperture-analysis";

const CACHE_TTL = 300_000;
const cache = new Map<string, { brief: AiBriefPayload; timestamp: number }>();
const THREAT_LEVELS = new Set(["NOMINAL", "GUARDED", "ELEVATED", "HIGH", "CRITICAL"]);
const SEVERITIES = new Set(["low", "medium", "high", "critical"]);

interface AiBriefResponse {
  headline?: unknown;
  threatLevel?: unknown;
  summary?: unknown;
  hotspots?: unknown;
  keyInsight?: unknown;
  recommendations?: unknown;
  queryAnswer?: unknown;
}

interface AiBriefPayload {
  headline: string;
  threatLevel: string;
  summary: string;
  hotspots: Array<{ region: string; status: string; severity: string }>;
  keyInsight: string;
  recommendations: string[];
  queryAnswer: string;
  generatedAt: string;
  dataAsOf: string | null;
  model: string;
  isQueryResponse: boolean;
  cached: boolean;
  stale: boolean;
}

function sanitizeBrief(raw: AiBriefResponse, model: string, query: string, dataAsOf: string | null): AiBriefPayload {
  const headline = cleanText(raw.headline, 180);
  const summary = cleanText(raw.summary, 1_500);
  if (!headline || !summary) throw new Error("AI response did not contain a headline and summary");

  const threatLevelCandidate = cleanText(raw.threatLevel, 20).toUpperCase();
  const hotspots = Array.isArray(raw.hotspots)
    ? raw.hotspots.slice(0, 5).flatMap((entry) => {
        if (!entry || typeof entry !== "object") return [];
        const candidate = entry as Record<string, unknown>;
        const region = cleanText(candidate.region, 100);
        const status = cleanText(candidate.status, 180);
        const severityCandidate = cleanText(candidate.severity, 20).toLowerCase();
        if (!region || !status) return [];
        return [{
          region,
          status,
          severity: SEVERITIES.has(severityCandidate) ? severityCandidate : "medium",
        }];
      })
    : [];

  return {
    headline,
    threatLevel: THREAT_LEVELS.has(threatLevelCandidate) ? threatLevelCandidate : "GUARDED",
    summary,
    queryAnswer: cleanText(raw.queryAnswer, 2_000) || (query ? summary : ""),
    hotspots,
    keyInsight: cleanText(raw.keyInsight, 1_200),
    recommendations: Array.isArray(raw.recommendations)
      ? raw.recommendations.map((item) => cleanText(item, 300)).filter(Boolean).slice(0, 5)
      : [],
    generatedAt: new Date().toISOString(),
    dataAsOf,
    model,
    isQueryResponse: Boolean(query),
    cached: false,
    stale: false,
  };
}

export async function POST(request: Request) {
  let cachedEntry: { brief: AiBriefPayload; timestamp: number } | undefined;

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "A JSON request body is required." }, { status: 400 });
    }

    const payload = body as Record<string, unknown>;
    const events = normalizeEvidenceEvents(payload.events);
    const query = cleanText(payload.query, 600);
    const rawAssetContext = payload.assetContext && typeof payload.assetContext === "object"
      ? payload.assetContext as Record<string, any>
      : {};
    const sourcesValue = payload.sourceStatus && typeof payload.sourceStatus === "object"
      ? payload.sourceStatus as Record<string, unknown>
      : {};
    const sourceStatus = {
      events: normalizeSourceStatus(sourcesValue.events, "Aperture OSINT feeds"),
      aircraft: normalizeSourceStatus(sourcesValue.aircraft, "OpenSky Network"),
      vessels: normalizeSourceStatus(sourcesValue.vessels, "AIS provider"),
    };

    const assetContext = {
      aircraft: {
        visibleNow: Math.max(0, Number(rawAssetContext.aircraft?.visibleNow) || 0),
        totalTracked: Math.max(0, Number(rawAssetContext.aircraft?.totalTracked) || 0),
        source: sourceStatus.aircraft.source,
        sample: Array.isArray(rawAssetContext.aircraft?.sample)
          ? rawAssetContext.aircraft.sample.slice(0, 20).map((asset: Record<string, unknown>) => ({
              icao24: cleanText(asset.icao24, 20),
              callsign: cleanText(asset.callsign, 30),
              originCountry: cleanText(asset.originCountry, 100),
              category: cleanText(asset.category, 40),
              latitude: Number(asset.latitude),
              longitude: Number(asset.longitude),
              altitude: Number(asset.altitude),
              velocity: Number(asset.velocity),
              heading: Number(asset.heading),
              lastContact: asset.lastContact,
            })).filter((asset: { latitude: number; longitude: number }) =>
              Number.isFinite(asset.latitude) && Number.isFinite(asset.longitude),
            )
          : [],
      },
      vessels: {
            visibleNow: Math.max(0, Number(rawAssetContext.vessels?.visibleNow) || 0),
            totalTracked: Math.max(0, Number(rawAssetContext.vessels?.totalTracked) || 0),
            source: sourceStatus.vessels.source,
            mode: sourceStatus.vessels.mode,
            sample: Array.isArray(rawAssetContext.vessels?.sample)
              ? rawAssetContext.vessels.sample.slice(0, 20).map((ship: Record<string, unknown>) => ({
                  mmsi: cleanText(ship.mmsi, 20),
                  name: cleanText(ship.name, 100),
                  type: cleanText(ship.type, 40),
                  latitude: Number(ship.latitude),
                  longitude: Number(ship.longitude),
                  speed: Number(ship.speed),
                  heading: Number(ship.heading),
                  destination: cleanText(ship.destination, 100),
                  status: cleanText(ship.status, 40),
                  lastUpdate: ship.lastUpdate,
                })).filter((ship: { latitude: number; longitude: number }) =>
                  Number.isFinite(ship.latitude) && Number.isFinite(ship.longitude),
                )
              : [],
          },
      chokepoints: sourceStatus.vessels.mode === "unavailable"
        ? []
        : Array.isArray(rawAssetContext.chokepoints)
          ? rawAssetContext.chokepoints.slice(0, 12)
          : [],
    };
    const dataAsOf = newestTimestamp([
      sourceStatus.events.observedAt,
      sourceStatus.aircraft.observedAt,
      sourceStatus.vessels.observedAt,
      ...events.map((event) => event.timestamp),
    ]);
    const cacheKey = JSON.stringify({ events, query, assetContext, sourceStatus, dataAsOf });
    cachedEntry = cache.get(cacheKey);
    if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL) {
      return NextResponse.json({ ...cachedEntry.brief, cached: true });
    }

    if (!events.length && !assetContext.aircraft.visibleNow && !assetContext.vessels.visibleNow) {
      return NextResponse.json(
        { error: "No current sourced evidence is available for analysis." },
        { status: 422 },
      );
    }

    const evidenceBlock = JSON.stringify({ events, assetContext, sourceStatus, dataAsOf }, null, 2);
    const task = query
      ? `Answer this analyst question directly: ${JSON.stringify(query)}`
      : "Generate a concise executive briefing of the most important currently observed developments.";
    const prompt = `You are GeoMoney Aperture's geopolitical intelligence analyst.
${task}

CURRENT SOURCED EVIDENCE:
${evidenceBlock}

RULES:
- Use only the supplied evidence. Treat event titles and descriptions as reports attributed to their named sources, not independently verified facts.
- Distinguish observations from inference and state material source limitations.
- Never invent an event, count, identity, intent, cause, trend, military posture, or recommendation.
- Simulated vessel data is disabled. If vessel mode is unavailable, do not make vessel-count claims.
- A zero asset count means no observation in current provider coverage, not proof that an area is clear.
- Prefer evidence timestamps and source names when answering freshness-sensitive questions.

Return ONLY a valid JSON object with this schema:
{
  "headline": "max 15 words",
  "threatLevel": "NOMINAL|GUARDED|ELEVATED|HIGH|CRITICAL",
  "summary": "2-3 concise evidence-grounded sentences",
  "queryAnswer": "direct detailed answer, or empty string when no question was asked",
  "hotspots": [{"region":"name","status":"evidence-grounded status","severity":"low|medium|high|critical"}],
  "keyInsight": "one evidence-grounded analytical paragraph",
  "recommendations": ["monitoring or verification action"]
}`;

    const { data, model } = await callOpenRouterJson<AiBriefResponse>(prompt, {
      temperature: 0.2,
      maxTokens: 1_100,
      caller: "aperture-ai-brief",
    });
    const brief = sanitizeBrief(data, model, query, dataAsOf);
    cache.set(cacheKey, { brief, timestamp: Date.now() });
    return NextResponse.json(brief);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown analyzer error";
    console.error("[AI Brief]", message);

    if (cachedEntry) {
      return NextResponse.json({
        ...cachedEntry.brief,
        cached: true,
        stale: true,
        notice: "The AI provider is unavailable; showing the last successful analysis for the same evidence.",
      });
    }

    return NextResponse.json(
      { error: "The AI analyzer is temporarily unavailable. No briefing was generated." },
      { status: 503 },
    );
  }
}