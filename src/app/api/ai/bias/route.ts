import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { callOpenRouterJson } from '@/lib/openrouter';

export async function POST(req: Request) {
  try {
    const { text, title, articleId } = await req.json();

    if (!text && !title) {
      return NextResponse.json(
        { error: 'Text or title is required for analysis' },
        { status: 400 }
      );
    }

    // Check if we have cached analysis in DB
    if (articleId) {
      try {
        const article = await prisma.article.findUnique({
          where: { id: articleId },
          select: { aiAnalysis: true },
        });
        if (article?.aiAnalysis) {
          const cached = JSON.parse(article.aiAnalysis);
          return NextResponse.json(cached);
        }
      } catch { }
    }

    const prompt = `
      You are an expert geopolitical and financial news analyst for GeoMoney TV.
      Perform a comprehensive, deeply insightful analysis of the following news.

      Content to analyze:
      Title: ${title || 'N/A'}
      Text: ${text ? text.substring(0, 4000) : 'N/A'}

      Your analysis MUST include ALL of the following:

      1. EXECUTIVE SUMMARY (3-5 sentences — be thorough, not vague).
      2. 3-5 KEY STRATEGIC POINTS.
      3. BIAS ANALYSIS: Political leaning (-100 Left to 100 Right) with reasoning.
      4. SENTIMENT: Score (0-100) and label (Positive/Negative/Neutral).
      5. HIDDEN CONTEXT: What is NOT being said? Geopolitical angles, behind-the-scenes dynamics.
      6. MARKET RESPONSE INDICATORS: How may this news influence commodity prices, currencies, and markets?
         - Which specific commodities/assets may be affected? (e.g., Gold, Oil, Rare Earths, USD, etc.)
         - Direction of pressure: Positive Pressure or Negative Pressure?
         - Magnitude: Low, Medium, or High?
         - Timeframe: Immediate, Short-term (days-weeks), Medium-term (months), Long-term (years)?
      7. SCENARIO PROJECTIONS: Based on this intelligence, give 2-3 concrete scenario outlooks about what may happen next.
         - Include assessment level using ONLY these exact values: "Limited" or "Moderate" or "Elevated".
         - These are GeoMoney Assessment descriptors, NOT investment signals.

      Return the response ONLY as a valid JSON object:
      {
        "summary": "...",
        "key_points": ["...", "...", "..."],
        "bias": {
           "score": number,
           "category": "Left" | "Lean Left" | "Center" | "Lean Right" | "Right",
           "explanation": "..."
        },
        "sentiment": {
           "score": number,
           "label": "Positive" | "Negative" | "Neutral"
        },
        "hidden_context": "...",
        "price_impact": [
          {
            "asset": "Gold",
            "direction": "Positive Pressure" | "Negative Pressure" | "Neutral",
            "magnitude": "Low" | "Medium" | "High",
            "timeframe": "Immediate" | "Short-term" | "Medium-term" | "Long-term",
            "reasoning": "..."
          }
        ],
        "predictions": [
          {
            "prediction": "...",
            "confidence": "Limited" | "Moderate" | "Elevated",
            "timeframe": "..."
          }
        ]
      }
    `;

    const { data: analysis } = await callOpenRouterJson<{
      summary: string;
      key_points: string[];
      bias: { score: number; category: string; explanation: string };
      sentiment: { score: number; label: string };
      hidden_context: string;
      price_impact: unknown[];
      predictions: unknown[];
    }>(prompt, { temperature: 0.1, maxTokens: 1200, caller: 'bias' });

    // Ensure price_impact and predictions arrays exist
    if (!analysis.price_impact) analysis.price_impact = [];
    if (!analysis.predictions) analysis.predictions = [];

    // Cache analysis in DB if articleId provided
    if (articleId) {
      try {
        await prisma.article.update({
          where: { id: articleId },
          data: { aiAnalysis: JSON.stringify(analysis) },
        });
      } catch (e) {
        console.warn('Could not cache analysis:', e);
      }
    }

    return NextResponse.json(analysis);

  } catch (error) {
    console.error('Bias Analysis Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze bias' },
      { status: 500 }
    );
  }
}
