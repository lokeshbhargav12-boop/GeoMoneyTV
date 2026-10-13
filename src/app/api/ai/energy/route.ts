import { NextResponse } from 'next/server';
import { callOpenRouterJson, getAiFailure } from '@/lib/openrouter';

export async function POST(req: Request) {
    try {
        const { query } = await req.json();

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

        const { data: analysisJson } = await callOpenRouterJson(prompt, {
            temperature: 0.3,
            maxTokens: 800,
            caller: 'energy',
            signal: req.signal,
            validate: (data: any) => {
                if (typeof data?.summary !== 'string' || !Array.isArray(data.strategic_implications) || !data.strategic_implications.every((v: unknown) => typeof v === 'string') || !Array.isArray(data.affected_markets) || !data.affected_markets.every((v: any) => typeof v?.market === 'string' && typeof v?.impact === 'string' && typeof v?.direction === 'string') || !Array.isArray(data.key_players) || !data.key_players.every((v: any) => typeof v?.name === 'string' && typeof v?.role === 'string') || typeof data.outlook?.short_term !== 'string' || typeof data.outlook?.long_term !== 'string' || typeof data.confidence !== 'string') throw new Error('Invalid energy analysis structure');
                return data;
            },
        });

        return NextResponse.json(analysisJson);

    } catch (error) {
        console.error('AI Energy Analysis Error:', error);
        const failure = getAiFailure(error);
        return NextResponse.json(failure, { status: failure.status });
    }
}

