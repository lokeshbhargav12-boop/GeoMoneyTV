# Subscription tiers & entitlements

Central configuration and gating architecture for the GeoMoney subscription tiers.

## Commercial state

| Tier | Price | Status | Card CTA |
| --- | --- | --- | --- |
| Free | US$0 | Available | Start Free |
| Basic | US$39 / month | Available | Get Basic |
| Advanced | — | Coming Soon | Notify Me |
| Pro | — | Coming Soon / Early Access | Request Early Access |

Display order everywhere subscription tiers are shown is **Free -> Basic -> Advanced -> Pro**.

Only Basic is purchasable. Advanced and Pro must not display checkout buttons or take
payments until they are formally activated; their cards collect demand through the
waitlist/interest list. API access, enterprise data feeds and bulk commercial data
services are explicitly **not** part of Pro and remain separately licensed.

## Single source of truth

`src/lib/entitlements.ts` is the only place tier names, prices, statuses, copy, CTAs,
feature lists and feature-to-tier mappings are defined. Nothing else may hard-code
subscription logic:

- `PLAN_TIERS` — the four tier definitions rendered by the pricing page
  (`src/components/entitlement/PricingCards.tsx`) and by the billing center
  (`src/components/BillingCenter.tsx`).
- `MODULES` — registry mapping a feature/module key to its `requiredTier`
  (e.g. `critical-materials -> advanced`, `energy-hub -> basic`).
- `buildGateState(moduleKey, viewerTier)` — produces the locked/preview presentation:
  badge, title, message and the correct primary CTA (Get Basic / Notify Me /
  Request Early Access). No checkout CTA is ever produced for Advanced or Pro.
- `WAITLIST_SOURCES` — interest-list sources recorded with signups:
  `pricing_page` (Basic), `advanced_notify` (Advanced), `pro_early_access` (Pro).

### Reassigning or expanding a tier later

1. Move a feature between tiers: edit the `requiredTier` of its entry in `MODULES`.
   Every gate and label that references the module updates automatically.
2. Activate a future tier: set `status` / `statusLabel`, fill `price` /
   `priceLabel`, flip `purchasable: true`, and set the CTA action to `checkout`
   with the checkout href. Then extend the checkout API
   (`src/app/api/billing/checkout/route.ts` currently accepts only
   `planId: "basic"`) and the Stripe webhook mapping
   (`planKey` is read from subscription metadata) for the new price.
3. Add a module: add an entry to `MODULES` and wrap the feature surface with
   `<TierGate module="..." />`.

## Viewer entitlement state

The platform recognises, at minimum: **guest** (logged out), **free** (account,
no open subscription), **basic** subscriber, and — for when they launch —
**advanced** and **pro** (resolved from the `planKey` recorded on the synced
Stripe subscription).

- `src/lib/subscription-state.ts` — server-side resolver. Open subscription
  statuses: `active`, `trialing`, `past_due` (grace while Stripe retries).
  Anything else degrades to the free account.
- `GET /api/subscription` — client-visible state: `{ signedIn, tier, planKey, status }`.
- `src/components/EntitlementProvider.tsx` — resolves that state once per page
  and shares it through `useEntitlements()`. Mounted in the root layout.

## Gating behaviour

- Free/Basic viewers entering a **Basic** feature: contextual lock panel —
  "Included with GeoMoney Basic" — with a **Get Basic** upgrade CTA.
- Free/Basic viewers entering an **Advanced** feature (e.g. the full Critical
  Materials Intelligence module): preview/locked state labelled
  **Advanced — Coming Soon** with **Notify Me** (never a payment CTA).
- Any viewer entering a **Pro** capability: **Pro — Coming Soon / Early Access**
  with **Request Early Access**.
- Selected previews remain visible to lower tiers (`previewForLowerTiers`);
  e.g. public Critical Materials pages and basic material information stay
  open, while the advanced intel sections lock.

Gates are rendered with `src/components/entitlement/TierGate.tsx`
(`mode="overlay"` keeps a blurred, non-interactive preview behind the lock;
`mode="replace"` replaces the feature). Interest CTAs use
`src/components/entitlement/TierInterestButton.tsx`; the waitlist modal is
source-aware (`src/components/WaitlistModal.tsx`).

Currently wired gates:

| Surface | Module | Behaviour |
| --- | --- | --- |
| `/materials/[symbol]` — Cross-Material Impact, Shock Simulation | critical-materials | Advanced preview/locked for guest/free/basic |
| `/materials/[symbol]` — Pro Features sidebar | professional-workflows | Pro panel + Request Early Access (no checkout) |
| `/materials` — module tier note | critical-materials | Notify Me |
| `/features/analytics` (+ instrument) | analytics | Advanced — Coming Soon + Notify Me |
| Pricing page / Billing center | all tiers | status badges, correct CTAs, no checkout for Advanced/Pro |

## Verification

```bash
node ./node_modules/typescript/bin/tsc --noEmit --incremental false
npm run lint
```

The entitlement state follows the locally synced `Subscription` rows, so the
Stripe webhook (`STRIPE_WEBHOOK_SECRET`) must be configured for paid access to
propagate (see `docs/stripe-billing.md`).
