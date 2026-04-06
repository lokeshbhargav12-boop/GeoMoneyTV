import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const OPENROUTER_API_KEY =
    process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY

const INSTRUMENT_NAMES: Record<string, string> = {
    XAUUSD: 'Gold (XAU/USD)',
    'TVC:USOIL': 'WTI Crude Oil',
    'COMEX:HG1!': 'Copper (COMEX Futures)',
    'TVC:DXY': 'US Dollar Index (DXY)',
    'CAPITALCOM:US500': 'S&P 500 Index',
    'NYMEX:NG1!': 'Natural Gas (NYMEX Futures)',
    'COMEX:SI1!': 'Silver (COMEX Futures)',
    'TVC:US10Y': 'US 10-Year Treasury Yield',
}

export async function POST(req: Request) {
    if (!OPENROUTER_API_KEY) {
        return NextResponse.json({ error: 'API Key not configured' }, { status: 500 })
    }

    let symbol: string
    try {
        const body = await req.json()
        symbol = body?.symbol
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    if (!symbol || typeof symbol !== 'string') {
        return NextResponse.json({ error: 'symbol is required' }, { status: 400 })
    }

    const instrumentName = INSTRUMENT_NAMES[symbol] ?? symbol

    // Read admin-configured model (same pattern as /api/ai/summarize)
    const aiSetting = await prisma.siteSettings.findUnique({ where: { key: 'ai_model' } })
    const adminModel = aiSetting?.value || ''

    const prompt = `You are a senior macro market strategist and geopolitical intelligence analyst for GeoMoney TV — an international financial and geopolitical intelligence platform focused on commodities, energy, and critical materials.

Analyze the current global macro environment for: ${instrumentName}

Today's date: April 2026

Consider these macro themes:
- Ongoing geopolitical tensions affecting commodity supply chains (Middle East, Russia-Ukraine, Taiwan Strait)
- Central bank policy divergence between the Fed, ECB, BOJ, and EM central banks
- The critical minerals and energy transition reshaping long-term commodity demand
- US Dollar dynamics and global capital flow patterns
- Elevated sovereign debt and fiscal pressures in major economies
- AI infrastructure build-out driving unprecedented energy and metal demand

Return ONLY a valid JSON object with EXACTLY these fields:
{
  "trend": "BULLISH" or "BEARISH" or "NEUTRAL",
  "trend_strength": number 0-100,
  "structure": one of ["Break of Structure ↑", "Break of Structure ↓", "Change of Character", "Range Consolidation", "Trend Continuation ↑", "Trend Continuation ↓"],
  "signal": "string max 10 words — one clear macro insight",
  "bias_score": number -100 to 100,
  "key_resistance": ["string describing first resistance level", "string describing second resistance level"],
  "key_support": ["string describing first support level", "string describing second support level"],
  "macro_drivers": ["driver 1 max 8 words", "driver 2 max 8 words", "driver 3 max 8 words"],
  "analysis": "string — 3 to 4 professional sentences of macro intelligence",
  "risk_factors": ["risk 1 string", "risk 2 string"]
}

No markdown. No explanation. JSON only.`

    // Models tried in order — admin-configured model first, then fallbacks
    const FALLBACKS = [
        'qwen/qwen2.5-72b-instruct:free',
        'deepseek/deepseek-r1:free',
        'meta-llama/llama-3.3-70b-instruct:free',
    ]
    const MODELS = adminModel
        ? [adminModel, ...FALLBACKS.filter(m => m !== adminModel)]
        : FALLBACKS

    let lastError: string = 'No models available'

    for (const model of MODELS) {
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://geomoney.tv',
                    'X-Title': 'GeoMoney Market Intelligence',
                },
                body: JSON.stringify({
                    model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.65,
                    max_tokens: 900,
                }),
            })

            if (!response.ok) {
                const errBody = await response.text()
                lastError = `${model}: HTTP ${response.status} — ${errBody}`
                console.warn('Market sentiment model failed, trying next:', lastError)
                continue
            }

            const data = await response.json()
            const content: string = data.choices?.[0]?.message?.content ?? ''

            if (!content) {
                lastError = `${model}: empty response`
                console.warn('Market sentiment model returned empty content, trying next')
                continue
            }

            // Parse JSON — strip markdown fences by extracting from first { to last }
            const firstBrace = content.indexOf('{')
            const lastBrace = content.lastIndexOf('}')
            if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
                lastError = `${model}: no JSON in response`
                console.warn('Market sentiment model returned no JSON, trying next:', content.slice(0, 200))
                continue
            }

            const sentiment = JSON.parse(content.substring(firstBrace, lastBrace + 1))

            return NextResponse.json({
                symbol,
                instrumentName,
                ...sentiment,
                timestamp: new Date().toISOString(),
            })
        } catch (error) {
            lastError = `${model}: ${error instanceof Error ? error.message : String(error)}`
            console.warn('Market sentiment model threw, trying next:', lastError)
        }
    }

    console.error('All market sentiment models failed. Last error:', lastError)
    return NextResponse.json(
        { error: 'Failed to generate market analysis. Please try again.' },
        { status: 500 }
    )
}
