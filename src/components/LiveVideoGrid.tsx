"use client";

import { useState } from "react";
import { LIVE_WEBCAMS } from '@/lib/world-monitor-geo';
import PublicStreamPlayer from './PublicStreamPlayer';

export default function LiveVideoGrid() {
  const [activeFeed, setActiveFeed] = useState(LIVE_WEBCAMS[0]);

  return <div className="space-y-4">
    <p className="text-sm text-gray-400">Public news broadcasts and location cameras. Playback and live status depend on each provider.</p>
    <div className="grid grid-cols-2 gap-2">
      {LIVE_WEBCAMS.map((feed) => <button type="button" key={feed.id} aria-pressed={activeFeed.id === feed.id} onClick={() => setActiveFeed(feed)} className={`min-h-[48px] rounded-xl border px-3 py-2 text-left text-sm ${activeFeed.id === feed.id ? 'border-cyan-400/50 bg-cyan-400/10 text-white' : 'border-white/10 text-gray-300'}`}>{feed.title}<span className="block text-xs text-gray-400">{feed.feedType === 'camera' ? 'Location camera' : 'Broadcast'}</span></button>)}
    </div>
    <div className="overflow-hidden rounded-xl border border-white/10"><PublicStreamPlayer feed={activeFeed} /></div>
  </div>;
}
