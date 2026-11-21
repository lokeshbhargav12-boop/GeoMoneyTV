import { NextResponse } from "next/server";
import { getViewerSubscriptionState } from "@/lib/subscription-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Current viewer subscription tier (guest / free / basic / advanced / pro).
 * Client components resolve entitlement state through this endpoint via
 * <EntitlementProvider> so gating stays consistent across the platform.
 */
export async function GET() {
  const state = await getViewerSubscriptionState();
  return NextResponse.json(state, { headers: { "Cache-Control": "no-store" } });
}
