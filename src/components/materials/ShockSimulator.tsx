'use client'

import { useState } from 'react'
import { FlaskConical, Loader2, Play } from 'lucide-react'
import { signed } from './intel-types'

const SHOCK_TYPES = [
  { value: 'export_restriction', label: 'Export restriction' },
  { value: 'mine_outage', label: 'Mine outage' },
  { value: 'refinery_outage', label: 'Refinery outage' },
  { value: 'sanctions', label: 'Sanctions' },
  { value: 'logistics_disruption', label: 'Logistics disruption' },
  { value: 'demand_surge', label: 'Demand surge' },
  { value: 'new_capacity', label: 'New capacity' },
]

const MAGNITUDES = [10, 25, 50, 75, 100]
const DURATIONS = [
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 365, label: '1 year' },
]

export interface SimulationResult {
  material: { name: string; symbol: string }
  shockSummary: string
  supplyImpact: { removedShareRange: [number, number]; direction: string; basis: string; confidence: string }
  affectedStages: string[]
  topApplications: { name: string; dependence: string; exposure: string; confidence: string }[]
  geographicExposure: { country: string; stage: string; sharePct: number | null; confidence: string }[]
  mitigationRoutes: string[]
  priceDirection: { direction: string; qualitativeMagnitude: string; note: string }
  pulseEffect: { component: string; illustrativeDelta: number; label: string }
  timeHorizon: { label: string; durationDays: number }
  confidence: string
  assumptions: string[]
}

// C7 — Shock Propagation Simulation (constrained MVP): "what if this
// worsens?" with visible assumptions, ranges and per-component confidence.
export default function ShockSimulator({ symbol, materialName }: { symbol: string; materialName: string }) {
  const [shockType, setShockType] = useState('export_restriction')
  const [magnitudePct, setMagnitudePct] = useState(50)
  const [durationDays, setDurationDays] = useState(90)
  const [geography, setGeography] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SimulationResult | null>(null)

  const run = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/materials/${encodeURIComponent(symbol)}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shockType, magnitudePct, durationDays, geography: geography || null, note: note || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Simulation failed')
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed')
    } finally {
      setLoading(false)
    }
  }

  const selectClass = 'w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-geo-gold/50 focus:outline-none'

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-6">
      <div className="flex items-center gap-3 mb-1">
        <FlaskConical className="w-5 h-5 text-geo-gold" />
        <h2 className="text-xl font-bold">Simulate Disruption</h2>
      </div>
      <p className="text-xs text-gray-500 mb-5">
        Constrained what-if analysis for {materialName}. Outputs are ranges and directional effects with visible assumptions — never false precision.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <label className="block">
          <span className="text-xs text-gray-400 block mb-1">Shock type</span>
          <select value={shockType} onChange={(e) => setShockType(e.target.value)} className={selectClass}>
            {SHOCK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-gray-400 block mb-1">Magnitude</span>
          <select value={magnitudePct} onChange={(e) => setMagnitudePct(Number(e.target.value))} className={selectClass}>
            {MAGNITUDES.map((m) => <option key={m} value={m}>{m}% of affected supply/capacity</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-gray-400 block mb-1">Duration</span>
          <select value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value))} className={selectClass}>
            {DURATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-gray-400 block mb-1">Geography (optional)</span>
          <input value={geography} onChange={(e) => setGeography(e.target.value)} placeholder="e.g. China" className={selectClass} />
        </label>
      </div>

      <label className="block mt-3">
        <span className="text-xs text-gray-400 block mb-1">Analyst note (optional)</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Scenario interpretation note" className={selectClass} />
      </label>

      <button
        onClick={run}
        disabled={loading}
        className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-geo-gold to-yellow-600 text-black font-bold text-sm hover:from-yellow-500 hover:to-yellow-700 transition-all disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
        {loading ? 'Simulating…' : 'Run simulation'}
      </button>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      {result && <SimulationResultView result={result} />}
    </div>
  )

function ConfidenceBadge({ value }: { value: string }) {
  const color = value === 'high' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : value === 'medium' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-gray-500/15 text-gray-400 border-gray-500/30'
  return <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${color}`}>{value} confidence</span>
}

function SimulationResultView({ result }: { result: SimulationResult }) {
  const supplyDown = result.supplyImpact.direction === 'supply_down'
  return (
    <div className="mt-6 pt-5 border-t border-white/10 space-y-5">
      {/* Shock summary */}
      <div className="bg-geo-gold/5 border border-geo-gold/20 rounded-lg p-4">
        <p className="text-[10px] uppercase tracking-wide text-geo-gold font-semibold mb-1">Shock summary</p>
        <p className="text-sm text-gray-200 leading-relaxed">{result.shockSummary}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Supply impact */}
        <div className="bg-black/30 rounded-lg border border-white/10 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-300">Supply impact</p>
            <ConfidenceBadge value={result.supplyImpact.confidence} />
          </div>
          <p className="text-2xl font-black text-white">
            {result.supplyImpact.direction === 'demand_up' ? 'Demand-led' : `${result.supplyImpact.removedShareRange[0]}–${result.supplyImpact.removedShareRange[1]}%`}
            {result.supplyImpact.direction !== 'demand_up' && (
              <span className="text-sm font-normal text-gray-400"> {supplyDown ? 'of global supply at risk' : 'added availability'}</span>
            )}
          </p>
          <p className="mt-2 text-xs text-gray-500 leading-relaxed">{result.supplyImpact.basis}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {result.affectedStages.map((stage) => (
              <span key={stage} className="px-2 py-0.5 rounded bg-white/10 text-[10px] text-gray-300 capitalize">{stage}</span>
            ))}
          </div>
        </div>

        {/* Price + pulse effect */}
        <div className="bg-black/30 rounded-lg border border-white/10 p-4">
          <p className="text-xs font-semibold text-gray-300 mb-2">Directional effects</p>
          <p className="text-sm text-gray-200">
            Price pressure: <span className={`font-bold ${result.priceDirection.direction === 'upward' ? 'text-red-400' : result.priceDirection.direction === 'downward' ? 'text-emerald-400' : 'text-gray-300'}`}>{result.priceDirection.direction}</span>
            <span className="text-gray-500"> ({result.priceDirection.qualitativeMagnitude})</span>
          </p>
          <p className="mt-1.5 text-sm text-gray-200">
            Illustrative Risk Pulse effect:{' '}
            <span className={`font-bold ${result.pulseEffect.illustrativeDelta > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {signed(result.pulseEffect.illustrativeDelta)}
            </span>{' '}
            <span className="text-gray-500">on {result.pulseEffect.component}</span>
          </p>
          <p className="mt-1.5 text-sm text-gray-200">Time horizon: <span className="text-gray-300">{result.timeHorizon.label}</span></p>
          <p className="mt-2 text-[11px] text-gray-500 leading-relaxed">{result.priceDirection.note}</p>
        </div>
      </div>

      {/* Applications */}
      {result.topApplications.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-300 mb-2">Application exposure (ranked by dependence)</p>
          <div className="space-y-1.5">
            {result.topApplications.map((app) => (
              <div key={app.name} className="flex items-center justify-between text-xs bg-black/30 rounded-lg px-3 py-2">
                <span className="text-gray-200">{app.name}</span>
                <span className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-gray-500 capitalize">{app.dependence}</span>
                  <span className={`font-semibold capitalize ${app.exposure === 'high' ? 'text-red-400' : app.exposure === 'moderate' ? 'text-amber-400' : 'text-emerald-400'}`}>{app.exposure}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}


      <div className="grid md:grid-cols-2 gap-4">
        {/* Geographic exposure */}
        {result.geographicExposure.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-300 mb-2">Geographic exposure</p>
            <div className="space-y-1.5">
              {result.geographicExposure.map((geo) => (
                <div key={`${geo.country}-${geo.stage}`} className="flex items-center justify-between text-xs bg-black/30 rounded-lg px-3 py-2">
                  <span className="text-gray-200">{geo.country} <span className="text-gray-500 capitalize">· {geo.stage}</span></span>
                  <span className="flex items-center gap-2">
                    {geo.sharePct != null && <span className="text-geo-gold">{geo.sharePct}%</span>}
                    <ConfidenceBadge value={geo.confidence} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mitigation */}
        <div>
          <p className="text-xs font-semibold text-gray-300 mb-2">Mitigation routes</p>
          <ul className="space-y-1.5 list-disc list-inside text-xs text-gray-300">
            {result.mitigationRoutes.map((route, idx) => <li key={idx}>{route}</li>)}
          </ul>
        </div>
      </div>

      {/* Assumptions — always visible per the guardrails */}
      <div className="bg-black/40 rounded-lg border border-white/10 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-300">Scenario assumptions (always visible)</p>
          <ConfidenceBadge value={result.confidence} />
        </div>
        <ul className="space-y-1 list-disc list-inside text-[11px] text-gray-500">
          {result.assumptions.map((assumption, idx) => <li key={idx}>{assumption}</li>)}
        </ul>
      </div>
    </div>
  )
}

}
