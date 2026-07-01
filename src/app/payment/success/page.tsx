import Link from "next/link";
import { CheckCircle } from "lucide-react";

export const metadata = {
  title: "Payment Successful — GeoMoney Pro",
  description: "Thank you for subscribing to GeoMoney Pro.",
};

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-geo-dark to-black text-white pt-32 pb-24">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
        <h1 className="text-4xl font-bold mb-4">Welcome to GeoMoney Pro</h1>
        <p className="text-gray-400 mb-8">
          Thank you for your payment. Your Pro membership is being activated.
          You will receive a confirmation email shortly.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-blue-600 px-8 py-3 font-bold text-white hover:bg-blue-700 transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </main>
  );
}
