'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Smartphone, Bell, Download, Star, Zap, Globe, Shield, Clock } from 'lucide-react'
import { useNewsletter } from '@/hooks/useNewsletter'

const FEATURES = [
    { icon: Globe, title: 'Global Market Access', description: 'Track commodities, currencies, and rare earths worldwide' },
    { icon: Zap, title: 'Real-Time Alerts', description: 'Instant notifications for price movements and news' },
    { icon: Shield, title: 'Secure Portfolio', description: 'Bank-grade encryption for your investment data' },
    { icon: Star, title: 'AI Insights', description: 'Personalized recommendations powered by machine learning' },
]

export default function GeoMoneyAppPage() {
    const { email, setEmail, status, message, handleSubscribe } = useNewsletter()

    return (
        <main className="min-h-screen bg-gradient-to-br from-geo-dark via-black to-geo-dark text-white">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-geo-gold/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
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
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 rounded-full border border-blue-500/30 mb-6">
                                <Clock className="w-4 h-4 text-blue-400" />
                                <span className="text-blue-400 text-sm font-medium">Launching Q1 2026</span>
                            </div>

                            <h1 className="text-5xl md:text-6xl font-bold mb-6">
                                <span className="text-geo-gold">GeoMoney</span>
                                <br />
                                Mobile App
                            </h1>

                            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                                Your pocket-sized command center for global resource intelligence.
                                Track commodities, analyze markets, and make informed decisions—anywhere, anytime.
                            </p>

                            {/* App Store Buttons (Coming Soon) */}
                            <div className="flex flex-wrap gap-4 mb-8">
                                <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-xl border border-white/10">
                                    <Download className="w-6 h-6 text-gray-400" />
                                    <div>
                                        <div className="text-xs text-gray-500">Coming to</div>
                                        <div className="font-semibold">App Store</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-xl border border-white/10">
                                    <Download className="w-6 h-6 text-gray-400" />
                                    <div>
                                        <div className="text-xs text-gray-500">Coming to</div>
                                        <div className="font-semibold">Google Play</div>
                                    </div>
                                </div>
                            </div>

                            {/* Notify Me */}
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
                                    {status === 'loading' ? 'Saving...' : status === 'success' ? 'Notified!' : 'Notify Me'}
                                </button>
                            </form>
                            {message && (
                                <div className={`text-sm mt-3 ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                    {message}
                                </div>
                            )}
                        </motion.div>

                        {/* Right - Phone Mockup */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="flex justify-center"
                        >
                            <div className="relative">
                                {/* Phone Frame */}
                                <div className="w-72 h-[580px] bg-gradient-to-br from-gray-800 to-gray-900 rounded-[3rem] p-3 shadow-2xl border border-white/10">
                                    {/* Screen */}
                                    <div className="w-full h-full bg-gradient-to-br from-geo-dark to-black rounded-[2.5rem] overflow-hidden relative">
                                        {/* Status Bar */}
                                        <div className="flex justify-between items-center px-6 py-3 text-xs text-gray-400">
                                            <span>9:41</span>
                                            <div className="w-20 h-6 bg-black rounded-full" />
                                            <span>100%</span>
                                        </div>

                                        {/* App Content Preview */}
                                        <div className="px-4 pt-4">
                                            <div className="text-geo-gold font-bold text-xl mb-4">GeoMoney</div>

                                            {/* Mini Portfolio */}
                                            <div className="bg-white/5 rounded-xl p-4 mb-4">
                                                <div className="text-gray-400 text-xs mb-1">Portfolio Value</div>
                                                <div className="text-2xl font-bold text-white">$124,532.00</div>
                                                <div className="text-green-400 text-sm">+2.34% today</div>
                                            </div>

                                            {/* Mini Ticker Items */}
                                            <div className="space-y-2">
                                                {['GOLD', 'SILVER', 'COPPER'].map((metal, i) => (
                                                    <div key={metal} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                                                        <span className="text-geo-gold font-medium">{metal}</span>
                                                        <div className="text-right">
                                                            <div className="text-white text-sm font-medium">$2,715.30</div>
                                                            <div className={i % 2 === 0 ? 'text-green-400 text-xs' : 'text-red-400 text-xs'}>
                                                                {i % 2 === 0 ? '+0.45%' : '-0.12%'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Bottom Nav */}
                                        <div className="absolute bottom-0 left-0 right-0 flex justify-around py-4 bg-black/50 backdrop-blur">
                                            {['Home', 'Markets', 'Portfolio', 'Alerts'].map((tab, i) => (
                                                <div key={tab} className={`text-xs ${i === 0 ? 'text-geo-gold' : 'text-gray-500'}`}>
                                                    {tab}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Decorative Elements */}
                                <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
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
                            Powerful Features, <span className="text-geo-gold">Pocket-Sized</span>
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Everything you need to stay ahead in the global commodities market
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {FEATURES.map((feature, idx) => (
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

            {/* CTA Section */}
            <section className="border-t border-white/10 py-16 bg-gradient-to-b from-transparent to-geo-gold/5">
                <div className="mx-auto max-w-3xl px-4 text-center">
                    <h3 className="text-2xl font-bold mb-4">Be the First to Know</h3>
                    <p className="text-gray-400 mb-6">
                        Join our early access list and get exclusive beta access when we launch.
                    </p>
                    <div className="inline-flex items-center gap-4 text-geo-gold">
                        <Smartphone className="w-6 h-6" />
                        <span className="font-medium">Launching Q1 2026</span>
                    </div>
                </div>
            </section>
        </main>
    )
}
