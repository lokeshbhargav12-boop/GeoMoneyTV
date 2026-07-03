'use client'

import Link from 'next/link'
import { ArrowLeft, RefreshCcw } from 'lucide-react'

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-geo-dark via-black to-geo-dark text-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <Link href="/about" className="inline-flex items-center gap-2 text-gray-400 hover:text-geo-gold transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to About
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <RefreshCcw className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Refund Policy</h1>
            <p className="text-gray-400 text-sm mt-1">Last updated: March 2026</p>
          </div>
        </div>

        <div className="prose prose-invert prose-lg max-w-none space-y-8">
          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-emerald-400">1. Overview</h2>
            <p className="text-gray-300 leading-relaxed">
              At GeoMoney TV, we strive to deliver high-quality geopolitical analysis and market intelligence.
              If you are not satisfied with your Pro Membership purchase, you may request a refund under the terms outlined below.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-emerald-400">2. Subscription Refunds</h2>
            <p className="text-gray-300 leading-relaxed">
              Pro Memberships are billed on a monthly basis. You may request a full refund within 7 days of your initial purchase
              or within 7 days of any automatic renewal if you have not substantially used the premium features during that billing period.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Refund requests made after the 7-day window will be reviewed on a case-by-case basis, but are not guaranteed.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-emerald-400">3. Non-Refundable Items</h2>
            <p className="text-gray-300 leading-relaxed">
              The following are generally not eligible for refunds:
            </p>
            <ul className="text-gray-300 space-y-2 ml-4">
              <li className="flex items-start gap-2"><span className="text-emerald-400 mt-1">•</span> Partially used subscription periods</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 mt-1">•</span> Promotional or discounted purchases unless otherwise stated</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 mt-1">•</span> Any third-party fees or currency conversion charges</li>
            </ul>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-emerald-400">4. How to Request a Refund</h2>
            <p className="text-gray-300 leading-relaxed">
              To request a refund, please contact us at{' '}
              <a href="mailto:support@geomoneytv.com" className="text-emerald-400 hover:underline">support@geomoneytv.com</a>{' '}
              with your account email, transaction details, and the reason for your request. We aim to process refund requests within 5-7 business days.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-emerald-400">5. Cancellation</h2>
            <p className="text-gray-300 leading-relaxed">
              You may cancel your Pro Membership at any time from your account settings or by contacting support.
              Cancellation will stop future billing; you will continue to have access to premium features until the end of your current billing period.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-emerald-400">6. Disputes & Chargebacks</h2>
            <p className="text-gray-300 leading-relaxed">
              We encourage you to contact us directly before initiating a chargeback or payment dispute.
              Unresolved disputes may result in suspension of your account and access to the Platform.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-emerald-400">7. Changes to This Policy</h2>
            <p className="text-gray-300 leading-relaxed">
              GeoMoney TV reserves the right to modify this Refund Policy at any time. Changes will be posted on this page with an updated revision date.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-emerald-400">8. Contact</h2>
            <p className="text-gray-300 leading-relaxed">
              For refund-related inquiries, contact us at{' '}
              <a href="mailto:support@geomoneytv.com" className="text-emerald-400 hover:underline">support@geomoneytv.com</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
