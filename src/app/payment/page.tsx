import Link from "next/link";
import { ArrowLeft, CheckCircle, ShieldCheck } from "lucide-react";
import StripeCheckoutButton from "@/components/StripeCheckoutButton";

export const metadata = {
  title: "Subscribe to GeoMoney Basic",
  description: "Secure Stripe checkout for the GeoMoney Basic monthly membership.",
};

const FEATURES = [
  "Global macro analytics dashboard",
  "Exclusive weekly intelligence reports",
  "Advanced energy & critical materials data",
  "Priority support and new feature previews",
];

export default function PaymentPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-geo-dark to-black pt-32 pb-24 text-white">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link href="/pricing" className="mb-8 inline-flex items-center gap-2 text-gray-400 transition-colors hover:text-geo-gold">
          <ArrowLeft className="h-4 w-4" /> Back to Pricing
        </Link>

        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-geo-gold">GeoMoney membership</p>
          <h1 className="mt-3 text-4xl font-bold md:text-5xl">GeoMoney Basic</h1>
          <p className="mx-auto mt-4 max-w-xl text-gray-400">
            Subscribe through Stripe's hosted checkout, then manage your membership from your profile.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 md:p-10">
          <div className="mb-6 flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-geo-gold" />
            <h2 className="text-2xl font-bold">Basic Membership</h2>
          </div>

          <ul className="mb-8 space-y-4 text-gray-300">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-geo-gold" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mb-8 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">US$39</span>
            <span className="text-gray-400">/ month</span>
          </div>

          <StripeCheckoutButton />

          <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-gray-500">
            <ShieldCheck className="h-4 w-4" /> Secure checkout powered by Stripe. Cancel anytime.
          </p>
          <p className="mt-3 text-center text-xs leading-relaxed text-gray-500">
            Renews monthly until cancelled. Applicable taxes and the final amount are shown before payment.
            By subscribing, you agree to our <Link href="/about/terms" className="text-gray-400 underline">Terms</Link> and <Link href="/about/refund-policy" className="text-gray-400 underline">Refund Policy</Link>.
          </p>
        </div>

        <p className="mx-auto mt-12 max-w-2xl text-center text-xs leading-relaxed text-gray-600">
          GeoMoney provides geopolitical, energy, commodity, industrial, and macroeconomic intelligence
          for informational and research purposes only. It does not provide financial, investment, legal, or tax advice.
        </p>
      </div>
    </main>
  );
}
