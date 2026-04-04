import { prisma } from "@/lib/prisma";

const DEFAULT_SYMBOLS = [
    { label: 'S&P 500', symbol: 'SPY', type: 'stock' },
    { label: 'Gold (Oz)', symbol: 'GLD', type: 'commodity' },
    { label: 'Bitcoin', symbol: 'BTC', type: 'crypto' },
    { label: 'Euro', symbol: 'EUR', type: 'currency' },
];

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
            return data.map(item => ({
                label: item.label,
                symbol: item.symbol,
                price: item.price,
                change: item.change || 0,
                changePercent: item.change || 0,
                type: item.type
            }));
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

        let symbols = DEFAULT_SYMBOLS;
        let apiKey = '';

        settings.forEach((s) => {
            if (s.key === 'ticker_symbols') {
                try { symbols = JSON.parse(s.value); } catch { }
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

                if (item.type === 'crypto' && item.symbol === 'BTC') {
                    url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${item.symbol}&to_currency=USD&apikey=${apiKey}`;
                } else if (item.type === 'currency' && item.symbol === 'EUR') {
                    url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${item.symbol}&to_currency=USD&apikey=${apiKey}`;
                } else {
                    url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${item.symbol}&apikey=${apiKey}`;
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
