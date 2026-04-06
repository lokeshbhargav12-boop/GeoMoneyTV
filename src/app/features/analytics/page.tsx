'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  ArrowLeft, Activity, Globe, Brain, TrendingUp, TrendingDown,
  Minus, RefreshCw, AlertCircle, BarChart3, DollarSign,
} from 'lucide-react'

const TradingViewChart = dynamic(() => import('@/components/TradingViewChart'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-white/5 rounded-xl border border-white/10">
      <div className="flex flex-col items-center gap-3">
        <div className="w-7 h-7 border-2 border-geo-gold/40 border-t-geo-gold rounded-full animate-spin" />
        <span className="text-gray-500 text-sm">Loading chart…</span>
      </div>
    </div>
  ),
})

const TradingViewMiniChart = dynamic(
  () => import('@/components/TradingViewMiniChart'),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-white/5 rounded-lg" /> },
)

const TradingViewMarketQuotes = dynamic(
  () => import('@/components/TradingViewMarketQuotes'),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-white/5 rounded-lg" /> },
)

// ── Types ──────────────────────────────────────────────────────────────────────
interface SentimentData {
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  trend_strength: number
  structure: string
  signal: string
  bias_score: number
  key_resistance: string[]
  key_support: string[]
  macro_drivers: string[]
  analysis: string
  risk_factors: string[]
  instrumentName: string
  timestamp: string
}

// ── Instruments ────────────────────────────────────────────────────────────────
const INSTRUMENTS = [
  {
    id: 'gold', label: 'GOLD', symbol: 'XAUUSD', name: 'Gold Spot',
    color: '#D4AF37', lineColor: 'rgba(212,175,55,1)', bgColor: 'rgba(212,175,55,0.12)',
  },
  {
    id: 'wti', label: 'WTI OIL', symbol: 'TVC:USOIL', name: 'WTI Crude Oil',
    color: '#ff6b35', lineColor: 'rgba(255,107,53,1)', bgColor: 'rgba(255,107,53,0.12)',
  },
  {
    id: 'copper', label: 'COPPER', symbol: 'COMEX:HG1!', name: 'Copper',
    color: '#cd7f32', lineColor: 'rgba(205,127,50,1)', bgColor: 'rgba(205,127,50,0.12)',
  },
  {
    id: 'dxy', label: 'USD / DXY', symbol: 'TVC:DXY', name: 'US Dollar Index',
    color: '#4dabf7', lineColor: 'rgba(77,171,247,1)', bgColor: 'rgba(77,171,247,0.12)',
  },
  {
    id: 'spx', label: 'S&P 500', symbol: 'CAPITALCOM:US500', name: 'S&P 500',
    color: '#51cf66', lineColor: 'rgba(81,207,102,1)', bgColor: 'rgba(81,207,102,0.12)',
  },
  {
    id: 'natgas', label: 'NAT GAS', symbol: 'NYMEX:NG1!', name: 'Natural Gas',
    color: '#ff85c2', lineColor: 'rgba(255,133,194,1)', bgColor: 'rgba(255,133,194,0.12)',
  },
  {
    id: 'silver', label: 'SILVER', symbol: 'COMEX:SI1!', name: 'Silver',
    color: '#c8d6e5', lineColor: 'rgba(200,214,229,1)', bgColor: 'rgba(200,214,229,0.12)',
  },
  {
    id: 'us10y', label: 'US 10Y', symbol: 'TVC:US10Y', name: '10Y Treasury',
    color: '#a29bfe', lineColor: 'rgba(162,155,254,1)', bgColor: 'rgba(162,155,254,0.12)',
  },
] as const

const CAPITAL_FLOW = [
  {
    symbol: 'TVC:DXY', label: 'Dollar Index (DXY)',
    desc: 'Measures USD strength globally. A rising DXY typically compresses commodity prices.',
    color: '#4dabf7', lineColor: 'rgba(77,171,247,1)', bgColor: 'rgba(77,171,247,0.12)',
  },
  {
    symbol: 'XAUUSD', label: 'Gold / Safe Haven',
    desc: 'Barometer of real-value demand and geopolitical risk. Flows in during uncertainty.',
    color: '#D4AF37', lineColor: 'rgba(212,175,55,1)', bgColor: 'rgba(212,175,55,0.12)',
  },
  {
    symbol: 'TVC:US10Y', label: '10-Year Treasury Yield',
    desc: 'Global risk-free rate benchmark. Rising yields signal risk-off, pressuring commodities.',
    color: '#a29bfe', lineColor: 'rgba(162,155,254,1)', bgColor: 'rgba(162,155,254,0.12)',
  },
]

export default function AnalyticsDashboardPage() {
  const [selectedId, setSelectedId] = useState<string>('gold')
  const [sentimentCache, setSentimentCache] = useState<Record<string, SentimentData>>({})
  const [sentimentLoading, setSentimentLoading] = useState(false)
  const [sentimentError, setSentimentError] = useState<string | null>(null)

  const selected = INSTRUMENTS.find(i => i.id === selectedId) ?? INSTRUMENTS[0]
  const sentiment: SentimentData | undefined = sentimentCache[selected.symbol]

  const fetchSentiment = useCallback(
    async (symbol: string, forceRefresh = false) => {
      if (!forceRefresh && sentimentCache[symbol]) return
      setSentimentLoading(true)
      setSentimentError(null)
      try {
        const res = await fetch('/api/ai/market-sentiment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol }),
        })
        if (!res.ok) throw new Error(`API error ${res.status}`)
        const data: SentimentData = await res.json()
        setSentimentCache(prev => ({ ...prev, [symbol]: data }))
      } catch {
        setSentimentError('Unable to load market intelligence. Please try again.')
      } finally {
        setSentimentLoading(false)
      }
    },
    [sentimentCache],
  )

  const handleRefresh = useCallback(() => {
    setSentimentCache(prev => {
      const next = { ...prev }
      delete next[selected.symbol]
      return next
    })
    fetchSentiment(selected.symbol, true)
  }, [selected.symbol, fetchSentiment])

  // Auto-fetch when the selected instrument changes
  useEffect(() => {
    fetchSentiment(selected.symbol)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected.symbol])

  const trendColor =
    sentiment?.trend === 'BULLISH' ? '#51cf66' :
    sentiment?.trend === 'BEARISH' ? '#ff6b6b' :
    sentiment ? '#f59f00' : '#888888'

  const trendBg =
    sentiment?.trend === 'BULLISH' ? 'bg-green-950/30' :
    sentiment?.trend === 'BEARISH' ? 'bg-red-950/30' :
    sentiment ? 'bg-yellow-950/30' : 'bg-white/5'

  const trendBorder =
    sentiment?.trend === 'BULLISH' ? 'border-green-500/30' :
    sentiment?.trend === 'BEARISH' ? 'border-red-500/30' :
    sentiment ? 'border-yellow-500/30' : 'border-white/10'

  const trendLabel =
    sentiment?.trend === 'BULLISH' ? 'BOS ↑' :
    sentiment?.trend === 'BEARISH' ? 'BOS ↓' :
    sentiment ? 'ChoCH' : '—'

  const TrendIcon =
    sentiment?.trend === 'BULLISH' ? TrendingUp :
    sentiment?.trend === 'BEARISH' ? TrendingDown :
    Minus

  return (
    <main className="min-h-screen bg-geo-dark text-white pt-32">

      {/* ── Dashboard Header (sticky below navbar) ─────────────────── */}
      <div className="sticky z-20 border-b border-white/10 bg-black/60 backdrop-blur-xl" style={{ top: '128px' }}>
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 pt-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-500 hover:text-geo-gold transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <BarChart3 className="w-5 h-5 text-geo-gold" />
            <div>
              <h1 className="text-sm font-bold text-white">GeoMoney Analytics</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Live Global Macro Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/30 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-400 text-xs font-medium">LIVE</span>
            </div>
            <span className="text-xs text-gray-600 hidden md:block">Powered by TradingView · AI by GeoMoney</span>
          </div>
        </div>

        {/* Instrument Tabs */}
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 mt-1">
          <div className="flex overflow-x-auto gap-0 pb-0" style={{ scrollbarWidth: 'none' }}>
            {INSTRUMENTS.map(inst => (
              <button
                key={inst.id}
                onClick={() => setSelectedId(inst.id)}
                className={`flex-none px-4 py-2.5 text-xs font-bold tracking-wide border-b-2 transition-all whitespace-nowrap ${
                  selectedId === inst.id ? '' : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
                style={
                  selectedId === inst.id
                    ? { borderBottomColor: inst.color, color: inst.color }
                    : {}
                }
              >
                {inst.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Page content ───────────────────────────────────────────── */}
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 pt-6 pb-16 space-y-10">

        {/* ── Section 1: Main Chart + Macro Quotes ─────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4" style={{ height: '580px' }}>

          {/* Main TradingView Advanced Chart */}
          <div className="xl:col-span-3 rounded-xl border border-white/10 overflow-hidden bg-white/5" style={{ height: '580px' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={selected.symbol}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <TradingViewChart symbol={selected.symbol} interval="D" height={580} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Macro Market Quotes (correlation panel) */}
          <div className="xl:col-span-1 rounded-xl border border-white/10 overflow-hidden bg-white/5 flex flex-col" style={{ height: '580px' }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 flex-none">
              <Globe className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-white">Macro Markets</span>
              <span className="ml-auto text-xs text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                Live
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              <TradingViewMarketQuotes height={532} />
            </div>
          </div>
        </div>

        {/* ── Section 2: Market Intelligence (SMC / Pine Script style) ─ */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Brain className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-bold text-white">Market Intelligence</h2>
              <span className="px-2.5 py-0.5 bg-purple-500/15 text-purple-400 text-xs rounded-full border border-purple-500/25 font-medium">
                AI-POWERED
              </span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={sentimentLoading}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-400 hover:text-white transition-all disabled:opacity-40"
            >
              <RefreshCw className={`w-3 h-3 ${sentimentLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Instrument label */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selected.color }} />
            <span className="text-sm text-gray-400">Analysing:</span>
            <span className="text-sm font-bold" style={{ color: selected.color }}>{selected.name}</span>
          </div>

          {/* Loading state */}
          {sentimentLoading && (
            <div className="grid md:grid-cols-3 gap-4">
              {[0, 1, 2].map(i => (
                <div key={i} className="h-52 bg-white/5 rounded-xl border border-white/10 animate-pulse" />
              ))}
            </div>
          )}

          {/* Error state */}
          {sentimentError && !sentimentLoading && (
            <div className="flex items-center gap-3 p-4 bg-red-950/20 border border-red-500/30 rounded-xl text-red-400">
              <AlertCircle className="w-5 h-5 flex-none" />
              <span className="text-sm">{sentimentError}</span>
              <button onClick={handleRefresh} className="ml-auto text-xs underline hover:no-underline">
                Retry
              </button>
            </div>
          )}

          {/* Analysis cards */}
          {sentiment && !sentimentLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              {/* Row 1 — 3 cards */}
              <div className="grid md:grid-cols-3 gap-4">

                {/* Card A: Macro Structure (BOS-style indicator) */}
                <div className={`relative rounded-xl border ${trendBorder} ${trendBg} p-5 overflow-hidden`}>
                  {/* Accent bar at top */}
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: trendColor }}
                  />
                  <div className="text-xs text-gray-500 font-mono tracking-widest mb-3 uppercase">
                    Macro Structure
                  </div>

                  {/* Big BOS label */}
                  <div className="flex items-center gap-3 mb-1">
                    <TrendIcon className="w-8 h-8" style={{ color: trendColor }} />
                    <span className="text-3xl font-black tracking-tight" style={{ color: trendColor }}>
                      {trendLabel}
                    </span>
                  </div>

                  <div className="text-base font-bold mb-1" style={{ color: trendColor }}>
                    {sentiment.trend}
                  </div>
                  <div className="text-xs text-gray-400 mb-4">{sentiment.structure}</div>

                  {/* Trend strength meter */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Trend Strength</span>
                      <span style={{ color: trendColor }}>{sentiment.trend_strength}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${sentiment.trend_strength}%`, backgroundColor: trendColor }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-gray-300 italic border-t border-white/10 pt-3">
                    &ldquo;{sentiment.signal}&rdquo;
                  </div>
                </div>

                {/* Card B: Key Price Zones (demand/supply) */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <div className="text-xs text-gray-500 font-mono tracking-widest mb-4 uppercase">
                    Key Price Zones
                  </div>

                  {/* Supply zones */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-sm bg-red-500" />
                      <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">Supply Zones</span>
                    </div>
                    {sentiment.key_resistance.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 mb-1.5">
                        <div className="w-1 h-3.5 rounded bg-red-500/50 flex-none mt-0.5" />
                        <span className="text-xs text-red-300 leading-snug">{r}</span>
                      </div>
                    ))}
                  </div>

                  {/* Demand zones */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-sm bg-green-500" />
                      <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">Demand Zones</span>
                    </div>
                    {sentiment.key_support.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 mb-1.5">
                        <div className="w-1 h-3.5 rounded bg-green-500/50 flex-none mt-0.5" />
                        <span className="text-xs text-green-300 leading-snug">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card C: Macro Drivers + Bias Score */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <div className="text-xs text-gray-500 font-mono tracking-widest mb-4 uppercase">
                    Macro Drivers
                  </div>
                  <div className="space-y-2.5 mb-4">
                    {sentiment.macro_drivers.map((driver, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-none"
                          style={{ backgroundColor: `${selected.color}25`, color: selected.color }}
                        >
                          {i + 1}
                        </div>
                        <span className="text-sm text-gray-300 leading-snug">{driver}</span>
                      </div>
                    ))}
                  </div>

                  {/* Bias score */}
                  <div className="border-t border-white/10 pt-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-red-400">Bearish</span>
                      <span className="text-gray-500">Macro Bias</span>
                      <span className="text-green-400">Bullish</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden relative">
                      <div className="absolute inset-0 flex justify-center">
                        <div className="w-px h-full bg-white/20" />
                      </div>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.abs(sentiment.bias_score) / 2}%`,
                          marginLeft: sentiment.bias_score >= 0 ? '50%' : `${50 - Math.abs(sentiment.bias_score) / 2}%`,
                        }}
                        transition={{ duration: 0.8 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: sentiment.bias_score >= 0 ? '#51cf66' : '#ff6b6b' }}
                      />
                    </div>
                    <div
                      className="text-center text-xs mt-1 font-bold"
                      style={{ color: sentiment.bias_score >= 0 ? '#51cf66' : '#ff6b6b' }}
                    >
                      {sentiment.bias_score > 0 ? '+' : ''}{sentiment.bias_score}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2 — full analysis + risk factors */}
              <div className="grid md:grid-cols-3 gap-4">

                {/* GeoMoney AI Analysis (2/3) */}
                <div className="md:col-span-2 rounded-xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-gray-500 font-mono tracking-widest uppercase">
                      GeoMoney AI Analysis
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{sentiment.analysis}</p>
                  {sentiment.timestamp && (
                    <div className="mt-3 text-xs text-gray-600">
                      Generated: {new Date(sentiment.timestamp).toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Risk Factors (1/3) */}
                <div className="rounded-xl border border-yellow-500/20 bg-yellow-950/10 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs text-gray-500 font-mono tracking-widest uppercase">
                      Risk Factors
                    </span>
                  </div>
                  <div className="space-y-3">
                    {sentiment.risk_factors.map((risk, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-none mt-1.5" />
                        <span className="text-sm text-yellow-200/80 leading-snug">{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </section>

        {/* ── Section 3: Global Macro View (mini charts grid) ────────── */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <Globe className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Global Macro View</h2>
            <span className="text-xs text-gray-500">Track economic indicators across 50+ markets</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {INSTRUMENTS.map(inst => (
              <div
                key={inst.id}
                onClick={() => setSelectedId(inst.id)}
                role="button"
                className="rounded-xl border overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                style={{
                  borderColor: selectedId === inst.id ? inst.color : 'rgba(255,255,255,0.10)',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  boxShadow: selectedId === inst.id ? `0 0 16px ${inst.color}30` : 'none',
                }}
              >
                <div className="px-3 pt-2.5 pb-0 flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ color: inst.color }}>{inst.label}</span>
                  <span className="text-xs text-gray-600">{inst.name}</span>
                </div>
                <TradingViewMiniChart
                  symbol={inst.symbol}
                  height={140}
                  dateRange="1M"
                  trendLineColor={inst.lineColor}
                  underLineColor={inst.bgColor}
                />
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 4: Capital Flow Intelligence ───────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <DollarSign className="w-5 h-5 text-geo-gold" />
            <h2 className="text-lg font-bold text-white">Capital Flow Intelligence</h2>
            <span className="text-xs text-gray-500">Key macro flow indicators</span>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {CAPITAL_FLOW.map(inst => (
              <div
                key={inst.symbol}
                className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
              >
                <div className="px-4 pt-4 pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: inst.color }} />
                    <span className="text-sm font-bold" style={{ color: inst.color }}>{inst.label}</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-snug">{inst.desc}</p>
                </div>
                <TradingViewMiniChart
                  symbol={inst.symbol}
                  height={150}
                  dateRange="3M"
                  trendLineColor={inst.lineColor}
                  underLineColor={inst.bgColor}
                />
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer disclaimer ──────────────────────────────────────── */}
        <div className="border-t border-white/10 pt-6 text-center">
          <p className="text-xs text-gray-600 leading-relaxed">
            Charts powered by{' '}
            <a
              href="https://www.tradingview.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-400 underline"
            >
              TradingView
            </a>
            {' '}· AI market analysis generated by GeoMoney Intelligence Engine ·{' '}
            For informational purposes only. Not financial advice.
          </p>
        </div>
      </div>
    </main>
  )
}
