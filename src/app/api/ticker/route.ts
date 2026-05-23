import { NextResponse } from "next/server";
import {
  ensureTickerDataFresh,
  getStoredTickerData,
  getMiningCommodityData,
} from "@/lib/ticker-service";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureTickerDataFresh();

    // First try to get stored data from DB
    let data = await getStoredTickerData();

    // If no data in DB, use fallback mining commodity data
    if (!data || data.length === 0) {
      data = await getMiningCommodityData();
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 's-maxage=15, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error("Ticker API Error:", error);
    // Return fallback data even on error
    const fallbackData = await getMiningCommodityData();
    return NextResponse.json(fallbackData, {
      headers: {
        'Cache-Control': 's-maxage=15, stale-while-revalidate=60',
      },
    });
  }
}
