'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Mail, Bell, Users, Zap, TrendingUp, Globe, Award, CheckCircle } from 'lucide-react'
import { useNewsletter } from '@/hooks/useNewsletter'

const NEWSLETTER_BENEFITS = [
    { icon: Zap, title: 'Weekly Market Intel', description: 'Curated insights on commodities, currencies, and rare earths' },
    { icon: TrendingUp, title: 'Market Interpretation', description: 'Analysis of how global events impact resource markets' },
    { icon: Globe, title: 'Geopolitical Analysis', description: 'How global events impact resource markets' },
    { icon: Award, title: 'Exclusive Research', description: 'Deep dives into emerging opportunities' },
]

const PAST_TOPICS = [
    'The Lithium Supply Crunch: What Investors Need to Know',
    'Rare Earth Elements: China\'s Grip on the Future',
    'Gold in a High-Rate Environment: Safe Haven or Relic?',
    'Copper\'s Critical Role in the Green Transition',
]

export default function NewsletterPage() {
    const { email, setEmail, status, message, handleSubscribe } = useNewsletter()

    return (
        <main className="min-h-screen bg-gradient-to-br from-geo-dark via-black to-geo-dark text-white">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-geo-gold/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
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
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full border border-purple-500/30 mb-6">
                                <Users className="w-4 h-4 text-purple-400" />
                                <span className="text-purple-400 text-sm font-medium">Your Weekly Intelligence Source</span>
                            </div>

                            <h1 className="text-5xl md:text-6xl font-bold mb-6">
                                <span className="text-geo-gold">The GeoMoney</span>
                                <br />
                                Brief
                            </h1>

                            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                                The must-read intelligence brief for serious commodity investors.
                                Get system signals and intelligence delivered to your inbox every week.
                            </p>

                            {/* Social Proof */}
                            <div className="flex items-center gap-4 mb-8">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-geo-gold/50 to-yellow-600/50 border-2 border-geo-dark" />
                                    ))}
                                </div>
                                <div className="text-sm text-gray-400">
                                    Professionals trust our intelligence
                                </div>
                            </div>

                            {/* Subscribe Form */}
                            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 mb-6">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email address"
                                    disabled={status === 'loading' || status === 'success'}
                                    className="flex-1 px-4 py-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-geo-gold disabled:opacity-50"
                                />
                                <button
                                    type="submit"
                                    disabled={status === 'loading' || status === 'success'}
                                    className="px-8 py-4 bg-gradient-to-r from-geo-gold to-yellow-600 text-black font-bold rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Mail className="w-5 h-5" />
                                    {status === 'loading' ? 'Subscribing...' : status === 'success' ? 'Subscribed!' : 'Subscribe Free'}
                                </button>
                            </form>

                            {message && (
                                <div className={`text-sm mb-4 ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                    {message}
                                </div>
                            )}

                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                Free forever. Unsubscribe anytime.
                            </div>
                        </motion.div>

                        {/* Right - Newsletter Preview */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="relative"
                        >
                            {/* Email Preview */}
                            <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 border border-white/10 shadow-2xl">
                                {/* Email Header */}
                                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-geo-gold to-yellow-600 flex items-center justify-center">
                                        <span className="text-black font-bold text-lg">G</span>
                                    </div>
                                    <div>
                                        <div className="font-semibold">The GeoMoney Brief</div>
                                        <div className="text-sm text-gray-400">newsletter@geomoney.tv</div>
                                    </div>
                                </div>

                                {/* Email Content */}
                                <div className="space-y-4">
                                    <div className="text-geo-gold font-bold text-xl">This Week in Commodities</div>

                                    <div className="bg-black/30 rounded-lg p-4">
                                        <div className="text-sm text-gray-400 mb-2">Market Snapshot</div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <span className="text-geo-gold font-medium">Gold</span>
                                                <span className="text-green-400 text-sm ml-2">↑ 2.3%</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-300 font-medium">Silver</span>
                                                <span className="text-red-400 text-sm ml-2">↓ 0.8%</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-300 font-medium">Copper</span>
                                                <span className="text-green-400 text-sm ml-2">↑ 1.5%</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-300 font-medium">Oil</span>
                                                <span className="text-green-400 text-sm ml-2">↑ 3.1%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-sm text-gray-300 leading-relaxed">
                                        This week, gold surged past $2,700 as geopolitical tensions
                                        mounted in Eastern Europe. Meanwhile, copper demand signals
                                        from China suggest a potential supply squeeze...
                                    </div>

                                    <div className="text-geo-gold text-sm font-medium cursor-pointer">
                                        Continue reading →
                                    </div>
                                </div>
                            </div>

                            {/* Decorative glow */}
                            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-purple-500/5 rounded-full blur-3xl" />
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* What You'll Get */}
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
                            What You'll Get <span className="text-geo-gold">Every Week</span>
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {NEWSLETTER_BENEFITS.map((benefit, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                viewport={{ once: true }}
                                className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-geo-gold/30 transition-all"
                            >
                                <benefit.icon className="w-10 h-10 text-geo-gold mb-4" />
                                <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
                                <p className="text-gray-400 text-sm">{benefit.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Past Issues */}
            <section className="border-t border-white/10 py-20 bg-gradient-to-b from-transparent to-purple-500/5">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl font-bold mb-4">
                            Recent <span className="text-geo-gold">Topics Covered</span>
                        </h2>
                    </motion.div>

                    <div className="space-y-4">
                        {PAST_TOPICS.map((topic, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                viewport={{ once: true }}
                                className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10 hover:border-geo-gold/30 transition-all"
                            >
                                <div className="w-10 h-10 rounded-lg bg-geo-gold/10 flex items-center justify-center text-geo-gold font-bold">
                                    #{idx + 1}
                                </div>
                                <span className="text-white">{topic}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    )
}
