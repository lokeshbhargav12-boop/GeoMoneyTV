"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BellRing, CheckCircle, Crown, Sparkles } from "lucide-react";
import {
  PLAN_TIERS,
  WAITLIST_SOURCES,
  type PlanTier,
  type PlanTierId,
} from "@/lib/entitlements";
import { useEntitlements } from "@/components/EntitlementProvider";
import WaitlistModal from "@/components/WaitlistModal";

const STATUS_STYLES: Record<PlanTier["status"], string> = {
  available: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  "coming-soon": "border-amber-500/30 bg-amber-500/10 text-amber-300",
  "early-access": "border-purple-500/30 bg-purple-500/10 text-purple-300",
};

function tierToViewerCurrent(planId: PlanTierId, viewerTier: string): boolean {
  if (viewerTier === "guest") return false;
  return viewerTier === planId;
}

/**
 * The platform's pricing/subscription cards. Every surface that lists tiers
 * (marketing pricing page, billing center) renders from the central
 * PLAN_TIERS config in src/lib/entitlements.ts, in display order
 * Free -> Basic -> Advanced -> Pro. Checkout is only ever offered for tiers
 * with `purchasable: true`; future tiers collect interest instead.
 */
export default function PricingCards({ className = "" }: { className?: string }) {
  const { tier: viewerTier } = useEntitlements();
  const [modalSource, setModalSource] = useState<string | null>(null);

  return (
    <div className={className}>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {PLAN_TIERS.map((plan) => {
          const isBasic = plan.id === "basic";
          const isCurrent = tierToViewerCurrent(plan.id, viewerTier);
          return (
            <article
              key={plan.id}
              className={`flex flex-col rounded-2xl border p-6 ${
                isBasic
                  ? "border-geo-gold/40 bg-white/5 shadow-[0_0_30px_rgba(212,175,55,0.15)]"
                  : plan.status === "available"
                    ? "border-white/10 bg-white/5"
                    : "border-white/10 bg-white/[0.03]"
              } ${isCurrent ? "ring-1 ring-emerald-500/50" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{plan.name}</p>
                  <p className="mt-2 whitespace-nowrap text-xl font-bold text-white sm:text-2xl">{plan.priceLabel}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold ${STATUS_STYLES[plan.status]}`}>
                    {plan.statusLabel}
                  </span>
                  {isCurrent && (
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold text-emerald-400">
                      Current plan
                    </span>
                  )}
                  {isBasic && !isCurrent && (
                    <span className="rounded-full border border-geo-gold/40 bg-geo-gold/10 px-3 py-1 text-[10px] font-semibold text-geo-gold">
                      Monthly subscription
                    </span>
                  )}
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-gray-300">{plan.description}</p>

              <ul className="mt-4 flex-1 space-y-3 text-sm text-gray-300">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <CheckCircle
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        plan.status === "available" ? "text-geo-gold" : "text-gray-500"
                      }`}
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.note && (
                <p className="mt-4 rounded-lg border border-white/10 bg-black/30 p-3 text-[11px] leading-relaxed text-gray-500">
                  {plan.note}
                </p>
              )}

              <div className="mt-6">
                {plan.cta.action === "start-free" || plan.cta.action === "checkout" ? (
                  <Link
                    href={plan.cta.href || "/pricing"}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                      isBasic
                        ? "bg-geo-gold text-black hover:bg-yellow-500"
                        : "border border-white/20 text-white hover:border-geo-gold/40 hover:text-geo-gold"
                    }`}
                  >
                    {plan.cta.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setModalSource(
                        plan.id === "pro" ? WAITLIST_SOURCES.pro : WAITLIST_SOURCES.advanced,
                      )
                    }
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-geo-gold/40 hover:text-geo-gold"
                  >
                    {plan.id === "pro" ? <Crown className="h-4 w-4" /> : <BellRing className="h-4 w-4" />}
                    {plan.cta.label}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-gray-500">
        <Sparkles className="h-3.5 w-3.5 text-geo-gold" />
        Advanced and Pro are not yet available for purchase. Their cards collect demand — Notify Me
        and Request Early Access — while their capabilities are completed.
      </p>

      <WaitlistModal
        isOpen={modalSource !== null}
        onClose={() => setModalSource(null)}
        source={modalSource || undefined}
      />
    </div>
  );
}
