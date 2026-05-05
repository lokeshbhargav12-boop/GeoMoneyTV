"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, ChevronRight, Activity } from "lucide-react";
import type { GlobeEvent } from "./WorldGlobe";

const EVENT_CATEGORY_COLORS: Record<string, string> = {
  military: "#EF4444",
  cyber: "#A855F7",
  energy: "#F59E0B",
  economic: "#3B82F6",
  geopolitical: "#D4AF37",
  supply_chain: "#F97316",
  terrorism: "#DC2626",
  climate: "#10B981",
  commodities: "#F59E0B",
  technology: "#8B5CF6",
  geopolitics: "#D4AF37",
  economy: "#3B82F6",
};

export default function EventClusterPanel({
  events,
  center,
  onSelectEvent,
  onClose,
}: {
  events: GlobeEvent[];
  center: { lat: number; lng: number };
  onSelectEvent: (event: GlobeEvent) => void;
  onClose: () => void;
}) {
  const [sortBy, setSortBy] = useState<"time" | "threat" | "category">("threat");

  const highThreatCount = useMemo(
    () => events.filter(e => (e.threatScore || 0) >= 60).length,
    [events]
  );

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      if (sortBy === "threat") return (b.threatScore || 0) - (a.threatScore || 0);
      if (sortBy === "time") return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      return a.category.localeCompare(b.category);
    });
  }, [events, sortBy]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative z-10 w-[min(560px,94vw)] max-h-[80vh] rounded-2xl border border-white/[0.08] bg-[#0c1220]/95 backdrop-blur-2xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col"
        >
          {/* Top accent */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />

          {/* Header */}
          <div className="px-5 pt-4 pb-3 border-b border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Event Cluster — {events.length} Events
                  </h2>
                  <p className="text-[10px] font-mono text-gray-500 mt-0.5">
                    {center.lat.toFixed(3)}°, {center.lng.toFixed(3)}° •{" "}
                    {highThreatCount > 0 && (
                      <span className="text-orange-400">
                        {highThreatCount} high threat
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sort tabs */}
            <div className="flex items-center gap-1 mt-3">
              {(["threat", "time", "category"] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all ${
                    sortBy === key
                      ? "bg-white/10 text-white"
                      : "text-gray-600 hover:text-gray-400"
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          {/* Event list */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
            {sortedEvents.map((event, i) => {
              const categoryColor = EVENT_CATEGORY_COLORS[event.category.toLowerCase()] || "#D4AF37";

              return (
                <motion.button
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => {
                    onSelectEvent(event);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/[0.04] transition-all text-left group"
                >
                  {/* Color indicator */}
                  <div
                    className="w-3 h-3 rounded-full shrink-0 shadow-lg"
                    style={{
                      backgroundColor: categoryColor,
                      boxShadow: `0 0 8px ${categoryColor}40`,
                    }}
                  />

                  {/* Event info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white truncate max-w-[280px]">
                        {event.title}
                      </span>
                      {event.threatScore && event.threatScore >= 60 && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/20 text-[8px] font-mono text-red-400 shrink-0">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          HIGH
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] font-mono text-gray-500">
                      <span
                        className="uppercase"
                        style={{ color: categoryColor }}
                      >
                        {event.category.replace("_", " ")}
                      </span>
                      <span>{event.region}</span>
                    </div>
                  </div>

                  {/* Threat & Source */}
                  <div className="text-right shrink-0">
                    <div className="flex items-center justify-end gap-1 text-[11px] font-mono text-gray-400">
                      {event.threatScore ? `THREAT ${event.threatScore}` : "—"}
                    </div>
                    <div className="text-[9px] font-mono text-gray-600 mt-0.5 truncate max-w-[100px]">
                      {event.source}
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-3.5 h-3.5 text-gray-700 group-hover:text-gray-400 transition-colors shrink-0" />
                </motion.button>
              );
            })}
          </div>

          {/* Footer summary */}
          <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-gray-600">
            <span>
              {events.filter((e) => (e.threatScore || 0) >= 60).length} high threat •{" "}
              {events.length} total events
            </span>
            <span>Click any event for details</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Find all events within `radiusKm` of the given location.
 * Uses Haversine formula for distance on a sphere.
 */
export function findNearbyEvents(
  clickedLat: number,
  clickedLng: number,
  allEvents: GlobeEvent[],
  radiusKm: number = 100
): GlobeEvent[] {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  return allEvents.filter((event) => {
    // Check if ANY location of the event is within radius
    return event.locations.some(loc => {
      const dLat = toRad(loc.lat - clickedLat);
      const dLng = toRad(loc.lng - clickedLng);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(clickedLat)) *
          Math.cos(toRad(loc.lat)) *
          Math.sin(dLng / 2) ** 2;
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return dist <= radiusKm;
    });
  });
}
