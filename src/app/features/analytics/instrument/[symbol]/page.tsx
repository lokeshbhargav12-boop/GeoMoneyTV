import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";
import TierInterestButton from "@/components/entitlement/TierInterestButton";
import { ADVANCED_PLAN } from "@/lib/entitlements";

export const metadata = {
  title: "GeoMoney Analytics | Advanced — Coming Soon",
  description:
    "Instrument analytics are included in the GeoMoney Advanced subscription — Coming Soon.",
};

export default function AnalyticsInstrumentComingSoonPage() {
  return (
    <main className="min-h-screen bg-geo-dark text-white pt-32 pb-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/features/analytics"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-geo-gold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Analytics
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
            Instrument-level analytics are part of {ADVANCED_PLAN.name}: {ADVANCED_PLAN.description}{" "}
            Explore The GeoMoney Brief for current intelligence and updates — no checkout or
            payment is enabled while Advanced remains Coming Soon.
          </p>

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
