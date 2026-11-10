import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getAppUrl, getStripe, hasStripeSecret } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasStripeSecret()) {
    return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 503 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No Stripe billing account exists yet. Choose Basic to get started." },
        { status: 400 },
      );
    }

    const configuration = process.env.STRIPE_PORTAL_CONFIGURATION_ID?.trim();
    const portal = await getStripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${getAppUrl(request)}/profile?tab=billing`,
      ...(configuration ? { configuration } : {}),
    });

    return NextResponse.json({ url: portal.url });
  } catch (error) {
    console.error("Stripe billing portal failed:", error);
    return NextResponse.json(
      { error: "Unable to open billing management. Please try again." },
      { status: 502 },
    );
  }
}
