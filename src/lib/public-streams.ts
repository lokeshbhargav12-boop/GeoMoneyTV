export function youtubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com'].includes(parsed.hostname)) return null;
    const id = parsed.pathname.startsWith('/embed/') ? parsed.pathname.split('/')[2] : parsed.searchParams.get('v');
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}

export function streamErrorMessage(code: number): string {
  if (code === 100) return 'This video has ended, is private, or was removed by its provider.';
  if (code === 101 || code === 150) return 'The provider does not allow this stream to play on other websites.';
  if (code === 153) return 'YouTube could not verify this player’s origin. Open the stream directly on the provider.';
  return 'The stream could not be played. Retry or open it on the provider.';
}

export function liveVideoFromChannelHtml(html: string): string | null {
  if (!/"isLiveNow"\s*:\s*true/.test(html)) return null;
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
  return canonical ? youtubeVideoId(canonical.replace(/&amp;/g, '&')) : null;
}