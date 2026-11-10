import "server-only";

import { Prisma } from "@prisma/client";
import Stripe from "stripe";
import prisma from "@/lib/prisma";

function fromUnix(timestamp: number | null | undefined): Date | null {
  return timestamp ? new Date(timestamp * 1000) : null;
}

function resourceId(resource: string | { id: string } | null | undefined): string | null {
  if (!resource) return null;
  return typeof resource === "string" ? resource : resource.id;
}

function getSubscriptionPeriod(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0] as (typeof subscription.items.data)[number] & {
    current_period_start?: number;
    current_period_end?: number;
  };
  const legacy = subscription as unknown as {
    current_period_start?: number;
    current_period_end?: number;
  };

  return {
    start: fromUnix(item?.current_period_start ?? legacy.current_period_start),
    end: fromUnix(item?.current_period_end ?? legacy.current_period_end),
  };
}

async function syncSubscription(
  subscription: Stripe.Subscription,
  tx: Prisma.TransactionClient,
): Promise<void> {
  const customerId = resourceId(subscription.customer);
  let userId = subscription.metadata.userId || null;

  if (!userId && customerId) {
    const user = await tx.user.findUnique({ where: { stripeCustomerId: customerId } });
    userId = user?.id || null;
  }

  // Ignore subscriptions belonging to another application in the same Stripe account.
  if (!userId) return;

  const item = subscription.items.data[0];
  if (!item?.price?.id) throw new Error(`Subscription ${subscription.id} has no price.`);
  const period = getSubscriptionPeriod(subscription);

  await tx.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    create: {
      userId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: item.price.id,
      planKey: subscription.metadata.planId || "basic",
      status: subscription.status,
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: fromUnix(subscription.canceled_at),
      endedAt: fromUnix(subscription.ended_at),
      createdAt: fromUnix(subscription.created) || new Date(),
    },
    update: {
      userId,
      stripePriceId: item.price.id,
      planKey: subscription.metadata.planId || "basic",
      status: subscription.status,
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: fromUnix(subscription.canceled_at),
      endedAt: fromUnix(subscription.ended_at),
    },
  });
}

async function linkCheckoutCustomer(
  session: Stripe.Checkout.Session,
  tx: Prisma.TransactionClient,
): Promise<void> {
  const userId = session.client_reference_id || session.metadata?.userId;
  const customerId = resourceId(session.customer);
  if (!userId || !customerId) return;

  await tx.user.updateMany({
    where: {
      id: userId,
      OR: [{ stripeCustomerId: null }, { stripeCustomerId: customerId }],
    },
    data: { stripeCustomerId: customerId },
  });
}

export async function processStripeEvent(event: Stripe.Event): Promise<void> {
  try {
    await prismaTransaction(event);
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") return;
    throw error;
  }
}

async function prismaTransaction(event: Stripe.Event): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.stripeBillingEvent.create({
      data: { eventId: event.id, type: event.type },
    });

    switch (event.type) {
      case "checkout.session.completed":
        await linkCheckoutCustomer(event.data.object, tx);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.paused":
      case "customer.subscription.resumed":
        await syncSubscription(event.data.object, tx);
        break;
      default:
        break;
    }
  });
}
