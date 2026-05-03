"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Ship, Anchor, AlertTriangle, Navigation, ChevronRight } from "lucide-react";
import type { ShipData } from "./WorldGlobe";

const SHIP_TYPE_COLORS: Record<string, string> = {
  tanker: "#FF7A1A",
  container: "#00D68F",
  military: "#FF4D4F",
  lng: "#FFD166",
  cruise: "#C084FC",
  bulk: "#60A5FA",
  fishing: "#2DD4BF",
};

function isShipStalled(ship: ShipData) {
  return ship.speed < 0.5 && ship.status !== "underway";
}

export default function ShipClusterPanel({
  ships,
  center,
  onSelectShip,
  onClose,
}: {
  ships: ShipData[];
  center: { lat: number; lng: number };
  onSelectShip: (ship: ShipData) => void;
  onClose: () => void;
}) {
  const [sortBy, setSortBy] = useState<"name" | "speed" | "type">("name");

  const stalledCount = useMemo(
    () => ships.filter(isShipStalled).length,
    [ships]
  );

  const sortedShips = useMemo(() => {
    return [...ships].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "speed") return b.speed - a.speed;
      return a.type.localeCompare(b.type);
    });
  }, [ships, sortBy]);

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
          <div className="h-[2px] bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />

          {/* Header */}
          <div className="px-5 pt-4 pb-3 border-b border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                  <Ship className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Vessel Cluster — {ships.length} Ships
                  </h2>
                  <p className="text-[10px] font-mono text-gray-500 mt-0.5">
                    {center.lat.toFixed(3)}°, {center.lng.toFixed(3)}° •{" "}
                    {stalledCount > 0 && (
                      <span className="text-yellow-400">
                        {stalledCount} stalled
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
              {(["name", "speed", "type"] as const).map((key) => (
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

          {/* Ship list */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
            {sortedShips.map((ship, i) => {
              const stalled = isShipStalled(ship);
              const typeColor =
                SHIP_TYPE_COLORS[ship.type] || "#CBD5E1";

              return (
                <motion.button
                  key={ship.mmsi}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => {
                    onSelectShip(ship);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/[0.04] transition-all text-left group"
                >
                  {/* Color indicator */}
                  <div
                    className="w-3 h-3 rounded-full shrink-0 shadow-lg"
                    style={{
                      backgroundColor: typeColor,
                      boxShadow: `0 0 8px ${typeColor}40`,
                    }}
                  />

                  {/* Ship info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white truncate">
                        {ship.flagEmoji} {ship.name}
                      </span>
                      {stalled && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-500/20 text-[8px] font-mono text-yellow-400 shrink-0">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          STALLED
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] font-mono text-gray-500">
                      <span
                        className="uppercase"
                        style={{ color: typeColor }}
                      >
                        {ship.type}
                      </span>
                      <span>{ship.flag}</span>
                      {ship.length > 0 && <span>{ship.length}m</span>}
                    </div>
                  </div>

                  {/* Speed & destination */}
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 text-[11px] font-mono text-gray-400">
                      <Navigation className="w-3 h-3" />
                      {ship.speed.toFixed(1)} kn
                    </div>
                    <div className="text-[9px] font-mono text-gray-600 mt-0.5 truncate max-w-[100px]">
                      → {ship.destination || "—"}
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
              {ships.filter((s) => s.type === "tanker").length} tankers •{" "}
              {ships.filter((s) => s.type === "container").length} containers •{" "}
              {ships.filter((s) => s.type === "military").length} military
            </span>
            <span>Click any vessel for details</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Find all ships within `radiusKm` of the given ship.
 * Uses Haversine formula for distance on a sphere.
 */
export function findNearbyShips(
  clickedShip: ShipData,
  allShips: ShipData[],
  radiusKm: number = 50
): ShipData[] {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  return allShips.filter((ship) => {
    const dLat = toRad(ship.latitude - clickedShip.latitude);
    const dLng = toRad(ship.longitude - clickedShip.longitude);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(clickedShip.latitude)) *
        Math.cos(toRad(ship.latitude)) *
        Math.sin(dLng / 2) ** 2;
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return dist <= radiusKm;
  });
}
