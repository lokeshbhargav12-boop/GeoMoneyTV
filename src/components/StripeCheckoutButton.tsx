"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AlertCircle, Loader2, LockKeyhole } from "lucide-react";

export default function StripeCheckoutButton() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startCheckout = async () => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=%2Fpayment");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: "basic" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to start checkout.");
      const destination = new URL(data.url);
      if (!destination.hostname.endsWith(".stripe.com")) throw new Error("Invalid Stripe checkout URL.");
      window.location.assign(destination.toString());
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Unable to start checkout.");
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={startCheckout}
        disabled={loading || status === "loading"}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-geo-gold px-6 py-4 font-bold text-black transition-colors hover:bg-yellow-500 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LockKeyhole className="h-5 w-5" />}
        {status === "unauthenticated" ? "Sign in to Subscribe" : "Continue to Secure Checkout"}
      </button>
      {error && (
        <p className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-left text-xs text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
