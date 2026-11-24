// E2E webhook test: signs synthetic events with the local dev secret and posts
// them at the running app, then verifies the DB side effects.
const fs = require('fs');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');

const REPO = '/Users/arnabdeepnath/Desktop/GeoMoneyTV';
const envLocal = fs.readFileSync(REPO + '/.env.local', 'utf8');
const WHSEC = envLocal.match(/^STRIPE_WEBHOOK_SECRET=(.+)$/m)[1].trim();
const LIVE_PRICE = envLocal.match(/^STRIPE_BASIC_PRICE_ID=(.+)$/m)[1].trim();
const SECRET_KEY = envLocal.match(/^STRIPE_SECRET_KEY=(.+)$/m)[1].trim();
const stripe = new Stripe(SECRET_KEY);
const prisma = new PrismaClient();

const URL_WH = 'http://localhost:3001/api/webhooks/stripe';

function sign(payload, secret) {
  if (stripe.webhooks && typeof stripe.webhooks.generateTestHeaderString === 'function') {
    return stripe.webhooks.generateTestHeaderString({ payload, secret });
  }
  const t = Math.floor(Date.now() / 1000);
  const sig = crypto.createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex');
  return `t=${t},v1=${sig}`;
}

async function post(body, header) {
  const res = await fetch(URL_WH, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(header ? { 'stripe-signature': header } : {}) },
    body,
  });
  return { status: res.status, body: await res.text() };
}

(async () => {
  const user = await prisma.user.findUnique({ where: { email: 'qa.free@geomoneytv.test' } });
  console.log('QA user:', user.id, '| stripeCustomerId:', user.stripeCustomerId);
  if (!user.stripeCustomerId) throw new Error('stripeCustomerId missing — checkout flow should have set it');

  const now = Math.floor(Date.now() / 1000);

  // [1] checkout.session.completed
  const ev1 = {
    id: 'evt_QA_E2E_1', object: 'event', api_version: '2023-10-16', created: now, livemode: true,
    type: 'checkout.session.completed',
    data: { object: { id: 'cs_QA_E2E_1', object: 'checkout.session', client_reference_id: user.id, customer: user.stripeCustomerId, metadata: { userId: user.id, planId: 'basic' } } },
  };
  const p1 = JSON.stringify(ev1);
  console.log('\n[1] checkout.session.completed  ->', JSON.stringify(await post(p1, sign(p1, WHSEC))));

  // [2] customer.subscription.created
  const subObj = {
    id: 'sub_QA_E2E_TEST01', object: 'subscription', customer: user.stripeCustomerId, status: 'active',
    metadata: { userId: user.id, planId: 'basic' }, created: now, cancel_at_period_end: false,
    items: { object: 'list', data: [{ id: 'si_QA_E2E_1', object: 'subscription_item', current_period_start: now, current_period_end: now + 30 * 86400, price: { id: LIVE_PRICE, object: 'price' } }] },
  };
  const ev2 = { id: 'evt_QA_E2E_2', object: 'event', api_version: '2023-10-16', created: now, livemode: true, type: 'customer.subscription.created', data: { object: subObj } };
  const p2 = JSON.stringify(ev2);
  console.log('[2] customer.subscription.created ->', JSON.stringify(await post(p2, sign(p2, WHSEC))));

  // DB state after both
  const subs = await prisma.subscription.findMany({ where: { userId: user.id } });
  console.log('\nDB subscriptions for user:', JSON.stringify(subs.map(s => ({ id: s.stripeSubscriptionId, planKey: s.planKey, status: s.status, price: s.stripePriceId, periodEnd: s.currentPeriodEnd })), null, 1));

  // [3] replay same event (idempotency)
  console.log('\n[3] replay event 2      ->', JSON.stringify(await post(p2, sign(p2, WHSEC))));
  const subsAfter = await prisma.subscription.count({ where: { userId: user.id } });
  const evRow = await prisma.stripeBillingEvent.count({ where: { eventId: 'evt_QA_E2E_2' } });
  console.log('    subscription rows:', subsAfter, '| billing-event row for evt_QA_E2E_2:', evRow, '(both must stay 1)');

  // [4] tampered payload with a matching-length but stale signature
  const p2t = p2.replace('sub_QA_E2E_TEST01', 'sub_QA_TAMPERED01');
  console.log('\n[4] tampered payload    ->', JSON.stringify(await post(p2t, sign(p2, WHSEC))));

  // [5] wrong secret
  console.log('[5] wrong signing secret ->', JSON.stringify(await post(p2, sign(p2, 'whsec_wrong_secret'))));

  // [6] unhandled event type
  const ev3 = { id: 'evt_QA_E2E_3', object: 'event', api_version: '2023-10-16', created: now, livemode: true, type: 'invoice.paid', data: { object: { id: 'in_QA_E2E_1', object: 'invoice' } } };
  const p3 = JSON.stringify(ev3);
  console.log('[6] unhandled type invoice.paid ->', JSON.stringify(await post(p3, sign(p3, WHSEC))));

  const evRows = await prisma.stripeBillingEvent.findMany({ where: { eventId: { startsWith: 'evt_QA_E2E' } } });
  console.log('\nBilling event rows:', evRows.map(r => r.eventId + ':' + r.type).join(', '));
  await prisma.$disconnect();
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
