# Stripe billing setup

GeoMoney uses hosted Stripe Checkout for the Basic monthly subscription and the Stripe Customer Portal for payment methods, invoices, cancellation and billing details. Full card numbers and security codes never pass through the GeoMoney server.

## 1. Create the sandbox product

In the Stripe Dashboard with **Test mode** enabled:

1. Create a product named `GeoMoney Basic`.
2. Add a recurring price of **US$39 per month**.
3. Copy its price ID (`price_...`). Do not use a one-time price.

## 2. Configure the server

Add these values to `.env.local` for development and to the hosting provider's environment settings for deployment:

```dotenv
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PORTAL_CONFIGURATION_ID=bpc_... # optional; uses the active portal config when omitted
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

The publishable key is reserved for future Stripe.js use; the current hosted Checkout and Portal flow only requires the server secret. Never commit real keys or expose the secret/webhook keys through `NEXT_PUBLIC_` variables. Set `NEXT_PUBLIC_SITE_URL=https://geomoneytv.com` in production.

## 3. Update the database

Generate the Prisma client after pulling the changes:

```bash
npx prisma generate
```

For a local disposable database, apply the schema with:

```bash
npx prisma db push
```

For an existing/production MySQL database, review and apply `prisma/migrations/manual_stripe_billing.sql` through the normal migration process. This adds the Stripe customer ID, subscription records and idempotent webhook-event records.

## 4. Configure webhooks

For local development, install the Stripe CLI and run:

```bash
brew install stripe/stripe-cli/stripe
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the CLI's `whsec_...` signing secret into `STRIPE_WEBHOOK_SECRET`, then restart the app.

For production, create a webhook endpoint in Stripe pointing to:

```text
https://geomoneytv.com/api/webhooks/stripe
```

Subscribe to these events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.subscription.paused`
- `customer.subscription.resumed`

Use the endpoint's signing secret as `STRIPE_WEBHOOK_SECRET`. Webhook signatures are verified using the raw request body, and event IDs are stored to make retries idempotent. Signature failures return HTTP 400; temporary server/database failures return HTTP 500 so Stripe retries delivery.

## 5. Configure the Customer Portal

In Stripe Dashboard → Settings → Billing → Customer portal, enable the desired test-mode capabilities:

- Update and add payment methods
- View invoice history
- Cancel subscriptions (at the end of the billing period)
- Update customer billing information

Mirror the configuration in live mode before launch. The profile's **Manage billing** and **Add or update** buttons open this portal.

## 6. Test the flow

1. Sign in to GeoMoney and open **Profile → Plans & Billing**.
2. Choose **Subscribe with Stripe**.
3. Use Stripe's test card `4242 4242 4242 4242`, any future expiry and any CVC.
4. Complete checkout and confirm that Basic appears in the profile.
5. Verify invoice history, payment-method updates and cancellation through the portal.
6. Keep the Stripe CLI listener running during local webhook testing.

Useful additional Stripe test cards are documented at https://docs.stripe.com/testing. Test mode never charges real cards. The profile displays a prominent live-mode warning if a live secret is configured.
