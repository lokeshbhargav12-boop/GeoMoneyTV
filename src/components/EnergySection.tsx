'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sun, Wind, Droplets, Atom, Flame, Globe2, Zap, ArrowRight } from 'lucide-react'

const ENERGY_HIGHLIGHTS = [
    { name: 'Solar', icon: Sun, capacity: '1,419 GW', growth: '+26.1%', color: 'from-yellow-500 to-orange-500', text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    { name: 'Wind', icon: Wind, capacity: '1,017 GW', growth: '+12.4%', color: 'from-cyan-400 to-blue-500', text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    { name: 'Hydropower', icon: Droplets, capacity: '1,392 GW', growth: '+1.8%', color: 'from-blue-400 to-indigo-500', text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { name: 'Nuclear', icon: Atom, capacity: '413 GW', growth: '+3.2%', color: 'from-purple-400 to-violet-600', text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { name: 'Hydrogen', icon: Flame, capacity: '~1.4 GW', growth: '+94%', color: 'from-emerald-400 to-teal-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { name: 'Geothermal', icon: Globe2, capacity: '16.1 GW', growth: '+3.5%', color: 'from-red-400 to-rose-600', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
]

export default function EnergySection() {
    return (
        <section className="border-t border-white/10 bg-gradient-to-br from-geo-dark via-emerald-950/10 to-black py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-10 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-5 h-5 text-emerald-400" />
                            <span className="text-emerald-400 text-xs font-bold tracking-widest uppercase">Energy</span>
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight">
                            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                                Renewable Energy
                            </span>{' '}
                            Intelligence
                        </h2>
                        <p className="mt-2 text-gray-500 text-sm">
                            Track the global energy transition — solar, wind, nuclear, hydrogen & more
                        </p>
                    </div>
                    <Link
                        href="/energy"
                        className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-2 transition-colors group"
                    >
                        Explore Hub
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {ENERGY_HIGHLIGHTS.map((source, idx) => {
                        const Icon = source.icon
                        return (
                            <motion.div
                                key={source.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: idx * 0.1 }}
                                viewport={{ once: true }}
                            >
                                <Link
                                    href="/energy"
                                    className={`group relative block overflow-hidden rounded-xl border ${source.border} ${source.bg} p-5 backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-lg`}
                                >
                                    {/* Gradient top accent */}
                                    <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${source.color}`} />

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${source.bg} border ${source.border}`}>
                                                <Icon className={`w-5 h-5 ${source.text}`} />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">{source.name}</h3>
                                                <div className="text-xs text-gray-500">Installed: {source.capacity}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-sm font-bold ${source.growth.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                                                {source.growth}
                                            </div>
                                            <div className="text-[10px] text-gray-500">YoY Growth</div>
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-emerald-400">→</span>
                                    </div>
                                </Link>
                            </motion.div>
                        )
                    })}
                </div>

                {/* CTA */}
                <div className="mt-10 text-center">
                    <Link
                        href="/energy"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 font-medium hover:bg-emerald-500/20 transition-all"
                    >
                        Explore Energy Hub
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </section>
    )
}
