import "server-only";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { PlanTierId, ViewerTierId } from "@/lib/entitlements";

/**
 * Subscription states that keep entitlements open. Mirrors the OPEN_STATUSES
 * used by the billing API: `past_due` keeps access while Stripe retries the
 * payment; anything else (canceled, unpaid, incomplete, paused, ended)
 * degrades to the free account until resolved.
 */
export const ENTITLED_SUBSCRIPTION_STATUSES = ["active", "trialing", "past_due"] as const;

export interface ViewerSubscriptionState {
  signedIn: boolean;
  /** guest = logged out, free = account without an open subscription. */
  tier: ViewerTierId;
  /** Plan recorded on the open subscription, when present. */
  planKey: PlanTierId | null;
  /** Stripe subscription status of the open subscription, when present. */
  status: string | null;
}

export function planKeyToTier(planKey: string | null | undefined): PlanTierId | null {
  if (planKey === "basic" || planKey === "advanced" || planKey === "pro") return planKey;
  return null;
}

function emptyState(signedIn: boolean): ViewerSubscriptionState {
  return { signedIn, tier: signedIn ? "free" : "guest", planKey: null, status: null };
}

/**
 * Resolve the current viewer's subscription tier from the session and the
 * locally synced Subscription rows (kept current by the Stripe webhook).
 * This is the server-side counterpart of /api/subscription.
 */
export async function getViewerSubscriptionState(): Promise<ViewerSubscriptionState> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return emptyState(false);

  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: [...ENTITLED_SUBSCRIPTION_STATUSES] },
      },
      orderBy: [{ currentPeriodEnd: "desc" }, { createdAt: "desc" }],
      select: { planKey: true, status: true },
    });

    if (!subscription) return emptyState(true);

    // An open subscription always maps to at least Basic; future tiers are
    // recognised as soon as their planKey appears in Stripe metadata.
    const tier = planKeyToTier(subscription.planKey) ?? "basic";
    return {
      signedIn: true,
      tier,
      planKey: tier,
      status: subscription.status,
    };
  } catch (error) {
    console.error("Unable to resolve viewer subscription state:", error);
    return emptyState(true);
  }
}
