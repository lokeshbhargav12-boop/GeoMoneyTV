import Link from "next/link";
import { ArrowRight, CheckCircle, Sparkles } from "lucide-react";

export const metadata = {
  title: "Pricing & Access | GeoMoney",
  description:
    "GeoMoney Intelligence Platform pricing, access tiers, and early access details.",
};

const AVAILABLE_PLANS = [
  {
    name: "Free",
    price: "US$0",
    description: "Explore GeoMoney’s public research and media.",
    features: [
      "Public articles and selected research previews",
      "Open-access energy and critical-materials content",
      "GeoMoney TV videos and editorial updates",
      "Optional newsletter updates",
    ],
    cta: {
      label: "Explore Free Content",
      href: "/news",
    },
  },
  {
    name: "Basic",
    price: "US$39 / month",
    description: "Subscriber research and intelligence.",
    features: [
      "Subscriber-only geopolitical and economic briefings",
      "Research on energy systems, critical materials and supply chains",
      "Member reports and analysis included in Basic",
      "Access to Basic content while subscribed",
    ],
    cta: {
      label: "Join the Basic Waitlist",
      href: "/pricing#waitlist",
    },
    highlight: true,
  },
];

const UPCOMING_PLANS = [
  {
    name: "Advanced",
    subtitle: "Coming Soon",
    description: "Expanded analytical capabilities.",
    features: [
      "Advanced analytics and comparative tools planned",
      "Features and pricing to be announced",
    ],
    status: "Not currently available",
  },
  {
    name: "Pro",
    subtitle: "Coming Soon",
    description: "A future professional intelligence tier.",
    features: [
      "Additional research, monitoring and professional tools planned",
      "Features and pricing to be announced",
    ],
    status: "Not currently available",
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-geo-dark via-black to-geo-dark text-white pt-32 pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="text-sm tracking-[0.3em] text-geo-gold/80 font-semibold">
            GEOMONEY INTELLIGENCE PLATFORM
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mt-4">
            Pricing & Access
          </h1>
          <p className="mt-4 text-base text-gray-400 leading-relaxed">
            Choose how you explore geopolitics, energy systems, critical materials and the
            forces shaping global markets.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 mb-12">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-amber-300">
                Phase 1 — Early Access
              </h2>
              <p className="text-sm text-gray-200 leading-relaxed mt-2">
                GeoMoney is preparing to open paid subscriptions. Joining the Basic waitlist
                is free; it does not create a subscription, collect payment or reserve a price.
              </p>
            </div>
          </div>
        </div>

        <section className="mb-16">
          <h2 className="text-xl font-semibold text-white mb-6">Available & Planned Access</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {AVAILABLE_PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-6 bg-white/5 ${
                  plan.highlight
                    ? "border-geo-gold/40 shadow-[0_0_30px_rgba(212,175,55,0.15)]"
                    : "border-white/10"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                      {plan.name}
                    </p>
                    <p className="text-3xl font-bold text-white mt-2">{plan.price}</p>
                  </div>
                  {plan.highlight && (
                    <span className="rounded-full border border-geo-gold/40 bg-geo-gold/10 px-3 py-1 text-xs font-semibold text-geo-gold">
                      Basic waitlist
                    </span>
                  )}
                </div>
                <p className="mt-4 text-sm text-gray-300 leading-relaxed">{plan.description}</p>
                <ul className="mt-4 space-y-3 text-sm text-gray-300">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-geo-gold mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.cta.href}
                  className={`mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                    plan.highlight
                      ? "bg-geo-gold text-black hover:bg-yellow-500"
                      : "border border-white/20 text-white hover:border-geo-gold/40 hover:text-geo-gold"
                  }`}
                >
                  {plan.cta.label}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-xl font-semibold text-white mb-6">Upcoming Plans</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {UPCOMING_PLANS.map((plan) => (
              <div
                key={plan.name}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                      {plan.name}
                    </p>
                    <p className="text-sm text-geo-gold mt-2 font-semibold">
                      {plan.subtitle}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">{plan.status}</span>
                </div>
                <p className="mt-4 text-sm text-gray-300 leading-relaxed">{plan.description}</p>
                <ul className="mt-4 space-y-3 text-sm text-gray-300">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-gray-500 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-gray-500">{plan.status}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/40 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Billing & Subscription Information
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            Basic: US$39/month, billed monthly in USD when checkout opens. Renews automatically
            until cancelled. Applicable taxes may be added at checkout.
          </p>
          <p className="mt-3 text-sm text-gray-300 leading-relaxed">
            Cancel before your next renewal. The final subscription price and terms will be
            displayed before purchase.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-400">
            <Link href="/about/terms" className="hover:text-geo-gold">
              Terms & Conditions
            </Link>
            <span>·</span>
            <Link href="/about/privacy" className="hover:text-geo-gold">
              Privacy Policy
            </Link>
            <span>·</span>
            <Link href="/about/refund-policy" className="hover:text-geo-gold">
              Refund Policy
            </Link>
          </div>
          <p className="mt-6 text-xs text-gray-500 leading-relaxed">
            GeoMoney provides research and analytical information, not personalized investment,
            financial, legal or tax advice.
          </p>
          <p className="mt-4 text-xs text-gray-500">
            © 2026 Vidyata Hub Inc. All rights reserved. GeoMoney Intelligence Platform and
            GeoMoney TV are operated by Vidyata Hub Inc.
          </p>
        </section>
      </div>
    </main>
  );
}