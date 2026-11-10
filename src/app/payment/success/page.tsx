import Link from "next/link";
import { CheckCircle } from "lucide-react";

export const metadata = {
  title: "Payment Successful — GeoMoney Basic",
  description: "Your GeoMoney Basic checkout is complete.",
};

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-geo-dark to-black pt-32 pb-24 text-white">
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
        <CheckCircle className="mx-auto mb-6 h-16 w-16 text-green-500" />
        <h1 className="mb-4 text-4xl font-bold">Welcome to GeoMoney Basic</h1>
        <p className="mb-8 text-gray-400">
          Your Stripe checkout is complete. Your membership may take a few seconds to synchronize.
          Visit your profile to view the subscription, invoices and saved payment methods.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/profile?tab=billing&checkout=success" className="inline-block rounded-lg bg-geo-gold px-8 py-3 font-bold text-black hover:bg-yellow-500">
            View My Billing
          </Link>
          <Link href="/" className="inline-block rounded-lg border border-white/15 px-8 py-3 font-semibold text-white hover:bg-white/5">
            Return to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
