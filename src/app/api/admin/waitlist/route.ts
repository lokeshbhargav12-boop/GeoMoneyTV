import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildWaitlistPreferences,
  isWaitlistRecord,
  parseWaitlistMetadata,
  removeWaitlistFromPreferences,
} from "@/lib/waitlist";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "admin") return null;
  return session;
}

export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [subscribers, users] = await Promise.all([
      prisma.newsletter.findMany({
        select: {
          id: true,
          email: true,
          active: true,
          materialPreferences: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
    ]);

    const userByEmail = new Map(
      users.map((u) => [u.email.trim().toLowerCase(), u])
    );

    const waitlist = subscribers
      .filter((sub) => isWaitlistRecord(sub.materialPreferences))
      .map((sub) => {
        const meta = parseWaitlistMetadata(sub.materialPreferences);
        const matchedUser = userByEmail.get(sub.email.trim().toLowerCase());

        return {
          id: sub.id,
          name: meta.name || matchedUser?.name || sub.email.split("@")[0],
          email: sub.email,
          active: sub.active,
          source:
            meta.source ||
            (matchedUser ? "account_registration" : "waitlist"),
          joinedAt: meta.joinedAt || sub.createdAt.toISOString(),
          createdAt: sub.createdAt.toISOString(),
          updatedAt: sub.updatedAt.toISOString(),
          hasAccount: Boolean(matchedUser),
          userId: matchedUser?.id || null,
          userRole: matchedUser?.role || null,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
      );

    const activeCount = waitlist.filter((person) => person.active).length;

    return NextResponse.json({
      count: waitlist.length,
      activeCount,
      waitlist,
    });
  } catch (error) {
    console.error("Failed to fetch admin waitlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch waitlist" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email address is required" },
        { status: 400 }
      );
    }

    const finalName = name || email.split("@")[0];

    const existing = await prisma.newsletter.findUnique({
      where: { email },
    });

    if (!existing) {
      await prisma.newsletter.create({
        data: {
          email,
          active: true,
          materialPreferences: buildWaitlistPreferences(null, {
            name: finalName,
            source: "admin",
          }),
        },
      });
    } else {
      await prisma.newsletter.update({
        where: { email },
        data: {
          active: true,
          materialPreferences: buildWaitlistPreferences(
            existing.materialPreferences,
            {
              name: finalName,
              source: "admin",
            }
          ),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `${finalName} (${email}) added to the GeoMoney Pro Waitlist.`,
    });
  } catch (error) {
    console.error("Failed to add to waitlist:", error);
    return NextResponse.json(
      { error: "Failed to add to waitlist" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const existing = await prisma.newsletter.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const { shouldDeleteRecord, updatedPreferences } =
      removeWaitlistFromPreferences(existing.materialPreferences);

    if (shouldDeleteRecord) {
      await prisma.newsletter.delete({ where: { id } });
    } else {
      await prisma.newsletter.update({
        where: { id },
        data: { materialPreferences: updatedPreferences },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove waitlist entry:", error);
    return NextResponse.json(
      { error: "Failed to remove waitlist entry" },
      { status: 500 }
    );
  }
}