'use client'

import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'

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

        <div className="prose prose-invert prose-lg max-w-none space-y-8">
          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-geo-gold">1. Acceptance of Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              By accessing and using GeoMoney TV ("the Platform"), you accept and agree to be bound by these Terms and Conditions.
              If you do not agree to these terms, please do not use the Platform.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-geo-gold">2. Description of Service</h2>
            <p className="text-gray-300 leading-relaxed">
              GeoMoney TV provides geopolitical and market analysis for informational purposes only. The Platform offers news,
              analysis, energy intelligence, critical materials data, and AI-assisted research tools.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-geo-gold">3. Not Financial Advice</h2>
            <p className="text-gray-300 leading-relaxed">
              All content on GeoMoney TV is for informational and educational purposes only. Nothing on this Platform constitutes
              financial, investment, legal, or other professional advice. You should consult with appropriate professionals before
              making any financial decisions. Any actions taken based on information from this Platform are solely at your own risk.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-geo-gold">4. Intellectual Property</h2>
            <p className="text-gray-300 leading-relaxed">
              All content, including text, graphics, logos, analyses, and software, is the property of GeoMoney TV and is protected
              by intellectual property laws. You may not reproduce, distribute, or modify any content without prior written consent.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-geo-gold">5. User Accounts</h2>
            <p className="text-gray-300 leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities under your
              account. You agree to notify us immediately of any unauthorized use. GeoMoney TV reserves the right to suspend or
              terminate accounts that violate these terms.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-geo-gold">6. Newsletter & Communications</h2>
            <p className="text-gray-300 leading-relaxed">
              By subscribing to The GeoMoney Brief or The GeoMoney Intelligence Report, you consent to receiving periodic emails.
              You can unsubscribe at any time using the link provided in each email. Newsletter content is subject to the same
              disclaimers as all Platform content.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-geo-gold">7. Limitation of Liability</h2>
            <p className="text-gray-300 leading-relaxed">
              GeoMoney TV shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use
              of, or inability to use, the Platform. The content is based on publicly available information and analytical
              interpretation and may not be complete or accurate.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-geo-gold">8. Modifications</h2>
            <p className="text-gray-300 leading-relaxed">
              GeoMoney TV reserves the right to modify these Terms at any time. Changes will be posted on this page with an updated
              revision date. Continued use of the Platform constitutes acceptance of any modifications.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-geo-gold">9. Contact</h2>
            <p className="text-gray-300 leading-relaxed">
              For questions about these Terms, please contact us at{' '}
              <a href="mailto:support@geomoneytv.com" className="text-geo-gold hover:underline">support@geomoneytv.com</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
