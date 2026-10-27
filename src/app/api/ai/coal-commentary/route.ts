import { NextResponse } from "next/server";
import {
  getCoalMarketData,
  enrichCoalMarketData,
  generateCoalCommentary,
} from "@/lib/coal-market-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const rawData = await getCoalMarketData(new URL(req.url).origin);
    const marketData = enrichCoalMarketData(rawData);
    const commentary = await generateCoalCommentary(marketData);
    return NextResponse.json(
      { ...commentary, timestamp: marketData.timestamp },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error("[Coal Commentary API] error:", error);
    return NextResponse.json(
      { error: "Failed to generate coal commentary" },
      { status: 500 },
    );
  }
}
