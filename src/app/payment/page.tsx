"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle, AlertCircle } from "lucide-react";

// TODO: Replace with your real Paddle sandbox/production vendor ID.
const PADDLE_VENDOR_ID = process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID || "";

// TODO: Replace with your real Paddle product/price ID.
const PADDLE_PRICE_ID = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID || "";

declare global {
  interface Window {
    Paddle?: {
      Environment: { set: (env: "sandbox" | "production") => void };
      Setup: (config: { vendor: number }) => void;
      Checkout: {
        open: (config: {
          items: Array<{ priceId: string; quantity?: number }>;
          customer?: { email?: string };
          successUrl?: string;
          closeUrl?: string;
        }) => void;
      };
    };
  }
}

export default function PaymentPage() {
  const [paddleLoaded, setPaddleLoaded] = useState(false);
  const [paddleError, setPaddleError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    if (!PADDLE_VENDOR_ID) {
      setPaddleError(
        "Paddle vendor ID is not configured. Please set NEXT_PUBLIC_PADDLE_VENDOR_ID."
      );
      return;
    }

    if (window.Paddle) {
      setPaddleLoaded(true);
      return;
    }

    const checkPaddle = setInterval(() => {
      if (window.Paddle) {
        setPaddleLoaded(true);
        clearInterval(checkPaddle);
      }
    }, 200);

    return () => clearInterval(checkPaddle);
  }, []);

  useEffect(() => {
    if (!paddleLoaded || !window.Paddle || !PADDLE_VENDOR_ID) return;

    try {
      // Use sandbox when vendor ID looks like a sandbox ID or in development.
      const isSandbox =
        process.env.NODE_ENV === "development" ||
        PADDLE_VENDOR_ID.startsWith("test_");

      if (isSandbox && window.Paddle.Environment) {
        window.Paddle.Environment.set("sandbox");
      }

      window.Paddle.Setup({ vendor: Number(PADDLE_VENDOR_ID) });
    } catch (err) {
      setPaddleError(
        err instanceof Error ? err.message : "Failed to initialize Paddle."
      );
    }
  }, [paddleLoaded]);

  const handleCheckout = () => {
    if (!window.Paddle) {
      setPaddleError("Paddle is not loaded yet. Please try again.");
      return;
    }

    if (!PADDLE_PRICE_ID) {
      setPaddleError(
        "Paddle price ID is not configured. Please set NEXT_PUBLIC_PADDLE_PRICE_ID."
      );
      return;
    }

    setIsCheckingOut(true);

    try {
      window.Paddle.Checkout.open({
        items: [{ priceId: PADDLE_PRICE_ID, quantity: 1 }],
        successUrl: `${window.location.origin}/payment/success`,
        closeUrl: `${window.location.origin}/payment`,
      });
    } catch (err) {
      setPaddleError(
        err instanceof Error ? err.message : "Checkout failed to open."
      );
      setIsCheckingOut(false);
    }
  };

  return (
    <>
      <Script
        src="https://cdn.paddle.com/paddle/v2/paddle.js"
        strategy="afterInteractive"
        onLoad={() => setPaddleLoaded(true)}
        onError={() =>
          setPaddleError("Failed to load Paddle checkout script.")
        }
      />

      <main className="min-h-screen bg-gradient-to-br from-geo-dark to-black text-white pt-32 pb-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-geo-gold transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Unlock GeoMoney Pro
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto">
              Get unlimited access to premium analytics, exclusive intelligence
              reports, and professional tools.
            </p>
          </div>

          <div className="bg-white/5 rounded-2xl border border-white/10 p-8 md:p-10">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="w-6 h-6 text-geo-gold" />
              <h2 className="text-2xl font-bold">Pro Membership</h2>
            </div>

            <ul className="space-y-4 mb-8 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-geo-gold mt-1">•</span>
                <span>Real-time global macro analytics dashboard</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-geo-gold mt-1">•</span>
                <span>Exclusive weekly intelligence reports</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-geo-gold mt-1">•</span>
                <span>Advanced energy & critical materials data</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-geo-gold mt-1">•</span>
                <span>Priority support and new feature previews</span>
              </li>
            </ul>

            <div className="flex items-baseline gap-2 mb-8">
              <span className="text-4xl font-bold text-white">$29</span>
              <span className="text-gray-400">/ month</span>
            </div>

            {paddleError && (
              <div className="mb-6 flex items-start gap-3 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{paddleError}</span>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={!paddleLoaded || isCheckingOut || !PADDLE_VENDOR_ID}
              className="w-full rounded-lg bg-blue-600 px-6 py-4 font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Opening checkout…
                </>
              ) : (
                "Get Pro Access"
              )}
            </button>

            <p className="mt-4 text-center text-xs text-gray-500">
              Secure checkout powered by Paddle. You can cancel anytime.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
