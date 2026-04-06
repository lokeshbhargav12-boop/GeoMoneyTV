import { NextResponse } from 'next/server';
import { syncNewsToDatabase } from '@/lib/news-service';
import { updateTickerData } from '@/lib/ticker-service';
import { syncVideosToDatabase } from '@/lib/video-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow 60 seconds (Vercel max for Hobby/Pro limits vary)

export async function GET(req: Request) {
    // Require a secret token to prevent anyone from triggering expensive syncs
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return new Response('Unauthorized', { status: 401 })
    }

    try {
        console.log("Starting Scheduled Sync Job...");

        // 1. Sync News
        const newsCount = await syncNewsToDatabase();
        console.log(`Synced ${newsCount} news articles.`);

        // 2. Sync Tickers
        const tickersCount = await updateTickerData();
        console.log(`Synced ${tickersCount} tickers.`);

        // 3. Sync YouTube Videos & Shorts
        const videoResult = await syncVideosToDatabase();
        console.log(`Synced ${videoResult.added} new videos (${videoResult.total} total fetched).`);

        return NextResponse.json({
            success: true,
            synced: {
                news: newsCount,
                tickers: tickersCount,
                videos: videoResult
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Cron Job Failed:", error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
