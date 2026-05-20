import { NextResponse } from 'next/server';

const API_KEY = '2CXKVQU2QM3DKVOM';

type SupportedInterval = '60min' | 'D' | 'W' | 'M';

// In-memory cache to avoid hitting the 25 req/day limit
const cache = new Map<string, { timestamp: number, data: any }>();
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const requestedInterval = searchParams.get('interval');
    const interval: SupportedInterval =
        requestedInterval === '60min' ||
        requestedInterval === 'W' ||
        requestedInterval === 'M'
            ? requestedInterval
            : 'D';

    if (!symbol) {
        return NextResponse.json({ error: 'Missing symbol' }, { status: 400 });
    }

    // Symbol mapping for fallback to common ETFs since TV symbols are used
    const proxyMap: Record<string, string> = {
        'XAUUSD': 'GLD',
        'TVC:USOIL': 'USO',
        'CAPITALCOM:COPPER': 'CPER',
        'CAPITALCOM:DXY': 'UUP',
        'CAPITALCOM:US500': 'SPY',
        'CAPITALCOM:NATURALGAS': 'UNG',
        'CAPITALCOM:SILVER': 'SLV',
        'TVC:US10Y': 'IEF'
    };

    const avSymbol = proxyMap[symbol] || symbol;
    const cacheKey = `${avSymbol}:${interval}`;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return NextResponse.json(cached.data);
    }

    try {
        const queryUrl = new URL('https://www.alphavantage.co/query');

        if (interval === '60min') {
            queryUrl.searchParams.set('function', 'TIME_SERIES_INTRADAY');
            queryUrl.searchParams.set('interval', '60min');
            queryUrl.searchParams.set('outputsize', 'compact');
        } else if (interval === 'W') {
            queryUrl.searchParams.set('function', 'TIME_SERIES_WEEKLY');
        } else if (interval === 'M') {
            queryUrl.searchParams.set('function', 'TIME_SERIES_MONTHLY');
        } else {
            queryUrl.searchParams.set('function', 'TIME_SERIES_DAILY');
            queryUrl.searchParams.set('outputsize', 'compact');
        }

        queryUrl.searchParams.set('symbol', avSymbol);
        queryUrl.searchParams.set('apikey', API_KEY);

        const response = await fetch(queryUrl.toString());
        const data = await response.json();

        if (data['Note'] || data['Information']) {
            // This is usually a rate limit message
            console.warn('Alpha Vantage API note:', data);
            if (cached) {
                // Return stale cache if rate limited
                return NextResponse.json(cached.data);
            }
        }

        const timeSeriesKey =
            interval === '60min'
                ? 'Time Series (60min)'
                : interval === 'W'
                    ? 'Weekly Time Series'
                    : interval === 'M'
                        ? 'Monthly Time Series'
                        : 'Time Series (Daily)';

        if (data[timeSeriesKey]) {
            // transform data to array of objects
            const timeSeries = data[timeSeriesKey];
            const rawDates = Object.keys(timeSeries).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

            const formattedData = rawDates.map(date => ({
                date,
                open: parseFloat(timeSeries[date]['1. open']),
                high: parseFloat(timeSeries[date]['2. high']),
                low: parseFloat(timeSeries[date]['3. low']),
                close: parseFloat(timeSeries[date]['4. close']),
                volume: parseFloat(timeSeries[date]['5. volume'])
            }));

            const result = { symbol: avSymbol, data: formattedData };
            cache.set(cacheKey, { timestamp: Date.now(), data: result });

            return NextResponse.json(result);
        } else {
            // Fallback for empty data
            if (cached) return NextResponse.json(cached.data);
            return NextResponse.json({ error: 'No time series data returned', details: data }, { status: 400 });
        }

    } catch (error) {
        console.error('Error fetching Alpha Vantage data:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
