"use client";

import Link from "next/link";
import { ArrowRight, BellRing, Crown } from "lucide-react";
import { ADVANCED_PLAN, BASIC_PLAN, FREE_PLAN, PRO_PLAN } from "@/lib/entitlements";

/**
 * Homepage membership call-to-action. Reflects the live commercial state from
 * src/lib/entitlements.ts: Free and Basic are available now (Start Free /
 * Get Basic); Advanced and Pro are not purchasable and collect interest only.
 */
export default function MembershipCta() {
  return (
    <section
      id="membership"
      className="bg-gradient-to-b from-geo-dark to-black py-20 px-4 text-center border-t border-white/10 relative z-10 w-full overflow-hidden"
    >
      <div className="inline-flex items-center gap-2 rounded-full bg-geo-gold/10 border border-geo-gold/25 px-4 py-1.5 text-xs font-semibold text-geo-gold mb-4">
        <Crown className="w-3.5 h-3.5" />
        GeoMoney Basic — Available now
      </div>
      <h2 className="text-3xl font-bold text-white mb-4">Join GeoMoney Basic</h2>
      <p className="text-gray-300 max-w-2xl mx-auto mb-3 font-medium">
        {BASIC_PLAN.description}
      </p>
      <p className="text-gray-400 max-w-2xl mx-auto mb-8 text-sm">
        {BASIC_PLAN.priceLabel}, cancel anytime. {FREE_PLAN.name} accounts can start today
        with public research, GeoMoney TV and selected platform access — and{" "}
        {ADVANCED_PLAN.name} and {PRO_PLAN.name} are on the way.
      </p>
      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href={BASIC_PLAN.cta.href || "/payment"}
          className="inline-flex items-center gap-2 rounded-lg bg-geo-gold px-8 py-4 font-bold text-black hover:bg-yellow-500 transition-colors"
        >
          {BASIC_PLAN.cta.label}
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href={FREE_PLAN.cta.href || "/auth/register"}
          className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-8 py-4 font-semibold text-white hover:border-geo-gold/40 hover:text-geo-gold transition-colors"
        >
          {FREE_PLAN.cta.label}
        </Link>
      </div>
      <div className="mt-5 flex flex-col items-center justify-center gap-2 text-xs text-gray-400 sm:flex-row sm:gap-4">
        <Link href="/pricing" className="underline hover:text-geo-gold transition-colors">
          Compare all plans
        </Link>
        <span className="hidden sm:inline">·</span>
        <span className="inline-flex items-center gap-1.5">
          <BellRing className="w-3.5 h-3.5 text-geo-gold" />
          Advanced and Pro are collecting early interest — Notify Me / Request Early Access
          on the pricing page.
        </span>
      </div>
    </section>
  );
}
