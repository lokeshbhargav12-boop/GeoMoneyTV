import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getAppUrl,
  getOrCreateStripeCustomer,
  getStripe,
  hasOpenSubscription,
  isCheckoutConfigured,
} from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Please sign in to subscribe." }, { status: 401 });

  if (!isCheckoutConfigured()) {
    return NextResponse.json(
      { error: "Stripe checkout is not configured yet. Add the sandbox secret key and Basic price ID." },
      { status: 503 },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    if (body.planId !== "basic") {
      return NextResponse.json({ error: "Select an available plan." }, { status: 400 });
    }

    const customerId = await getOrCreateStripeCustomer(userId);
    if (await hasOpenSubscription(customerId)) {
      return NextResponse.json(
        { error: "You already have a subscription. Open billing management to make changes." },
        { status: 409 },
      );
    }

    const appUrl = getAppUrl(request);
    const checkout = await getStripe().checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: userId,
      line_items: [{ price: process.env.STRIPE_BASIC_PRICE_ID!, quantity: 1 }],
      success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/profile?tab=plans&checkout=cancelled`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      customer_update: { address: "auto", name: "auto" },
      metadata: { userId, planId: "basic" },
      subscription_data: { metadata: { userId, planId: "basic" } },
    });

    if (!checkout.url) throw new Error("Stripe did not return a checkout URL.");
    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    console.error("Stripe checkout failed:", error);
    return NextResponse.json(
      { error: "Unable to start secure checkout. Please try again." },
      { status: 502 },
    );
  }
}
