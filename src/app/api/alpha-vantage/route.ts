import { NextResponse } from 'next/server';
import { getOrRefreshStoredHistory } from '@/lib/ticker-service';

type SupportedInterval = '60min' | 'D' | 'W' | 'M';

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

    try {
        const result = await getOrRefreshStoredHistory(symbol, interval);
        return NextResponse.json(result, {
            headers: {
                'Cache-Control': 's-maxage=300, stale-while-revalidate=3600',
            },
        });
    } catch (error) {
        console.error('Error fetching market history data:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
