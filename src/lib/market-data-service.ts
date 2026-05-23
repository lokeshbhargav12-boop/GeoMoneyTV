import YahooFinance from "yahoo-finance2";
import { prisma } from "@/lib/prisma";

const yahooFinance = new YahooFinance();

export type MarketInterval = "60min" | "D" | "W" | "M";

export interface MarketQuoteRow {
    label: string;
    symbol: string;
    type: string;
    price: number;
    change: number;
    changePercent: number;
    previousClose: number | null;
    updatedAt?: Date;
}

export interface MarketHistoryRow {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface MarketSymbolConfig {
    label: string;
    symbol: string;
    type: string;
    sourceSymbol?: string;
}

type HistoryIntervalConfig = {
    yahooInterval: "1h" | "1d" | "1wk" | "1mo";
    days: number;
};

const YAHOO_SYMBOL_MAP: Record<string, string> = {
    GOLD: "GC=F",
    XAUUSD: "GC=F",
    SILVER: "SI=F",
    XAGUSD: "SI=F",
    COPPER: "HG=F",
    "CAPITALCOM:COPPER": "HG=F",
    CRUDE: "CL=F",
    WTI: "CL=F",
    "TVC:USOIL": "CL=F",
    USOIL: "CL=F",
    NATGAS: "NG=F",
    NATURALGAS: "NG=F",
    "CAPITALCOM:NATURALGAS": "NG=F",
    ASX200: "^AXJO",
    URANIUM: "URNM",
    LITHIUM: "LIT",
    ZINC: "ZINC.L",
    LEAD: "LEAD.L",
    NICKEL: "NICKEL.L",
    "TVC:US10Y": "^TNX",
    "CAPITALCOM:DXY": "DX-Y.NYB",
};

const HISTORY_CONFIG: Record<MarketInterval, HistoryIntervalConfig> = {
    "60min": { yahooInterval: "1h", days: 30 },
    D: { yahooInterval: "1d", days: 365 * 5 },
    W: { yahooInterval: "1wk", days: 365 * 10 },
    M: { yahooInterval: "1mo", days: 365 * 20 },
};

const HISTORY_LOOKBACK_LIMIT = 400;
let tickerRefreshPromise: Promise<number> | null = null;

function normalizeTickerKey(value: string) {
    return value.trim().toUpperCase();
}

function resolveYahooSymbol(item: Pick<MarketSymbolConfig, "symbol" | "sourceSymbol">) {
    const sourceKey = item.sourceSymbol
        ? normalizeTickerKey(item.sourceSymbol)
        : undefined;
    const symbolKey = normalizeTickerKey(item.symbol);

    if (sourceKey && YAHOO_SYMBOL_MAP[sourceKey]) {
        return YAHOO_SYMBOL_MAP[sourceKey];
    }

    return YAHOO_SYMBOL_MAP[symbolKey] || item.sourceSymbol || item.symbol;
}

function subtractDays(days: number) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - days);
    return date;
}

function toMinuteBucket(date = new Date()) {
    const bucket = new Date(date);
    bucket.setUTCSeconds(0, 0);
    return bucket;
}

function toFiniteNumber(value: unknown) {
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

export async function fetchLatestQuote(
    item: MarketSymbolConfig,
): Promise<MarketQuoteRow | null> {
    try {
        const yahooSymbol = resolveYahooSymbol(item);
        const quote = (await yahooFinance.quote(yahooSymbol)) as
            | Record<string, unknown>
            | undefined;

        if (!quote) {
            return null;
        }

        const price =
            toFiniteNumber(quote.regularMarketPrice) ??
            toFiniteNumber(quote.postMarketPrice) ??
            toFiniteNumber(quote.preMarketPrice);
        const change =
            toFiniteNumber(quote.regularMarketChange) ??
            toFiniteNumber(quote.postMarketChange) ??
            0;
        const changePercent =
            toFiniteNumber(quote.regularMarketChangePercent) ??
            toFiniteNumber(quote.postMarketChangePercent) ??
            0;
        const previousClose = toFiniteNumber(quote.regularMarketPreviousClose);

        if (!price) {
            return null;
        }

        return {
            label: item.label,
            symbol: item.symbol,
            type: item.type,
            price,
            change,
            changePercent,
            previousClose,
        };
    } catch (error) {
        console.error(`Quote fetch failed for ${item.symbol}:`, error);
        return null;
    }
}

export async function fetchAndStoreHistory(
    item: MarketSymbolConfig,
    interval: MarketInterval,
) {
    const config = HISTORY_CONFIG[interval];
    const yahooSymbol = resolveYahooSymbol(item);

    try {
        const chart = (await yahooFinance.chart(yahooSymbol, {
            period1: subtractDays(config.days),
            interval: config.yahooInterval,
        })) as {
            quotes?: Array<{
                date?: Date;
                open?: number | null;
                high?: number | null;
                low?: number | null;
                close?: number | null;
                volume?: number | null;
            }>;
        };

        const historyRows = (chart.quotes || [])
            .filter((point) => point.date && point.close != null)
            .map((point) => ({
                label: item.label,
                symbol: item.symbol,
                source: yahooSymbol,
                interval,
                open: point.open ?? point.close ?? 0,
                high: point.high ?? point.close ?? 0,
                low: point.low ?? point.close ?? 0,
                close: point.close ?? 0,
                volume: point.volume ?? 0,
                recordedAt: point.date as Date,
            }))
            .filter(
                (point) =>
                    point.open > 0 &&
                    point.high > 0 &&
                    point.low > 0 &&
                    point.close > 0,
            );

        if (!historyRows.length) {
            return [];
        }

        await prisma.marketPriceHistory.createMany({
            data: historyRows,
            skipDuplicates: true,
        });

        return historyRows;
    } catch (error) {
        console.error(`History fetch failed for ${item.symbol} (${interval}):`, error);
        return [];
    }
}

export async function getStoredHistory(
    symbol: string,
    interval: MarketInterval,
): Promise<MarketHistoryRow[]> {
    const rows = await prisma.marketPriceHistory.findMany({
        where: {
            symbol,
            interval,
        },
        orderBy: { recordedAt: "desc" },
        take: HISTORY_LOOKBACK_LIMIT,
    });

    return rows.reverse().map((row) => ({
        date: row.recordedAt.toISOString(),
        open: row.open,
        high: row.high,
        low: row.low,
        close: row.close,
        volume: row.volume ?? 0,
    }));
}

export async function upsertLatestQuote(quote: MarketQuoteRow) {
    await prisma.commodityPrice.upsert({
        where: { symbol: quote.symbol },
        update: {
            label: quote.label,
            type: quote.type,
            price: quote.price,
            change: quote.change,
            previousClose: quote.previousClose,
            updatedAt: new Date(),
        },
        create: {
            label: quote.label,
            symbol: quote.symbol,
            type: quote.type,
            price: quote.price,
            change: quote.change,
            previousClose: quote.previousClose,
        },
    });

    const recordedAt = toMinuteBucket();

    await prisma.marketPriceHistory.upsert({
        where: {
            symbol_interval_recordedAt: {
                symbol: quote.symbol,
                interval: "60min",
                recordedAt,
            },
        },
        update: {
            label: quote.label,
            source: resolveYahooSymbol({ symbol: quote.symbol }),
            open: quote.previousClose ?? quote.price,
            high: Math.max(quote.price, quote.previousClose ?? quote.price),
            low: Math.min(quote.price, quote.previousClose ?? quote.price),
            close: quote.price,
            volume: 0,
        },
        create: {
            label: quote.label,
            symbol: quote.symbol,
            source: resolveYahooSymbol({ symbol: quote.symbol }),
            interval: "60min",
            open: quote.previousClose ?? quote.price,
            high: Math.max(quote.price, quote.previousClose ?? quote.price),
            low: Math.min(quote.price, quote.previousClose ?? quote.price),
            close: quote.price,
            volume: 0,
            recordedAt,
        },
    });
}

export async function ensureTickerFresh(
    symbols: MarketSymbolConfig[],
    maxAgeMs = 60_000,
) {
    const latest = await prisma.commodityPrice.findFirst({
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
    });

    if (latest && Date.now() - latest.updatedAt.getTime() < maxAgeMs) {
        return 0;
    }

    if (!tickerRefreshPromise) {
        tickerRefreshPromise = refreshTickerQuotes(symbols).finally(() => {
            tickerRefreshPromise = null;
        });
    }

    return tickerRefreshPromise;
}

export async function refreshTickerQuotes(symbols: MarketSymbolConfig[]) {
    let updatedCount = 0;

    for (const item of symbols) {
        const quote = await fetchLatestQuote(item);

        if (!quote) {
            continue;
        }

        await upsertLatestQuote(quote);
        updatedCount += 1;
    }

    return updatedCount;
}