'use client'

import Link from 'next/link'
import { ArrowLeft, RefreshCcw, Mail } from 'lucide-react'

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

        <div className="mb-8 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
          <p className="text-sm text-gray-300 leading-relaxed">
            GeoMoney is owned and operated by{" "}
            <strong className="text-amber-400">Vidyata Hub Inc.</strong>, a corporation
            incorporated under the laws of Canada. Payments are processed by{" "}
            <strong className="text-amber-400">Paddle</strong>, which acts as Merchant of
            Record.
          </p>
        </div>

        <div className="prose prose-invert prose-lg max-w-none space-y-8">
          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-emerald-400">1. Overview</h2>
            <p className="text-gray-300 leading-relaxed">
              GeoMoney provides digital access to geopolitical, energy, commodity,
              industrial, and macroeconomic intelligence through a subscription-based SaaS
              platform. Because our product is delivered digitally, all purchases are
              generally final and non-refundable except where required by applicable law.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-emerald-400">2. Digital Product Refunds</h2>
            <p className="text-gray-300 leading-relaxed">
              GeoMoney Pro subscriptions grant immediate access to digital content,
              reports, analytics, and tools. As a digital product, subscriptions are
              non-refundable once access has been granted, except where required by law.
            </p>
            <p className="text-gray-300 leading-relaxed">
              If you believe you have a valid legal basis for a refund (for example, a
              defect that prevents meaningful access), please contact us and we will
              review your request in accordance with applicable consumer protection laws.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-emerald-400">3. Cancellation</h2>
            <p className="text-gray-300 leading-relaxed">
              You may cancel your GeoMoney Pro subscription at any time through your
              account settings or by contacting support. Cancellation will stop future
              billing at the end of the current billing period. You will continue to have
              access to premium features until the end of your current billing period.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Subscriptions automatically renew unless cancelled before the renewal date.
              It is your responsibility to manage your subscription and cancel before the
              next billing cycle if you do not wish to renew.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-emerald-400">4. Delivery Issues</h2>
            <p className="text-gray-300 leading-relaxed">
              If you experience technical issues that prevent you from accessing your
              subscription, please contact our support team. We will work to resolve the
              issue promptly. Refunds for delivery issues are handled on a case-by-case
              basis and may be issued where access cannot be restored within a reasonable
              time.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-emerald-400">5. Duplicate Charges</h2>
            <p className="text-gray-300 leading-relaxed">
              If you believe you have been charged more than once for the same subscription
              period, please contact us with your transaction details. Verified duplicate
              charges will be refunded in full.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-emerald-400">6. Paddle as Merchant of Record</h2>
            <p className="text-gray-300 leading-relaxed">
              Payments are processed by Paddle, which acts as Merchant of Record for
              GeoMoney. Paddle handles billing, tax collection, and payment processing on
              our behalf. Depending on your jurisdiction, your payment statement may show
              a charge from Paddle or Paddle.com.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-emerald-400">7. Changes to This Policy</h2>
            <p className="text-gray-300 leading-relaxed">
              GeoMoney reserves the right to modify this Refund Policy at any time.
              Changes will be posted on this page with an updated revision date.
              Continued use of the Platform constitutes acceptance of any modifications.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-emerald-400">8. Contact</h2>
            <p className="text-gray-300 leading-relaxed">
              For refund-related inquiries, contact us at{' '}
              <a href="mailto:info@geomoney.com" className="text-emerald-400 hover:underline inline-flex items-center gap-1">
                <Mail className="w-4 h-4" />
                info@geomoney.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
