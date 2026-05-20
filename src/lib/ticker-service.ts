import { prisma } from "@/lib/prisma";

type TickerSymbolConfig = {
    label: string;
    symbol: string;
    type: string;
    sourceSymbol?: string;
};

const DEFAULT_SYMBOLS = [
    { label: 'GOLD', symbol: 'GOLD', type: 'commodity', sourceSymbol: 'GLD' },
    { label: 'SILVER', symbol: 'SILVER', type: 'commodity', sourceSymbol: 'SLV' },
    { label: 'COPPER', symbol: 'COPPER', type: 'commodity', sourceSymbol: 'CPER' },
    { label: 'CRUDE OIL', symbol: 'CRUDE', type: 'commodity', sourceSymbol: 'USO' },
    { label: 'NAT GAS', symbol: 'NATGAS', type: 'commodity', sourceSymbol: 'UNG' },
    { label: 'URANIUM', symbol: 'URANIUM', type: 'commodity', sourceSymbol: 'URNM' },
    { label: 'LITHIUM', symbol: 'LITHIUM', type: 'commodity', sourceSymbol: 'LIT' },
] satisfies TickerSymbolConfig[];

const COMMODITY_PROXY_MAP: Record<string, string> = {
    GOLD: 'GLD',
    XAUUSD: 'GLD',
    SILVER: 'SLV',
    XAGUSD: 'SLV',
    COPPER: 'CPER',
    CRUDE: 'USO',
    USOIL: 'USO',
    WTI: 'USO',
    NATGAS: 'UNG',
    NATURALGAS: 'UNG',
    UNGAS: 'UNG',
    URANIUM: 'URNM',
    LITHIUM: 'LIT',
};

// Mining commodities for the ticker (Discovery Alert style)
const MINING_COMMODITIES = [
    { label: 'GOLD', symbol: 'GOLD', price: 2715.30, change: -5.20, changePercent: -0.19, type: 'commodity' },
    { label: 'SILVER', symbol: 'SILVER', price: 30.125, change: -0.205, changePercent: -0.68, type: 'commodity' },
    { label: 'COPPER', symbol: 'COPPER', price: 4.2150, change: 0.0350, changePercent: 0.84, type: 'commodity' },
    { label: 'ZINC', symbol: 'ZINC', price: 3360.090, change: -68.750, changePercent: -2.01, type: 'commodity' },
    { label: 'LEAD', symbol: 'LEAD', price: 1985.500, change: -4.350, changePercent: -0.22, type: 'commodity' },
    { label: 'NICKEL', symbol: 'NICKEL', price: 17521.0, change: -963.0, changePercent: -5.21, type: 'commodity' },
    { label: 'CRUDE OIL', symbol: 'CRUDE', price: 69.84, change: 0.14, changePercent: 0.20, type: 'commodity' },
    { label: 'ASX200', symbol: 'ASX200', price: 8818.49, change: -75.00, changePercent: -0.84, type: 'index' },
    { label: 'URANIUM', symbol: 'URANIUM', price: 97.50, change: -3.03, changePercent: -3.03, type: 'commodity' },
    { label: 'LITHIUM', symbol: 'LITHIUM', price: 10250.00, change: 125.00, changePercent: 1.23, type: 'commodity' },
];

function normalizeTickerKey(value: string) {
    return value.trim().toUpperCase();
}

function mergeTickerRows(storedRows: Array<{
    label: string;
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    type: string;
}>) {
    const storedBySymbol = new Map(
        storedRows.map((item) => [normalizeTickerKey(item.symbol), item]),
    );

    const merged = MINING_COMMODITIES.map((item) => {
        const stored =
            storedBySymbol.get(normalizeTickerKey(item.symbol)) ||
            storedBySymbol.get(normalizeTickerKey(item.label));

        return stored
            ? {
                ...item,
                label: stored.label || item.label,
                symbol: stored.symbol || item.symbol,
                price: stored.price,
                change: stored.change,
                changePercent: stored.changePercent,
                type: stored.type || item.type,
            }
            : item;
    });

    const additionalRows = storedRows.filter((item) => {
        const key = normalizeTickerKey(item.symbol);
        return !MINING_COMMODITIES.some(
            (baseItem) =>
                normalizeTickerKey(baseItem.symbol) === key ||
                normalizeTickerKey(baseItem.label) === key,
        ) && ["commodity", "index"].includes(item.type);
    });

    return [...merged, ...additionalRows];
}

export async function getMiningCommodityData() {
    // Returns mining commodity data for the ticker
    // In production, this would fetch from a live API
    return MINING_COMMODITIES.map(item => ({
        label: item.label,
        symbol: item.symbol,
        price: item.price,
        change: item.change,
        changePercent: item.changePercent,
        type: item.type
    }));
}

export async function getStoredTickerData() {
    try {
        const data = await prisma.commodityPrice.findMany({
            orderBy: { updatedAt: 'desc' },
        });

        if (data.length > 0) {
            const storedRows = data.map(item => ({
                label: item.label,
                symbol: item.symbol,
                price: item.price,
                change: item.change || 0,
                changePercent: item.previousClose && item.previousClose !== 0
                    ? ((item.price - item.previousClose) / item.previousClose) * 100
                    : item.change || 0,
                type: item.type
            }));

            return mergeTickerRows(storedRows);
        }

        // Return mining commodities as fallback
        return getMiningCommodityData();
    } catch (error) {
        console.error("Error reading ticker from DB:", error);
        return getMiningCommodityData();
    }
}

export async function updateTickerData() {
    try {
        // 1. Get Settings
        const settings = await prisma.siteSettings.findMany({
            where: { key: { in: ['ticker_symbols', 'alpha_vantage_key'] } }
        });

        let symbols: TickerSymbolConfig[] = DEFAULT_SYMBOLS;
        let apiKey = '';

        settings.forEach((s) => {
            if (s.key === 'ticker_symbols') {
                try {
                    const parsed = JSON.parse(s.value);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        symbols = parsed;
                    }
                } catch { }
            } else if (s.key === 'alpha_vantage_key') {
                apiKey = s.value.trim();
            }
        });

        if (!apiKey) {
            console.log("Skipping Ticker Update: No API Key");
            return 0;
        }

        // 2. Fetch data for each symbol
        let updatedCount = 0;

        for (const item of symbols) {
            try {
                let price = 0;
                let change = 0;
                let previousClose = 0;

                let url = "";
                const fetchSymbol = item.sourceSymbol || COMMODITY_PROXY_MAP[normalizeTickerKey(item.symbol)] || item.symbol;

                if (item.type === 'crypto' && fetchSymbol === 'BTC') {
                    url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${fetchSymbol}&to_currency=USD&apikey=${apiKey}`;
                } else if (item.type === 'currency' && fetchSymbol === 'EUR') {
                    url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${fetchSymbol}&to_currency=USD&apikey=${apiKey}`;
                } else {
                    url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${fetchSymbol}&apikey=${apiKey}`;
                }

                const res = await fetch(url);
                const data = await res.json();

                if (data['Global Quote']) {
                    const q = data['Global Quote'];
                    price = parseFloat(q['05. price']);
                    change = parseFloat(q['10. change percent']?.replace('%', ''));
                    previousClose = parseFloat(q['08. previous close']);
                } else if (data['Realtime Currency Exchange Rate']) {
                    const q = data['Realtime Currency Exchange Rate'];
                    price = parseFloat(q['5. Exchange Rate']);
                    change = 0;
                } else {
                    console.warn(`No data for ${item.symbol}`, data);
                    continue;
                }

                if (price > 0) {
                    await prisma.commodityPrice.upsert({
                        where: { symbol: item.symbol },
                        update: {
                            price,
                            change,
                            previousClose,
                            updatedAt: new Date()
                        },
                        create: {
                            label: item.label,
                            symbol: item.symbol,
                            type: item.type,
                            price,
                            change,
                            previousClose
                        }
                    });
                    updatedCount++;
                }

            } catch (err) {
                console.error(`Failed to update ${item.symbol}`, err);
            }
        }

        return updatedCount;

    } catch (error) {
        console.error("Critical error in updateTickerData", error);
        throw error;
    }
}
