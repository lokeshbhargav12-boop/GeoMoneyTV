import { NextResponse } from 'next/server'
import { callOpenRouterJson } from '@/lib/openrouter'

const INSTRUMENT_NAMES: Record<string, string> = {
    XAUUSD: 'Gold (XAU/USD)',
    'TVC:USOIL': 'WTI Crude Oil',
    'CAPITALCOM:COPPER': 'Copper',
    'CAPITALCOM:DXY': 'US Dollar Index (DXY)',
    'CAPITALCOM:US500': 'S&P 500 Index',
    'CAPITALCOM:NATURALGAS': 'Natural Gas',
    'CAPITALCOM:SILVER': 'Silver',
    'TVC:US10Y': 'US 10-Year Treasury Note',
}

export async function POST(req: Request) {
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

    try {
        const { data: sentiment } = await callOpenRouterJson(prompt, {
            temperature: 0.65,
            maxTokens: 900,
            caller: 'market-sentiment',
        })

        return NextResponse.json({
            symbol,
            instrumentName,
            ...sentiment as object,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        console.error('All market sentiment models exhausted:', error instanceof Error ? error.message : String(error))
        return NextResponse.json(
            { error: 'Failed to generate market analysis. Please try again.' },
            { status: 500 }
        )
    }
}

