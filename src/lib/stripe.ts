import "server-only";

import Stripe from "stripe";
import prisma from "@/lib/prisma";

export function hasStripeSecret(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function isCheckoutConfigured(): boolean {
  return hasStripeSecret() && Boolean(process.env.STRIPE_BASIC_PRICE_ID?.trim());
}

export function getStripeMode(): "test" | "live" | "not_configured" {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return "not_configured";
  return key.startsWith("sk_live_") ? "live" : "test";
}

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error("Stripe is not configured. Add STRIPE_SECRET_KEY to the server environment.");
  }
  return new Stripe(secretKey);
}

export function getAppUrl(request: Request): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return (configuredUrl || new URL(request.url).origin).replace(/\/$/, "");
}

export async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User account not found.");

  const stripe = getStripe();
  if (user.stripeCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(user.stripeCustomerId);
      if (!customer.deleted) return customer.id;
    } catch (error) {
      const stripeError = error as Stripe.errors.StripeError;
      if (stripeError.code !== "resource_missing") throw error;
    }
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name || undefined,
    metadata: { userId: user.id },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

export async function hasOpenSubscription(customerId: string): Promise<boolean> {
  const subscriptions = await getStripe().subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 20,
  });

  return subscriptions.data.some((subscription) =>
    ["active", "trialing", "past_due", "unpaid", "paused"].includes(subscription.status),
  );
}
