import { prisma } from "@/lib/prisma";
import {
    HISTORY_REFRESH_MS,
    ensureTickerFresh,
    fetchAndStoreHistory,
    getLatestStoredHistoryTimestamp,
    getStoredHistory,
    refreshTickerQuotes,
    type MarketHistoryRow,
    type MarketInterval,
    type MarketSymbolConfig,
} from "@/lib/market-data-service";
import { getMarketStatus } from "@/lib/market-schedule";
import type { MarketStatus } from "@/lib/market-schedule";

export type TickerSymbolConfig = MarketSymbolConfig;

const DEFAULT_SYMBOLS = [
    { label: "GOLD", symbol: "GOLD", type: "commodity", sourceSymbol: "XAUUSD" },
    { label: "SILVER", symbol: "SILVER", type: "commodity", sourceSymbol: "XAGUSD" },
    { label: "COPPER", symbol: "COPPER", type: "commodity", sourceSymbol: "CAPITALCOM:COPPER" },
    { label: "ZINC", symbol: "ZINC", type: "commodity" },
    { label: "LEAD", symbol: "LEAD", type: "commodity" },
    { label: "NICKEL", symbol: "NICKEL", type: "commodity" },
    { label: "CRUDE OIL", symbol: "CRUDE", type: "commodity", sourceSymbol: "TVC:USOIL" },
    { label: "NAT GAS", symbol: "NATGAS", type: "commodity", sourceSymbol: "CAPITALCOM:NATURALGAS" },
    { label: "ASX200", symbol: "ASX200", type: "index" },
    { label: "URANIUM", symbol: "URANIUM", type: "commodity" },
    { label: "LITHIUM", symbol: "LITHIUM", type: "commodity" },
] satisfies TickerSymbolConfig[];

interface BaseCommodityItem {
    label: string;
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    type: string;
}

const MINING_COMMODITIES: BaseCommodityItem[] = [
    { label: "GOLD", symbol: "GOLD", price: 2715.30, change: -5.20, changePercent: -0.19, type: "commodity" },
    { label: "SILVER", symbol: "SILVER", price: 30.125, change: -0.205, changePercent: -0.68, type: "commodity" },
    { label: "COPPER", symbol: "COPPER", price: 4.2150, change: 0.0350, changePercent: 0.84, type: "commodity" },
    { label: "ZINC", symbol: "ZINC", price: 3360.090, change: -68.750, changePercent: -2.01, type: "commodity" },
    { label: "LEAD", symbol: "LEAD", price: 1985.500, change: -4.350, changePercent: -0.22, type: "commodity" },
    { label: "NICKEL", symbol: "NICKEL", price: 17521.0, change: -963.0, changePercent: -5.21, type: "commodity" },
    { label: "CRUDE OIL", symbol: "CRUDE", price: 69.84, change: 0.14, changePercent: 0.20, type: "commodity" },
    { label: "ASX200", symbol: "ASX200", price: 8818.49, change: -75.00, changePercent: -0.84, type: "index" },
    { label: "URANIUM", symbol: "URANIUM", price: 97.50, change: -3.03, changePercent: -3.03, type: "commodity" },
    { label: "LITHIUM", symbol: "LITHIUM", price: 10250.00, change: 125.00, changePercent: 1.23, type: "commodity" },
];

export interface TickerItem {
    label: string;
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    type: string;
    marketStatus: MarketStatus;
    sessionLabel: string;
    lastTradingTimestamp: string | null;
}

interface StoredRow {
    label: string;
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    type: string;
    marketStatus?: string;
    lastTradingTimestamp?: Date | null;
}

function normalizeTickerKey(value: string) {
    return value.trim().toUpperCase();
}

function attachMarketStatus(item: Omit<TickerItem, "marketStatus" | "sessionLabel" | "lastTradingTimestamp"> & { marketStatus?: string; lastTradingTimestamp?: string | Date | null; sessionLabel?: string }): TickerItem {
    const { status, sessionLabel } = getMarketStatus(item.symbol, item.type);
    const isActive = status === "OPEN" || status === "PRE_MARKET" || status === "POST_MARKET";

    const lastTs = item.lastTradingTimestamp
        ? (item.lastTradingTimestamp instanceof Date
            ? item.lastTradingTimestamp.toISOString()
            : String(item.lastTradingTimestamp))
        : null;

    return {
        label: item.label,
        symbol: item.symbol,
        price: item.price,
        change: isActive ? item.change : 0,
        changePercent: isActive ? item.changePercent : 0,
        type: item.type,
        marketStatus: status,
        sessionLabel,
        lastTradingTimestamp: lastTs,
    };
}

function mergeTickerRows(storedRows: StoredRow[]): TickerItem[] {
    const storedBySymbol = new Map(
        storedRows.map((item) => [normalizeTickerKey(item.symbol), item]),
    );

    const merged = MINING_COMMODITIES.map((item) => {
        const stored =
            storedBySymbol.get(normalizeTickerKey(item.symbol)) ||
            storedBySymbol.get(normalizeTickerKey(item.label));

        if (stored) {
            return attachMarketStatus({
                label: stored.label || item.label,
                symbol: stored.symbol || item.symbol,
                price: stored.price,
                change: stored.change,
                changePercent: stored.changePercent,
                type: stored.type || item.type,
                marketStatus: stored.marketStatus,
                lastTradingTimestamp: stored.lastTradingTimestamp,
            });
        }

        return attachMarketStatus(item);
    });

    const additionalRows = storedRows.filter((item) => {
        const key = normalizeTickerKey(item.symbol);
        return !MINING_COMMODITIES.some(
            (baseItem) =>
                normalizeTickerKey(baseItem.symbol) === key ||
                normalizeTickerKey(baseItem.label) === key,
        ) && ["commodity", "index"].includes(item.type);
    });

    const additionalWithStatus = additionalRows.map((item) =>
        attachMarketStatus(item),
    );

    return [...merged, ...additionalWithStatus];
}

export async function getMiningCommodityData(): Promise<TickerItem[]> {
    return MINING_COMMODITIES.map(item => attachMarketStatus(item));
}

export async function getTickerSymbols(): Promise<TickerSymbolConfig[]> {
    try {
        const setting = await prisma.siteSettings.findUnique({
            where: { key: "ticker_symbols" },
            select: { value: true },
        });

        if (!setting) {
            return DEFAULT_SYMBOLS;
        }

        const parsed = JSON.parse(setting.value);

        if (!Array.isArray(parsed) || parsed.length === 0) {
            return DEFAULT_SYMBOLS;
        }

        return parsed.filter(
            (item): item is TickerSymbolConfig =>
                typeof item?.label === "string" &&
                typeof item?.symbol === "string" &&
                typeof item?.type === "string",
        );
    } catch {
        return DEFAULT_SYMBOLS;
    }
}

export async function ensureTickerDataFresh(maxAgeMs = 60_000) {
    const symbols = await getTickerSymbols();
    return ensureTickerFresh(symbols, maxAgeMs);
}

export async function getStoredTickerData(): Promise<TickerItem[]> {
    try {
        const data = await prisma.commodityPrice.findMany({
            orderBy: { updatedAt: 'desc' },
        });

        if (data.length > 0) {
            const storedRows: StoredRow[] = data.map(item => ({
                label: item.label,
                symbol: item.symbol,
                price: item.price,
                change: item.change || 0,
                changePercent: item.previousClose && item.previousClose !== 0
                    ? ((item.price - item.previousClose) / item.previousClose) * 100
                    : item.change || 0,
                type: item.type,
                marketStatus: item.marketStatus,
                lastTradingTimestamp: item.lastTradingTimestamp,
            }));

            return mergeTickerRows(storedRows);
        }

        return getMiningCommodityData();
    } catch (error) {
        console.error("Error reading ticker from DB:", error);
        return getMiningCommodityData();
    }
}

export async function updateTickerData() {
    const symbols = await getTickerSymbols();
    return refreshTickerQuotes(symbols);
}

export async function resolveTickerSymbolConfig(rawSymbol: string) {
    const symbols = await getTickerSymbols();
    const normalized = normalizeTickerKey(rawSymbol);

    return (
        symbols.find(
            (item) =>
                normalizeTickerKey(item.symbol) === normalized ||
                normalizeTickerKey(item.label) === normalized ||
                normalizeTickerKey(item.sourceSymbol || "") === normalized,
        ) || {
            label: rawSymbol,
            symbol: rawSymbol,
            type: "instrument",
        }
    );
}

export async function getOrRefreshStoredHistory(
    rawSymbol: string,
    interval: MarketInterval,
): Promise<{ symbol: string; data: MarketHistoryRow[] }> {
    if (interval === "60min") {
        await ensureTickerDataFresh();
    }

    const symbolConfig = await resolveTickerSymbolConfig(rawSymbol);
    let data = await getStoredHistory(symbolConfig.symbol, interval);
    const latestRecordedAt = await getLatestStoredHistoryTimestamp(
        symbolConfig.symbol,
        interval,
    );
    const shouldRefresh =
        !latestRecordedAt ||
        Date.now() - latestRecordedAt.getTime() > HISTORY_REFRESH_MS[interval];

    if (data.length === 0 || shouldRefresh) {
        await fetchAndStoreHistory(symbolConfig, interval);
        data = await getStoredHistory(symbolConfig.symbol, interval);
    }

    return {
        symbol: symbolConfig.symbol,
        data,
    };
}