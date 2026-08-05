"use client";

import { AlertTriangle, CloudRain, Newspaper, Radio } from "lucide-react";

interface CoalIntelligenceFeedProps {
  osint: any[];
  climate: any[];
}

export default function CoalIntelligenceFeed({ osint, climate }: CoalIntelligenceFeedProps) {
  const allEvents = [
    ...osint.map((o) => ({ ...o, kind: "osint" as const })),
    ...climate.map((c) => ({ ...c, kind: "climate" as const })),
  ].sort((a, b) => (b.threatScore || b.severity || 0) - (a.threatScore || a.severity || 0));

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <div className="flex items-center gap-3 mb-6">
        <Radio className="w-6 h-6 text-amber-300" />
        <h2 className="text-2xl font-bold">Coal Intelligence Feed</h2>
      </div>

      {allEvents.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">No coal-relevant signals currently detected.</div>
      )}

      <div className="space-y-3 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
        {allEvents.map((event, idx) => {
          const isOsint = event.kind === "osint";
          const score = event.threatScore || event.severity || 0;
          const color = score >= 70 ? "text-red-400 border-red-500/20 bg-red-500/10" : score >= 40 ? "text-amber-400 border-amber-500/20 bg-amber-500/10" : "text-gray-300 border-white/10 bg-white/5";
          const Icon = isOsint ? Newspaper : CloudRain;
          const source = isOsint ? event.sourceDetail || event.source : event.source;

          return (
            <a
              key={`${event.kind}-${event.id || idx}`}
              href={event.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className={`block rounded-xl border p-4 transition-colors hover:bg-white/5 ${color}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-white leading-snug">{event.title}</div>
                    <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-2">
                      <span className="uppercase tracking-wider">{source}</span>
                      <span>•</span>
                      <span>{new Date(event.timestamp).toLocaleDateString()}</span>
                    </div>
                    {event.description && (
                      <p className="text-xs text-gray-400 mt-2 line-clamp-2">{event.description}</p>
                    )}
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${color}`}>
                  {score}
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
