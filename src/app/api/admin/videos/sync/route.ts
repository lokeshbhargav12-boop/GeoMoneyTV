import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncVideosToDatabase } from "@/lib/video-service";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await syncVideosToDatabase();

    return NextResponse.json({
      success: true,
      added: result.added,
      total: result.total,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Error syncing videos" },
      { status: 500 }
    );
  }
}
