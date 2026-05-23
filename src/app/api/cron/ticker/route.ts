import { NextResponse } from "next/server";
import { updateTickerData } from "@/lib/ticker-service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const tickersCount = await updateTickerData();

        return NextResponse.json({
            success: true,
            synced: { tickers: tickersCount },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Ticker cron job failed:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        );
    }
}