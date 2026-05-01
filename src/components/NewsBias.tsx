'use client';

import { useState } from 'react';
import { Loader2, Info } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface NewsBiasProps {
  title: string;
  text?: string;
  className?: string;
}

interface BiasResult {
  score: number;
  category: string;
  confidence: number;
  explanation: string;
}

export default function NewsBias({ title, text, className }: NewsBiasProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BiasResult | null>(null);
  const [error, setError] = useState('');

  const analyzeBias = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/ai/bias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, text }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze bias');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Could not analyze bias at this time.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to determining position on the bar (0% to 100%)
  // Score is -100 (Left) to 100 (Right)
  // Map -100 -> 0, 0 -> 50, 100 -> 100
  const getPosition = (score: number) => {
    return ((score + 100) / 200) * 100;
  };

  const getBiasColor = (score: number) => {
    if (score < -30) return 'text-blue-500'; // Left
    if (score > 30) return 'text-red-500';   // Right
    return 'text-gray-400';                  // Center
  };

  const getBiasBg = (score: number) => {
    if (score < -30) return 'bg-blue-500';
    if (score > 30) return 'bg-red-500';
    return 'bg-gray-400';
  };

  return (
    <div className={twMerge("bg-black/20 border border-white/10 rounded-xl p-4 backdrop-blur-sm", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="bg-gradient-to-r from-blue-400 via-white to-red-400 bg-clip-text text-transparent">
            AI Bias Check
          </span>
          <Info className="w-4 h-4 text-gray-500" />
        </h3>
        
        {!result && !loading && (
          <button
            onClick={analyzeBias}
            className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors font-medium border border-white/10"
          >
            Analyze Bias
          </button>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-6 text-gray-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-geo-gold" />
          <span className="text-xs">Analyzing content patterns...</span>
        </div>
      )}

      {error && (
        <div className="text-red-400 text-sm py-2 text-center bg-red-400/10 rounded-lg">
          {error}
        </div>
      )}

      {result && (
        <div className="animate-fade-in-up">
          {/* Bias Bar */}
          <div className="relative h-4 bg-gray-800 rounded-full mb-6 overflow-hidden border border-white/5">
            {/* Background Gradients */}
            <div className="absolute inset-0 flex opacity-30">
              <div className="w-1/3 bg-gradient-to-r from-blue-900 to-transparent" />
              <div className="w-1/3" />
              <div className="w-1/3 bg-gradient-to-l from-red-900 to-transparent" />
            </div>

            {/* Labels */}
            <div className="absolute top-0 w-full h-full flex justify-between px-3 items-center text-[10px] font-bold tracking-wider text-gray-500 pointer-events-none">
              <span>LEFT</span>
              <span>CENTER</span>
              <span>RIGHT</span>
            </div>

            {/* Indicator */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_2px_rgba(255,255,255,0.5)] transition-all duration-1000 ease-out z-10"
              style={{ left: `${getPosition(result.score)}%` }}
            />
          </div>

          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <div className={clsx("text-xl font-bold mb-1", getBiasColor(result.score))}>
                {result.category}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
                Assessment Strength: {result.confidence}%
              </div>
            </div>
            
            <div className="text-2xl font-black text-white/10">
              {Math.abs(result.score)}
            </div>
          </div>

          <p className="text-sm text-gray-300 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
            {result.explanation}
          </p>
          
          <div className="mt-3 flex justify-end">
            <button 
              onClick={analyzeBias} 
              className="text-xs text-gray-500 hover:text-white transition-colors"
            >
              Re-analyze
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
