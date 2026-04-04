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
    const { email, setEmail, status, message, handleSubscribe } = useNewsletter()

    return (
        <main className="min-h-screen bg-gradient-to-br from-geo-dark via-black to-geo-dark text-white">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                </div>

                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-24">
                    <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-geo-gold transition-colors mb-12">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>

                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left - Content */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full border border-green-500/30 mb-6">
                                <Clock className="w-4 h-4 text-green-400" />
                                <span className="text-green-400 text-sm font-medium">Coming Soon</span>
                            </div>

                            <h1 className="text-5xl md:text-6xl font-bold mb-6">
                                <span className="text-geo-gold">Analytics</span>
                                <br />
                                Dashboard
                            </h1>

                            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                                Your real-time global macro monitor. Monitor commodities, currencies, rare earths,
                                and economic indicators—all in one powerful dashboard.
                            </p>

                            {/* Stats Preview */}
                            <div className="grid grid-cols-3 gap-4 mb-8">
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <div className="text-2xl font-bold text-geo-gold">50+</div>
                                    <div className="text-sm text-gray-400">Countries</div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <div className="text-2xl font-bold text-geo-gold">200+</div>
                                    <div className="text-sm text-gray-400">Data Points</div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <div className="text-2xl font-bold text-geo-gold">24/7</div>
                                    <div className="text-sm text-gray-400">Updates</div>
                                </div>
                            </div>

                            {/* Waitlist */}
                            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email for early access"
                                    disabled={status === 'loading' || status === 'success'}
                                    className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-geo-gold disabled:opacity-50"
                                />
                                <button
                                    type="submit"
                                    disabled={status === 'loading' || status === 'success'}
                                    className="px-6 py-3 bg-gradient-to-r from-geo-gold to-yellow-600 text-black font-bold rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Bell className="w-4 h-4" />
                                    {status === 'loading' ? 'Joining...' : status === 'success' ? 'Joined!' : 'Join Waitlist'}
                                </button>
                            </form>
                            {message && (
                                <div className={`text-sm mt-3 ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                    {message}
                                </div>
                            )}
                        </motion.div>

                        {/* Right - Dashboard Mockup */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="relative"
                        >
                            {/* Dashboard Frame */}
                            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-4 border border-white/10 shadow-2xl">
                                {/* Top Bar */}
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                    <div className="flex-1 text-center text-xs text-gray-500">analytics.geomoney.tv</div>
                                </div>

                                {/* Dashboard Content */}
                                <div className="bg-geo-dark rounded-lg p-4 space-y-4">
                                    {/* Header Row */}
                                    <div className="flex justify-between items-center">
                                        <div className="text-geo-gold font-bold">Global Dashboard</div>
                                        <div className="flex gap-2">
                                            <div className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">LIVE</div>
                                        </div>
                                    </div>

                                    {/* Chart Area */}
                                    <div className="h-40 bg-white/5 rounded-lg flex items-end justify-around p-4 gap-1">
                                        {[40, 65, 45, 80, 55, 70, 50, 85, 60, 75, 55, 90].map((height, i) => (
                                            <div
                                                key={i}
                                                className="w-full bg-gradient-to-t from-geo-gold/50 to-geo-gold rounded-t"
                                                style={{ height: `${height}%` }}
                                            />
                                        ))}
                                    </div>

                                    {/* Stats Row */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-white/5 rounded-lg p-3">
                                            <div className="text-xs text-gray-400">Gold</div>
                                            <div className="font-bold text-white">$2,715</div>
                                            <div className="text-xs text-green-400">+1.2%</div>
                                        </div>
                                        <div className="bg-white/5 rounded-lg p-3">
                                            <div className="text-xs text-gray-400">Oil</div>
                                            <div className="font-bold text-white">$72.50</div>
                                            <div className="text-xs text-red-400">-0.8%</div>
                                        </div>
                                        <div className="bg-white/5 rounded-lg p-3">
                                            <div className="text-xs text-gray-400">Copper</div>
                                            <div className="font-bold text-white">$4.15</div>
                                            <div className="text-xs text-green-400">+2.3%</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative glow */}
                            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-500/5 rounded-full blur-3xl" />
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <section className="border-t border-white/10 py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl font-bold mb-4">
                            Everything You Need to <span className="text-geo-gold">Understand Market Dynamics</span>
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {DASHBOARD_FEATURES.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                viewport={{ once: true }}
                                className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-geo-gold/30 transition-all group"
                            >
                                <feature.icon className={`w-10 h-10 ${feature.color} mb-4 group-hover:scale-110 transition-transform`} />
                                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                                <p className="text-gray-400 text-sm">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="border-t border-white/10 py-16 bg-gradient-to-b from-transparent to-blue-500/5">
                <div className="mx-auto max-w-3xl px-4 text-center">
                    <h3 className="text-2xl font-bold mb-4">Be the First to Experience It</h3>
                    <p className="text-gray-400 mb-6">
                        Join the waitlist and get priority access when we launch.
                    </p>
                    <div className="inline-flex items-center gap-4 text-geo-gold">
                        <TrendingUp className="w-6 h-6" />
                        <span className="font-medium">Coming Soon</span>
                    </div>
                </div>
            </section>
        </main>
    )
}
