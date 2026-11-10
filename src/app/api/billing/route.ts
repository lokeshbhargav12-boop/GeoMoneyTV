import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Stripe from "stripe";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getStripe, getStripeMode, hasStripeSecret, isCheckoutConfigured } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPEN_STATUSES = ["active", "trialing", "past_due"];

function toIso(timestamp: number | null | undefined): string | null {
  return timestamp ? new Date(timestamp * 1000).toISOString() : null;
}

function subscriptionPeriod(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0] as (typeof subscription.items.data)[number] & {
    current_period_start?: number;
    current_period_end?: number;
  };
  const legacy = subscription as unknown as {
    current_period_start?: number;
    current_period_end?: number;
  };
  return {
    start: item?.current_period_start ?? legacy.current_period_start,
    end: item?.current_period_end ?? legacy.current_period_end,
  };
}

function emptyBilling() {
  return {
    configured: hasStripeSecret(),
    checkoutConfigured: isCheckoutConfigured(),
    mode: getStripeMode(),
    customerExists: false,
    currentPlan: "free",
    subscription: null,
    paymentMethods: [],
    invoices: [],
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasStripeSecret()) return NextResponse.json(emptyBilling());

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.stripeCustomerId) return NextResponse.json(emptyBilling());

    const stripe = getStripe();
    const customerId = user.stripeCustomerId;
    const [customer, subscriptions, paymentMethods, invoices] = await Promise.all([
      stripe.customers.retrieve(customerId, {
        expand: ["invoice_settings.default_payment_method"],
      }),
      stripe.subscriptions.list({ customer: customerId, status: "all", limit: 10 }),
      stripe.customers.listPaymentMethods(customerId, { limit: 10 }),
      stripe.invoices.list({ customer: customerId, limit: 12 }),
    ]);

    if (customer.deleted) return NextResponse.json(emptyBilling());

    const subscription =
      subscriptions.data.find((item) => OPEN_STATUSES.includes(item.status)) ||
      subscriptions.data[0];
    const item = subscription?.items.data[0];
    const period = subscription ? subscriptionPeriod(subscription) : null;
    const defaultPaymentMethod = customer.invoice_settings.default_payment_method;
    const defaultPaymentMethodId =
      typeof defaultPaymentMethod === "string"
        ? defaultPaymentMethod
        : defaultPaymentMethod?.id;

    return NextResponse.json({
      configured: true,
      checkoutConfigured: isCheckoutConfigured(),
      mode: getStripeMode(),
      customerExists: true,
      currentPlan: subscription && OPEN_STATUSES.includes(subscription.status) ? "basic" : "free",
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            planId: subscription.metadata.planId || "basic",
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            currentPeriodStart: toIso(period?.start),
            currentPeriodEnd: toIso(period?.end),
            price: item
              ? {
                  nickname: item.price.nickname || "GeoMoney Basic",
                  amount: item.price.unit_amount || 0,
                  currency: item.price.currency.toUpperCase(),
                  interval: item.price.recurring?.interval || "month",
                }
              : null,
          }
        : null,
      paymentMethods: paymentMethods.data.map((method) => ({
        id: method.id,
        type: method.type,
        brand: method.card?.brand || method.type.replaceAll("_", " "),
        last4: method.card?.last4 || method.us_bank_account?.last4 || null,
        expMonth: method.card?.exp_month || null,
        expYear: method.card?.exp_year || null,
        isDefault: method.id === defaultPaymentMethodId,
      })),
      invoices: invoices.data.map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        description: invoice.lines.data[0]?.description || "GeoMoney subscription",
        status: invoice.status,
        amountPaid: invoice.amount_paid,
        amountDue: invoice.amount_due,
        currency: invoice.currency.toUpperCase(),
        created: toIso(invoice.created),
        hostedUrl: invoice.hosted_invoice_url,
        pdfUrl: invoice.invoice_pdf,
      })),
    });
  } catch (error) {
    console.error("Unable to load Stripe billing:", error);
    return NextResponse.json(
      { error: "Billing details are temporarily unavailable. Please refresh." },
      { status: 502 },
    );
  }
}
