'use client'

import Link from 'next/link'
import { CheckCircle, Crown, ArrowRight, Shield, Zap, Globe, BarChart3, Lock } from 'lucide-react'

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Access real-time global macro dashboards, commodity trackers, and market intelligence tools.',
  },
  {
    icon: Globe,
    title: 'Geopolitical Briefings',
    description: 'Receive in-depth analysis on energy flows, supply chains, and international policy shifts.',
  },
  {
    icon: Zap,
    title: 'Exclusive Reports',
    description: 'Unlock The GeoMoney Intelligence Report and members-only weekly briefings.',
  },
  {
    icon: Lock,
    title: 'Ad-Free Experience',
    description: 'Enjoy uninterrupted access to all content without advertisements or paywalls.',
  },
  {
    icon: Shield,
    title: 'Priority Support',
    description: 'Get faster responses from our team and early access to new features and tools.',
  },
  {
    icon: Crown,
    title: 'Member Perks',
    description: 'Participate in exclusive webinars, Q&A sessions, and community discussions.',
  },
]

const PLANS = [
  {
    name: 'Monthly',
    price: '$29',
    period: '/ month',
    description: 'Flexible monthly access to all Pro features.',
    features: [
      'Full analytics dashboard',
      'Weekly intelligence reports',
      'Energy & materials data',
      'Priority support',
      'Cancel anytime',
    ],
    cta: 'Get Pro Access',
    href: '/payment',
    highlighted: true,
  },
  {
    name: 'Annual',
    price: '$290',
    period: '/ year',
    description: 'Save two months with annual billing.',
    features: [
      'Everything in Monthly',
      'Exclusive annual member briefings',
      'Early access to new features',
      'Dedicated support channel',
      'Best value',
    ],
    cta: 'Choose Annual',
    href: '/payment',
    highlighted: false,
  },
]

export default function MembershipPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-geo-dark via-black to-geo-dark text-white pt-32 pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-geo-gold/10 border border-geo-gold/20 px-4 py-1.5 text-sm font-medium text-geo-gold mb-6">
            <Crown className="w-4 h-4" />
            GeoMoney Pro Membership
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Unlock{' '}
            <span className="bg-gradient-to-r from-geo-gold to-yellow-600 bg-clip-text text-transparent">
              Premium Intelligence
            </span>
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed">
            Upgrade to GeoMoney Pro for unlimited access to advanced analytics, exclusive reports,
            and professional tools designed for investors, analysts, and global affairs professionals.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition-all hover:border-geo-gold/30 hover:bg-white/[0.07]"
            >
              <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-geo-gold/10 p-3 border border-geo-gold/20">
                <feature.icon className="w-6 h-6 text-geo-gold" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Choose Your Plan</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-8 transition-all ${
                  plan.highlighted
                    ? 'border-geo-gold/40 bg-geo-gold/5'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-geo-gold px-3 py-1 text-xs font-bold text-black">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-400">{plan.period}</span>
                </div>
                <p className="text-gray-400 text-sm mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-gray-300">
                      <CheckCircle className="w-5 h-5 text-geo-gold shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`flex items-center justify-center gap-2 w-full rounded-lg px-6 py-3 font-bold transition-colors ${
                    plan.highlighted
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Trust / FAQ teaser */}
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            All memberships include a 7-day refund window. You can cancel anytime.
            For questions, review our{' '}
            <Link href="/about/refund-policy" className="text-geo-gold hover:underline">
              Refund Policy
            </Link>{' '}
            or{' '}
            <Link href="/about/contact" className="text-geo-gold hover:underline">
              contact us
            </Link>.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-geo-gold" />
              Secure checkout
            </span>
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-geo-gold" />
              Instant access
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-geo-gold" />
              Cancel anytime
            </span>
          </div>
        </div>
      </div>
    </main>
  )
}
