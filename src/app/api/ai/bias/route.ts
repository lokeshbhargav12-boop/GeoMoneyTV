import { NextResponse } from 'next/server';
import { getAiModel } from '@/lib/get-ai-model';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

export async function POST(req: Request) {
  if (!OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: 'OpenRouter API Key not configured' },
      { status: 500 }
    );
  }

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

    const aiModel = await getAiModel();

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
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API Error:', errorText);
      return NextResponse.json(
        { error: `OpenRouter API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const rawContent = data.choices[0]?.message?.content;

    if (!rawContent) {
      throw new Error('No content received from AI');
    }

    // Parse JSON — strip markdown fences by extracting from first { to last }
    let cleanContent = rawContent;
    const firstBrace = cleanContent.indexOf('{');
    const lastBrace = cleanContent.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      console.error('JSON Parse Error. Raw content:', rawContent);
      throw new Error('Failed to parse AI response as JSON');
    }

    cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);

    let analysis;
    try {
      analysis = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('JSON Parse Error. Raw content:', rawContent);
      throw new Error('Failed to parse AI response as JSON');
    }

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
