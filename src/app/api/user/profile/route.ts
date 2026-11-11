import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { parseProfileDetails } from "@/lib/profile-details";

export const dynamic = "force-dynamic";

async function getAuthenticatedEmail() {
  const session = await getServerSession(authOptions);
  return session?.user?.email?.trim().toLowerCase() || null;
}

export async function GET() {
  try {
    const email = await getAuthenticatedEmail();
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, phone: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Failed to fetch profile details:", error);
    return NextResponse.json(
      { error: "Failed to load profile details" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const email = await getAuthenticatedEmail();
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = parseProfileDetails(await req.json());
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { email },
      data: parsed.data,
      select: { id: true, name: true, phone: true, email: true },
    });

    return NextResponse.json({ user, message: "Profile details updated." });
  } catch (error) {
    console.error("Failed to update profile details:", error);
    return NextResponse.json(
      { error: "Failed to update profile details" },
      { status: 500 }
    );
  }
}
