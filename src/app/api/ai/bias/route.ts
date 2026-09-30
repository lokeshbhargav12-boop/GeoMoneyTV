import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { callOpenRouterJson } from '@/lib/openrouter';

type BiasCategory = 'Left' | 'Lean Left' | 'Center' | 'Lean Right' | 'Right';
type SentimentLabel = 'Positive' | 'Negative' | 'Neutral';
type ImpactDirection = 'Positive Pressure' | 'Negative Pressure' | 'Neutral';
type ImpactMagnitude = 'Low' | 'Medium' | 'High';
type ImpactTimeframe = 'Immediate' | 'Short-term' | 'Medium-term' | 'Long-term';
type ProjectionConfidence = 'Limited' | 'Moderate' | 'Elevated';

interface BiasAnalysisResponse {
  summary: string;
  key_points: string[];
  bias: {
    score: number;
    category: BiasCategory;
    explanation: string;
  };
  sentiment: {
    score: number;
    label: SentimentLabel;
  };
  hidden_context: string;
  price_impact: Array<{
    asset: string;
    direction: ImpactDirection;
    magnitude: ImpactMagnitude;
    timeframe: ImpactTimeframe;
    reasoning: string;
  }>;
  predictions: Array<{
    prediction: string;
    confidence: ProjectionConfidence;
    timeframe: string;
  }>;
  confidence: number;
}

const LEFT_HINTS = [
  'progressive',
  'social justice',
  'redistribution',
  'welfare',
  'equity',
  'activist',
  'regulation',
  'union',
  'climate policy',
  'government intervention',
];

const RIGHT_HINTS = [
  'conservative',
  'tax cuts',
  'deregulation',
  'free market',
  'border security',
  'national security',
  'traditional values',
  'private sector',
  'law and order',
  'sovereignty',
];

const POSITIVE_HINTS = [
  'growth',
  'improved',
  'strong',
  'resilient',
  'gain',
  'rise',
  'record high',
  'stabilized',
  'agreement',
  'surplus',
];

const NEGATIVE_HINTS = [
  'crisis',
  'decline',
  'fall',
  'drop',
  'conflict',
  'inflation',
  'deficit',
  'shortage',
  'sanction',
  'recession',
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function sentenceSplit(value: string): string[] {
  return normalizeWhitespace(value)
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function countHints(haystack: string, terms: string[]): number {
  const source = haystack.toLowerCase();
  return terms.reduce((total, term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'g');
    const matches = source.match(regex);
    return total + (matches?.length || 0);
  }, 0);
}

function categoryFromScore(score: number): BiasCategory {
  if (score <= -60) return 'Left';
  if (score <= -20) return 'Lean Left';
  if (score < 20) return 'Center';
  if (score < 60) return 'Lean Right';
  return 'Right';
}

function sentimentLabelFromScore(score: number): SentimentLabel {
  if (score > 60) return 'Positive';
  if (score < 40) return 'Negative';
  return 'Neutral';
}

function fallbackAnalysis(title: string, text: string): BiasAnalysisResponse {
  const sourceText = normalizeWhitespace(`${title} ${text}`);
  const sentences = sentenceSplit(sourceText);

  const leftSignals = countHints(sourceText, LEFT_HINTS);
  const rightSignals = countHints(sourceText, RIGHT_HINTS);
  const positiveSignals = countHints(sourceText, POSITIVE_HINTS);
  const negativeSignals = countHints(sourceText, NEGATIVE_HINTS);

  const biasScore = clamp((rightSignals - leftSignals) * 14, -100, 100);
  const sentimentScore = clamp(50 + (positiveSignals - negativeSignals) * 8, 0, 100);

  const key_points = sentences.slice(0, 4).map((s) => s.slice(0, 220));
  const summary = sentences.slice(0, 3).join(' ') || title || 'No analyzable content was provided.';

  return {
    summary,
    key_points: key_points.length
      ? key_points
      : ['Insufficient textual detail for deeper extraction.'],
    bias: {
      score: biasScore,
      category: categoryFromScore(biasScore),
      explanation:
        'Bias score estimated via fallback lexical framing analysis because the primary AI analysis provider was unavailable.',
    },
    sentiment: {
      score: sentimentScore,
      label: sentimentLabelFromScore(sentimentScore),
    },
    hidden_context:
      'Fallback mode: verify source ownership, selective omission, and geopolitical incentives behind framing before making strategic decisions.',
    price_impact: [],
    predictions: [],
    confidence: 45,
  };
}

function normalizeDirection(value: unknown): ImpactDirection {
  const v = String(value ?? '').toLowerCase();
  if (v.includes('positive') || v === 'bullish') return 'Positive Pressure';
  if (v.includes('negative') || v === 'bearish') return 'Negative Pressure';
  return 'Neutral';
}

function normalizeMagnitude(value: unknown): ImpactMagnitude {
  const v = String(value ?? '').toLowerCase();
  if (v === 'high') return 'High';
  if (v === 'medium') return 'Medium';
  return 'Low';
}

function normalizeTimeframe(value: unknown): ImpactTimeframe {
  const v = String(value ?? '').toLowerCase();
  if (v.includes('short')) return 'Short-term';
  if (v.includes('medium')) return 'Medium-term';
  if (v.includes('long')) return 'Long-term';
  return 'Immediate';
}

function normalizeProjectionConfidence(value: unknown): ProjectionConfidence {
  const v = String(value ?? '').toLowerCase();
  if (v === 'elevated') return 'Elevated';
  if (v === 'moderate') return 'Moderate';
  return 'Limited';
}

function normalizeAnalysisPayload(
  candidate: Partial<BiasAnalysisResponse> | null | undefined,
  title: string,
  text: string,
): BiasAnalysisResponse {
  const fallback = fallbackAnalysis(title, text);
  const payload = candidate ?? {};
  const rawPriceImpact = Array.isArray((payload as { price_impact?: unknown }).price_impact)
    ? ((payload as { price_impact?: unknown[] }).price_impact ?? [])
    : [];
  const rawPredictions = Array.isArray((payload as { predictions?: unknown }).predictions)
    ? ((payload as { predictions?: unknown[] }).predictions ?? [])
    : [];

  const biasScore = clamp(Number(payload.bias?.score ?? fallback.bias.score), -100, 100);
  const sentimentScore = clamp(
    Number(payload.sentiment?.score ?? fallback.sentiment.score),
    0,
    100,
  );

  const priceImpact = rawPriceImpact.length
    ? rawPriceImpact
        .filter((row) => typeof row === 'object' && row !== null)
        .slice(0, 8)
        .map((row) => {
          const entry = row as Record<string, unknown>;
          return {
            asset: String(entry.asset ?? '').trim() || 'Unknown Asset',
            direction: normalizeDirection(entry.direction),
            magnitude: normalizeMagnitude(entry.magnitude),
            timeframe: normalizeTimeframe(entry.timeframe),
            reasoning: String(entry.reasoning ?? '').trim(),
          };
        })
    : [];

  const predictions = rawPredictions.length
    ? rawPredictions
        .filter((row) => typeof row === 'object' && row !== null)
        .slice(0, 6)
        .map((row) => {
          const entry = row as Record<string, unknown>;
          return {
            prediction: String(entry.prediction ?? '').trim() || 'No projection provided.',
            confidence: normalizeProjectionConfidence(entry.confidence),
            timeframe: String(entry.timeframe ?? '').trim() || 'Not specified',
          };
        })
    : [];

  return {
    summary: String(payload.summary ?? '').trim() || fallback.summary,
    key_points:
      Array.isArray(payload.key_points) && payload.key_points.length > 0
        ? payload.key_points
            .map((point) => String(point ?? '').trim())
            .filter(Boolean)
            .slice(0, 6)
        : fallback.key_points,
    bias: {
      score: biasScore,
      category: categoryFromScore(biasScore),
      explanation:
        String(payload.bias?.explanation ?? '').trim() || fallback.bias.explanation,
    },
    sentiment: {
      score: sentimentScore,
      label: sentimentLabelFromScore(sentimentScore),
    },
    hidden_context:
      String(payload.hidden_context ?? '').trim() || fallback.hidden_context,
    price_impact: priceImpact,
    predictions,
    confidence: clamp(Number(payload.confidence ?? 75), 0, 100),
  };
}

export async function POST(req: Request) {
  let title = '';
  let text = '';
  let articleId: string | undefined;

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request body' },
        { status: 400 }
      );
    }

    const payload = (body && typeof body === 'object') ? (body as Record<string, unknown>) : {};
    title = typeof payload.title === 'string' ? payload.title.trim() : '';
    text = typeof payload.text === 'string' ? payload.text.trim() : '';
    articleId = typeof payload.articleId === 'string' ? payload.articleId : undefined;

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
          const normalizedCached = normalizeAnalysisPayload(cached, title, text);
          return NextResponse.json(normalizedCached);
        }
      } catch (cacheError) {
        console.warn('Bias analysis cache read failed; regenerating:', cacheError);
      }
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

    let analysisRaw: Partial<BiasAnalysisResponse>;
    let usedFallback = false;

    try {
      const { data } = await callOpenRouterJson<Partial<BiasAnalysisResponse>>(prompt, {
        temperature: 0.1,
        maxTokens: 1200,
        caller: 'bias',
      });
      analysisRaw = data;
    } catch (aiError) {
      usedFallback = true;
      console.error('Bias Analysis AI provider failed, using fallback:', aiError);
      analysisRaw = fallbackAnalysis(title, text);
    }

    const analysis = normalizeAnalysisPayload(analysisRaw, title, text);

    // Cache analysis in DB if articleId provided
    if (articleId && !usedFallback) {
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
    const emergencyFallback = normalizeAnalysisPayload(undefined, title, text);
    return NextResponse.json(emergencyFallback);
  }
}
