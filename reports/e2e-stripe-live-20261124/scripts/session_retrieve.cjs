// Retrieves the live checkout session created during browser testing + live account state.
const fs = require('fs');
const Stripe = require('stripe');

const REPO = '/Users/arnabdeepnath/Desktop/GeoMoneyTV';
const envLocal = fs.readFileSync(REPO + '/.env.local', 'utf8');
const stripe = new Stripe(envLocal.match(/^STRIPE_SECRET_KEY=(.+)$/m)[1].trim());

const SESSION_ID = 'cs_live_bgkL7anaDU40hoRB18HobF15LC1D4n1jlR0lFjMUbfhMIHTnwZIoRufcXN';

(async () => {
  const s = await stripe.checkout.sessions.retrieve(SESSION_ID, { expand: ['line_items'] });
  console.log('CHECKOUT SESSION');
  console.log('  id:              ', s.id);
  console.log('  livemode:        ', s.livemode);
  console.log('  status:          ', s.status, '| payment_status:', s.payment_status);
  console.log('  mode:            ', s.mode);
  console.log('  currency:        ', s.currency, '| amount_total:', s.amount_total);
  console.log('  customer:        ', s.customer);
  console.log('  client_ref:      ', s.client_reference_id);
  console.log('  metadata:        ', JSON.stringify(s.metadata));
  console.log('  success_url:     ', s.success_url);
  console.log('  cancel_url:      ', s.cancel_url);
  console.log('  line items:      ', s.line_items.data.map(li => li.description + ' @ ' + li.amount_total + ' ' + li.currency).join(' | '));
  console.log('  expires_at:      ', new Date(s.expires_at * 1000).toISOString());

  console.log('\nLIVE ACCOUNT STATE');
  const charges = await stripe.charges.list({ limit: 5 });
  console.log('  charges:         ', charges.data.length, charges.data.map(c => c.id + ':' + c.status).join(', ') || '(none)');
  const subs = await stripe.subscriptions.list({ limit: 5, status: 'all' });
  console.log('  subscriptions:   ', subs.data.length, subs.data.map(x => x.id + ':' + x.status).join(', ') || '(none)');
  const customers = await stripe.customers.list({ limit: 5 });
  console.log('  customers:       ', customers.data.length, customers.data.map(c => c.id + ' <' + c.email + '>').join(', ') || '(none)');
  const products = await stripe.products.list({ limit: 5 });
  console.log('  products:        ', products.data.length, products.data.map(p => p.id + ':' + p.name).join(', '));
  const prices = await stripe.prices.list({ limit: 5 });
  console.log('  prices:          ', prices.data.length, prices.data.map(p => p.id + ':' + (p.unit_amount/100) + ' ' + p.currency + '/' + (p.recurring && p.recurring.interval)).join(', '));
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
