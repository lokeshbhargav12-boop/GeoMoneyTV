"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle, AlertCircle, Mail } from "lucide-react";

export default function PaymentPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-geo-dark to-black text-white pt-32 pb-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-geo-gold transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Pricing
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            GeoMoney Pro
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Subscription checkout is coming soon. Join the waitlist to be notified when
            GeoMoney Pro becomes available.
          </p>
        </div>

        <div className="bg-white/5 rounded-2xl border border-white/10 p-8 md:p-10">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle className="w-6 h-6 text-geo-gold" />
            <h2 className="text-2xl font-bold">Pro Membership</h2>
          </div>

          <ul className="space-y-4 mb-8 text-gray-300">
            <li className="flex items-start gap-3">
              <span className="text-geo-gold mt-1">•</span>
              <span>Global macro analytics dashboard</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-geo-gold mt-1">•</span>
              <span>Exclusive weekly intelligence reports</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-geo-gold mt-1">•</span>
              <span>Advanced energy & critical materials data</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-geo-gold mt-1">•</span>
              <span>Priority support and new feature previews</span>
            </li>
          </ul>

          <div className="flex items-baseline gap-2 mb-8">
            <span className="text-4xl font-bold text-white">$29</span>
            <span className="text-gray-400">/ month</span>
          </div>

          <div className="mb-6 flex items-start gap-3 rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 text-amber-200 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>
              Checkout is temporarily disabled while we prepare for launch. Join the
              waitlist and we'll notify you as soon as subscriptions are available.
            </span>
          </div>

          <Link
            href="/about/contact"
            className="w-full rounded-lg bg-blue-600 px-6 py-4 font-bold text-white transition-colors hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <Mail className="w-5 h-5" />
            Join the Waitlist
          </Link>

          <p className="mt-4 text-center text-xs text-gray-500">
            Secure checkout powered by Paddle. Cancel anytime.
          </p>
        </div>

        {/* Global Disclaimer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-gray-600 leading-relaxed max-w-2xl mx-auto">
            GeoMoney provides geopolitical, energy, commodity, industrial, and
            macroeconomic intelligence for informational and research purposes only. It
            does NOT provide financial, investment, legal, or tax advice.
          </p>
        </div>
      </div>
    </main>
  );
}
