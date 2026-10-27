// Lightweight coal chart history — fetches directly from Yahoo Finance
// (no Prisma DB dependency) so the chart renders even when the DB/ticker
// pipeline is unavailable.  Returns [{date, close}, …] sorted ascending.
import { NextResponse } from "next/server";
import { getReferenceCoalHistory } from "@/data/coal/reference-market";

export const dynamic = "force-dynamic";

const COAL_YAHOO_SYMBOLS: Record<string, string> = {
  NEWCASTLE: "MTF=F",
  API2: "ATW=F",
  ILLINOIS: "ILB=F",
  METCOAL: "MCC=F",
};

const INTERVAL_CONFIG: Record<string, { yahooInterval: "1d" | "1wk" | "1mo"; days: number }> = {
  D: { yahooInterval: "1d", days: 365 },
  W: { yahooInterval: "1wk", days: 365 * 3 },
  M: { yahooInterval: "1mo", days: 365 * 10 },
};

function subtractDays(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawSymbol = searchParams.get("symbol") ?? "";
  const intervalParam = searchParams.get("interval") ?? "D";
  const interval = INTERVAL_CONFIG[intervalParam] ? intervalParam : "D";

  const normalizedSymbol = rawSymbol.toUpperCase();
  const yahooSymbol = COAL_YAHOO_SYMBOLS[normalizedSymbol];
  const fallbackData = getReferenceCoalHistory(
    normalizedSymbol,
    interval as "D" | "W" | "M",
  );

  if (!yahooSymbol && fallbackData.length === 0) {
    return NextResponse.json(
      { error: `No Yahoo Finance symbol for "${rawSymbol}"` },
      { status: 404 },
    );
  }

  if (!yahooSymbol) {
    return NextResponse.json(
      { symbol: rawSymbol, data: fallbackData, source: "reference" },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        },
      },
    );
  }

  const config = INTERVAL_CONFIG[interval];

  try {
    const YahooFinance = (await import("yahoo-finance2")).default;
    const yf = new YahooFinance();

    const chart = (await yf.chart(yahooSymbol, {
      period1: subtractDays(config.days),
      interval: config.yahooInterval,
    })) as {
      quotes?: Array<{
        date?: Date;
        close?: number | null;
      }>;
    };

    const data = (chart.quotes ?? [])
      .filter((q) => q.date && q.close != null && Number.isFinite(q.close))
      .map((q) => ({
        date: (q.date as Date).toISOString(),
        close: q.close as number,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-200);

    return NextResponse.json(
      {
        symbol: rawSymbol,
        data: data.length > 0 ? data : fallbackData,
        source: data.length > 0 ? "yahoo" : "reference",
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        },
      },
    );
  } catch (error) {
    console.error("[coal/chart-history] Yahoo Finance fetch failed, using reference series:", error);
    return NextResponse.json(
      { symbol: rawSymbol, data: fallbackData, source: "reference" },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        },
      },
    );
  }
}
