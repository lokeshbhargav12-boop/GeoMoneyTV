/**
 * Central subscription & entitlement configuration.
 *
 * SINGLE SOURCE OF TRUTH for:
 *  - the commercial state of each tier (available / coming soon / early access)
 *  - pricing-card copy, feature lists and calls to action
 *  - which tier each feature/module requires (MODULES below)
 *  - the gating presentation shown when a viewer lacks access
 *
 * Never hard-code tier names, prices, CTAs or feature-to-tier mappings in
 * pages/components. Reassign a module to another tier by editing `MODULES`,
 * and activate a tier by flipping its `status` here — every surface that
 * renders tiers or gate states reads from this file.
 *
 * Commercial state (subscription tier handoff, Nov 2026):
 *   Free - $0 - Available | Basic - $39/month - Available
 *   Advanced - Coming Soon | Pro - Coming Soon / Early Access
 *   Display order everywhere: Free -> Basic -> Advanced -> Pro.
 */

export type PlanTierId = "free" | "basic" | "advanced" | "pro";

/** A viewer of the platform. `guest` = logged out. */
export type ViewerTierId = "guest" | PlanTierId;

/** Order used everywhere subscription tiers are shown. */
export const TIER_DISPLAY_ORDER: PlanTierId[] = ["free", "basic", "advanced", "pro"];

const TIER_RANK: Record<ViewerTierId, number> = {
  guest: 0,
  free: 0,
  basic: 1,
  advanced: 2,
  pro: 3,
};

export function isPlanTierId(value: unknown): value is PlanTierId {
  return value === "free" || value === "basic" || value === "advanced" || value === "pro";
}

/** True when `viewerTier` receives everything `requiredTier` includes. */
export function tierHasAccess(viewerTier: ViewerTierId, requiredTier: PlanTierId): boolean {
  return TIER_RANK[viewerTier] >= TIER_RANK[requiredTier];
}

export type TierAvailability = "available" | "coming-soon" | "early-access";

export type TierCtaAction = "start-free" | "checkout" | "notify" | "request-access";

export interface TierCta {
  label: string;
  action: TierCtaAction;
  /** Present for navigation CTAs (start-free, checkout). */
  href?: string;
}

export interface PlanTier {
  id: PlanTierId;
  name: string;
  status: TierAvailability;
  /** Human-readable status shown on cards, e.g. "Coming Soon / Early Access". */
  statusLabel: string;
  priceLabel: string;
  /** Card description / positioning copy. */
  description: string;
  /** Monthly price in USD when the tier is purchasable. */
  price: number | null;
  /** Whether a public checkout may be offered for this tier. */
  purchasable: boolean;
  cta: TierCta;
  features: string[];
  /** Extra card footnote, e.g. what is explicitly NOT included. */
  note?: string;
}

/** Waitlist / interest-list sources used by the waitlist API metadata. */
export const WAITLIST_SOURCES = {
  basic: "pricing_page",
  advanced: "advanced_notify",
  pro: "pro_early_access",
} as const;

export const PLAN_TIERS: PlanTier[] = [
  {
    id: "free",
    name: "Free",
    status: "available",
    statusLabel: "Available",
    priceLabel: "US$0",
    price: 0,
    purchasable: false, // free accounts are created by signing up, not buying
    description: "Public discovery and limited platform access.",
    cta: { label: "Start Free", action: "start-free", href: "/auth/register" },
    features: [
      "Public GeoMoney Intelligence articles and content",
      "GeoMoney TV content",
      "Public market and reference data",
      "Selected public Energy Hub access",
      "Selected maps and tools",
      "Public Critical Materials pages and basic material information",
      "Limited preview access to selected platform capabilities",
      "AI Navigation Assistant",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    status: "available",
    statusLabel: "Available",
    priceLabel: "US$39 / month",
    price: 39,
    purchasable: true,
    // BASIC CARD COPY (handoff, verbatim).
    description:
      "Full access to GeoMoney's standard intelligence platform, premium research and currently available Energy Hub Beta capabilities.",
    cta: { label: "Get Basic", action: "checkout", href: "/payment" },
    features: [
      "Full standard GeoMoney Intelligence access",
      "GeoMoney Brief — three times a week",
      "Premium intelligence reports",
      "Full standard research and archive access",
      "Energy Hub — Beta",
      "Renewable Energy Systems — available Beta functionality",
      "Fossil Energy Systems — available Beta functionality",
      "Energy Infrastructure — available standard Beta functionality",
      "Energy Chokepoints — available standard Beta functionality",
      "Basic/curated Aperture access where currently enabled",
      "Basic watchlists and saved items where available",
      "Basic alerts and digests where available",
      "Standard GeoMoney AI, research and navigation functionality where enabled",
    ],
  },
  {
    id: "advanced",
    name: "Advanced",
    status: "coming-soon",
    statusLabel: "Coming Soon",
    priceLabel: "Coming soon",
    price: null,
    purchasable: false,
    description:
      "Advanced analytics and cross-system intelligence for deeper research and analysis.",
    cta: { label: "Notify Me", action: "notify" },
    features: [
      "Full Critical Materials Intelligence module",
      "Analytics Dashboard",
      "Advanced Energy Infrastructure analysis",
      "Advanced scenario modelling",
      "Cross-system comparisons",
      "Enhanced Aperture access",
      "Deeper analytical tools",
      "Advanced GeoMoney AI functionality",
      "Selected advanced exports where supported",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    status: "early-access",
    statusLabel: "Coming Soon / Early Access",
    priceLabel: "Coming soon",
    price: null,
    purchasable: false,
    description:
      "Professional monitoring and investigation for users who need deeper intelligence workflows.",
    cta: { label: "Request Early Access", action: "request-access" },
    features: [
      "Everything in Advanced",
      "Expanded/professional Aperture capabilities",
      "Professional monitoring workflows",
      "Investigation workspaces",
      "More advanced alerts",
      "Greater historical depth",
      "Higher usage limits",
      "Advanced scenario and investigation workflows",
      "Expanded professional exports where licensing permits",
      "Priority support",
    ],
    note: "API access, enterprise data feeds and bulk commercial data services are not included in Pro and remain separately licensed.",
  },
];

export function getPlanTier(id: PlanTierId): PlanTier {
  const tier = PLAN_TIERS.find((plan) => plan.id === id);
  if (!tier) throw new Error(`Unknown plan tier: ${id}`);
  return tier;
}

export const FREE_PLAN = getPlanTier("free");
export const BASIC_PLAN = getPlanTier("basic");
export const ADVANCED_PLAN = getPlanTier("advanced");
export const PRO_PLAN = getPlanTier("pro");

/** Badge text for a tier, e.g. "Advanced · Coming Soon". */
export function tierBadgeLabel(tier: PlanTier): string {
  return tier.status === "available" ? tier.name : `${tier.name} · ${tier.statusLabel}`;
}

// ---------------------------------------------------------------------------
// Module registry — feature/module -> required tier.
// ---------------------------------------------------------------------------

export type ModuleKey =
  | "ai-navigation"
  | "energy-hub"
  | "aperture"
  | "premium-research"
  | "critical-materials"
  | "critical-materials-library"
  | "commodity-alerts"
  | "analytics"
  | "professional-workflows";

export interface ModuleEntitlement {
  key: ModuleKey;
  /** Display name used in gate panels and labels. */
  label: string;
  requiredTier: PlanTierId;
  /** One or two sentences of context shown in the gate panel. */
  description: string;
  /** Selected previews stay visible to lower tiers while the full feature is locked. */
  previewForLowerTiers: boolean;
}

/**
 * Free preview for the /materials list — guest/free viewers see only the
 * first N results of the current view; the remainder of the library is
 * covered by the Basic paywall panel (module `critical-materials-library`).
 * Basic and above see the full list.
 */
export const MATERIALS_FREE_PREVIEW_COUNT = 3;

export const MODULES: Record<ModuleKey, ModuleEntitlement> = {
  "ai-navigation": {
    key: "ai-navigation",
    label: "AI Navigation Assistant",
    requiredTier: "free",
    description: "The AI Navigation Assistant is available to everyone, including free accounts.",
    previewForLowerTiers: true,
  },
  "energy-hub": {
    key: "energy-hub",
    label: "Energy Hub — Beta",
    requiredTier: "basic",
    description:
      "This is part of the currently available standard Energy Hub Beta functionality and is included with the GeoMoney Basic subscription.",
    previewForLowerTiers: true,
  },
  aperture: {
    key: "aperture",
    label: "Geomoney Aperture",
    requiredTier: "basic",
    description:
      "Basic/curated Aperture access where currently enabled is included with the GeoMoney Basic subscription. Enhanced and professional Aperture capabilities arrive with Advanced and Pro.",
    previewForLowerTiers: true,
  },
  "premium-research": {
    key: "premium-research",
    label: "Premium research",
    requiredTier: "basic",
    description:
      "Premium intelligence reports and the full standard research and archive are included with the GeoMoney Basic subscription.",
    previewForLowerTiers: true,
  },
  "critical-materials": {
    key: "critical-materials",
    label: "Critical Materials Intelligence",
    requiredTier: "advanced",
    description:
      "Public/SEO-facing material information stays open to everyone, and selected previews are available to Free and Basic accounts. The full Critical Materials Intelligence module is part of GeoMoney Advanced.",
    previewForLowerTiers: true,
  },
  "critical-materials-library": {
    key: "critical-materials-library",
    label: "Critical Materials — Full Library",
    requiredTier: "basic",
    description: `Beyond the free preview of the first ${MATERIALS_FREE_PREVIEW_COUNT} materials, the full Critical Materials library — every tracked material with live reference prices, risk pulse and intelligence — is included with the GeoMoney Basic subscription.`,
    previewForLowerTiers: true,
  },
  "commodity-alerts": {
    key: "commodity-alerts",
    label: "Commodity Threshold Notifications",
    requiredTier: "basic",
    description:
      "Saved commodity threshold notifications are part of the GeoMoney Basic subscription — set custom price thresholds for gold, silver, copper, oil and more.",
    previewForLowerTiers: true,
  },
  analytics: {
    key: "analytics",
    label: "Analytics Dashboard",
    requiredTier: "advanced",
    description:
      "The Analytics Dashboard — advanced analytics and cross-system intelligence — is part of GeoMoney Advanced.",
    previewForLowerTiers: false,
  },
  "professional-workflows": {
    key: "professional-workflows",
    label: "Professional workflows",
    requiredTier: "pro",
    description:
      "Professional monitoring workflows, investigation workspaces and advanced scenario tooling are planned for GeoMoney Pro.",
    previewForLowerTiers: true,
  },
};

export interface GateCta {
  label: string;
  action: "checkout" | "notify" | "request-access";
  /** Navigation target for action "checkout" (the Basic checkout page). */
  href?: string;
  /** Source recorded with waitlist/interest-list signups for notify/request-access. */
  waitlistSource?: string;
}

export interface TierGateState {
  module: ModuleEntitlement;
  allowed: boolean;
  requiredTier: PlanTier;
  badgeLabel: string;
  title: string;
  message: string;
  primaryCta: GateCta;
  secondaryCta: { label: string; href: string };
}

/**
 * Build the presentation for a gated module for the given viewer tier.
 * Consumed by <TierGate /> and any bespoke locked/preview state.
 */
export function buildGateState(moduleKey: ModuleKey, viewerTier: ViewerTierId): TierGateState {
  const module = MODULES[moduleKey];
  const requiredTier = getPlanTier(module.requiredTier);
  const allowed = tierHasAccess(viewerTier, module.requiredTier);

  let title: string;
  let message = module.description;
  let primaryCta: GateCta;

  switch (module.requiredTier) {
    case "free":
      title = "Available";
      primaryCta = {
        label: getPlanTier("free").cta.label, // "Start Free"
        action: "checkout",
        href: getPlanTier("free").cta.href || "/auth/register",
      };
      break;
    case "basic":
      title = "Included with GeoMoney Basic";
      message = `${message} Purchase the ${BASIC_PLAN.name} pack (${BASIC_PLAN.priceLabel}) to unlock it — access opens immediately after payment.`;
      primaryCta = {
        label: getPlanTier("basic").cta.label, // "Get Basic"
        action: "checkout",
        href: getPlanTier("basic").cta.href || "/payment",
      };
      break;
    case "advanced":
      title = "Advanced — Coming Soon";
      message = `${message} Advanced is not yet available for purchase — join the notification list and we will email you when it launches.`;
      primaryCta = {
        label: getPlanTier("advanced").cta.label, // "Notify Me"
        action: "notify",
        waitlistSource: WAITLIST_SOURCES.advanced,
      };
      break;
    case "pro":
      title = "Pro — Coming Soon / Early Access";
      message = `${message} Pro is not yet available for purchase — request early access and we will contact you as places open.`;
      primaryCta = {
        label: getPlanTier("pro").cta.label, // "Request Early Access"
        action: "request-access",
        waitlistSource: WAITLIST_SOURCES.pro,
      };
      break;
  }

  return {
    module,
    allowed,
    requiredTier,
    badgeLabel: tierBadgeLabel(requiredTier),
    title,
    message,
    primaryCta,
    secondaryCta: { label: "Compare plans", href: "/pricing" },
  };
}

// ---------------------------------------------------------------------------
// Free AI trial — guard rail for the counted AI tools.
// ---------------------------------------------------------------------------

/**
 * Free accounts (and logged-out visitors) may use the counted AI tools a
 * limited number of times; afterwards the tools lock and the upgrade popup
 * (<AiLimitModal />) appears. Basic and above are unlimited, and platform
 * admins bypass the trial so demos and QA never lock.
 *
 * Enforced server-side by src/lib/ai-trial.ts via the `gm_ai_tries` cookie.
 * Only user-initiated AI actions are counted — auto-running analysis (article
 * summaries, bias analysis, cached briefs) never consumes a try.
 */
export const AI_TRIAL = {
  /** Free tries across all counted AI tools, combined. */
  tries: 3,
  /** Counted AI tools (user-initiated only) — keep in sync with the routes. */
  countedTools: [
    "AI Navigation Assistant (/api/ai/navigate)",
    "Energy Hub AI analyzer (/api/ai/energy)",
    "Aperture AI Navigator (/api/world-monitor/ai-brief)",
  ],
  /** Upgrade popup copy shown when the free tries are exhausted. */
  presentation: {
    badge: "GeoMoney Basic",
    title: "You've used all your free AI tries",
    primaryCta: { label: "Get Basic", href: "/payment" },
    secondaryCta: { label: "Compare plans", href: "/pricing" },
  },
} as const;

/** Upgrade message used by the popup and by blocked AI responses. */
export function buildAiTrialMessage(): string {
  return `You've used all ${AI_TRIAL.tries} free AI tries. Upgrade to ${BASIC_PLAN.name} (${BASIC_PLAN.priceLabel}) to unlock unlimited AI tools — navigation, energy analysis and Aperture intelligence.`;
}

// ---------------------------------------------------------------------------
// Waitlist / interest-list presentation (source-aware modal copy).
// ---------------------------------------------------------------------------

export interface InterestPresentation {
  /** Callout badge inside the modal header. */
  badge: string;
  /** Modal headline. */
  title: string;
  /** Explanatory paragraph. */
  blurb: string;
  /** Modal submit button label. */
  submitLabel: string;
  /** Submit button label after a successful signup. */
  submittedLabel: string;
  /** Success message shown after submit. */
  successMessage: string;
  /** Confirmation email subject. */
  emailSubject: string;
  /** Confirmation email headline (after the recipient name). */
  emailHeadline: string;
  /** Confirmation email body paragraph. */
  emailBody: string;
}

const DEFAULT_INTEREST_PRESENTATION: InterestPresentation = {
  badge: "GeoMoney Basic Priority Access",
  title: "Join GeoMoney Basic Waitlist",
  blurb:
    "GeoMoney Intelligence Platform will be launching soon. Join the Basic waitlist to receive priority access when subscriptions open.",
  submitLabel: "Join the Waitlist",
  submittedLabel: "Joined Waitlist!",
  successMessage:
    "Successfully joined the GeoMoney Basic waitlist! Priority access has been reserved.",
  emailSubject: "GeoMoney Basic Waitlist Confirmation — Priority Access Reserved",
  emailHeadline: "you're on the GeoMoney Basic waitlist!",
  emailBody:
    "Thank you for joining the GeoMoney Basic waitlist. You will receive priority access when subscriptions open, including subscriber research, premium intelligence reports and member updates.",
};

const INTEREST_PRESENTATIONS: Record<string, InterestPresentation> = {
  [WAITLIST_SOURCES.advanced]: {
    badge: "GeoMoney Advanced",
    title: "Notify Me about Advanced",
    blurb:
      "Advanced analytics and cross-system intelligence for deeper research and analysis. Join the notification list and we will email you when Advanced launches — no payment is enabled while it is Coming Soon.",
    submitLabel: "Notify Me",
    submittedLabel: "You're on the list!",
    successMessage:
      "You're on the Advanced notification list. We'll email you as soon as Advanced launches.",
    emailSubject: "GeoMoney Advanced — Notify Me confirmation",
    emailHeadline: "you're on the Advanced notification list!",
    emailBody:
      "Thank you for your interest in GeoMoney Advanced. We will email you as soon as Advanced and its analytics capabilities launch. No payment is enabled while Advanced remains Coming Soon.",
  },
  [WAITLIST_SOURCES.pro]: {
    badge: "GeoMoney Pro",
    title: "Request Pro Early Access",
    blurb:
      "Professional monitoring and investigation for users who need deeper intelligence workflows. Request early access and we will contact you as places open — no payment is enabled while Pro is Coming Soon / Early Access.",
    submitLabel: "Request Early Access",
    submittedLabel: "Request received!",
    successMessage:
      "Your Pro early access request has been received. We'll be in touch as places open.",
    emailSubject: "GeoMoney Pro — Early access request received",
    emailHeadline: "your Pro early access request has been received!",
    emailBody:
      "Thank you for requesting early access to GeoMoney Pro. We will contact you as places open. No payment is enabled while Pro remains Coming Soon / Early Access.",
  },
};

export function getInterestPresentation(source: string | undefined): InterestPresentation {
  if (!source) return DEFAULT_INTEREST_PRESENTATION;
  return INTEREST_PRESENTATIONS[source] ?? DEFAULT_INTEREST_PRESENTATION;
}
