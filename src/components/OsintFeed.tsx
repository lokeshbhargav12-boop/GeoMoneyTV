"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio,
  Search,
  Filter,
  ChevronDown,
  ExternalLink,
  Clock,
  TrendingUp,
  MessageSquare,
  ArrowUp,
  Eye,
  Lock,
  Shield,
  Terminal,
  Newspaper,
  Satellite,
  Landmark,
  Signal,
  AlertTriangle,
  Zap,
  Globe2,
  Ship,
  Flame,
  Cpu,
} from "lucide-react";
import type { GlobeEvent } from "./WorldGlobe";

// ─── TYPES ───────────────────────────────────────────────────
interface OsintFeedProps {
  events: GlobeEvent[];
  selectedEvent: GlobeEvent | null;
  onEventSelect: (event: GlobeEvent) => void;
  isLoading: boolean;
}

// ─── CATEGORY CONFIG ─────────────────────────────────────────
const CATEGORY_CONFIG: Record<
  string,
  { icon: typeof Radio; color: string; label: string }
> = {
  military: { icon: Shield, color: "text-red-400", label: "Military" },
  cyber: { icon: Terminal, color: "text-purple-400", label: "Cyber" },
  energy: { icon: Flame, color: "text-amber-400", label: "Energy" },
  economic: { icon: Landmark, color: "text-blue-400", label: "Economic" },
  geopolitical: { icon: Globe2, color: "text-geo-gold", label: "Geopolitical" },
  geopolitics: { icon: Globe2, color: "text-geo-gold", label: "Geopolitics" },
  supply_chain: { icon: Ship, color: "text-orange-400", label: "Supply Chain" },
  terrorism: { icon: AlertTriangle, color: "text-red-500", label: "Terrorism" },
  climate: { icon: Globe2, color: "text-emerald-400", label: "Climate" },
  nuclear: { icon: AlertTriangle, color: "text-red-500", label: "Nuclear" },
  commodities: { icon: Zap, color: "text-amber-400", label: "Commodities" },
  technology: { icon: Cpu, color: "text-purple-400", label: "Technology" },
  economy: { icon: Landmark, color: "text-blue-400", label: "Economy" },
};

function getConfig(cat: string) {
  return (
    CATEGORY_CONFIG[cat] || { icon: Signal, color: "text-gray-400", label: cat }
  );
}

function threatColor(score?: number) {
  if (!score) return "text-gray-500";
  if (score >= 80) return "text-red-400";
  if (score >= 60) return "text-orange-400";
  if (score >= 40) return "text-yellow-400";
  return "text-emerald-400";
}

function threatBg(score?: number) {
  if (!score) return "bg-gray-500";
  if (score >= 80) return "bg-red-500";
  if (score >= 60) return "bg-orange-500";
  if (score >= 40) return "bg-yellow-500";
  return "bg-emerald-500";
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function OsintFeed({
  events,
  selectedEvent,
  onEventSelect,
  isLoading,
}: OsintFeedProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    "all",
    ...Array.from(new Set(events.map((e) => e.category))),
  ];
  const sources = ["all", ...Array.from(new Set(events.map((e) => e.source)))];

  const filtered = events.filter((e) => {
    if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
    if (sourceFilter !== "all" && e.source !== sourceFilter) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  // Stats
  const highThreath = events.filter((e) => (e.threatScore || 0) >= 70).length;
  const totalLocations = events.reduce((s, e) => s + e.locations.length, 0);

  return (
    <div className="flex flex-col h-full bg-black/60 backdrop-blur-xl border-l border-white/5">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-black/40">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-geo-gold animate-pulse" />
            <h2 className="text-sm font-bold tracking-wide text-white">
              OSINT LIVE FEED
            </h2>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {events.length} signals
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-white/5 rounded-lg px-2 py-1.5 text-center">
            <div className="text-[9px] text-gray-500 uppercase">Events</div>
            <div className="text-sm font-bold text-white font-mono">
              {events.length}
            </div>
          </div>
          <div className="bg-red-500/5 border border-red-500/10 rounded-lg px-2 py-1.5 text-center">
            <div className="text-[9px] text-red-400 uppercase">High Threat</div>
            <div className="text-sm font-bold text-red-400 font-mono">
              {highThreath}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg px-2 py-1.5 text-center">
            <div className="text-[9px] text-gray-500 uppercase">Locations</div>
            <div className="text-sm font-bold text-white font-mono">
              {totalLocations}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
          <input
            type="text"
            placeholder="Search intelligence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:border-geo-gold/40"
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-white transition-colors"
        >
          <Filter className="w-3 h-3" />
          Filters
          <ChevronDown
            className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`}
          />
        </button>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2 space-y-2">
                <div>
                  <div className="text-[9px] text-gray-600 uppercase mb-1">
                    Category
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {categories.map((c) => (
                      <button
                        key={c}
                        onClick={() => setCategoryFilter(c)}
                        className={`px-2 py-0.5 rounded text-[10px] border transition-all ${
                          categoryFilter === c
                            ? "bg-geo-gold/15 border-geo-gold/40 text-geo-gold"
                            : "bg-white/5 border-white/10 text-gray-500 hover:text-white"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-gray-600 uppercase mb-1">
                    Source
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {sources.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSourceFilter(s)}
                        className={`px-2 py-0.5 rounded text-[10px] border transition-all ${
                          sourceFilter === s
                            ? "bg-geo-gold/15 border-geo-gold/40 text-geo-gold"
                            : "bg-white/5 border-white/10 text-gray-500 hover:text-white"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Feed Items */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-8 h-8 border-2 border-geo-gold/30 border-t-geo-gold rounded-full animate-spin" />
            <div className="text-xs text-gray-500 font-mono">
              Aggregating OSINT feeds...
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-500">
            <Eye className="w-6 h-6" />
            <div className="text-xs">No signals match filters</div>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((event) => {
              const config = getConfig(event.category);
              const Icon = config.icon;
              const isSelected = selectedEvent?.id === event.id;
              return (
                <button
                  key={event.id}
                  onClick={() => onEventSelect(event)}
                  className={`w-full text-left px-4 py-3 transition-all hover:bg-white/[0.03] ${
                    isSelected
                      ? "bg-geo-gold/5 border-l-2 border-l-geo-gold"
                      : "border-l-2 border-l-transparent"
                  }`}
                >
                  {/* Top row: category + time */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`w-3 h-3 ${config.color}`} />
                      <span
                        className={`text-[9px] font-mono uppercase ${config.color}`}
                      >
                        {config.label}
                      </span>
                      <span className="text-[9px] text-gray-700">•</span>
                      <span className="text-[9px] text-gray-600 font-mono">
                        {event.sourceDetail || event.source}
                      </span>
                    </div>
                    <span className="text-[9px] text-gray-600 font-mono flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {timeAgo(event.timestamp)}
                    </span>
                  </div>

                  {/* Title */}
                  <p className="text-xs text-gray-200 leading-relaxed line-clamp-2 mb-2">
                    {event.title}
                  </p>

                  {/* Bottom row: threat + engagement + region */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {event.threatScore && (
                        <div className="flex items-center gap-1">
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${threatBg(event.threatScore)}`}
                          />
                          <span
                            className={`text-[9px] font-mono ${threatColor(event.threatScore)}`}
                          >
                            {event.threatScore}
                          </span>
                        </div>
                      )}
                      {event.engagement && (
                        <div className="flex items-center gap-2 text-[9px] text-gray-600">
                          <span className="flex items-center gap-0.5">
                            <ArrowUp className="w-2.5 h-2.5" />
                            {event.engagement.upvotes.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <MessageSquare className="w-2.5 h-2.5" />
                            {event.engagement.comments}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {event.locations.length > 0 && (
                        <span className="text-[9px] text-gray-600 font-mono">
                          {event.locations[0].name}
                        </span>
                      )}
                      {(event.link || event.url) && (
                        <ExternalLink className="w-2.5 h-2.5 text-gray-600" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/5 bg-black/40">
        <div className="flex items-center justify-between text-[9px] text-gray-600">
          <span className="font-mono">
            Sources: Reddit • GDELT • BBC • NYT • USGS • ReliefWeb • GDACS • HN
          </span>
          <span className="font-mono flex items-center gap-1">
            <Shield className="w-2.5 h-2.5" /> OSINT
          </span>
        </div>
      </div>
    </div>
  );
}
