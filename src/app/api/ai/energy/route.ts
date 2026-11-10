import { NextResponse } from 'next/server';
import { callOpenRouterJson, getAiFailure } from '@/lib/openrouter';

const PREFERRED_MODEL = process.env.OPENROUTER_AI_MODEL || 'moonshotai/kimi-k3.1-pro';

type EnergyAnalysis = {
  summary: string;
  strategic_implications: string[];
  affected_markets: { market: string; impact: string; direction: string }[];
  key_players: { name: string; role: string }[];
  outlook: { short_term: string; long_term: string };
  confidence: string;
  fallback?: boolean;
};

function normalizeArray(values: unknown, fallback: string[]): string[] {
  return Array.isArray(values)
    ? values.map((item) => String(item ?? '').trim()).filter(Boolean).slice(0, 6)
    : fallback;
}

function normalizeEnergyAnalysis(candidate: any, fallback: EnergyAnalysis): EnergyAnalysis {
  return {
    summary: typeof candidate?.summary === 'string' && candidate.summary.trim()
      ? candidate.summary.trim()
      : fallback.summary,
    strategic_implications: normalizeArray(candidate?.strategic_implications, fallback.strategic_implications),
    affected_markets: Array.isArray(candidate?.affected_markets)
      ? candidate.affected_markets
          .filter((item: any) => item && typeof item === 'object')
          .map((item: any) => ({
            market: String(item.market ?? '').trim() || 'Unknown',
            impact: String(item.impact ?? '').trim() || 'Impact not specified',
            direction: String(item.direction ?? 'Neutral').trim(),
          }))
          .slice(0, 6)
      : fallback.affected_markets,
    key_players: Array.isArray(candidate?.key_players)
      ? candidate.key_players
          .filter((item: any) => item && typeof item === 'object')
          .map((item: any) => ({
            name: String(item.name ?? '').trim() || 'Unknown',
            role: String(item.role ?? '').trim() || 'Role not specified',
          }))
          .slice(0, 6)
      : fallback.key_players,
    outlook: {
      short_term: String(candidate?.outlook?.short_term ?? '').trim() || fallback.outlook.short_term,
      long_term: String(candidate?.outlook?.long_term ?? '').trim() || fallback.outlook.long_term,
    },
    confidence: String(candidate?.confidence ?? '').trim() || fallback.confidence,
  };
}

function buildFallback(query: string, reason: string): EnergyAnalysis {
  return {
    summary: `Fallback analysis (AI provider unavailable). Request: "${query}". Reason: ${reason}`,
    strategic_implications: [
      'Supply chain resilience and export controls remain the dominant variables for energy-security decisions.',
      'Policy timing and subsidy design can shift capital flows faster than underlying fuel market fundamentals.',
      'Regional infrastructure bottlenecks and grid constraints will shape price volatility more than headline demand growth.',
    ],
    affected_markets: [
      {
        market: 'Energy & Critical Minerals',
        impact: 'Likely near-term volatility while policy signals and industrial demand stay uncertain.',
        direction: 'Neutral',
      },
    ],
    key_players: [
      { name: 'United States', role: 'Policy incentives, strategic reserves, LNG exports' },
      { name: 'China', role: 'Manufacturing scale, critical mineral processing' },
      { name: 'OPEC+', role: 'Supply management and price stability' },
    ],
    outlook: {
      short_term: 'Expect policy-driven volatility; validate with current market data before action.',
      long_term: 'Structural shift toward electrification and critical minerals persists; monitor capex and trade policy.',
    },
    confidence: 'Limited',
    fallback: true,
  };
}

export async function POST(req: Request) {
    let query = "";
    try {
        const body = await req.json();
        query = typeof body?.query === 'string' ? body.query : "";

        if (typeof query !== 'string' || !query.trim() || query.length > 2000) {
            return NextResponse.json({ error: 'Enter an energy question of 1–2000 characters.' }, { status: 400 });
        }

        const prompt = `
You are a senior energy geopolitics analyst working for GeoMoney TV — a geopolitical and market intelligence platform.

Analyze the following energy-related question and provide a STRUCTURED analysis in JSON format.

QUESTION: "${query}"

Respond ONLY with valid JSON in this exact format (no markdown, no explanations outside JSON):
{
    "summary": "A 2-3 sentence executive summary of your analysis",
    "strategic_implications": [
        "First strategic implication",
        "Second strategic implication",
        "Third strategic implication"
    ],
    "affected_markets": [
        { "market": "Market/Commodity name", "impact": "Brief explanation of impact", "direction": "Positive Pressure or Negative Pressure or Neutral" }
    ],
    "key_players": [
        { "name": "Country or Company name", "role": "Their role in this dynamic" }
    ],
    "outlook": {
        "short_term": "6-12 month outlook",
        "long_term": "3-5 year outlook"
    },
    "confidence": "Elevated or Moderate or Limited"
}

INSTRUCTIONS:
- Focus on geopolitical, strategic, and financial dimensions of energy
- Consider supply chain dependencies, trade dynamics, sanctions, alliances
- Include relevant commodities (lithium, uranium, copper, rare earths, etc.)
- Mention key countries (US, China, EU, India, Russia, Saudi Arabia, Australia, etc.)
- Be analytical, factual, and avoid speculation
- Cover both renewable and traditional energy where relevant
- No live observations or external sources were supplied. State that this is general analysis, not current market intelligence. Never invent current prices, events or citations.
`;

        const fallback = buildFallback(query, 'AI provider returned incomplete output.');
        const { data: analysisJson } = await callOpenRouterJson(prompt, {
            temperature: 0.3,
            maxTokens: 900,
            caller: 'energy',
            signal: req.signal,
            preferredModels: [PREFERRED_MODEL],
            allowFallback: true,
            timeoutMs: 90_000,
            modelTimeoutMs: 45_000,
            maxAttempts: 3,
            validate: (data: any) => normalizeEnergyAnalysis(data, fallback),
        });

        return NextResponse.json(analysisJson);

    } catch (error) {
        console.error('AI Energy Analysis Error:', error);
        const failure = getAiFailure(error);
        const fallback = buildFallback(query || "Energy analysis request", failure.error);
        return NextResponse.json({ ...fallback, notice: failure.error, retryable: failure.retryable });
    }
}

