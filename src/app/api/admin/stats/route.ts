import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isWaitlistRecord } from "@/lib/waitlist";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any)?.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const [articles, newsletters, rareEarth, users, videos, socialPosts, allSubscribers] = await Promise.all([
            prisma.article.count(),
            prisma.newsletter.count(),
            prisma.rareEarthMaterial.count(),
            prisma.user.count(),
            prisma.video.count(),
            prisma.socialPost.count(),
            prisma.newsletter.findMany({
                where: { active: true },
                select: { materialPreferences: true },
            }),
        ]);

        const waitlist = allSubscribers.filter((sub) =>
            isWaitlistRecord(sub.materialPreferences)
        ).length;

        return NextResponse.json({
            articles,
            newsletters,
            rareEarth,
            users,
            videos,
            socialPosts,
            waitlist,
        });
    } catch (error) {
        console.error("Failed to fetch stats:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}