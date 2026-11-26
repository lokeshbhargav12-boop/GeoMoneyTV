import Link from "next/link";
import { BarChart3, ArrowLeft } from "lucide-react";
import TierInterestButton from "@/components/entitlement/TierInterestButton";
import { ADVANCED_PLAN } from "@/lib/entitlements";

export const metadata = {
  title: "GeoMoney Analytics | Advanced — Coming Soon",
  description:
    "The GeoMoney Analytics Dashboard is included in the Advanced subscription — Coming Soon.",
};

export default function AnalyticsComingSoonPage() {
  return (
    <main className="min-h-screen bg-geo-dark text-white pt-32 pb-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-geo-gold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] px-8 py-16 text-center shadow-2xl">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-geo-gold/15 border border-geo-gold/30">
            <BarChart3 className="h-6 w-6 text-geo-gold" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            GeoMoney Analytics
          </h1>
          <p className="mt-3 text-xl text-geo-gold font-semibold">Advanced — Coming Soon</p>
          <p className="mt-4 text-sm sm:text-base text-gray-400 leading-relaxed">
            The Analytics Dashboard is part of {ADVANCED_PLAN.name}: {ADVANCED_PLAN.description} It
            will be introduced when the Advanced subscription launches — no checkout or payment
            is enabled while Advanced remains Coming Soon.
          </p>

          {/* Dashboard preview screenshot (design preview) */}
          <div className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-black/40 text-left">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                Dashboard preview
              </span>
              <span className="rounded-full border border-geo-gold/30 bg-geo-gold/10 px-2.5 py-0.5 text-[10px] font-semibold text-geo-gold">
                Design preview
              </span>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/analytics-preview.png"
              alt="Preview of the GeoMoney Analytics dashboard"
              className="w-full"
            />
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <TierInterestButton
              tier="advanced"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-geo-gold px-6 py-3 text-sm font-bold text-black hover:bg-yellow-500 transition-colors"
            />
            <Link
              href="/features/newsletter"
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:border-geo-gold/40 hover:text-geo-gold transition-colors"
            >
              Explore The GeoMoney Brief
            </Link>
          </div>
          <p className="mt-5 text-xs text-gray-500">
            Prefer the full picture?{" "}
            <Link href="/pricing" className="text-gray-400 underline hover:text-geo-gold">
              Compare all plans
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
