'use client'

import { Activity, ChevronDown, ChevronUp, Gauge } from 'lucide-react'
import { useState } from 'react'
import { pulseColor, signed, type IntelPulse } from './intel-types'

const COMPONENTS = [
  { key: 'supplyRisk', label: 'Supply Risk' },
  { key: 'policyRisk', label: 'Policy Risk' },
  { key: 'demandPressure', label: 'Demand Pressure' },
  { key: 'marketStress', label: 'Market Stress' },
  { key: 'supplyResponse', label: 'Supply Response', mitigating: true },
] as const

// C4 — GeoMoney Material Risk Pulse: 0–100 score, five explainable
// components, "why did this move?" contributions and 90-day trend.
export default function RiskPulseCard({ pulse, history }: { pulse: IntelPulse; history: { asOf: string; score: number }[] }) {
  const [showWhy, setShowWhy] = useState(false)
  const previous = history.length >= 2 ? history[history.length - 2].score : null
  const delta = previous != null ? pulse.score - previous : null

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-6">
      <div className="flex items-center gap-3 mb-5">
        <Gauge className="w-5 h-5 text-geo-gold" />
        <h2 className="text-xl font-bold">GeoMoney Risk Pulse</h2>
        <span className="ml-auto text-[10px] text-gray-500 uppercase tracking-wide">deterministic · explainable</span>
      </div>

      <div className="flex items-center gap-6 flex-wrap">
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke={pulse.score >= 75 ? '#f87171' : pulse.score >= 55 ? '#fb923c' : pulse.score >= 40 ? '#fbbf24' : '#34d399'}
              strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${(pulse.score / 100) * 263.9} 263.9`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-black ${pulseColor(pulse.score)}`}>{pulse.score}</span>
            {delta != null && (
              <span className={`text-xs font-semibold ${delta > 0 ? 'text-red-400' : delta < 0 ? 'text-emerald-400' : 'text-gray-500'}`}>
                {signed(delta)} today
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-[220px] space-y-2.5">
          {COMPONENTS.map(({ key, label, ...rest }) => {
            const value = pulse[key]
            const mitigating = 'mitigating' in rest
            return (
              <div key={key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">{label}{mitigating && <span className="text-gray-600"> (mitigating)</span>}</span>
                  <span className="text-gray-200 font-semibold">{value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${mitigating ? 'bg-sky-400' : value >= 60 ? 'bg-red-400' : value >= 40 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {history.length > 1 && (
          <div className="w-full sm:w-40">
            <p className="text-xs text-gray-500 mb-1">90-day trend</p>
            <Sparkline points={history.map((h) => h.score)} />
          </div>
        )}
      </div>

      {pulse.contributions.length > 0 && (
        <div className="mt-5 pt-4 border-t border-white/10">
          <button onClick={() => setShowWhy((v) => !v)} className="flex items-center gap-2 text-sm font-semibold text-geo-gold hover:text-yellow-400 transition-colors">
            <Activity className="w-4 h-4" /> Why did this move?
            {showWhy ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showWhy && (
            <ul className="mt-3 space-y-1.5">
              {pulse.contributions.map((c, idx) => (
                <li key={idx} className="flex items-center justify-between text-xs bg-black/30 rounded-lg px-3 py-2">
                  <span className="text-gray-300 truncate mr-3">{c.label}</span>
                  <span className={`font-semibold flex-shrink-0 ${c.delta >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>{signed(c.delta)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-[11px] text-gray-500">
            Scores are generated only from structured data and documented rules — every movement is traceable to an event contribution.
          </p>
        </div>
      )}
    </div>
  )
}

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null
  const max = Math.max(...points, 1)
  const min = Math.min(...points, 0)
  const range = Math.max(max - min, 1)
  const coords = points.map((p, i) => `${(i / (points.length - 1)) * 100},${30 - ((p - min) / range) * 28}`).join(' ')
  return (
    <svg viewBox="0 0 100 32" className="w-full h-8" preserveAspectRatio="none">
      <polyline points={coords} fill="none" stroke="#d4af37" strokeWidth="1.5" />
    </svg>
  )
}
