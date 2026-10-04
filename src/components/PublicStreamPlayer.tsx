"use client";

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import type { Webcam } from '@/lib/world-monitor-geo';
import { streamErrorMessage } from '@/lib/public-streams';

interface Player { destroy(): void; pauseVideo(): void }
interface YouTubeApi { Player: new (element: HTMLElement, options: Record<string, unknown>) => Player }
type YouTubeWindow = Window & { YT?: YouTubeApi; onYouTubeIframeAPIReady?: () => void };
let sdkPromise: Promise<YouTubeApi> | null = null;
function loadPlayerApi(): Promise<YouTubeApi> {
  const win = window as YouTubeWindow;
  if (win.YT?.Player) return Promise.resolve(win.YT);
  if (!sdkPromise) sdkPromise = new Promise((resolve, reject) => {
    const previous = win.onYouTubeIframeAPIReady;
    const timer = window.setTimeout(() => {
      document.querySelector('script[src="https://www.youtube.com/iframe_api"]')?.remove();
      sdkPromise = null;
      reject(new Error('YouTube player could not load. Check your connection or content blocker.'));
    }, 15_000);
    win.onYouTubeIframeAPIReady = () => { window.clearTimeout(timer); previous?.(); if (win.YT) resolve(win.YT); };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.onerror = () => { window.clearTimeout(timer); script.remove(); sdkPromise = null; reject(new Error('YouTube player is blocked or unavailable.')); };
      document.head.appendChild(script);
    }
  });
  return sdkPromise;
}

export default function PublicStreamPlayer({ feed }: { feed: Webcam }) {
  const host = useRef<HTMLDivElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState('Loading provider…');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [verified, setVerified] = useState(false);
  const [checkedAt, setCheckedAt] = useState('');

  useEffect(() => {
    let disposed = false;
    let player: Player | undefined;
    let readyTimer: number | undefined;
    const controller = new AbortController();
    const deadline = window.setTimeout(() => controller.abort(), 12_000);
    setState('Loading provider…'); setError(''); setNotice(''); setVerified(false); setCheckedAt('');
    const visibility = () => { if (document.hidden) player?.pauseVideo(); };
    document.addEventListener('visibilitychange', visibility);
    (async () => {
      try {
        const response = await fetch(`/api/world-monitor/streams?id=${encodeURIComponent(feed.id)}`, { signal: controller.signal, cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !data.videoId) throw new Error(data.error || 'No public video is configured for this feed.');
        if (disposed) return;
        setVerified(data.liveVerified === true); setNotice(data.notice || ''); setCheckedAt(data.checkedAt || '');
        const api = await loadPlayerApi();
        if (disposed || !host.current) return;
        const element = document.createElement('div');
        host.current.replaceChildren(element);
        readyTimer = window.setTimeout(() => { if (!disposed) { setError('The video player did not become ready. Retry or open the provider.'); setState('Unavailable'); } }, 15_000);
        player = new api.Player(element, {
          width: '100%', height: '100%', videoId: data.videoId,
          playerVars: { autoplay: 0, playsinline: 1, origin: window.location.origin, enablejsapi: 1 },
          events: {
            onReady: () => { window.clearTimeout(readyTimer); if (!disposed) { setError(''); setState('Ready — tap Play'); } },
            onStateChange: (event: { data: number }) => {
              if (!disposed) setState(({ 0: 'Ended', 1: 'Playing', 2: 'Paused', 3: 'Buffering…', 5: 'Ready — tap Play' } as Record<number, string>)[event.data] || 'Ready — tap Play');
            },
            onAutoplayBlocked: () => { if (!disposed) setState('Tap Play to start'); },
            onError: (event: { data: number }) => { window.clearTimeout(readyTimer); if (!disposed) { setError(streamErrorMessage(event.data)); setState('Unavailable'); } },
          },
        });
        // YouTube replaces its mount node with an iframe; explicitly preserve
        // accessible naming, referrer identification and user-initiated playback.
        const iframe = host.current.querySelector('iframe');
        if (iframe) {
          iframe.title = feed.title;
          iframe.referrerPolicy = 'strict-origin-when-cross-origin';
          iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
        }
      } catch (failure) {
        if (!disposed) { setError(controller.signal.aborted ? 'The provider check timed out. Please retry.' : failure instanceof Error ? failure.message : 'Stream unavailable.'); setState('Unavailable'); }
      } finally { window.clearTimeout(deadline); }
    })();
    return () => { disposed = true; controller.abort(); window.clearTimeout(deadline); window.clearTimeout(readyTimer); document.removeEventListener('visibilitychange', visibility); player?.destroy(); };
  }, [feed.id, attempt]);

  return (
    <div className="min-w-0 bg-black">
      <div ref={host} className="aspect-video min-h-[200px] w-full [&_iframe]:h-full [&_iframe]:w-full" />
      <div className="space-y-2 p-3 text-xs">
        <div role="status" className="flex flex-wrap items-center gap-2 text-gray-300">
          <span className="rounded bg-white/10 px-2 py-1">{state}</span>
          <span>{verified ? 'Provider reports live' : 'Live status unverified'}</span>
        </div>
        {checkedAt && <p className="text-gray-500">Status checked {new Date(checkedAt).toLocaleTimeString()}</p>}
        {feed.feedType === 'broadcast' && <p className="text-gray-400">News broadcast — map pin identifies the broadcaster, not the footage location.</p>}
        {notice && <p className="text-amber-300">{notice}</p>}
        {error && <p role="alert" className="text-red-300">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setAttempt((value) => value + 1)} className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-white/20 px-3 text-white"><RefreshCw className="h-4 w-4" />Retry</button>
          <a href={feed.providerUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-cyan-400/30 px-3 text-cyan-300">Open on provider<ExternalLink className="h-4 w-4" /></a>
        </div>
      </div>
    </div>
  );
}