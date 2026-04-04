'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, MapPin, Factory, TrendingUp, Lock, Gem, Globe } from 'lucide-react'

// Rare Earth Materials Data
const MATERIALS_DATA: {
    [key: string]: {
        name: string
        symbol: string
        category: string
        description: string
        applications: string[]
        countries: string[]
        atomicNumber: number
        price?: number
        priceUnit?: string
        criticalLevel: 'High' | 'Medium' | 'Low'
        supplyRisk: string
        demandTrend: string
    }
} = {
    La: {
        name: 'Lanthanum',
        symbol: 'La',
        category: 'Light Rare Earth',
        description: 'Lanthanum is a soft, ductile, silvery-white metal that tarnishes rapidly when exposed to air. It is the first element in the lanthanide series and is essential for various high-tech applications.',
        applications: ['Hybrid vehicle batteries', 'Camera and telescope lenses', 'Petroleum refining catalysts', 'Metal alloys', 'Hydrogen storage'],
        countries: ['China', 'Australia', 'United States', 'India', 'Brazil'],
        atomicNumber: 57,
        price: 4.50,
        priceUnit: '$/kg',
        criticalLevel: 'Medium',
        supplyRisk: 'Moderate - China dominates 60% of global production',
        demandTrend: 'Increasing demand from EV battery sector'
    },
    Ce: {
        name: 'Cerium',
        symbol: 'Ce',
        category: 'Light Rare Earth',
        description: 'Cerium is the most abundant of the rare earth elements, making up about 0.0046% of the Earth\'s crust. Its compounds are used in various applications from catalytic converters to glass polishing.',
        applications: ['Catalytic converters', 'Glass polishing', 'LED lighting', 'Metallurgy', 'Self-cleaning ovens'],
        countries: ['China', 'Australia', 'United States', 'Russia'],
        atomicNumber: 58,
        price: 4.20,
        priceUnit: '$/kg',
        criticalLevel: 'Low',
        supplyRisk: 'Low - Most abundant rare earth element',
        demandTrend: 'Stable with growth in automotive catalysts'
    },
    Nd: {
        name: 'Neodymium',
        symbol: 'Nd',
        category: 'Light Rare Earth',
        description: 'Neodymium is critical for the production of the world\'s strongest permanent magnets. These NdFeB magnets are essential for electric vehicles, wind turbines, and electronics.',
        applications: ['Permanent magnets (NdFeB)', 'Electric vehicle motors', 'Wind turbine generators', 'Headphones and speakers', 'Lasers'],
        countries: ['China', 'Australia', 'Myanmar', 'United States'],
        atomicNumber: 60,
        price: 152.50,
        priceUnit: '$/kg',
        criticalLevel: 'High',
        supplyRisk: 'High - Critical for green energy transition',
        demandTrend: 'Rapidly increasing with EV and renewable energy growth'
    },
    Dy: {
        name: 'Dysprosium',
        symbol: 'Dy',
        category: 'Heavy Rare Earth',
        description: 'Dysprosium is vital for high-performance magnets that operate at elevated temperatures. It\'s one of the most critical elements for electric vehicle motors and wind turbines.',
        applications: ['High-temperature magnets', 'Electric vehicle motors', 'Wind turbines', 'Nuclear reactor control rods', 'Data storage devices'],
        countries: ['China', 'Australia', 'Myanmar'],
        atomicNumber: 66,
        price: 425.00,
        priceUnit: '$/kg',
        criticalLevel: 'High',
        supplyRisk: 'Very High - Limited sources outside China',
        demandTrend: 'Strong growth driven by EV and wind energy sectors'
    },
    Eu: {
        name: 'Europium',
        symbol: 'Eu',
        category: 'Heavy Rare Earth',
        description: 'Europium has unique luminescent properties that make it essential for display technologies, security features in banknotes, and LED lighting applications.',
        applications: ['LED phosphors', 'Display screens', 'Euro banknote security', 'Fluorescent lamps', 'Nuclear reactor control'],
        countries: ['China', 'United States'],
        atomicNumber: 63,
        price: 35.00,
        priceUnit: '$/kg',
        criticalLevel: 'Medium',
        supplyRisk: 'Moderate - Declining demand from phosphors',
        demandTrend: 'Stable with potential growth in LED applications'
    },
    Tb: {
        name: 'Terbium',
        symbol: 'Tb',
        category: 'Heavy Rare Earth',
        description: 'Terbium is used in green phosphors for displays and is increasingly important for solid-state devices. It can also be used as a substitute for dysprosium in magnets.',
        applications: ['Green phosphors', 'Solid-state devices', 'Fuel cells', 'Magnet additives', 'Naval sonar systems'],
        countries: ['China', 'Australia'],
        atomicNumber: 65,
        price: 1650.00,
        priceUnit: '$/kg',
        criticalLevel: 'High',
        supplyRisk: 'High - Very limited production outside China',
        demandTrend: 'Growing demand as magnet additive'
    },
    Y: {
        name: 'Yttrium',
        symbol: 'Y',
        category: 'Heavy Rare Earth',
        description: 'Although technically not a lanthanide, yttrium is grouped with rare earths due to similar properties. It\'s crucial for superconductors, LED phosphors, and cancer treatment.',
        applications: ['LED lights', 'Superconductors', 'Lasers', 'Cancer treatment', 'Jet engine coatings'],
        countries: ['China', 'Australia', 'India', 'Brazil'],
        atomicNumber: 39,
        price: 32.50,
        priceUnit: '$/kg',
        criticalLevel: 'Medium',
        supplyRisk: 'Moderate - Multiple production sources',
        demandTrend: 'Stable with potential in medical applications'
    },
    Pr: {
        name: 'Praseodymium',
        symbol: 'Pr',
        category: 'Light Rare Earth',
        description: 'Praseodymium is often used alongside neodymium in high-strength permanent magnets. It\'s also used to create special alloys and in glass coloring.',
        applications: ['Permanent magnets', 'Aircraft engines', 'Glass coloring', 'Carbon arc lighting', 'Magnet alloys'],
        countries: ['China', 'Australia', 'United States'],
        atomicNumber: 59,
        price: 128.00,
        priceUnit: '$/kg',
        criticalLevel: 'High',
        supplyRisk: 'High - Critical for magnet industry',
        demandTrend: 'Growing with neodymium demand'
    }
}

export default function MaterialDetailPage() {
    const params = useParams()
    const symbol = params.symbol as string
    const material = MATERIALS_DATA[symbol]
    const [showProModal, setShowProModal] = useState(false)

    if (!material) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-geo-dark to-black text-white pt-32 pb-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-geo-gold transition-colors mb-6">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                    <h1 className="text-4xl font-bold">Material not found</h1>
                    <p className="text-gray-400 mt-4">The requested rare earth material does not exist.</p>
                </div>
            </main>
        )
    }

    const getCriticalColor = (level: string) => {
        switch (level) {
            case 'High': return 'text-red-400 bg-red-400/10 border-red-400/30'
            case 'Medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
            case 'Low': return 'text-green-400 bg-green-400/10 border-green-400/30'
            default: return 'text-gray-400'
        }
    }

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
                    className="flex flex-col md:flex-row md:items-start gap-8 mb-12"
                >
                    {/* Element Symbol Card */}
                    <div className="flex-shrink-0">
                        <div className="w-32 h-32 bg-gradient-to-br from-geo-gold/20 to-yellow-600/10 rounded-2xl border border-geo-gold/30 flex flex-col items-center justify-center">
                            <span className="text-5xl font-bold text-geo-gold">{material.symbol}</span>
                            <span className="text-sm text-gray-400 mt-1">{material.atomicNumber}</span>
                        </div>
                    </div>

                    {/* Title & Info */}
                    <div className="flex-1">
                        <span className="text-geo-gold text-sm font-medium tracking-widest uppercase">{material.category}</span>
                        <h1 className="text-4xl md:text-5xl font-bold mt-2">{material.name}</h1>
                        <p className="text-gray-400 mt-4 max-w-2xl">{material.description}</p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-3 mt-6">
                            <span className={`px-3 py-1.5 text-sm font-medium rounded-full border ${getCriticalColor(material.criticalLevel)}`}>
                                {material.criticalLevel} Criticality
                            </span>
                            {material.price && (
                                <span className="px-3 py-1.5 text-sm font-medium rounded-full bg-white/5 border border-white/10 text-white">
                                    ${material.price} {material.priceUnit}
                                </span>
                            )}
                        </div>
                    </div>
                </motion.div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Applications */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="bg-white/5 rounded-xl border border-white/10 p-6"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <Factory className="w-5 h-5 text-geo-gold" />
                                <h2 className="text-xl font-bold">Key Applications</h2>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {material.applications.map((app, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-black/30 rounded-lg">
                                        <div className="w-2 h-2 rounded-full bg-geo-gold" />
                                        <span className="text-gray-300">{app}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.section>

                        {/* Major Producers */}
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
                        </motion.section>

                        {/* Supply & Demand */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="bg-white/5 rounded-xl border border-white/10 p-6"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <TrendingUp className="w-5 h-5 text-geo-gold" />
                                <h2 className="text-xl font-bold">Supply–Demand Analysis</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-black/30 rounded-lg">
                                    <h3 className="text-sm text-gray-400 mb-1">Supply Risk Assessment</h3>
                                    <p className="text-white">{material.supplyRisk}</p>
                                </div>
                                <div className="p-4 bg-black/30 rounded-lg">
                                    <h3 className="text-sm text-gray-400 mb-1">Current Demand Conditions</h3>
                                    <p className="text-white">{material.demandTrend}</p>
                                </div>
                            </div>
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
                                    <h3 className="font-semibold mb-1">Market Outlook (Analytical View)</h3>
                                    <p className="text-sm text-gray-400">Analytical market overview</p>
                                </div>
                                <div className="p-4 bg-black/30 rounded-lg border border-white/10">
                                    <h3 className="font-semibold mb-1">Price Alerts</h3>
                                    <p className="text-sm text-gray-400">Real-time notifications</p>
                                </div>
                            </div>

                            <button className="w-full mt-6 py-3 bg-gradient-to-r from-geo-gold to-yellow-600 text-black font-bold rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all">
                                Subscribe for Pro Access
                            </button>
                        </motion.div>

                        {/* Related Materials */}
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
                                {Object.values(MATERIALS_DATA)
                                    .filter(m => m.symbol !== symbol)
                                    .slice(0, 4)
                                    .map((m) => (
                                        <Link
                                            key={m.symbol}
                                            href={`/materials/${m.symbol}`}
                                            className="flex items-center justify-between p-3 bg-black/30 rounded-lg hover:bg-white/5 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-geo-gold font-bold">{m.symbol}</span>
                                                <span className="text-gray-300">{m.name}</span>
                                            </div>
                                            <span className="text-gray-500">→</span>
                                        </Link>
                                    ))
                                }
                            </div>
                        </motion.div>
                    </div>
                </div>

            </div>
        </main>
    )
}
