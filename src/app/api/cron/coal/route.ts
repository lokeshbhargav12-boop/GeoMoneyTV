import { NextResponse } from "next/server";
import {
  getCoalMarketData,
  clearCoalMarketCache,
  clearCoalAiBriefCache,
  generateCoalCommentary,
} from "@/lib/coal-market-service";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60s for EIA + OpenRouter warm-up

// Scheduled coal-desk warm-up. Protected by CRON_SECRET (same pattern as
// /api/cron/sync). Refreshes the in-memory market cache and force-regenerates
// the AI brief (bypassing its 4-hour TTL). Called by the in-process scheduler
// in server.js every 4 hours; GDELT/vessels stay fresh per /api/coal/market
// request within their own 2-minute cache.
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    console.log("[Coal Cron] Warming coal desk caches...");

    // 1. Warm the market data cache (EIA basin prices + aggregates, ticker,
    //    vessels, OSINT, climate).
    clearCoalMarketCache();
    const marketData = await getCoalMarketData();

    // 2. Force-regenerate the AI brief (clear bypasses the 4-hour TTL).
    clearCoalAiBriefCache();
    const brief = await generateCoalCommentary(marketData);

    return NextResponse.json({
      success: true,
      warmed: {
        benchmarks: marketData.benchmarks.length,
        liveBenchmarks: marketData.benchmarks.filter((b) => b.live).length,
        eiaBenchmarks: marketData.benchmarks.filter((b) => b.asOf).length,
        routes: marketData.routes.length,
        briefFetchedAt: brief.fetchedAt ?? null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Coal Cron] failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
