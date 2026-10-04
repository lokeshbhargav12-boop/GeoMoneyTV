import { NextResponse } from 'next/server';
import { LIVE_WEBCAMS } from '@/lib/world-monitor-geo';
import { liveVideoFromChannelHtml, youtubeVideoId } from '@/lib/public-streams';

export const dynamic = 'force-dynamic';
const cache = new Map<string, { expires: number; value: Record<string, unknown> }>();

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id');
  const feed = LIVE_WEBCAMS.find((entry) => entry.id === id);
  if (!feed) return NextResponse.json({ error: 'Unknown public feed.' }, { status: 404 });
  const cached = cache.get(feed.id);
  if (cached && cached.expires > Date.now()) return NextResponse.json(cached.value);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  let videoId = youtubeVideoId(feed.embedUrl);
  let liveVerified = false;
  let notice = 'Live status is unverified. Playback availability depends on the provider.';
  try {
    // Only predefined URLs are fetched; clients cannot turn this endpoint into a proxy.
    const response = await fetch(feed.channelUrl || feed.providerUrl!, { signal: controller.signal, cache: 'no-store' });
    if (response.ok) {
      const current = liveVideoFromChannelHtml(await response.text());
      if (current) { videoId = current; liveVerified = true; notice = ''; }
    }
  } catch {
    notice = 'The provider’s current live status could not be checked. You can still try playback or open the provider.';
  } finally { clearTimeout(timer); }
  const value = { id: feed.id, videoId, liveVerified, checkedAt: new Date().toISOString(), providerUrl: feed.providerUrl, notice };
  cache.set(feed.id, { value, expires: Date.now() + (liveVerified ? 120_000 : 30_000) });
  return NextResponse.json(value);
}