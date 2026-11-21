import Link from "next/link";
import { CheckCircle, ShieldCheck } from "lucide-react";
import PricingCards from "@/components/entitlement/PricingCards";
import { ADVANCED_PLAN, BASIC_PLAN, PRO_PLAN } from "@/lib/entitlements";

export const metadata = {
  title: "Pricing & Access | GeoMoney",
  description:
    "GeoMoney Intelligence Platform pricing, access tiers, and early access details.",
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-geo-dark via-black to-geo-dark text-white pt-32 pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="text-sm tracking-[0.3em] text-geo-gold/80 font-semibold">
            GEOMONEY INTELLIGENCE PLATFORM
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mt-4">
            Pricing & Access
          </h1>
          <p className="mt-4 text-base text-gray-400 leading-relaxed">
            Choose how you explore geopolitics, energy systems, critical materials and the
            forces shaping global markets. Free and Basic are available today; Advanced and
            Pro are on the way and collecting early interest.
          </p>
        </div>

        {/* Free -> Basic -> Advanced -> Pro (single source: src/lib/entitlements.ts) */}
        <PricingCards className="mb-12" />

        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 mb-12">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <h2 className="text-lg font-semibold text-amber-300">
                Checkout & Availability
              </h2>
              <p className="text-sm text-gray-200 leading-relaxed mt-2">
                <strong>{BASIC_PLAN.name}</strong> ({BASIC_PLAN.priceLabel}) is the paid
                subscription available at launch and uses Stripe&apos;s secure hosted checkout.
                Review the final price and applicable taxes before payment, then manage billing
                from your profile. <strong>{ADVANCED_PLAN.name}</strong> ({ADVANCED_PLAN.statusLabel})
                and <strong>{PRO_PLAN.name}</strong> ({PRO_PLAN.statusLabel}) are not yet available
                for purchase — no checkout or payment is enabled for them while they remain in
                development.
              </p>
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-white/10 bg-black/40 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Billing & Subscription Information
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            Basic: {BASIC_PLAN.priceLabel}, billed monthly in USD. Renews automatically until
            cancelled. Applicable taxes may be added at checkout.
          </p>
          <p className="mt-3 text-sm text-gray-300 leading-relaxed">
            Advanced and Pro are not yet sold. Their cards collect demand through{" "}
            &ldquo;{ADVANCED_PLAN.cta.label}&rdquo; and &ldquo;{PRO_PLAN.cta.label}&rdquo; —
            no payment details are collected for tiers that are not activated.
          </p>
          <p className="mt-3 text-sm text-gray-300 leading-relaxed">
            Cancel before your next renewal. The final subscription price and terms will be
            displayed before purchase.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-300">
            {BASIC_PLAN.features.slice(0, 4).map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-geo-gold" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
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
