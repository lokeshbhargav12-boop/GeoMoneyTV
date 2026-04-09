import { NextResponse } from 'next/server';
import { getAiModel } from '@/lib/get-ai-model';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

export async function POST(req: Request) {
    try {
        const { query } = await req.json();

        if (!query) {
            return NextResponse.json({ error: 'query is required' }, { status: 400 });
        }

        if (!OPENROUTER_API_KEY) {
            return NextResponse.json(
                { error: 'OpenRouter API Key not configured' },
                { status: 500 }
            );
        }

        // Fetch AI Model setting
        const aiModel = await getAiModel();

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
`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://geomoney.com',
                'X-Title': 'GeoMoney TV',
            },
            body: JSON.stringify({
                model: aiModel,
                messages: [
                    { role: 'user', content: prompt },
                ],
                temperature: 0.3,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter API Error:', errorText);
            return NextResponse.json(
                { error: `AI service error: ${response.statusText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        const contentStr = data.choices[0]?.message?.content?.trim();

        if (!contentStr) {
            throw new Error('No content received from AI');
        }

        // Parse JSON — strip markdown fences by extracting from first { to last }
        let analysisJson;
        try {
            const firstBrace = contentStr.indexOf('{');
            const lastBrace = contentStr.lastIndexOf('}');
            if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
                throw new Error('No JSON object found in AI response');
            }
            analysisJson = JSON.parse(contentStr.substring(firstBrace, lastBrace + 1));
        } catch {
            throw new Error('Could not parse AI response as JSON');
        }

        return NextResponse.json(analysisJson);

    } catch (error) {
        console.error('AI Energy Analysis Error:', error);
        return NextResponse.json(
            { error: 'Failed to analyze energy query' },
            { status: 500 }
        );
    }
}
