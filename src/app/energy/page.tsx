'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
    ArrowLeft, Sun, Wind, Droplets, Atom, Flame, Zap,
    Calculator, Leaf, BrainCircuit, Globe2, TrendingUp,
    TrendingDown, Battery, Shield, Sparkles, Loader2,
    ArrowRight, BarChart3, Factory, Landmark, ChevronRight
} from 'lucide-react'

// ─── GLOBAL ENERGY MIX DATA ──────────────────────────────────
const ENERGY_SOURCES = [
    { name: 'Solar', icon: Sun, capacity: '1,419 GW', growth: '+26.1%', status: 'Accelerating', color: 'from-yellow-500 to-orange-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', desc: 'Fastest growing energy source globally. China leads with 609 GW installed capacity.' },
    { name: 'Wind', icon: Wind, capacity: '1,017 GW', growth: '+12.4%', status: 'Strong Growth', color: 'from-cyan-400 to-blue-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', desc: 'Offshore wind expanding rapidly. Europe and China dominate installations.' },
    { name: 'Hydropower', icon: Droplets, capacity: '1,392 GW', growth: '+1.8%', status: 'Mature', color: 'from-blue-400 to-indigo-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', desc: 'Largest renewable source by capacity. Critical for grid stability and storage.' },
    { name: 'Nuclear', icon: Atom, capacity: '413 GW', growth: '+3.2%', status: 'Revival', color: 'from-purple-400 to-violet-600', bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', desc: 'SMR technology driving new interest. 60+ reactors under construction worldwide.' },
    { name: 'Hydrogen', icon: Flame, capacity: '~1.4 GW', growth: '+94%', status: 'Emerging', color: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', desc: 'Green hydrogen production scaling up. Expected to reach 134-240 GW by 2030.' },
    { name: 'Geothermal', icon: Globe2, capacity: '16.1 GW', growth: '+3.5%', status: 'Niche Growth', color: 'from-red-400 to-rose-600', bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', desc: 'Enhanced geothermal systems unlocking new potential. 24/7 baseload power.' },
]

// ─── CRITICAL ENERGY COMMODITIES ──────────────────────────────
const ENERGY_COMMODITIES = [
    { symbol: 'Li', name: 'Lithium Carbonate', price: 13250, change: -4.2, unit: '$/tonne', use: 'EV Batteries' },
    { symbol: 'Co', name: 'Cobalt', price: 28.50, change: +2.8, unit: '$/lb', use: 'Battery Cathodes' },
    { symbol: 'U₃O₈', name: 'Uranium', price: 82.50, change: +12.3, unit: '$/lb', use: 'Nuclear Fuel' },
    { symbol: 'Cu', name: 'Copper', price: 9420, change: +5.1, unit: '$/tonne', use: 'Electrification' },
    { symbol: 'Si', name: 'Polysilicon', price: 6.85, change: -8.7, unit: '$/kg', use: 'Solar Panels' },
    { symbol: 'Ni', name: 'Nickel', price: 16850, change: -2.1, unit: '$/tonne', use: 'Battery Anodes' },
    { symbol: 'Pt', name: 'Platinum', price: 985, change: +1.4, unit: '$/oz', use: 'Fuel Cells' },
    { symbol: 'Ag', name: 'Silver', price: 31.20, change: +3.6, unit: '$/oz', use: 'Solar Contacts' },
    { symbol: 'Mn', name: 'Manganese', price: 4.80, change: +0.9, unit: '$/kg', use: 'LFP Batteries' },
    { symbol: 'GaAs', name: 'Gallium', price: 320, change: +6.2, unit: '$/kg', use: 'Advanced Solar' },
]

// ─── ENERGY POLICIES ──────────────────────────────────────────
const ENERGY_POLICIES = [
    { name: 'US Inflation Reduction Act', country: '🇺🇸 USA', investment: '$369B', focus: 'Clean energy tax credits, EV incentives, domestic manufacturing', year: '2022', status: 'Active' },
    { name: 'EU Green Deal', country: '🇪🇺 EU', investment: '€1T+', focus: 'Carbon neutrality by 2050, Fit for 55 package, CBAM', year: '2019', status: 'Active' },
    { name: 'China 14th Five-Year Plan', country: '🇨🇳 China', investment: '$546B', focus: '1,200 GW wind+solar by 2030, EV dominance, nuclear expansion', year: '2021', status: 'Active' },
    { name: 'India National Solar Mission', country: '🇮🇳 India', investment: '$113B', focus: '500 GW non-fossil fuel capacity by 2030, green hydrogen', year: '2010', status: 'Expanded' },
    { name: 'Japan GX Strategy', country: '🇯🇵 Japan', investment: '$150B', focus: 'Nuclear restart, hydrogen economy, carbon pricing', year: '2023', status: 'Active' },
    { name: 'Australia Net Zero Plan', country: '🇦🇺 Australia', investment: '$A20B', focus: 'Capacity Investment Scheme, critical minerals, green hydrogen', year: '2022', status: 'Active' },
]

// ─── ENERGY TRANSITION TIMELINE ───────────────────────────────
const TIMELINE_EVENTS = [
    { year: '2015', event: 'Paris Agreement signed by 196 nations', type: 'Policy' },
    { year: '2017', event: 'Solar becomes cheapest electricity source in history', type: 'Milestone' },
    { year: '2020', event: 'Renewables generate 29% of global electricity', type: 'Milestone' },
    { year: '2021', event: 'IEA Net Zero by 2050 roadmap released', type: 'Policy' },
    { year: '2022', event: 'US passes Inflation Reduction Act ($369B)', type: 'Policy' },
    { year: '2023', event: 'Global EV sales surpass 14 million units', type: 'Market' },
    { year: '2024', event: 'Renewable capacity additions hit 510 GW record', type: 'Milestone' },
    { year: '2025', event: 'First commercial fusion power plant designs approved', type: 'Technology' },
    { year: '2030', event: 'Target: Triple global renewable energy capacity', type: 'Target' },
    { year: '2050', event: 'Target: Net-zero emissions globally', type: 'Target' },
]

export default function EnergyPage() {
    // Solar Economics Calculator
    const [solarSize, setSolarSize] = useState<string>('')
    const [costPerWatt, setCostPerWatt] = useState<string>('2.50')
    const [electricityRate, setElectricityRate] = useState<string>('0.14')
    const [sunHours, setSunHours] = useState<string>('5')
    const [solarLocation, setSolarLocation] = useState<string>('')
    const [solarResult, setSolarResult] = useState<{ annualProduction: string; annualSavings: string; payback: string; savings25: string } | null>(null)

    // Wind Farm Calculator
    const [turbineCount, setTurbineCount] = useState<string>('')
    const [turbineRating, setTurbineRating] = useState<string>('3')
    const [capacityFactor, setCapacityFactor] = useState<string>('35')
    const [windLocation, setWindLocation] = useState<string>('')

    const captureLocation = (setter: React.Dispatch<React.SetStateAction<string>>) => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setter(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`)
                },
                () => alert('Could not capture location. Please check browser permissions or enter manually.')
            )
        } else {
            alert('Geolocation is not supported by this browser.')
        }
    }
    const [windResult, setWindResult] = useState<{ totalCapacity: string; annualOutput: string; homesPowered: string } | null>(null)

    // Carbon Offset Estimator
    const [renewableCapacity, setRenewableCapacity] = useState<string>('')
    const [sourceType, setSourceType] = useState('solar')
    const [carbonResult, setCarbonResult] = useState<{ co2Offset: string; trees: string; cars: string } | null>(null)

    // AI Energy Analyzer
    const [aiQuery, setAiQuery] = useState('')
    const [aiLoading, setAiLoading] = useState(false)
    const [aiResult, setAiResult] = useState<{
        summary: string
        strategic_implications: string[]
        affected_markets: { market: string; impact: string; direction: string }[]
        key_players: { name: string; role: string }[]
        outlook: { short_term: string; long_term: string }
        confidence: string
    } | null>(null)
    const [aiError, setAiError] = useState('')

    // ─── CALCULATORS ──────────────────────────────────────────
    const calculateSolarROI = () => {
        const size = parseFloat(solarSize) || 0
        const cpw = parseFloat(costPerWatt) || 2.50
        const rate = parseFloat(electricityRate) || 0.14
        const hours = parseFloat(sunHours) || 5

        const annualKWh = size * hours * 365
        const annualSave = annualKWh * rate
        const totalCost = size * 1000 * cpw
        const paybackYears = totalCost / annualSave
        const total25 = annualSave * 25 - totalCost

        setSolarResult({
            annualProduction: annualKWh.toLocaleString(undefined, { maximumFractionDigits: 0 }),
            annualSavings: annualSave.toLocaleString(undefined, { maximumFractionDigits: 0 }),
            payback: paybackYears.toFixed(1),
            savings25: total25.toLocaleString(undefined, { maximumFractionDigits: 0 }),
        })
    }

    const calculateWindFarm = () => {
        const turbines = parseInt(turbineCount) || 0
        const rating = parseFloat(turbineRating) || 3
        const cf = (parseFloat(capacityFactor) || 35) / 100

        const totalMW = turbines * rating
        const annualMWh = totalMW * cf * 8760
        const homes = Math.round(annualMWh / 10.5) // avg US home uses ~10.5 MWh/yr

        setWindResult({
            totalCapacity: totalMW.toLocaleString(undefined, { maximumFractionDigits: 1 }),
            annualOutput: annualMWh.toLocaleString(undefined, { maximumFractionDigits: 0 }),
            homesPowered: homes.toLocaleString(),
        })
    }

    const carbonFactors: { [key: string]: number } = {
        solar: 0.04, // tonnes CO2/MWh offset vs coal
        wind: 0.04,
        hydro: 0.038,
        nuclear: 0.045,
        geothermal: 0.035,
    }

    const calculateCarbon = () => {
        const cap = parseFloat(renewableCapacity) || 0
        const factor = carbonFactors[sourceType] || 0.04
        // coal baseline: ~1 tonne CO2/MWh, renewable offset ≈ 0.9-1
        const coalEmissionFactor = 1.0
        const annualMWh = cap * 0.25 * 8760 // 25% avg capacity factor
        const co2 = annualMWh * (coalEmissionFactor - factor)
        const equivTrees = co2 * 45 // ~45 trees absorb 1 tonne CO2/yr
        const equivCars = co2 / 4.6 // avg car emits 4.6 tonnes CO2/yr

        setCarbonResult({
            co2Offset: co2.toLocaleString(undefined, { maximumFractionDigits: 0 }),
            trees: equivTrees.toLocaleString(undefined, { maximumFractionDigits: 0 }),
            cars: equivCars.toLocaleString(undefined, { maximumFractionDigits: 0 }),
        })
    }

    // ─── AI ANALYZER ──────────────────────────────────────────
    const analyzeEnergy = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!aiQuery.trim()) return

        setAiLoading(true)
        setAiError('')
        setAiResult(null)

        try {
            const response = await fetch('/api/ai/energy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: aiQuery }),
            })

            if (!response.ok) throw new Error('Failed to analyze')

            const data = await response.json()
            setAiResult(data)
        } catch {
            setAiError('Could not analyze. Please try again.')
        } finally {
            setAiLoading(false)
        }
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-geo-dark to-black text-white pt-28 pb-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                {/* ─── HEADER ──────────────────────────────── */}
                <div className="mb-12">
                    <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-geo-gold transition-colors mb-6">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="text-emerald-400 text-sm font-medium tracking-widest uppercase flex items-center gap-2">
                            <Zap className="w-4 h-4" /> Energy Hub
                        </span>
                        <h1 className="text-4xl md:text-5xl font-bold mt-2">
                            Renewable <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Energy</span> Intelligence
                        </h1>
                        <p className="text-gray-400 mt-4 max-w-2xl">
                            Track the global energy transition with AI-powered analysis, calculators, commodity data, and geopolitical policy intelligence.
                        </p>
                    </motion.div>
                </div>

                {/* ─── HUB NAVIGATION ────────────────────────── */}
                <div className="flex overflow-x-auto gap-3 mb-12 pb-2" style={{scrollbarWidth: 'none'}}>
                    <a href="#dashboard" className="px-4 py-2 whitespace-nowrap bg-white/5 border border-white/10 rounded-full hover:bg-emerald-500/20 hover:text-emerald-400 transition-all text-sm">Dashboard</a>
                    <a href="#analyzer" className="px-4 py-2 whitespace-nowrap bg-white/5 border border-white/10 rounded-full hover:bg-emerald-500/20 hover:text-emerald-400 transition-all text-sm">AI Analyzer</a>
                    <a href="#calculators" className="px-4 py-2 whitespace-nowrap bg-white/5 border border-white/10 rounded-full hover:bg-emerald-500/20 hover:text-emerald-400 transition-all text-sm">Calculators</a>
                    <a href="#storage" className="px-4 py-2 whitespace-nowrap bg-white/5 border border-white/10 rounded-full hover:bg-emerald-500/20 hover:text-emerald-400 transition-all text-sm">Energy Storage (ESS)</a>
                    <a href="#policy" className="px-4 py-2 whitespace-nowrap bg-white/5 border border-white/10 rounded-full hover:bg-emerald-500/20 hover:text-emerald-400 transition-all text-sm">Policy Tracker</a>
                </div>


                {/* ═══ 1. GLOBAL ENERGY MIX DASHBOARD ═══════════ */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    id="dashboard" className="mb-16"
                >
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <Globe2 className="w-6 h-6 text-emerald-400" />
                        Global Energy Mix Dashboard
                    </h2>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {ENERGY_SOURCES.map((source) => {
                            const Icon = source.icon
                            return (
                                <div
                                    key={source.name}
                                    className={`group relative overflow-hidden rounded-xl border ${source.border} ${source.bg} p-6 backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-${source.text}/10`}
                                >
                                    {/* Gradient accent line */}
                                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${source.color}`} />

                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2.5 rounded-lg ${source.bg} border ${source.border}`}>
                                                <Icon className={`w-6 h-6 ${source.text}`} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white">{source.name}</h3>
                                                <span className={`text-xs font-semibold ${source.text} uppercase tracking-wider`}>{source.status}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-bold text-white">{source.capacity}</div>
                                            <div className={`text-sm font-bold ${source.growth.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                                                {source.growth}
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-400 leading-relaxed">{source.desc}</p>

                                    {/* Capacity bar */}
                                    <div className="mt-4">
                                        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                            <span>Installed Capacity</span>
                                            <span>{source.capacity}</span>
                                        </div>
                                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: '100%' }}
                                                transition={{ duration: 1.5, delay: 0.3 }}
                                                className={`h-full rounded-full bg-gradient-to-r ${source.color}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </motion.section>

                {/* ═══ 6. ENERGY GEOPOLITICS INTELLIGENCE ENGINE ═════════ */}
                <div id="analyzer"></div>
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.35 }}
                    className="mb-16"
                >
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <BrainCircuit className="w-6 h-6 text-emerald-400" />
                        <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                            Energy Geopolitics Intelligence Engine
                        </span>
                    </h2>

                    <div className="bg-white/5 rounded-xl border border-white/10 p-6 relative overflow-hidden">
                        {/* Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-emerald-500/20 blur-xl" />

                        <div className="flex items-center gap-2 text-emerald-400 mb-4">
                            <Sparkles className="w-4 h-4 animate-pulse" />
                            <span className="text-xs font-medium tracking-wider uppercase">Powered by GeoMoney AI</span>
                        </div>

                        <form onSubmit={analyzeEnergy} className="relative mb-4">
                            <input
                                type="text"
                                value={aiQuery}
                                onChange={(e) => setAiQuery(e.target.value)}
                                placeholder="Ask about energy geopolitics... (e.g., 'Impact of China's solar panel dominance on US energy security')"
                                className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-4 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-light text-lg"
                                disabled={aiLoading}
                            />
                            <button
                                type="submit"
                                disabled={aiLoading || !aiQuery.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                            </button>
                        </form>

                        {/* Suggested Queries */}
                        {!aiResult && !aiLoading && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {[
                                    "China's rare earth monopoly impact",
                                    "US IRA effect on clean energy",
                                    "Nuclear energy revival 2025",
                                    "Green hydrogen economy outlook"
                                ].map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => setAiQuery(q)}
                                        className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-gray-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}

                        {aiLoading && (
                            <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-4">
                                <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                                <div className="text-center">
                                    <p className="font-semibold text-white">Analyzing Energy Intelligence...</p>
                                    <p className="text-xs text-gray-500 mt-1">Strategic Implications • Market Impact • Key Players • Outlook</p>
                                </div>
                            </div>
                        )}

                        {aiError && (
                            <div className="p-4 bg-red-500/10 border-l-2 border-red-500 text-red-200 text-sm">
                                {aiError}
                                <button onClick={analyzeEnergy as any} className="ml-3 text-emerald-400 hover:underline text-xs">Retry</button>
                            </div>
                        )}

                        {aiResult && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-0 rounded-xl border border-white/10 overflow-hidden">
                                {/* Summary */}
                                <div className="p-4 border-b border-white/5 bg-white/5">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Shield className="w-3 h-3" /> Executive Summary
                                    </h4>
                                    <p className="text-sm text-gray-200 leading-relaxed">{aiResult.summary}</p>
                                </div>

                                {/* Strategic Implications */}
                                <div className="p-4 border-b border-white/5">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Strategic Implications</h4>
                                    <ul className="space-y-2">
                                        {aiResult.strategic_implications.map((impl, idx) => (
                                            <li key={idx} className="flex gap-2 text-sm text-gray-300">
                                                <span className="text-emerald-400 font-bold shrink-0">▸</span>
                                                {impl}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Affected Markets */}
                                {aiResult.affected_markets && aiResult.affected_markets.length > 0 && (
                                    <div className="p-4 border-b border-white/5 bg-gradient-to-r from-green-900/10 to-red-900/10">
                                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <BarChart3 className="w-3 h-3" /> Affected Markets
                                        </h4>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {aiResult.affected_markets.map((market, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`rounded-lg border p-3 ${(market.direction?.toLowerCase() === 'positive pressure' || market.direction?.toLowerCase() === 'bullish') ? 'text-green-400 bg-green-500/10 border-green-500/20' : (market.direction?.toLowerCase() === 'negative pressure' || market.direction?.toLowerCase() === 'bearish') ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-gray-400 bg-gray-500/10 border-gray-500/20'}`}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-bold text-white text-sm">{market.market}</span>
                                                        <span className="text-xs font-bold uppercase">{market.direction?.toLowerCase() === 'bullish' ? 'Positive Pressure' : market.direction?.toLowerCase() === 'bearish' ? 'Negative Pressure' : market.direction}</span>
                                                    </div>
                                                    <p className="text-xs opacity-80">{market.impact}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Key Players */}
                                {aiResult.key_players && aiResult.key_players.length > 0 && (
                                    <div className="p-4 border-b border-white/5">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Key Players</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {aiResult.key_players.map((player, idx) => (
                                                <div key={idx} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                                                    <div className="text-sm font-bold text-white">{player.name}</div>
                                                    <div className="text-[10px] text-gray-500">{player.role}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Outlook */}
                                <div className="p-4 bg-emerald-500/5">
                                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <TrendingUp className="w-3 h-3" /> Outlook
                                    </h4>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Short-Term (6-12 months)</div>
                                            <p className="text-sm text-gray-200">{aiResult.outlook?.short_term}</p>
                                        </div>
                                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Long-Term (3-5 years)</div>
                                            <p className="text-sm text-gray-200">{aiResult.outlook?.long_term}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 text-right">
                                        <span className={`text-[10px] px-2 py-1 rounded-full border font-bold ${(aiResult.confidence === 'Elevated' || aiResult.confidence === 'High') ? 'bg-green-500/20 text-green-400 border-green-500/30' : (aiResult.confidence === 'Moderate' || aiResult.confidence === 'Medium') ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                                            GeoMoney Assessment: {aiResult.confidence}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.section>

                

                {/* ═══ 2. CRITICAL ENERGY COMMODITIES ═══════════ */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    id="commodities" className="mb-16"
                >
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <Battery className="w-6 h-6 text-emerald-400" />
                        Critical Energy Commodities
                    </h2>

                    <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                        <p className="text-gray-400 text-sm mb-6">
                            Track prices for critical minerals and materials powering the energy transition.
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {ENERGY_COMMODITIES.map((commodity) => (
                                <div
                                    key={commodity.symbol}
                                    className="bg-black/30 rounded-lg p-4 border border-white/10 hover:border-emerald-500/30 transition-all group"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-emerald-400 font-bold text-lg">{commodity.symbol}</span>
                                        <span className={`text-xs font-medium ${commodity.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {commodity.change >= 0 ? '+' : ''}{commodity.change}%
                                        </span>
                                    </div>
                                    <div className="text-white font-semibold">${commodity.price.toLocaleString()}</div>
                                    <div className="text-gray-500 text-xs">{commodity.name}</div>
                                    <div className="mt-2 text-[10px] text-emerald-400/70 font-medium uppercase tracking-wider">{commodity.use}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.section>

                {/* ═══ 3. SOLAR ECONOMICS CALCULATOR ══════════════════ */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    id="calculators" className="mb-16"
                >
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <Sun className="w-6 h-6 text-yellow-400" />
                        Solar Economics Calculator
                    </h2>

                    <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                        <p className="text-gray-400 text-sm mb-6">
                            Calculate the return on investment for a solar panel installation based on system size, costs, and local conditions.
                        </p>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="text-sm text-gray-400 flex justify-between items-center mb-1.5">
                                   <span>Location Coordinates</span>
                                   <button onClick={() => captureLocation(setSolarLocation)} className="text-xs text-yellow-500 hover:text-yellow-400 transition-colors">Auto-Capture (GPS)</button>
                                </label>
                                <input type="text" value={solarLocation} onChange={(e) => setSolarLocation(e.target.value)} placeholder="e.g. 34.05, -118.24" className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors" />
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div>
                                <label className="text-sm text-gray-400 block mb-1.5">System Size (kW)</label>
                                <input type="number" value={solarSize} onChange={(e) => setSolarSize(e.target.value)} placeholder="e.g. 10" className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-1.5">Cost per Watt ($)</label>
                                <input type="number" value={costPerWatt} onChange={(e) => setCostPerWatt(e.target.value)} placeholder="e.g. 2.50" className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-1.5">Electricity Rate ($/kWh)</label>
                                <input type="number" value={electricityRate} onChange={(e) => setElectricityRate(e.target.value)} placeholder="e.g. 0.14" className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-1.5">Peak Sun Hours/Day</label>
                                <input type="number" value={sunHours} onChange={(e) => setSunHours(e.target.value)} placeholder="e.g. 5" className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-1.5">&nbsp;</label>
                                <button onClick={calculateSolarROI} className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold py-3 rounded-lg hover:from-yellow-400 hover:to-orange-400 transition-all">
                                    Calculate ROI
                                </button>
                            </div>
                        </div>

                        {solarResult && (
                            <div className="mt-6 grid md:grid-cols-4 gap-4">
                                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                    <div className="text-sm text-gray-400">Annual Production</div>
                                    <div className="text-xl font-bold text-yellow-400">{solarResult.annualProduction} kWh</div>
                                </div>
                                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                                    <div className="text-sm text-gray-400">Annual Savings</div>
                                    <div className="text-xl font-bold text-green-400">${solarResult.annualSavings}</div>
                                </div>
                                <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                                    <div className="text-sm text-gray-400">Payback Period</div>
                                    <div className="text-xl font-bold text-cyan-400">{solarResult.payback} years</div>
                                </div>
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                    <div className="text-sm text-gray-400">25-Year Net Savings</div>
                                    <div className={`text-xl font-bold ${parseFloat(solarResult.savings25.replace(/,/g, '')) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>${solarResult.savings25}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.section>

                {/* ═══ 4. WIND FARM CAPACITY CALCULATOR ═════════ */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.25 }}
                    className="mb-16"
                >
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <Wind className="w-6 h-6 text-cyan-400" />
                        Wind Farm Capacity Calculator
                    </h2>

                    <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                        <p className="text-gray-400 text-sm mb-6">
                            Estimate wind farm output based on turbine specifications and capacity factor.
                        </p>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="text-sm text-gray-400 flex justify-between items-center mb-1.5">
                                   <span>Location Coordinates</span>
                                   <button onClick={() => captureLocation(setWindLocation)} className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">Auto-Capture (GPS)</button>
                                </label>
                                <input type="text" value={windLocation} onChange={(e) => setWindLocation(e.target.value)} placeholder="e.g. 51.50, -0.12" className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors" />
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="text-sm text-gray-400 block mb-1.5">Number of Turbines</label>
                                <input type="number" value={turbineCount} onChange={(e) => setTurbineCount(e.target.value)} placeholder="e.g. 50" className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-1.5">Turbine Rating (MW)</label>
                                <input type="number" value={turbineRating} onChange={(e) => setTurbineRating(e.target.value)} placeholder="e.g. 3" className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-1.5">Capacity Factor (%)</label>
                                <input type="number" value={capacityFactor} onChange={(e) => setCapacityFactor(e.target.value)} placeholder="e.g. 35" className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-1.5">&nbsp;</label>
                                <button onClick={calculateWindFarm} className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-3 rounded-lg hover:from-cyan-400 hover:to-blue-400 transition-all">
                                    Calculate
                                </button>
                            </div>
                        </div>

                        {windResult && (
                            <div className="mt-6 grid md:grid-cols-3 gap-4">
                                <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                                    <div className="text-sm text-gray-400">Total Capacity</div>
                                    <div className="text-xl font-bold text-cyan-400">{windResult.totalCapacity} MW</div>
                                </div>
                                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                    <div className="text-sm text-gray-400">Annual Output</div>
                                    <div className="text-xl font-bold text-blue-400">{windResult.annualOutput} MWh</div>
                                </div>
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                    <div className="text-sm text-gray-400">Homes Powered</div>
                                    <div className="text-xl font-bold text-emerald-400">{windResult.homesPowered}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.section>

                {/* ═══ 5. CARBON OFFSET ESTIMATOR ═══════════════ */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mb-16"
                >
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <Leaf className="w-6 h-6 text-green-400" />
                        Carbon Offset Estimator
                    </h2>

                    <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                        <p className="text-gray-400 text-sm mb-6">
                            Estimate the CO₂ offset from renewable energy installations versus coal-fired power generation.
                        </p>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm text-gray-400 block mb-1.5">Renewable Capacity (MW)</label>
                                <input type="number" value={renewableCapacity} onChange={(e) => setRenewableCapacity(e.target.value)} placeholder="e.g. 100" className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-1.5">Energy Source</label>
                                <select value={sourceType} onChange={(e) => setSourceType(e.target.value)} className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors">
                                    <option value="solar">Solar PV</option>
                                    <option value="wind">Wind</option>
                                    <option value="hydro">Hydropower</option>
                                    <option value="nuclear">Nuclear</option>
                                    <option value="geothermal">Geothermal</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-1.5">&nbsp;</label>
                                <button onClick={calculateCarbon} className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-black font-bold py-3 rounded-lg hover:from-green-400 hover:to-emerald-400 transition-all">
                                    Estimate Offset
                                </button>
                            </div>
                        </div>

                        {carbonResult && (
                            <div className="mt-6 grid md:grid-cols-3 gap-4">
                                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                                    <div className="text-sm text-gray-400">Annual CO₂ Offset</div>
                                    <div className="text-xl font-bold text-green-400">{carbonResult.co2Offset} tonnes</div>
                                </div>
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                    <div className="text-sm text-gray-400">Equivalent Trees Planted</div>
                                    <div className="text-xl font-bold text-emerald-400">🌳 {carbonResult.trees}</div>
                                </div>
                                <div className="p-4 bg-teal-500/10 border border-teal-500/30 rounded-lg">
                                    <div className="text-sm text-gray-400">Equivalent Cars Removed</div>
                                    <div className="text-xl font-bold text-teal-400">🚗 {carbonResult.cars}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.section>

                
                {/* ═══ ENERGY STORAGE ═══════════════════════════ */}
                <motion.section
                    id="storage"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16"
                >
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <Battery className="w-6 h-6 text-purple-400" />
                        Energy Storage Systems (ESS & BESS)
                    </h2>
                    <div className="bg-white/5 rounded-xl border border-white/10 p-6 flex items-center justify-center min-h-[200px]">
                        <div className="text-center">
                            <Zap className="w-12 h-12 text-purple-400/50 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-white mb-2">Energy Storage Analytics Coming Soon</h3>
                            <p className="text-gray-400 text-sm max-w-md mx-auto">Track battery energy storage systems, utility-scale storage deployments, and grid stability metrics.</p>
                        </div>
                    </div>
                </motion.section>
<div id="policy"></div>
                {/* ═══ 7. ENERGY POLICY TRACKER ═════════════════ */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="mb-16"
                >
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <Landmark className="w-6 h-6 text-emerald-400" />
                        Global Energy Policy Tracker
                    </h2>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {ENERGY_POLICIES.map((policy) => (
                            <div
                                key={policy.name}
                                className="bg-white/5 rounded-xl border border-white/10 p-5 hover:border-emerald-500/30 transition-all group"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-2xl">{policy.country.split(' ')[0]}</span>
                                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold tracking-wider uppercase ${policy.status === 'Active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
                                        {policy.status}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">{policy.name}</h3>
                                <div className="text-sm text-emerald-400 font-bold mb-3">{policy.investment} investment</div>
                                <p className="text-sm text-gray-400 leading-relaxed">{policy.focus}</p>
                                <div className="mt-3 text-xs text-gray-500">Since {policy.year}</div>
                            </div>
                        ))}
                    </div>
                </motion.section>

                {/* ═══ 8. ENERGY TRANSITION TIMELINE ════════════ */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.45 }}
                    className="mb-16"
                >
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <TrendingUp className="w-6 h-6 text-emerald-400" />
                        Energy Transition Timeline
                    </h2>

                    <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                        <div className="relative">
                            {/* Vertical line */}
                            <div className="absolute left-[60px] md:left-[80px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 via-cyan-500 to-purple-500" />

                            <div className="space-y-6">
                                {TIMELINE_EVENTS.map((event, idx) => {
                                    const typeColors: { [key: string]: string } = {
                                        Policy: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                                        Milestone: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                                        Market: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                                        Technology: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
                                        Target: 'bg-red-500/20 text-red-400 border-red-500/30',
                                    }
                                    return (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3, delay: 0.1 * idx }}
                                            className="flex items-center gap-4 group"
                                        >
                                            <div className="w-[50px] md:w-[70px] text-right shrink-0">
                                                <span className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">{event.year}</span>
                                            </div>
                                            <div className="relative shrink-0">
                                                <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-black shadow-lg shadow-emerald-500/30 group-hover:scale-125 transition-transform" />
                                            </div>
                                            <div className="flex-1 bg-black/30 rounded-lg p-3 border border-white/10 group-hover:border-emerald-500/30 transition-all">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <p className="text-sm text-gray-200 font-medium">{event.event}</p>
                                                    <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold tracking-wider uppercase shrink-0 ${typeColors[event.type]}`}>
                                                        {event.type}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </motion.section>

            </div>
        </main>
    )
}
