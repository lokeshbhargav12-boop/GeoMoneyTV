import Link from "next/link";
import { BarChart3, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "GeoMoney Analytics | Coming Soon",
  description: "GeoMoney Analytics is launching in a future platform release.",
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
          <p className="mt-3 text-xl text-geo-gold font-semibold">Coming Soon</p>
          <p className="mt-4 text-sm sm:text-base text-gray-400 leading-relaxed">
            Advanced Analytics will be introduced in a future platform release.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full bg-geo-gold px-6 py-3 text-sm font-semibold text-black hover:bg-yellow-500 transition-colors"
            >
              View Pricing
            </Link>
            <Link
              href="/features/newsletter"
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:border-geo-gold/40 hover:text-geo-gold transition-colors"
            >
              Explore The GeoMoney Brief
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}