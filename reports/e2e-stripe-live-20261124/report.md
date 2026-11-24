# GeoMoney TV — Stripe LIVE key end-to-end test report

- **Date:** 2026-11-24, 18:48–18:56 IST
- **Repo:** `~/Desktop/GeoMoneyTV` @ `262f056` (main)
- **App under test:** production build (`next build` + `next start`) on `http://localhost:3001`
  - Port 3001 was used because 3000 is occupied by another local project (KPMG Aggregator_Server).
  - `NEXT_PUBLIC_SITE_URL` was set to `http://localhost:3001` so Stripe `success_url`/`cancel_url` return to the local app.
- **Stripe account:** `acct_1UD5weDE73IOyxBL` — **"Vidyata Hub Inc."**, LIVE mode (`livemode: true` on all objects)
- **Tier:** single testing pass, no money moved — **0 charges, 0 subscriptions** in the account at the end.

---

## 1. What was added (key wiring)

`Key.txt` (repo root, live pk/sk pair) was imported into `.env.local`. Backup of the previous values: `.env.local.backup`.

| Variable | Value now | Note |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_…` (live, verified against the API) | replaced a **test**-mode key from a different account |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_…` | new line (was absent) |
| `STRIPE_BASIC_PRICE_ID` | `price_1UfJaeDE73IOyxBLVj5T91fD` | **new live price** — old value was a test-mode price that does not exist in live |
| `STRIPE_PORTAL_CONFIGURATION_ID` | `bpc_1UfJafDE73IOyxBLlUgTj5Vm` | **new live portal config** — old value didn't exist in live |
| `STRIPE_WEBHOOK_SECRET` | local dev secret (generated for these tests) | production must use the real endpoint secret |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3001` | was `localhost:3000`; must match the local port for checkout return URLs |

Live objects created in the Stripe account via API (idempotent script in `scripts/stripe_setup_live.cjs`):

- Product `prod_VggysDV5vg7Bnk` — "GeoMoney Basic"
- Price `price_1UfJaeDE73IOyxBLVj5T91fD` — **US$39.00 / month**, USD
- Customer Portal configuration `bpc_1UfJafDE73IOyxBLlUgTj5Vm` — update payment methods, invoice history, cancel at period end, billing info update; returns to `geomoneytv.com/profile?tab=billing`

Safety measures:

- `Key.txt` added to `.gitignore` so the live secret cannot be committed accidentally.
- `.env.local` is gitignored — these live keys are **local-only**. Production (Hostinger) requires the same variables set in the hosting environment.
- QA test users created for the run: `qa.free@geomoneytv.test` (user) and `qa.admin@geomoneytv.test` (admin). Passwords were set during the test session and deliberately kept out of this folder; `scripts/qa_users.cjs` can (re)create them with a password of your choice. **Delete or disable these accounts before public launch.**

---

## 2. Test matrix & results

### A. Guest experience

| # | Test | Method | Result | Evidence |
|---|---|---|---|---|
| 1 | Home + pricing render | browser | PASS — Free & Basic "Available"; Basic **US$39 / month**; Advanced/Pro collect interest (Notify Me / Request Early Access) | `01`, `02` |
| 2 | `/world-monitor` as guest | browser | PASS — Basic gate: "Purchase the Basic pack (US$39 / month) to unlock", Get Basic / Compare plans | `03` |
| 3 | `/energy/coal` as guest | browser | PASS — Basic gate on the Coal desk | `04` |

### B. Auth

| # | Test | Method | Result | Evidence |
|---|---|---|---|---|
| 4 | Sign-in as QA free user | browser form | PASS — session `qa.free@geomoneytv.test` (role user) | `05`, `06` |

### C. Billing UI (live-mode evidence)

| # | Test | Method | Result | Evidence |
|---|---|---|---|---|
| 5 | Profile → Plans & Billing | browser | PASS — **STRIPE LIVE** badge + red banner "Live Stripe keys are active. Real payment methods will be charged." | `07` |
| 6 | Billing tab | browser | PASS — "You are on the Free plan", empty invoice history | `08` |
| 7 | Billing API | `GET /api/billing` | PASS — `{"configured":true,"checkoutConfigured":true,"mode":"live","customerExists":true,"currentPlan":"free"}` | console |

### D. Checkout (live)

| # | Test | Method | Result | Evidence |
|---|---|---|---|---|
| 8 | Start Basic checkout | browser click → `POST /api/billing/checkout` | PASS — live Checkout Session created, hosted page opens with **no TEST MODE banner** | `09` |
| 9 | Session object | Stripe API retrieve | PASS — `cs_live_bgkL7…` **livemode: true**, status `open`, `payment_status: unpaid`, USD 39.00, metadata `{planId: basic, userId}`, success/cancel URLs back to localhost:3001 | console |
| 10 | Cancel return | browser | PASS — "Checkout was cancelled. No payment was taken; you can subscribe whenever you're ready." | `10` |

> **Adaptive pricing note:** the hosted page displayed **₹3,765.14 / month** (INR) for the India-based browser while the session itself is **USD 39.00** — session has `adaptive_pricing: {enabled: true}` and `presentment_details: {presentment_amount: 376514, presentment_currency: "inr"}`. This is Stripe's local-currency display for the customer's region; the base price remains US$39. If INR display isn't desired at launch, adjust the pricing/localization settings in the Stripe Dashboard.

### E. Customer portal (live)

| # | Test | Method | Result | Evidence |
|---|---|---|---|---|
| 11 | "Add or update" → portal | browser click → `POST /api/billing/portal` | PASS — live portal session opens: "Vidyata Hub Inc., GeoMoney TV — manage your subscription", billing info for the QA user, payment methods empty, invoice history empty | `11` |

### F. Payment success landing

| # | Test | Method | Result | Evidence |
|---|---|---|---|---|
| 12 | `/payment/success` | browser with the real `cs_live_…` session id | PASS — "Welcome to GeoMoney Basic… Your Stripe checkout is complete" | `12` |

### G. Webhook pipeline (local, real signature verification)

Synthetic events signed with the local `STRIPE_WEBHOOK_SECRET` and POSTed at the running app (`scripts/webhook_qa_e2e.cjs`).

| # | Test | Result |
|---|---|---|
| 13 | `checkout.session.completed` | PASS — `200 {"received":true}`; customer link updated idempotently |
| 14 | `customer.subscription.created` | PASS — `200`; `Subscription` row created (`sub_QA_E2E_TEST01`, planKey `basic`, status `active`, live price id, period end +30d) |
| 15 | Replay of the same event | PASS — idempotent: still 1 subscription row, 1 billing-event row |
| 16 | Tampered payload / wrong signing secret | PASS — `400 {"error":"Invalid webhook signature."}` for both |
| 17 | Unhandled type (`invoice.paid`) | PASS — `200 {"received":true}`, stored, no side effect |

### H. Entitlement unlock → relock loop

| # | Test | Result | Evidence |
|---|---|---|---|
| 18 | `/api/subscription` with synced subscription | PASS — `{"tier":"basic","status":"active"}` | console |
| 19 | `/world-monitor` unlocked (Basic) | PASS — globe dashboard renders, no gate | `13` |
| 20 | `/energy/coal` unlocked (Basic) | PASS — full Coal Market desk renders | `14` |
| 21 | After deleting synthetic rows | PASS — tier back to `free`; gate re-appears on reload | `15` |
| 22 | Admin bypass | PASS — `qa.admin` resolves `tier: pro`, no gate; sign-in lands on `/admin` | `16`, `17` |

### I. Negative API tests

| Test | Expect | Got |
|---|---|---|
| `POST /api/billing/checkout` `{planId:"advanced"}` (signed in) | 400 | 400 "Select an available plan." |
| `POST /api/billing/checkout` `{}` (signed in) | 400 | 400 "Select an available plan." |
| `POST /api/billing/checkout` (unauthenticated) | 401 | 401 "Please sign in to subscribe." |
| `POST /api/billing/portal` (unauthenticated) | 401 | 401 "Unauthorized" |
| `POST /api/billing/portal` (user without Stripe customer) | 400 | 400 "No Stripe billing account exists yet…" |
| `POST /api/webhooks/stripe` (no signature / no config) | 400 | 400 "Webhook is not configured." |

### J. Account integrity (after all tests)

- Charges: **0** · Subscriptions: **0** — nothing billed.
- Customers: **1** (`cus_Vgh1DVXIlZdwZj`, the QA user — created by the checkout flow).
- Products/prices: 1 each (the GeoMoney Basic $39/mo pair).
- The live checkout session remains `open`/`unpaid` and expires 2026-11-25 13:19 UTC.
- All synthetic DB rows (subscription + billing events) deleted; customer link kept on the QA user.

---

## 3. Not covered / limitations & recommendations

1. **Payment not actually completed.** Live mode rejects test cards (`4242…`), and no real card was entered — so the literal "enter card → pay → subscription activates" step was not performed. Everything around it was: live session creation → hosted page render → cancel/success URLs → webhook signature + processing → DB sync → entitlement unlock. Recommendation: optional final smoke test with a real card for US$39 (then cancel + refund), or an equivalent pass in test mode before launch traffic.
2. **409 "already have a subscription" branch** can only trigger with a real open subscription in Stripe; not exercisable without a payment. Code path reviewed, behavior untested.
3. **Production environment (Hostinger) needs these variables** — `.env.local` is local-only: `STRIPE_SECRET_KEY` (live), `STRIPE_BASIC_PRICE_ID`, `STRIPE_PORTAL_CONFIGURATION_ID`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` (the **real** endpoint secret for `https://geomoneytv.com/api/webhooks/stripe`), `NEXT_PUBLIC_SITE_URL=https://geomoneytv.com`. Without the webhook secret on production, paid subscriptions will never activate in the DB.
4. **Webhook endpoint registration:** confirm the live Stripe account has the endpoint `https://geomoneytv.com/api/webhooks/stripe` configured with the event list from `docs/stripe-billing.md`. (The live account was empty before this test — if the endpoint existed it would have shown events/attempts; verify in Dashboard → Developers → Webhooks.)
5. **Adaptive pricing** (INR presentment) — see the note in section D.
6. **`Key.txt`** remains in the repo root (now gitignored). Recommend deleting it once production env vars are set, or moving it to your password manager.
7. **QA accounts** `qa.free@…test` / `qa.admin@…test` live in the production database (12 users total now) — remove before launch.
8. Unrelated observations during the run: pre-existing EIA `HTTP 403` responses for some coal-market series and one GDACS timeout in the server log — data-source hiccups, nothing to do with billing.

---

## 4. Screenshot index (17 images, `screenshots/`)

| File | Shows |
|---|---|
| `01-home-guest.png` | Landing page as guest |
| `02-pricing-guest.png` | Pricing page — Free/Basic available, Advanced/Pro collect interest |
| `03-world-monitor-guest-locked.png` | Geomoney Aperture gate for guests ("Purchase the Basic pack…") |
| `04-energy-coal-guest-locked.png` | Coal desk gate for guests |
| `05-signin-filled.png` | Sign-in form (QA free user) |
| `06-home-signed-in.png` | Signed-in landing |
| `07-profile-plans-free-live.png` | Plans & Billing — **STRIPE LIVE** badge + live-mode warning, free plan |
| `08-billing-and-invoices-tab-free.png` | Billing & invoices tab — Free plan, no invoices |
| `09-stripe-checkout-live.png` | **Live Stripe Checkout** page — GeoMoney Basic, no test banner |
| `10-profile-plans-checkout-cancelled.png` | Back from Stripe — "Checkout was cancelled. No payment was taken…" |
| `11-stripe-portal-live.png` | **Live Customer Portal** — subscription management, billing info |
| `12-payment-success-page.png` | `/payment/success` — "Welcome to GeoMoney Basic" |
| `13-world-monitor-basic-unlocked.png` | World Monitor unlocked while Basic active (synced via webhook) |
| `14-energy-coal-basic-unlocked.png` | Coal desk unlocked while Basic active |
| `15-world-monitor-relocked-after-cleanup.png` | Gate restored after synthetic subscription removed |
| `16-admin-landing.png` | Admin sign-in lands on `/admin` |
| `17-world-monitor-admin-bypass.png` | Admin bypass — full dashboard, no gate (tier pro) |

---

## 5. Re-run appendix

Scripts in `scripts/`:

- `stripe_setup_live.cjs` — idempotently (re)creates product / price / portal config in the live account.
- `webhook_qa_e2e.cjs` — signs synthetic Stripe events with the local webhook secret and verifies DB effects, idempotency and signature rejection.
- `session_retrieve.cjs` — dumps a checkout session + live account state.
- `qa_users.cjs` — creates/resets the QA users (edit the password placeholders first).
- `png_check.py` — screenshot sanity check (pure-stdlib PNG decode, flags blank/black frames).

Key commands used:

```bash
# live object setup
NODE_PATH=$PWD/node_modules node scripts/stripe_setup_live.cjs          # run from repo root
# fresh build + local server (port 3001)
node ./node_modules/next/dist/bin/next build
node ./node_modules/next/dist/bin/next start -p 3001
# webhook E2E (app must be running)
NODE_PATH=$PWD/node_modules node --env-file=.env scripts/webhook_qa_e2e.cjs
# signed-in API checks (cookie jar)
curl -s -c jar http://localhost:3001/api/auth/csrf …  # NextAuth credentials flow, see transcript
```

Local server is currently **still running on :3001** (`/tmp/geomoney-3001.log`). Stop it with `kill 92127` (or leave it for manual testing).

Working-tree state: `.gitignore` modified (added `Key.txt`), `reports/` untracked. Nothing committed.
