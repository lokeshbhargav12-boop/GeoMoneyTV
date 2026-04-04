'use client'

import Link from 'next/link'
import { ArrowLeft, BrainCircuit, AlertTriangle, CheckCircle, XCircle, Shield, Eye, BarChart3, Ban, Sparkles } from 'lucide-react'

export default function AiGuidelinesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-geo-dark via-black to-geo-dark text-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <Link href="/about" className="inline-flex items-center gap-2 text-gray-400 hover:text-geo-gold transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to About
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <BrainCircuit className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Research Methodology & AI Transparency</h1>
          </div>
        </div>

        {/* Important Disclaimer */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 mb-8 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-400 mb-2">Important Disclaimer</h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-3">
              GeoMoney provides geopolitical and macroeconomic intelligence for informational purposes only.
            </p>
            <p className="text-gray-300 text-sm leading-relaxed mb-2">Nothing on this platform constitutes:</p>
            <ul className="text-gray-300 text-sm space-y-1 ml-4">
              <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">•</span> Financial advice</li>
              <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">•</span> Investment recommendations</li>
              <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">•</span> Trading signals</li>
              <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">•</span> An offer to buy or sell any asset</li>
            </ul>
            <p className="text-gray-300 text-sm leading-relaxed mt-3">
              GeoMoney is not a registered investment advisor, broker, or financial institution. All content reflects analytical opinions based on publicly available information and proprietary frameworks. Users must conduct their own independent research and consult qualified professionals before making financial decisions.
            </p>
          </div>
        </div>

        <div className="prose prose-invert prose-lg max-w-none space-y-8">

          {/* AI Use & Methodology */}
          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold text-purple-400">AI Use & Methodology</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              GeoMoney incorporates AI-assisted analysis as part of its research and analytical process. AI tools are used to support:
            </p>
            <ul className="text-gray-300 space-y-2 ml-4">
              <li className="flex items-start gap-2"><span className="text-purple-400 mt-1">•</span> Data synthesis</li>
              <li className="flex items-start gap-2"><span className="text-purple-400 mt-1">•</span> Pattern identification</li>
              <li className="flex items-start gap-2"><span className="text-purple-400 mt-1">•</span> Scenario development</li>
              <li className="flex items-start gap-2"><span className="text-purple-400 mt-1">•</span> Content structuring</li>
            </ul>
            <p className="text-gray-300 leading-relaxed">
              AI outputs are integrated within a broader analytical framework and are not used in isolation.
            </p>
            <p className="text-gray-300 leading-relaxed">
              AI-assisted components are non-deterministic and may reflect:
            </p>
            <ul className="text-gray-300 space-y-2 ml-4">
              <li className="flex items-start gap-2"><span className="text-purple-400 mt-1">•</span> Data limitations</li>
              <li className="flex items-start gap-2"><span className="text-purple-400 mt-1">•</span> Modeling assumptions</li>
              <li className="flex items-start gap-2"><span className="text-purple-400 mt-1">•</span> Interpretive constraints</li>
            </ul>
            <p className="text-gray-300 leading-relaxed">
              AI-generated or AI-assisted content should be interpreted as analytical perspective, not definitive conclusions.
            </p>
          </section>

          {/* Human Oversight */}
          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold text-purple-400">Human Oversight</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              GeoMoney maintains human oversight across all published content. AI-assisted outputs are:
            </p>
            <ul className="text-gray-300 space-y-2 ml-4">
              <li className="flex items-start gap-2"><span className="text-purple-400 mt-1">•</span> Reviewed</li>
              <li className="flex items-start gap-2"><span className="text-purple-400 mt-1">•</span> Validated</li>
              <li className="flex items-start gap-2"><span className="text-purple-400 mt-1">•</span> Contextualized</li>
            </ul>
            <p className="text-gray-300 leading-relaxed">
              Human judgment remains the primary driver of analysis. AI supports the process — it does not replace it.
            </p>
          </section>

          {/* AI Language Standards */}
          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-purple-400">AI Language Standards</h2>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="font-bold text-green-400">We Use</span>
                </div>
                <ul className="text-gray-300 text-sm space-y-1.5">
                  <li>"Analysis suggests…"</li>
                  <li>"Current indicators imply…"</li>
                  <li>"GeoMoney assessment…"</li>
                  <li>"Scenario outlook…"</li>
                </ul>
              </div>
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <span className="font-bold text-red-400">We Avoid</span>
                </div>
                <ul className="text-gray-300 text-sm space-y-1.5">
                  <li>"You should…"</li>
                  <li>"Buy / sell / hold…"</li>
                  <li>"Guaranteed outcome"</li>
                  <li>"High-confidence signal"</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Confidence & Uncertainty */}
          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold text-purple-400">Confidence & Uncertainty</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              GeoMoney may use structured descriptors to communicate analytical conditions. These descriptors:
            </p>
            <ul className="text-gray-300 space-y-2 ml-4">
              <li className="flex items-start gap-2"><span className="text-purple-400 mt-1">•</span> Reflect internal assessment of information quality and system dynamics</li>
              <li className="flex items-start gap-2"><span className="text-purple-400 mt-1">•</span> Do not represent investment signals or outcome probabilities</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-2">Examples:</p>
            <div className="grid grid-cols-3 gap-3 mt-2">
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <div className="text-sm font-bold text-gray-400">GeoMoney Assessment</div>
                <div className="text-xs text-gray-500 mt-1">Moderate Confidence</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <div className="text-sm font-bold text-gray-400">Signal Strength</div>
                <div className="text-xs text-gray-500 mt-1">Limited</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <div className="text-sm font-bold text-gray-400">System State</div>
                <div className="text-xs text-gray-500 mt-1">Tightening</div>
              </div>
            </div>
            <p className="text-gray-400 text-sm italic mt-2">These are descriptive indicators only, not recommendations.</p>
          </section>

          {/* Limitations & Risk Disclosure */}
          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold text-purple-400">Limitations & Risk Disclosure</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">All analysis is subject to:</p>
            <ul className="text-gray-300 space-y-2 ml-4">
              <li className="flex items-start gap-2"><span className="text-purple-400 mt-1">•</span> Incomplete or evolving data</li>
              <li className="flex items-start gap-2"><span className="text-purple-400 mt-1">•</span> Model limitations</li>
              <li className="flex items-start gap-2"><span className="text-purple-400 mt-1">•</span> Changing geopolitical and market conditions</li>
            </ul>
            <p className="text-gray-300 leading-relaxed">Forward-looking assessments are inherently uncertain. GeoMoney makes no guarantees regarding:</p>
            <ul className="text-gray-300 space-y-2 ml-4">
              <li className="flex items-start gap-2"><span className="text-purple-400 mt-1">•</span> Accuracy</li>
              <li className="flex items-start gap-2"><span className="text-purple-400 mt-1">•</span> Completeness</li>
              <li className="flex items-start gap-2"><span className="text-purple-400 mt-1">•</span> Timeliness</li>
              <li className="flex items-start gap-2"><span className="text-purple-400 mt-1">•</span> Outcomes</li>
            </ul>
          </section>

          {/* Prohibited AI Content */}
          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-400" />
              <h2 className="text-xl font-bold text-red-400">Prohibited AI Content</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">GeoMoney AI systems are restricted from generating:</p>
            <ul className="text-gray-300 space-y-2 ml-4">
              <li className="flex items-start gap-2"><span className="text-red-400 mt-1">✕</span> Financial or investment advice</li>
              <li className="flex items-start gap-2"><span className="text-red-400 mt-1">✕</span> Trade execution guidance</li>
              <li className="flex items-start gap-2"><span className="text-red-400 mt-1">✕</span> Guaranteed outcomes</li>
              <li className="flex items-start gap-2"><span className="text-red-400 mt-1">✕</span> Fabricated or misleading content</li>
              <li className="flex items-start gap-2"><span className="text-red-400 mt-1">✕</span> Undisclosed promotional material</li>
            </ul>
          </section>

          {/* Transparency */}
          <section className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h2 className="text-xl font-bold text-purple-400">Transparency</h2>
            <p className="text-gray-300 leading-relaxed">
              Content may incorporate AI-assisted analysis. GeoMoney maintains transparency in how AI is used within its research process.
            </p>
            <p className="text-gray-300 leading-relaxed">
              For inquiries, contact:{' '}
              <a href="mailto:support@geomoneytv.com" className="text-purple-400 hover:underline">support@geomoneytv.com</a>
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
