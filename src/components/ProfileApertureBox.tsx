"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Eye,
  Loader2,
  Radar,
  Sparkles,
} from "lucide-react";
import AiLimitModal from "@/components/entitlement/AiLimitModal";

interface ApertureBrief {
  headline: string;
  threatLevel: string;
  summary: string;
  queryAnswer: string;
  hotspots: Array<{ region: string; status: string; severity: string }>;
  keyInsight: string;
  recommendations: string[];
  generatedAt: string;
  dataAsOf: string | null;
  model: string;
  isQueryResponse: boolean;
  cached: boolean;
  stale: boolean;
}

const SUGGESTIONS = [
  "What are the current tension hotspots?",
  "Any disruptions near key chokepoints?",
  "Latest developments in the Middle East",
];

const THREAT_STYLES: Record<string, string> = {
  NOMINAL: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  GUARDED: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
  ELEVATED: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  HIGH: "border-orange-500/30 bg-orange-500/10 text-orange-400",
  CRITICAL: "border-red-500/30 bg-red-500/10 text-red-400",
};

/**
 * GeoMoney Aperture card on the user profile — a "Tracked Critical
 * Materials"-style box containing the Aperture AI Navigator (client request,
 * Nov 2026). Queries run through /api/world-monitor/ai-brief with the latest
 * intelligence events as evidence, so each attempt counts against the free
 * AI trial (AI_TRIAL) for free accounts and shows the upgrade popup when the
 * tries are exhausted.
 */
export default function ProfileApertureBox() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [brief, setBrief] = useState<ApertureBrief | null>(null);
  const [lastQuery, setLastQuery] = useState("");
  const [limitOpen, setLimitOpen] = useState(false);

  const runQuery = useCallback(
    async (rawQuery: string) => {
      const trimmed = rawQuery.trim();
      if (!trimmed || loading) return;

      setLoading(true);
      setError("");
      setBrief(null);
      setLastQuery(trimmed);

      try {
        // Latest intelligence events become the sourced evidence for the
        // Aperture analysis (the brief only reasons over supplied evidence).
        const eventsResponse = await fetch("/api/world-monitor/events");
        const eventsData = await eventsResponse.json().catch(() => ({}));
        const events = Array.isArray(eventsData?.events)
          ? eventsData.events.slice(0, 20).map((event: Record<string, unknown>) => ({
              id: String(event?.id ?? ""),
              title: String(event?.title ?? ""),
              description: String(event?.description ?? ""),
              source: String(event?.source ?? "geomoney"),
              sourceDetail: String(event?.sourceDetail ?? "GeoMoney Intel"),
              timestamp: String(event?.timestamp ?? ""),
              region: String(event?.region ?? "Global"),
              category: String(event?.category ?? "unknown"),
              url: String(event?.link ?? ""),
            }))
          : [];

        const response = await fetch("/api/world-monitor/ai-brief", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ events, query: trimmed }),
        });

        const data = await response.json().catch(() => ({}));

        // Free AI trial exhausted: surface the upgrade popup (AiLimitModal).
        if (data?.code === "AI_TRIAL_LIMIT") {
          setLimitOpen(true);
          throw new Error(data?.error || "You've used all your free AI tries.");
        }

        if (!response.ok) {
          throw new Error(
            data?.error || "The Aperture navigator could not complete the analysis.",
          );
        }

        setBrief(data as ApertureBrief);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "The Aperture navigator is unavailable.",
        );
      } finally {
        setLoading(false);
      }
    },
    [loading],
  );

  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-geo-gold" />
            <h2 className="text-lg font-semibold">GeoMoney Aperture</h2>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-geo-gold/30 bg-geo-gold/10 px-2.5 py-0.5 text-[11px] font-semibold text-geo-gold">
            <Sparkles className="h-3 w-3" />
            AI Navigator
          </span>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-400 mb-4">
            Ask the Aperture AI navigator about live developments, regions and
            chokepoints.{" "}
            <Link
              href="/world-monitor"
              className="inline-flex items-center gap-1 text-geo-gold hover:text-geo-gold/80 transition-colors"
            >
              Open the full Aperture
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void runQuery(query);
            }}
            className="relative mb-3"
          >
            <label htmlFor="aperture-navigator-input" className="sr-only">
              Ask the Aperture AI Navigator
            </label>
            <input
              id="aperture-navigator-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Taiwan Strait shipping activity, Red Sea disruptions…"
              disabled={loading}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-white placeholder-gray-400 focus:border-geo-gold/50 focus:outline-none focus:ring-1 focus:ring-geo-gold/50 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              aria-label="Ask the Aperture AI Navigator"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-geo-gold/10 p-2 text-geo-gold transition-all hover:bg-geo-gold hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Radar className="w-5 h-5" />
              )}
            </button>
          </form>

          {!brief && !loading && !error && (
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setQuery(suggestion);
                    void runQuery(suggestion);
                  }}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-400 hover:border-geo-gold/40 hover:text-geo-gold transition-colors disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin text-geo-gold" />
              Analyzing current sourced evidence…
            </div>
          )}

          {error && (
            <div
              className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-300"
              role="alert"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {brief && (
            <div className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    THREAT_STYLES[brief.threatLevel] || THREAT_STYLES.GUARDED
                  }`}
                >
                  {brief.threatLevel}
                </span>
                {brief.stale && (
                  <span className="text-[10px] uppercase tracking-wider text-amber-400">
                    Last successful analysis
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-white">{brief.headline}</p>
              <p className="text-sm leading-relaxed text-gray-300">
                {brief.isQueryResponse && brief.queryAnswer
                  ? brief.queryAnswer
                  : brief.summary}
              </p>
              {brief.keyInsight && (
                <p className="text-xs leading-relaxed text-gray-400">
                  {brief.keyInsight}
                </p>
              )}
              {brief.hotspots.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {brief.hotspots.map((hotspot, index) => (
                    <span
                      key={`${hotspot.region}-${index}`}
                      className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] text-gray-300"
                    >
                      {hotspot.region}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-gray-600">
                AI-generated{lastQuery ? ` for "${lastQuery}"` : ""}
                {brief.dataAsOf
                  ? ` · Data as of ${new Date(brief.dataAsOf).toLocaleString()}`
                  : ""}{" "}
                · Verify with linked sources
              </p>
            </div>
          )}
        </div>
      </div>

      <AiLimitModal isOpen={limitOpen} onClose={() => setLimitOpen(false)} />
    </>
  );
}
