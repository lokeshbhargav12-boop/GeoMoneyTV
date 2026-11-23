import "server-only";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AI_TRIAL, buildAiTrialMessage } from "@/lib/entitlements";
import { getViewerSubscriptionState } from "@/lib/subscription-state";

/**
 * Free AI trial guard rail (see AI_TRIAL in src/lib/entitlements.ts).
 *
 * Counted AI tools call `checkAiTrial()` before doing any work and
 * `consumeAiTrialUse()` once per allowed attempt. Free accounts and guests get
 * `AI_TRIAL.tries` attempts combined across the counted tools; Basic and above
 * are unlimited; platform admins bypass the trial entirely (see
 * subscription-state.ts).
 *
 * The counter is a server-managed cookie (`gm_ai_tries`) so it survives
 * sessions without a schema change. Blocked attempts answer with
 * `{ code: "AI_TRIAL_LIMIT" }` — every AI surface turns that into the upgrade
 * popup (<AiLimitModal />).
 */

const COOKIE_NAME = "gm_ai_tries";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export interface AiTrialCheck {
  /** False when the viewer must upgrade before the tool will respond. */
  allowed: boolean;
  /** True when the viewer's tier is subject to the trial (free account or guest). */
  limited: boolean;
  used: number;
  remaining: number;
  limit: number;
}

function readUsed(): number {
  const raw = cookies().get(COOKIE_NAME)?.value;
  const parsed = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function writeUsed(used: number): void {
  cookies().set(COOKIE_NAME, String(used), {
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    sameSite: "lax",
    httpOnly: true,
  });
}

/** Resolve the free-AI-trial state for the current request. */
export async function checkAiTrial(): Promise<AiTrialCheck> {
  const limit = AI_TRIAL.tries;
  const { tier } = await getViewerSubscriptionState();

  if (tier !== "guest" && tier !== "free") {
    return { allowed: true, limited: false, used: 0, remaining: limit, limit };
  }

  const used = readUsed();
  const remaining = Math.max(0, limit - used);
  return { allowed: remaining > 0, limited: true, used, remaining, limit };
}

/**
 * Record one fulfilled attempt and return the remaining tries afterwards.
 * Call right before returning a real (non-error) response so provider
 * failures never burn a free try.
 */
export function consumeAiTrialUse(check: AiTrialCheck): number {
  if (!check.limited) return check.limit;
  const used = check.used + 1;
  writeUsed(used);
  return Math.max(0, check.limit - used);
}

/** Trial-state fields added to counted AI responses ({} for unlimited viewers). */
export function aiTrialPayload(check: AiTrialCheck, remainingAfter: number) {
  return check.limited ? { aiTrial: { limit: check.limit, remaining: remainingAfter } } : {};
}

/** Standard blocked response for counted AI routes. */
export function aiTrialBlockedResponse(check: AiTrialCheck): NextResponse {
  return NextResponse.json(
    {
      error: buildAiTrialMessage(),
      code: "AI_TRIAL_LIMIT",
      limit: check.limit,
      remaining: 0,
      upgradeUrl: AI_TRIAL.presentation.primaryCta.href,
    },
    { status: 403 },
  );
}
