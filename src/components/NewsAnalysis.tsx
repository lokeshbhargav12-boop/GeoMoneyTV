'use client';

import { useState, useEffect } from 'react';
import { Loader2, BrainCircuit, Target, Scale, Zap, TrendingUp, TrendingDown, Minus, Eye, Lightbulb, BarChart3 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface NewsAnalysisProps {
  title: string;
  text?: string;
  articleId?: string;
  className?: string;
}

interface PriceImpact {
  asset: string;
  direction: string;
  magnitude: string;
  timeframe: string;
  reasoning: string;
}

interface Prediction {
  prediction: string;
  confidence: string;
  timeframe: string;
}

interface AnalysisResult {
  summary: string;
  key_points: string[];
  bias: {
    score: number;
    category: string;
    explanation: string;
  };
  sentiment: {
    score: number;
    label: string;
  };
  hidden_context: string;
  price_impact?: PriceImpact[];
  predictions?: Prediction[];
}

export default function NewsAnalysis({ title, text, articleId, className }: NewsAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');

  // Auto-initialize if we have an articleId (cached analysis may exist)
  useEffect(() => {
    if (articleId) {
      analyzeContent();
    }
  }, [articleId]);

  const analyzeContent = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/ai/bias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, text, articleId }),
      });

      if (!response.ok) throw new Error('Failed to analyze content');

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Could not analyze content at this time.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPosition = (score: number) => {
    const clampedScore = Math.max(-100, Math.min(100, score));
    return ((clampedScore + 100) / 200) * 100;
  };

  const getBiasColor = (score: number) => {
    if (score < -30) return 'text-blue-500';
    if (score > 30) return 'text-red-500';
    return 'text-gray-400';
  };

  const getDirectionLabel = (direction: string) => {
    const d = direction.toLowerCase();
    if (d === 'bullish') return 'Positive Pressure';
    if (d === 'bearish') return 'Negative Pressure';
    return direction;
  };

  const getDirectionIcon = (direction: string) => {
    if (direction.toLowerCase() === 'positive pressure' || direction.toLowerCase() === 'bullish') return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (direction.toLowerCase() === 'negative pressure' || direction.toLowerCase() === 'bearish') return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getDirectionColor = (direction: string) => {
    if (direction.toLowerCase() === 'positive pressure' || direction.toLowerCase() === 'bullish') return 'text-green-400 bg-green-500/10 border-green-500/20';
    if (direction.toLowerCase() === 'negative pressure' || direction.toLowerCase() === 'bearish') return 'text-red-400 bg-red-500/10 border-red-500/20';
    return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
  };

  const getMagnitudeBar = (magnitude: string) => {
    if (magnitude.toLowerCase() === 'high') return 'w-full bg-gradient-to-r from-geo-gold to-yellow-500';
    if (magnitude.toLowerCase() === 'medium') return 'w-2/3 bg-geo-gold/60';
    return 'w-1/3 bg-geo-gold/30';
  };

  const getConfidenceBadge = (confidence: string) => {
    const c = confidence.toLowerCase();
    if (c === 'elevated' || c === 'high') return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (c === 'moderate' || c === 'medium') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <div className={twMerge("bg-black/40 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md", className)}>
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-geo-gold" />
          <span className="bg-gradient-to-r from-geo-gold to-yellow-600 bg-clip-text text-transparent">
            Intelligence Engine
          </span>
        </h3>

        {!result && !loading && !articleId && (
          <button
            onClick={analyzeContent}
            className="text-xs px-4 py-2 bg-geo-gold text-black font-bold rounded-lg hover:bg-yellow-500 transition-all flex items-center gap-2"
          >
            <Zap className="w-3 h-3" />
            INITIALIZE ANALYSIS
          </button>
        )}
      </div>

      {loading && (
        <div className="p-12 flex flex-col items-center justify-center text-gray-400 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-geo-gold" />
          <div className="text-center">
            <p className="font-semibold text-white">Analyzing System Signals...</p>
            <p className="text-xs text-gray-500 mt-1">Political Bias • Sentiment • Market Signals • Scenario Projections</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border-l-2 border-red-500 text-red-200 text-sm m-4">
          {error}
          <button onClick={analyzeContent} className="ml-3 text-geo-gold hover:underline text-xs">Retry</button>
        </div>
      )}

      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Executive Summary */}
          <div className="p-4 border-b border-white/5 bg-white/5">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Target className="w-3 h-3" /> Executive Summary
            </h4>
            <p className="text-sm text-gray-200 leading-relaxed font-medium">
              {result.summary}
            </p>
          </div>

          {/* Key Strategic Points */}
          <div className="p-4 border-b border-white/5">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              Strategic Key Points
            </h4>
            <ul className="space-y-2">
              {result.key_points.map((point, idx) => (
                <li key={idx} className="flex gap-2 text-sm text-gray-300">
                  <span className="text-geo-gold font-bold shrink-0">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Market Response Indicators */}
          {result.price_impact && result.price_impact.length > 0 && (
            <div className="p-4 border-b border-white/5 bg-gradient-to-r from-green-900/10 to-red-900/10">
              <h4 className="text-xs font-bold text-geo-gold uppercase tracking-widest mb-4 flex items-center gap-2">
                <BarChart3 className="w-3 h-3" /> Market Response Indicators
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                {result.price_impact.map((impact, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg border p-3 ${getDirectionColor(impact.direction)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getDirectionIcon(impact.direction)}
                        <span className="font-bold text-white text-sm">{impact.asset}</span>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {getDirectionLabel(impact.direction)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] text-gray-500 uppercase">Impact:</span>
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${getMagnitudeBar(impact.magnitude)}`} />
                      </div>
                      <span className="text-[10px] text-gray-400">{impact.magnitude}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500">⏱ {impact.timeframe}</span>
                    </div>
                    {impact.reasoning && (
                      <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                        {impact.reasoning}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scenario Projections */}
          {result.predictions && result.predictions.length > 0 && (
            <div className="p-4 border-b border-white/5 bg-purple-900/5">
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Lightbulb className="w-3 h-3" /> Scenario Projections
              </h4>
              <div className="space-y-3">
                {result.predictions.map((pred, idx) => (
                  <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-start gap-3">
                      <span className="text-geo-gold font-bold text-lg shrink-0">#{idx + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-200 font-medium mb-2">
                          {pred.prediction}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${getConfidenceBadge(pred.confidence)}`}>
                            GeoMoney Assessment: {pred.confidence}
                          </span>
                          {pred.timeframe && (
                            <span className="text-[10px] text-gray-500">
                              ⏱ {pred.timeframe}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bias Meter */}
          <div className="p-4 bg-black/20 border-b border-white/5">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Scale className="w-3 h-3" /> Political Bias Calibration
            </h4>

            <div className="relative h-6 bg-gray-900 rounded-full mb-2 overflow-hidden border border-white/10 mx-2">
              <div className="absolute inset-0 flex opacity-90">
                <div className="w-1/2 bg-gradient-to-r from-blue-900 via-blue-900/50 to-transparent" />
                <div className="w-1/2 bg-gradient-to-l from-red-900 via-red-900/50 to-transparent" />
              </div>
              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/30 z-0"></div>
              <div className="absolute top-0 w-full h-full flex justify-between px-3 items-center text-[9px] font-bold tracking-widest text-white/40 pointer-events-none z-10">
                <span>LEFT</span>
                <span>CENTER</span>
                <span>RIGHT</span>
              </div>
              <div
                className="absolute top-0 bottom-0 w-1.5 h-full bg-white shadow-[0_0_15px_3px_rgba(255,255,255,0.8)] transition-all duration-1000 ease-out z-20"
                style={{ left: `${getPosition(result.bias.score)}%` }}
              />
            </div>

            <div className="flex justify-between items-end mt-2 px-2">
              <div>
                <div className={clsx("text-xl font-bold font-mono tracking-tighter", getBiasColor(result.bias.score))}>
                  {result.bias.category} ({result.bias.score > 0 ? '+' + result.bias.score : result.bias.score})
                </div>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  {result.bias.explanation}
                </p>
              </div>
            </div>
          </div>

          {/* Hidden Context */}
          <div className="p-4 bg-geo-gold/5">
            <h4 className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Eye className="w-3 h-3" /> Hidden Geopolitical Context
            </h4>
            <p className="text-xs text-gray-300 italic leading-relaxed border-l-2 border-yellow-500/50 pl-3">
              &ldquo;{result.hidden_context}&rdquo;
            </p>
          </div>

          <div className="p-2 flex justify-end">
            <button
              onClick={analyzeContent}
              className="text-[10px] text-gray-600 hover:text-gray-400 uppercase tracking-wider transition-colors"
            >
              Re-calibrate Intelligence
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
