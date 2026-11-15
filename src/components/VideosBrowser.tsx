"use client";

import { useState } from "react";
import { Play, Film, Clapperboard } from "lucide-react";

export interface VideoItem {
  id: string;
  title: string;
  url: string;
  thumbnail: string | null;
  publishedAt: string;
}

interface VideosBrowserProps {
  regularVideos: VideoItem[];
  shorts: VideoItem[];
}

type Tab = "briefings" | "shorts";

/**
 * Tabbed video browser. The tabs previously just scrolled while both lists
 * rendered at once (147 cards on one page), which was slow and confusing
 * (QA P3). Only the active tab's list is mounted now.
 */
export default function VideosBrowser({ regularVideos, shorts }: VideosBrowserProps) {
  const [tab, setTab] = useState<Tab>("briefings");

  const tabs: { id: Tab; label: string; count: number; icon: typeof Film }[] = [
    { id: "briefings", label: "Global Briefings", count: regularVideos.length, icon: Film },
    { id: "shorts", label: "Quick Briefing", count: shorts.length, icon: Clapperboard },
  ];

  return (
    <>
      {/* Tab controls */}
      <div role="tablist" aria-label="Video categories" className="flex flex-wrap gap-4 mb-10">
        {tabs.map((entry) => {
          const Icon = entry.icon;
          const active = tab === entry.id;
          return (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`panel-${entry.id}`}
              id={`tab-${entry.id}`}
              onClick={() => setTab(entry.id)}
              className={`group flex items-center gap-2 px-6 py-3 rounded-full border transition-all cursor-pointer shadow-lg ${
                active
                  ? "border-geo-gold/60 bg-geo-gold/15 text-white"
                  : "border-white/10 bg-white/5 hover:border-geo-gold/50 hover:bg-white/10"
              }`}
            >
              <Icon className="w-5 h-5 text-geo-gold group-hover:scale-110 transition-transform" />
              <span className="font-bold text-white">{entry.label}</span>
              <span className="bg-white/10 text-gray-300 group-hover:bg-geo-gold/20 group-hover:text-geo-gold px-2.5 py-0.5 rounded-full text-xs font-bold transition-colors">
                {entry.count}
              </span>
            </button>
          );
        })}
      </div>

      {tab === "briefings" && (
        <section
          id="long-videos"
          role="tabpanel"
          aria-labelledby="tab-briefings"
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-8">
            <Film className="w-6 h-6 text-geo-gold" />
            <h2 className="text-2xl font-bold text-white">Global Briefings</h2>
            <span className="ml-auto text-sm text-gray-500">
              {regularVideos.length} videos
            </span>
          </div>

          {regularVideos.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {regularVideos.map((video) => (
                <a
                  key={video.id}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:border-geo-gold/30 hover:bg-white/10 transition-all"
                >
                  <div className="relative aspect-video overflow-hidden bg-gray-900">
                    {video.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-800">
                        <span className="text-gray-500">No Thumbnail</span>
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg">
                        <Play className="w-6 h-6 fill-current" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="mb-2 text-lg font-bold text-white line-clamp-2 group-hover:text-geo-gold transition-colors">
                      {video.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(video.publishedAt).toLocaleDateString()}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500 rounded-xl bg-white/5 border border-white/10">
              <Film className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No videos yet. Add videos from the admin panel.</p>
            </div>
          )}
        </section>
      )}

      {tab === "shorts" && (
        <section id="shorts" role="tabpanel" aria-labelledby="tab-shorts" className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <Clapperboard className="w-6 h-6 text-geo-gold" />
            <h2 className="text-2xl font-bold text-white">Quick Briefings</h2>
            <span className="ml-auto text-sm text-gray-500">{shorts.length} shorts</span>
          </div>

          {shorts.length > 0 ? (
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {shorts.map((video) => (
                <a
                  key={video.id}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:border-geo-gold/30 hover:bg-white/10 transition-all"
                >
                  <div className="relative aspect-[9/16] overflow-hidden bg-gray-900">
                    {video.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-800">
                        <span className="text-gray-500 text-xs">No Thumb</span>
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white shadow-lg">
                        <Play className="w-4 h-4 fill-current" />
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      SHORT
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-bold text-white line-clamp-2 group-hover:text-geo-gold transition-colors">
                      {video.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(video.publishedAt).toLocaleDateString()}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500 rounded-xl bg-white/5 border border-white/10">
              <Clapperboard className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>
                No shorts yet. Add shorts from the admin panel by setting video type to
                &quot;Short&quot;.
              </p>
            </div>
          )}
        </section>
      )}
    </>
  );
}
