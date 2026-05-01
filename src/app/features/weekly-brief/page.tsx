'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, FileText, Bell, Briefcase, Shield, TrendingUp, Clock, CheckCircle, Crown, Users } from 'lucide-react'
import { useNewsletter } from '@/hooks/useNewsletter'

const BRIEF_FEATURES = [
    { icon: Briefcase, title: 'Executive Summary', description: 'Key market movements distilled into actionable bullet points' },
    { icon: Shield, title: 'Risk Assessment', description: 'Weekly geopolitical and market risk analysis' },
    { icon: TrendingUp, title: 'Sector Spotlight', description: 'Deep dive into a different commodity sector each week' },
    { icon: Crown, title: 'Expert Commentary', description: 'Insights from industry veterans and fund managers' },
]

const TESTIMONIALS = [
    { name: 'Senior Analyst', role: 'Portfolio Manager, Global Fund', quote: 'Essential reading for anyone in commodities.' },
    { name: 'Industry Executive', role: 'CEO, Mining Corp', quote: 'The only brief I read before my Monday meetings.' },
    { name: 'Chief Economist', role: 'Leading Investment Bank', quote: 'Concise, actionable, and always ahead of the curve.' },
]

export default function WeeklyBriefPage() {
    const { email, setEmail, status, message, handleSubscribe } = useNewsletter()

    return (
        <main className="min-h-screen bg-gradient-to-br from-geo-dark via-black to-geo-dark text-white">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -left-40 w-96 h-96 bg-geo-gold/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
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
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-geo-gold/20 rounded-full border border-geo-gold/30 mb-6">
                                <Crown className="w-4 h-4 text-geo-gold" />
                                <span className="text-geo-gold text-sm font-medium">Premium Intelligence</span>
                            </div>

                            <h1 className="text-5xl md:text-6xl font-bold mb-6">
                                <span className="text-geo-gold">The GeoMoney</span>
                                <br />
                                Intelligence Report
                            </h1>

                            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                                The definitive intelligence report trusted by decision makers at the world's
                                leading investment firms, mining companies, and sovereign wealth funds.
                            </p>

                            {/* Credibility Badges */}
                            <div className="grid grid-cols-3 gap-4 mb-8">
                                <div className="text-center">
                                    <div className="text-sm text-gray-400">Decision Makers</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-geo-gold">85%</div>
                                    <div className="text-sm text-gray-400">Open Rate</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-geo-gold">5 min</div>
                                    <div className="text-sm text-gray-400">Read Time</div>
                                </div>
                            </div>

                            {/* Subscribe Form */}
                            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 mb-6">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your corporate email"
                                    disabled={status === 'loading' || status === 'success'}
                                    className="flex-1 px-4 py-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-geo-gold disabled:opacity-50"
                                />
                                <button
                                    type="submit"
                                    disabled={status === 'loading' || status === 'success'}
                                    className="px-8 py-4 bg-gradient-to-r from-geo-gold to-yellow-600 text-black font-bold rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Bell className="w-5 h-5" />
                                    {status === 'loading' ? 'Subscribing...' : status === 'success' ? 'Subscribed!' : 'Get the Brief'}
                                </button>
                            </form>

                            {message && (
                                <div className={`text-sm mb-4 ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                    {message}
                                </div>
                            )}

                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                    Delivered every Monday
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-blue-400" />
                                    Before market open
                                </div>
                            </div>
                        </motion.div>

                        {/* Right - Brief Preview */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="relative"
                        >
                            {/* Document Preview */}
                            <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-8 border border-white/10 shadow-2xl">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-8 h-8 text-geo-gold" />
                                        <div>
                                            <div className="font-bold text-lg">The GeoMoney Intelligence Report</div>
                                            <div className="text-sm text-gray-400">Issue #247 • Week of Jan 27, 2026</div>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 bg-geo-gold/20 text-geo-gold text-xs font-bold rounded-full">
                                        PREMIUM
                                    </div>
                                </div>

                                {/* Content Preview */}
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-geo-gold font-semibold text-sm mb-2">EXECUTIVE SUMMARY</div>
                                        <div className="space-y-2">
                                            <div className="flex items-start gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-geo-gold mt-2" />
                                                <span className="text-sm text-gray-300">Gold breaks $2,800 resistance amid Fed pivot speculation</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-geo-gold mt-2" />
                                                <span className="text-sm text-gray-300">Copper inventories hit 5-year lows; supply crunch imminent</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-geo-gold mt-2" />
                                                <span className="text-sm text-gray-300">China announces new rare earth export restrictions</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-black/30 rounded-lg p-4">
                                        <div className="text-geo-gold font-semibold text-sm mb-2">KEY RISK: ⚠️ HIGH</div>
                                        <div className="text-sm text-gray-300">
                                            Escalating tensions in the South China Sea could disrupt
                                            40% of global shipping routes...
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                        <span className="text-sm text-gray-400">Read time: 5 minutes</span>
                                        <span className="text-geo-gold text-sm font-medium cursor-pointer">
                                            View full brief →
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative glow */}
                            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-geo-gold/5 rounded-full blur-3xl" />
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* What's Inside */}
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
                            What's Inside <span className="text-geo-gold">Every Brief</span>
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {BRIEF_FEATURES.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                viewport={{ once: true }}
                                className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-geo-gold/30 transition-all"
                            >
                                <feature.icon className="w-10 h-10 text-geo-gold mb-4" />
                                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                                <p className="text-gray-400 text-sm">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="border-t border-white/10 py-20 bg-gradient-to-b from-transparent to-geo-gold/5">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl font-bold mb-4">
                            Trusted by <span className="text-geo-gold">Industry Leaders</span>
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {TESTIMONIALS.map((testimonial, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                viewport={{ once: true }}
                                className="bg-white/5 rounded-xl border border-white/10 p-6"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-geo-gold/50 to-yellow-600/50" />
                                    <div>
                                        <div className="font-semibold">{testimonial.name}</div>
                                        <div className="text-sm text-gray-400">{testimonial.role}</div>
                                    </div>
                                </div>
                                <p className="text-gray-300 italic">"{testimonial.quote}"</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    )
}
