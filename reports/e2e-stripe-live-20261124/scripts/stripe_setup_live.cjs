// Creates the GeoMoney Basic product + $39/mo price + billing portal configuration
// in the LIVE Stripe account. Idempotent: reuses objects that already exist.
// Prints only non-secret identifiers.
const fs = require('fs');
const Stripe = require('stripe');

const keytxt = fs.readFileSync('/Users/arnabdeepnath/Desktop/GeoMoneyTV/Key.txt', 'utf8');
const liveKey = keytxt.match(/Secret:\s*(\S+)/)[1].trim();
const stripe = new Stripe(liveKey);

(async () => {
  // --- Product + price ---
  let product = null;
  let price = null;

  const products = await stripe.products.list({ limit: 100, active: true });
  product = products.data.find(p => p.name === 'GeoMoney Basic') || null;

  if (!product) {
    product = await stripe.products.create({
      name: 'GeoMoney Basic',
      description: 'GeoMoney Basic subscription — subscriber intelligence tier.',
      metadata: { app: 'geomoneytv', tier: 'basic' },
    });
    console.log('CREATED PRODUCT:', product.id, '|', product.name);
  } else {
    console.log('REUSED PRODUCT:', product.id, '|', product.name);
  }

  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
  price = prices.data.find(p => p.unit_amount === 3900 && p.currency === 'usd' && p.recurring && p.recurring.interval === 'month') || null;

  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: 3900,
      currency: 'usd',
      recurring: { interval: 'month' },
      nickname: 'Basic monthly',
      metadata: { app: 'geomoneytv', tier: 'basic' },
    });
    console.log('CREATED PRICE:', price.id, '|', (price.unit_amount/100).toFixed(2), price.currency.toUpperCase() + '/' + price.recurring.interval, '| livemode:', price.livemode);
  } else {
    console.log('REUSED PRICE:', price.id, '|', (price.unit_amount/100).toFixed(2), price.currency.toUpperCase() + '/' + price.recurring.interval, '| livemode:', price.livemode);
  }

  // --- Portal configuration ---
  let config = null;
  const configs = await stripe.billingPortal.configurations.list({ limit: 10 });
  config = configs.data.find(c => c.active) || null;

  if (!config) {
    config = await stripe.billingPortal.configurations.create({
      business_profile: { headline: 'GeoMoney TV — manage your subscription' },
      features: {
        invoice_history: { enabled: true },
        payment_method_update: { enabled: true },
        customer_update: { enabled: true, allowed_updates: ['address', 'email', 'name'] },
        subscription_cancel: {
          enabled: true,
          mode: 'at_period_end',
          cancellation_reason: {
            enabled: true,
            options: ['too_expensive', 'missing_features', 'switched_service', 'unused', 'other'],
          },
        },
      },
      default_return_url: 'https://geomoneytv.com/profile?tab=billing',
    });
    console.log('CREATED PORTAL CONFIG:', config.id, '| active:', config.active);
  } else {
    console.log('REUSED PORTAL CONFIG:', config.id, '| active:', config.active);
  }

  console.log('\n=== RESULT ===');
  console.log('PRODUCT_ID=' + product.id);
  console.log('PRICE_ID=' + price.id);
  console.log('PORTAL_CONFIG_ID=' + config.id);
})().catch(e => { console.error('FATAL:', e.type || '', e.message); process.exit(1); });
