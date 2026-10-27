import { NextResponse } from "next/server";
import {
  getCoalMarketData,
  enrichCoalMarketData,
} from "@/lib/coal-market-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const rawData = await getCoalMarketData(new URL(req.url).origin);
    const data = enrichCoalMarketData(rawData);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("[Coal Market API] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch coal market data" },
      { status: 500 },
    );
  }
}
