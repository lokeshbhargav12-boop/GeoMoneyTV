'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

export default function MembershipPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-geo-dark via-black to-geo-dark text-white pt-32 pb-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
          <div className="flex items-start gap-3 text-left">
            <Sparkles className="w-5 h-5 text-amber-400 mt-0.5" />
            <div>
              <h1 className="text-2xl font-semibold text-white">Membership & Plans</h1>
              <p className="mt-2 text-sm text-gray-200 leading-relaxed">
                Pricing and access details have moved to the Pricing page so we can keep
                everything in one place.
              </p>
            </div>
          </div>
          <Link
            href="/pricing"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-geo-gold px-6 py-3 text-sm font-semibold text-black hover:bg-yellow-500 transition-colors"
          >
            View Pricing
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          GeoMoney provides research and analytical information, not personalized investment,
          financial, legal or tax advice.
        </p>
      </div>
    </main>
  )
}
