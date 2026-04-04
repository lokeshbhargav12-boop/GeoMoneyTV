import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any)?.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const [articles, newsletters, rareEarth, users, videos] = await Promise.all([
            prisma.article.count(),
            prisma.newsletter.count(),
            prisma.rareEarthMaterial.count(),
            prisma.user.count(),
            prisma.video.count(),
        ]);

        return NextResponse.json({
            articles,
            newsletters,
            rareEarth,
            users,
            videos,
        });
    } catch (error) {
        console.error("Failed to fetch stats:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
