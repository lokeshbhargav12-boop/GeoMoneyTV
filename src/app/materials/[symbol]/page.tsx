'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    ArrowLeft,
    MapPin,
    Factory,
    TrendingUp,
    TrendingDown,
    Lock,
    Gem,
    Globe,
    BookOpen,
    ExternalLink,
    LineChart,
    Activity,
    Atom,
} from 'lucide-react'
import MaterialPriceChart from '@/components/materials/MaterialPriceChart'
import EarlyWarningBanner from '@/components/materials/EarlyWarningBanner'
import RiskPulseCard from '@/components/materials/RiskPulseCard'
import MaterialIntelFeed from '@/components/materials/MaterialIntelFeed'
import CrossMaterialImpact from '@/components/materials/CrossMaterialImpact'
import ShockSimulator from '@/components/materials/ShockSimulator'
import SinceLastCheckedBanner from '@/components/materials/SinceLastCheckedBanner'
import type { MaterialIntel } from '@/components/materials/intel-types'

interface MaterialBenchmarkInfo {
    id: string | null
    productForm: string
    grade: string | null
    benchmarkName: string | null
    market: string | null
    currency: string
    unit: string
    updateFrequency: string | null
    isProxy: boolean
    isLive: boolean
    feedSymbol: string | null
    latest: { price: number; asOf: string } | null
    change: number | null
    changePercent: number | null
    source: { publisher: string; url: string | null } | null
}

interface MaterialSourceInfo {
    publisher: string
    document: string | null
    url: string | null
    dataYear: number | null
}

interface MaterialDetail {
    id: string | null
    materialKey: string
    name: string
    symbol: string
    category: string
    materialFamily: string | null
    description: string
    supply: string | null
    demand: string | null
    applications: string[]
    countries: string[]
    price: number | null
    unit: string | null
    lastUpdated: string | null
    benchmarks: MaterialBenchmarkInfo[]
    sources: MaterialSourceInfo[]
    countryRoles: { country: string; stage: string; sharePct: number | null; dataYear: number | null }[]
    effectivePrice: {
        price: number
        unit: string
        currency: string
        asOf: string | null
        label: string
        isLive: boolean
        isProxy: boolean
        change: number | null
        changePercent: number | null
    } | null
}

interface RelatedMaterial {
    id: string | null
    name: string
    symbol: string
    category: string
    effectivePrice: number | null
    effectiveUnit: string | null
}

interface MaterialDetailResponse {
    material: MaterialDetail
    related: RelatedMaterial[]
}

function formatPrice(price: number): string {
    return price.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: price < 10 ? 4 : 2,
    })
}

function formatDate(iso: string | null | undefined): string | null {
    if (!iso) return null
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return null
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function ChangeChip({ pct }: { pct: number }) {
    const up = pct >= 0
    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${
                up ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
            }`}
        >
            {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {up ? '+' : ''}
            {pct.toFixed(2)}%
        </span>
    )
}

export default function MaterialDetailPage() {
    const params = useParams()
    const symbol = decodeURIComponent(params.symbol as string)
    const [data, setData] = useState<MaterialDetailResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const [intel, setIntel] = useState<MaterialIntel | null>(null)

    useEffect(() => {
        setLoading(true)
        setNotFound(false)
        setData(null)
        fetch(`/api/rare-earth/${encodeURIComponent(symbol)}`)
            .then((res) => {
                if (res.status === 404) {
                    setNotFound(true)
                    return null
                }
                return res.json()
            })
            .then((payload: MaterialDetailResponse | null) => {
                if (payload?.material) setData(payload)
                else setNotFound(true)
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false))
    }, [symbol])

    // Fetch the intelligence aggregate (C1–C5) for this material. The
    // "Since You Last Checked" banner (C6) owns lastSeenAt updates via its
    // explicit "Mark as caught up" action — do NOT auto-PATCH here, or the
    // delta would always be empty.
    useEffect(() => {
        setIntel(null)
        fetch(`/api/materials/${encodeURIComponent(symbol)}/intel`)
            .then((res) => (res.ok ? res.json() : null))
            .then((payload: MaterialIntel | null) => setIntel(payload))
            .catch(() => setIntel(null))
    }, [symbol])

    if (loading) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-geo-dark to-black text-white pt-32 pb-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3 text-gray-400">
                        <Atom className="w-6 h-6 animate-pulse text-geo-gold" />
                        Loading material intelligence...
                    </div>
                </div>
            </main>
        )
    }

    if (notFound || !data) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-geo-dark to-black text-white pt-32 pb-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <Link href="/materials" className="inline-flex items-center gap-2 text-gray-400 hover:text-geo-gold transition-colors mb-8">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Critical Materials
                    </Link>
                    <h1 className="text-4xl font-bold">Material not found</h1>
                    <p className="text-gray-400 mt-4">The requested critical material does not exist.</p>
                </div>
            </main>
        )
    }

    const material = data.material
    const related = data.related
    const priceAsOf = formatDate(material.effectivePrice?.asOf ?? material.lastUpdated)

    return (
        <main className="min-h-screen bg-gradient-to-br from-geo-dark to-black text-white pt-32 pb-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Back Button */}
                <Link href="/materials" className="inline-flex items-center gap-2 text-gray-400 hover:text-geo-gold transition-colors mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Critical Materials
                </Link>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-12"
                >
                    <div className="flex items-start justify-between flex-wrap gap-6">
                        <div>
                            <div className="flex items-center gap-5 mb-2">
                                {/* Periodic-table-style element tile */}
                                <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-geo-gold/25 to-yellow-600/10 border border-geo-gold/40 flex flex-col items-center justify-center flex-shrink-0">
                                    <span className="text-3xl font-bold text-geo-gold leading-none">{material.symbol}</span>
                                    <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-wide text-center px-1 leading-tight">
                                        {material.category}
                                    </span>
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold">{material.name}</h1>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <span className="px-3 py-1 rounded-full text-sm bg-geo-gold/20 text-geo-gold">
                                            {material.category}
                                        </span>
                                        {material.effectivePrice?.isLive && (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                                <Activity className="w-3 h-3" /> LIVE FEED
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {material.effectivePrice && (
                            <div className="text-right">
                                <div className="flex items-center justify-end gap-3 flex-wrap">
                                    <div className="text-3xl font-bold text-geo-gold">
                                        {material.effectivePrice.currency === 'USD' ? '$' : `${material.effectivePrice.currency} `}
                                        {formatPrice(material.effectivePrice.price)}
                                        <span className="text-base text-gray-400 font-normal">/{material.effectivePrice.unit}</span>
                                    </div>
                                    {material.effectivePrice.changePercent != null && (
                                        <ChangeChip pct={material.effectivePrice.changePercent} />
                                    )}
                                </div>
                                <div className="text-sm text-gray-400">{material.effectivePrice.label}</div>
                                {priceAsOf && (
                                    <div className="text-xs text-gray-500 mt-1">as of {priceAsOf}</div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* C6 — Since You Last Checked (signed-in trackers only) */}
                <div className="mb-6">
                    <SinceLastCheckedBanner symbol={symbol} materialId={material.id} />
                </div>

                {/* C2 — Early-Warning status */}
                {intel?.state && (
                    <div className="mb-8">
                        <EarlyWarningBanner state={intel.state} />
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Overview */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="bg-white/5 rounded-xl border border-white/10 p-6"
                        >
                            <h2 className="text-xl font-bold mb-4">Overview</h2>
                            <p className="text-gray-300 leading-relaxed">{material.description}</p>
                        </motion.section>

                        {/* C4 — GeoMoney Risk Pulse */}
                        {intel?.pulse && (
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.12 }}
                            >
                                <RiskPulseCard pulse={intel.pulse} history={intel.pulseHistory} />
                            </motion.section>
                        )}

                        {/* Applications */}
                        {material.applications.length > 0 && (
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.15 }}
                                className="bg-white/5 rounded-xl border border-white/10 p-6"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <Factory className="w-5 h-5 text-geo-gold" />
                                    <h2 className="text-xl font-bold">Key Applications</h2>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {material.applications.map((app, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 bg-black/30 rounded-lg border border-white/10">
                                            <div className="w-2 h-2 bg-geo-gold rounded-full flex-shrink-0"></div>
                                            <span className="text-gray-300">{app}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.section>
                        )}

                        {/* Producing Countries */}
                        {material.countries.length > 0 && (
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="bg-white/5 rounded-xl border border-white/10 p-6"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <Globe className="w-5 h-5 text-geo-gold" />
                                    <h2 className="text-xl font-bold">Major Producing Countries</h2>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {material.countries.map((country, idx) => (
                                        <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-black/30 rounded-lg border border-white/10">
                                            <MapPin className="w-4 h-4 text-geo-gold" />
                                            <span className="text-gray-300">{country}</span>
                                        </div>
                                    ))}
                                </div>
                                {material.countryRoles.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        {material.countryRoles.map((role, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-sm px-3 py-2 bg-black/20 rounded-lg">
                                                <span className="text-gray-300">{role.country} — <span className="capitalize text-gray-400">{role.stage}</span></span>
                                                <span className="text-geo-gold">
                                                    {role.sharePct != null ? `${role.sharePct}%` : ''}
                                                    {role.dataYear != null ? ` (${role.dataYear})` : ''}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.section>
                        )}


                        {/* Supply & Demand */}
                        {(material.supply || material.demand) && (
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.25 }}
                                className="bg-white/5 rounded-xl border border-white/10 p-6"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <TrendingUp className="w-5 h-5 text-geo-gold" />
                                    <h2 className="text-xl font-bold">Supply–Demand Analysis</h2>
                                </div>
                                <div className="space-y-4">
                                    {material.supply && (
                                        <div className="p-4 bg-black/30 rounded-lg">
                                            <h3 className="text-sm text-gray-400 mb-1">Supply Conditions</h3>
                                            <p className="text-white">{material.supply}</p>
                                        </div>
                                    )}
                                    {material.demand && (
                                        <div className="p-4 bg-black/30 rounded-lg">
                                            <h3 className="text-sm text-gray-400 mb-1">Demand Conditions</h3>
                                            <p className="text-white">{material.demand}</p>
                                        </div>
                                    )}
                                </div>
                            </motion.section>
                        )}


                        {/* Price Benchmarks (F5) */}
                        {material.benchmarks.length > 0 && (
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                                className="bg-white/5 rounded-xl border border-white/10 p-6"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <LineChart className="w-5 h-5 text-geo-gold" />
                                    <h2 className="text-xl font-bold">Price Benchmarks</h2>
                                </div>
                                <div className="space-y-3">
                                    {material.benchmarks.map((b, idx) => (
                                        <div key={b.id ?? idx} className="p-4 bg-black/30 rounded-lg border border-white/10">
                                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-semibold text-white capitalize">{b.productForm}</span>
                                                        {b.isLive && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                                                <Activity className="w-2.5 h-2.5" /> LIVE
                                                            </span>
                                                        )}
                                                        {b.isProxy && (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                                                PROXY
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        {[b.benchmarkName, b.grade, b.market, b.updateFrequency && `Updates ${b.updateFrequency}`]
                                                            .filter(Boolean)
                                                            .join(' · ')}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    {b.latest ? (
                                                        <>
                                                            <div className="flex items-center justify-end gap-2">
                                                                <div className="text-lg font-bold text-geo-gold">
                                                                    {b.currency === 'USD' ? '$' : `${b.currency} `}
                                                                    {formatPrice(b.latest.price)}
                                                                    <span className="text-xs text-gray-400 font-normal">/{b.unit}</span>
                                                                </div>
                                                                {b.changePercent != null && <ChangeChip pct={b.changePercent} />}
                                                            </div>
                                                            <div className="text-xs text-gray-500">as of {formatDate(b.latest.asOf)}</div>
                                                        </>
                                                    ) : (
                                                        <div className="text-sm text-gray-500">
                                                            Awaiting observation
                                                            {b.updateFrequency ? ` · updates ${b.updateFrequency}` : ''}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.section>
                        )}


                        {/* Price History (recorded observations or configured market feed) */}
                        {material.benchmarks.some((b) => (b.id && b.latest) || b.feedSymbol) && (
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.33 }}
                                className="bg-white/5 rounded-xl border border-white/10 p-6"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <Activity className="w-5 h-5 text-geo-gold" />
                                    <h2 className="text-xl font-bold">Price History</h2>
                                </div>
                                <MaterialPriceChart
                                    symbol={material.symbol}
                                    benchmarks={material.benchmarks.map((b) => ({
                                        id: b.id,
                                        productForm: b.productForm,
                                        benchmarkName: b.benchmarkName,
                                        unit: b.unit,
                                        currency: b.currency,
                                        isLive: b.isLive,
                                        hasData: b.latest != null,
                                        feedSymbol: b.feedSymbol,
                                        isProxy: b.isProxy,
                                    }))}
                                />
                            </motion.section>
                        )}

                        {/* Data Sources & Provenance (F4) */}
                        {material.sources.length > 0 && (
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.35 }}
                                className="bg-white/5 rounded-xl border border-white/10 p-6"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <BookOpen className="w-5 h-5 text-geo-gold" />
                                    <h2 className="text-xl font-bold">Data Sources & Provenance</h2>
                                </div>
                                <div className="space-y-2">
                                    {material.sources.map((s, idx) => (
                                        <div key={idx} className="flex items-center justify-between gap-4 p-3 bg-black/30 rounded-lg border border-white/10">
                                            <div>
                                                <span className="text-gray-200 font-medium">{s.publisher}</span>
                                                {s.document && <span className="text-gray-400"> — {s.document}</span>}
                                                {s.dataYear != null && (
                                                    <span className="text-gray-500 text-sm"> · data year {s.dataYear}</span>
                                                )}
                                            </div>
                                            {s.url && (
                                                <a
                                                    href={s.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-geo-gold hover:text-yellow-400 transition-colors flex-shrink-0"
                                                    title="Open source"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.section>
                        )}

                        {/* C1 + C3 — Latest intelligence with relevance + implications */}
                        {intel && (
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.38 }}
                            >
                                <MaterialIntelFeed events={intel.events} />
                            </motion.section>
                        )}

                        {/* C5 — Cross-Material Impact */}
                        {intel && intel.crossMaterial.length > 0 && (
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                            >
                                <CrossMaterialImpact items={intel.crossMaterial} />
                            </motion.section>
                        )}

                        {/* C7 — Shock Propagation Simulation */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.42 }}
                        >
                            <ShockSimulator symbol={symbol} materialName={material.name} />
                        </motion.section>
                    </div>


                    {/* Sidebar - Pro Features */}
                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="bg-gradient-to-br from-geo-gold/10 to-yellow-600/5 rounded-xl border border-geo-gold/20 p-6"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <Lock className="w-5 h-5 text-geo-gold" />
                                <span className="text-geo-gold font-bold">Pro Features</span>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-black/30 rounded-lg border border-white/10">
                                    <h3 className="font-semibold mb-1">Price History Chart</h3>
                                    <p className="text-sm text-gray-400">5-year historical pricing data</p>
                                </div>
                                <div className="p-4 bg-black/30 rounded-lg border border-white/10">
                                    <h3 className="font-semibold mb-1">Supply Chain Analysis</h3>
                                    <p className="text-sm text-gray-400">Detailed global supply chain mapping</p>
                                </div>
                                <div className="p-4 bg-black/30 rounded-lg border border-white/10">
                                    <h3 className="font-semibold mb-1">Market Conditions Overview</h3>
                                    <p className="text-sm text-gray-400">Analytical market overview</p>
                                </div>
                                <div className="p-4 bg-black/30 rounded-lg border border-white/10">
                                    <h3 className="font-semibold mb-1">Commodity Threshold Notifications</h3>
                                    <p className="text-sm text-gray-400">Real-time notifications</p>
                                </div>
                            </div>

                            <Link
                                href="/pricing"
                                className="block text-center w-full mt-6 py-3 bg-gradient-to-r from-geo-gold to-yellow-600 text-black font-bold rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all"
                            >
                                Subscribe for Pro Access
                            </Link>
                        </motion.div>

                        {/* Related Materials */}
                        {related.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                                className="bg-white/5 rounded-xl border border-white/10 p-6"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <Gem className="w-5 h-5 text-geo-gold" />
                                    <span className="font-bold">Related Materials</span>
                                </div>

                                <div className="space-y-2">
                                    {related.map((m) => (
                                        <Link
                                            key={m.symbol}
                                            href={`/materials/${encodeURIComponent(m.symbol)}`}
                                            className="flex items-center justify-between p-3 bg-black/30 rounded-lg hover:bg-white/5 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-geo-gold font-bold">{m.symbol}</span>
                                                <span className="text-gray-300">{m.name}</span>
                                            </div>
                                            <span className="text-gray-500">→</span>
                                        </Link>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}

