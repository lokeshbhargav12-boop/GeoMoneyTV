"use client";

import { useState } from "react";
import { Play, Maximize2, X, AlertCircle } from "lucide-react";

export const NEWS_STREAMS = [
  {
    id: "sky_news",
    title: "Sky News Global",
    url: "https://www.youtube.com/embed/live_stream?channel=UCoMdktPbSTixAyNGwb-PUkQ",
    type: "youtube",
    status: "live",
  },
  {
    id: "al_jazeera",
    title: "Al Jazeera English",
    url: "https://www.youtube.com/embed/live_stream?channel=UCNye-wNBqNL5ZzHSJj3l8Bg",
    type: "youtube",
    status: "live",
  },
  {
    id: "abc_news",
    title: "ABC News Live",
    url: "https://www.youtube.com/embed/live_stream?channel=UCBi2mrWuNuyYy4gbM6fU18Q",
    type: "youtube",
    status: "live",
  },
];

export default function LiveVideoGrid() {
  const [activeStream, setActiveStream] = useState<string | null>(NEWS_STREAMS[0].id);

  const currentStream = NEWS_STREAMS.find(s => s.id === activeStream);

  return (
    <div className="flex flex-col gap-4">
      {/* Main Video Player */}
      <div className="relative aspect-video rounded-xl overflow-hidden border border-white/[0.08] bg-black shadow-inner">
        {currentStream ? (
          <iframe
            src={`${currentStream.url}&autoplay=1&mute=1`}
            className="absolute inset-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 bg-white/5">
            <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs font-mono">Stream Unavailable</p>
          </div>
        )}
        
        {/* Stream Badge */}
        <div className="absolute top-3 left-3 px-2 py-1 bg-red-600 text-white text-[9px] font-bold uppercase tracking-widest rounded flex items-center gap-1.5 shadow-lg shadow-black/50">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          LIVE
        </div>
      </div>

      {/* Stream Selector */}
      <div className="grid grid-cols-3 gap-2">
        {NEWS_STREAMS.map((stream) => (
          <button
            key={stream.id}
            onClick={() => setActiveStream(stream.id)}
            className={`text-left px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
              activeStream === stream.id
                ? "border-red-500/50 bg-red-500/10 text-white"
                : "border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Play className={`w-3 h-3 ${activeStream === stream.id ? 'text-red-400' : 'text-gray-500'}`} />
              <span className="truncate">{stream.title}</span>
            </div>
            <div className="text-[9px] font-mono opacity-60">Global Feed</div>
          </button>
        ))}
      </div>
    </div>
  );
}
