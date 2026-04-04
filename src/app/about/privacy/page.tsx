'use client'

import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-geo-dark via-black to-geo-dark text-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <Link href="/about" className="inline-flex items-center gap-2 text-gray-400 hover:text-geo-gold transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to About
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Privacy Policy</h1>
            <p className="text-gray-400 text-sm mt-1">Last updated: March 2026</p>
          </div>
        </div>

        <div className="prose prose-invert prose-lg max-w-none space-y-8">
          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-blue-400">1. Information We Collect</h2>
            <p className="text-gray-300 leading-relaxed">
              We collect information you provide directly, including:
            </p>
            <ul className="text-gray-300 space-y-2 ml-4">
              <li className="flex items-start gap-2"><span className="text-blue-400 mt-1">•</span> Email address (when subscribing to newsletters)</li>
              <li className="flex items-start gap-2"><span className="text-blue-400 mt-1">•</span> Account information (name, email) when registering</li>
              <li className="flex items-start gap-2"><span className="text-blue-400 mt-1">•</span> Usage data and analytics (pages visited, features used)</li>
            </ul>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-blue-400">2. How We Use Your Information</h2>
            <p className="text-gray-300 leading-relaxed">We use collected information to:</p>
            <ul className="text-gray-300 space-y-2 ml-4">
              <li className="flex items-start gap-2"><span className="text-blue-400 mt-1">•</span> Send The GeoMoney Brief and The GeoMoney Intelligence Report</li>
              <li className="flex items-start gap-2"><span className="text-blue-400 mt-1">•</span> Improve and personalize your experience</li>
              <li className="flex items-start gap-2"><span className="text-blue-400 mt-1">•</span> Analyze Platform usage for service improvements</li>
              <li className="flex items-start gap-2"><span className="text-blue-400 mt-1">•</span> Communicate important updates about the Platform</li>
            </ul>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-blue-400">3. Data Sharing</h2>
            <p className="text-gray-300 leading-relaxed">
              We do not sell, rent, or share your personal information with third parties for their marketing purposes.
              We may share data with service providers who assist in operating the Platform (e.g., email delivery services)
              under strict confidentiality agreements.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-blue-400">4. Cookies & Tracking</h2>
            <p className="text-gray-300 leading-relaxed">
              We use essential cookies for Platform functionality (e.g., language preferences, authentication).
              We may use analytics tools to understand how visitors interact with our Platform.
              You can control cookie preferences through your browser settings.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-blue-400">5. Data Security</h2>
            <p className="text-gray-300 leading-relaxed">
              We implement industry-standard security measures to protect your personal information. However, no method of
              transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-blue-400">6. Your Rights</h2>
            <p className="text-gray-300 leading-relaxed">You have the right to:</p>
            <ul className="text-gray-300 space-y-2 ml-4">
              <li className="flex items-start gap-2"><span className="text-blue-400 mt-1">•</span> Access your personal data</li>
              <li className="flex items-start gap-2"><span className="text-blue-400 mt-1">•</span> Request correction or deletion of your data</li>
              <li className="flex items-start gap-2"><span className="text-blue-400 mt-1">•</span> Unsubscribe from newsletters at any time</li>
              <li className="flex items-start gap-2"><span className="text-blue-400 mt-1">•</span> Opt out of non-essential tracking</li>
            </ul>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-blue-400">7. Data Retention</h2>
            <p className="text-gray-300 leading-relaxed">
              We retain your information only for as long as necessary to provide our services and fulfill the purposes
              described in this policy. Newsletter subscriber data is retained until you unsubscribe.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-blue-400">8. International Users</h2>
            <p className="text-gray-300 leading-relaxed">
              If you are accessing GeoMoney TV from the European Union or other regions with data protection laws,
              please note that your data may be processed in jurisdictions with different data protection standards.
              By using the Platform, you consent to such transfer.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-blue-400">9. Contact</h2>
            <p className="text-gray-300 leading-relaxed">
              For privacy-related inquiries, contact us at{' '}
              <a href="mailto:support@geomoney.tv" className="text-blue-400 hover:underline">support@geomoneytv.com</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
