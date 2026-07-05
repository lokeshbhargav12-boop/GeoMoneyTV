'use client'

import Link from 'next/link'
import { ArrowLeft, FileText, Mail } from 'lucide-react'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-geo-dark via-black to-geo-dark text-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <Link href="/about" className="inline-flex items-center gap-2 text-gray-400 hover:text-geo-gold transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to About
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-geo-gold/10 border border-geo-gold/20">
            <FileText className="w-8 h-8 text-geo-gold" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Terms & Conditions</h1>
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
            <h2 className="text-xl font-bold text-geo-gold">1. Acceptance of Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              By accessing and using GeoMoney ("the Platform"), you accept and agree to be bound by these Terms and Conditions.
              If you do not agree to these terms, please do not use the Platform.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-geo-gold">2. Description of Service</h2>
            <p className="text-gray-300 leading-relaxed">
              GeoMoney is a subscription-based geopolitical, energy, industrial, and
              critical-materials SaaS platform. The Platform provides news, analysis,
              energy intelligence, critical materials data, and AI-assisted research tools
              for informational and research purposes.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-geo-gold">3. Not Financial Advice</h2>
            <p className="text-gray-300 leading-relaxed">
              All content on GeoMoney is for informational and research purposes only.
              Nothing on this Platform constitutes financial, investment, legal, tax, or
              other professional advice. You should consult with appropriate professionals
              before making any financial decisions. Any actions taken based on information
              from this Platform are solely at your own risk.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-geo-gold">4. Subscription Billing & Auto-Renewal</h2>
            <p className="text-gray-300 leading-relaxed">
              GeoMoney Pro subscriptions are billed on a recurring basis (monthly or
              annually, depending on the plan selected). By subscribing, you authorize
              Paddle, our Merchant of Record, to charge your selected payment method on a
              recurring basis until you cancel.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Subscriptions automatically renew at the end of each billing period unless
              cancelled before the renewal date. You are responsible for cancelling your
              subscription if you do not wish to renew.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-geo-gold">5. Cancellation</h2>
            <p className="text-gray-300 leading-relaxed">
              You may cancel your subscription at any time through your account settings or
              by contacting support. Cancellation will take effect at the end of your
              current billing period, and you will continue to have access until that date.
              No partial refunds will be provided except where required by law.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-geo-gold">6. Payments</h2>
            <p className="text-gray-300 leading-relaxed">
              Payments are processed by Paddle, which acts as Merchant of Record. Paddle
              handles billing, tax collection, and payment processing on our behalf. By
              subscribing, you agree to Paddle's terms and privacy policy in addition to
              ours.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-geo-gold">7. Refund Policy</h2>
            <p className="text-gray-300 leading-relaxed">
              Because GeoMoney Pro is a digital product, all purchases are generally final
              and non-refundable except where required by applicable law. For full details,
              please review our{' '}
              <Link href="/about/refund-policy" className="text-geo-gold hover:underline">Refund Policy</Link>.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-geo-gold">8. Intellectual Property</h2>
            <p className="text-gray-300 leading-relaxed">
              All content, including text, graphics, logos, analyses, and software, is the
              property of Vidyata Hub Inc. and is protected by intellectual property laws.
              You may not reproduce, distribute, or modify any content without prior
              written consent.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-geo-gold">9. User Accounts</h2>
            <p className="text-gray-300 leading-relaxed">
              You are responsible for maintaining the confidentiality of your account
              credentials and for all activities under your account. You agree to notify
              us immediately of any unauthorized use. GeoMoney reserves the right to
              suspend or terminate accounts that violate these terms.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-geo-gold">10. Newsletter & Communications</h2>
            <p className="text-gray-300 leading-relaxed">
              By subscribing to The GeoMoney Brief or The GeoMoney Intelligence Report, you
              consent to receiving periodic emails. You can unsubscribe at any time using
              the link provided in each email. Newsletter content is subject to the same
              disclaimers as all Platform content.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-geo-gold">11. Limitation of Liability</h2>
            <p className="text-gray-300 leading-relaxed">
              Vidyata Hub Inc. shall not be liable for any direct, indirect, incidental, or
              consequential damages arising from the use of, or inability to use, the
              Platform. The content is based on publicly available information and
              analytical interpretation and may not be complete or accurate.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-geo-gold">12. Modifications</h2>
            <p className="text-gray-300 leading-relaxed">
              GeoMoney reserves the right to modify these Terms at any time. Changes will
              be posted on this page with an updated revision date. Continued use of the
              Platform constitutes acceptance of any modifications.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-geo-gold">13. Contact</h2>
            <p className="text-gray-300 leading-relaxed">
              For questions about these Terms, please contact us at{' '}
              <a href="mailto:info@geomoney.com" className="text-geo-gold hover:underline inline-flex items-center gap-1">
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
