import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const start = Date.now();

    const [userCount, articleCount, materialCount, videoCount, newsletterCount] =
      await Promise.all([
        prisma.user.count(),
        prisma.article.count(),
        prisma.rareEarthMaterial.count(),
        prisma.video.count(),
        prisma.newsletter.count(),
      ]);

    const durationMs = Date.now() - start;

    return NextResponse.json({
      ok: true,
      latencyMs: durationMs,
      counts: {
        users: userCount,
        articles: articleCount,
        materials: materialCount,
        videos: videoCount,
        newsletters: newsletterCount,
      },
    });
  } catch (error) {
    console.error("Failed to fetch dev status:", error);
    return NextResponse.json({ ok: false, error: "DB connection failed" }, { status: 500 });
  }
}
