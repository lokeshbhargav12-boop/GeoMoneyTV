"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Ship,
  Plane,
  Globe2,
  Navigation,
  AlertTriangle,
  ExternalLink,
  MapPin,
  Clock,
  Gauge,
  ArrowUpRight,
  Anchor,
  Shield,
} from "lucide-react";
import Link from "next/link";
import type { GlobeEvent, AircraftData, ShipData } from "./WorldGlobe";

// ─── Shared wrapper ─────────────────────────────────────────
function PopupShell({
  accentColor,
  children,
  onClose,
}: {
  accentColor: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
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
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="relative z-10 w-[min(440px,92vw)] rounded-2xl border border-white/[0.08] bg-[#0c1220]/95 backdrop-blur-2xl shadow-2xl shadow-black/50 overflow-hidden"
        >
          {/* Top accent */}
          <div
            className="h-[2px]"
            style={{
              background: `linear-gradient(90deg, transparent, ${accentColor}90, transparent)`,
            }}
          />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function InfoRow({
  label,
  value,
  icon,
  valueColor,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[10px] font-mono text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span
        className="text-[11px] font-mono text-gray-300"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

// ─── SHIP POPUP ─────────────────────────────────────────────
export function ShipDetailPopup({
  ship,
  reportHref,
  onClose,
}: {
  ship: ShipData;
  reportHref: string;
  onClose: () => void;
}) {
  const stalled = ship.speed < 0.5 && ship.status !== "underway";

  const typeColors: Record<string, string> = {
    tanker: "#FF7A1A",
    container: "#00D68F",
    military: "#FF4D4F",
    lng: "#FFD166",
    cruise: "#C084FC",
    bulk: "#60A5FA",
    fishing: "#2DD4BF",
  };
  const typeColor = typeColors[ship.type] || "#CBD5E1";

  return (
    <PopupShell accentColor={typeColor} onClose={onClose}>
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center border"
            style={{
              backgroundColor: `${typeColor}15`,
              borderColor: `${typeColor}30`,
            }}
          >
            <Ship className="w-5 h-5" style={{ color: typeColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-white truncate">
              {ship.flagEmoji} {ship.name}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-[10px] font-mono uppercase"
                style={{ color: typeColor }}
              >
                {ship.type}
              </span>
              <span className="text-[10px] text-gray-600">•</span>
              <span className="text-[10px] font-mono text-gray-500">
                {ship.flag}
              </span>
              {stalled && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-500/20 text-[8px] font-mono text-yellow-400">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  STALLED
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="px-5 pb-2 border-t border-white/[0.05] pt-3 space-y-0.5">
        <InfoRow
          label="MMSI"
          value={ship.mmsi}
          icon={<Ship className="w-3 h-3" />}
        />
        {ship.imo && <InfoRow label="IMO" value={ship.imo} />}
        {ship.callsign && <InfoRow label="Callsign" value={ship.callsign} />}
        <InfoRow
          label="Speed"
          value={`${ship.speed.toFixed(1)} kn`}
          icon={<Gauge className="w-3 h-3" />}
          valueColor={stalled ? "#FDE047" : undefined}
        />
        <InfoRow
          label="Heading"
          value={`${ship.heading}°`}
          icon={<Navigation className="w-3 h-3" />}
        />
        <InfoRow
          label="Position"
          value={`${ship.latitude.toFixed(4)}°, ${ship.longitude.toFixed(4)}°`}
          icon={<MapPin className="w-3 h-3" />}
        />
        <InfoRow
          label="Destination"
          value={ship.destination || "—"}
          icon={<ArrowUpRight className="w-3 h-3" />}
        />
        {ship.length > 0 && (
          <InfoRow label="Length" value={`${ship.length}m`} />
        )}
        {ship.beam && <InfoRow label="Beam" value={`${ship.beam}m`} />}
        {ship.deadweight && (
          <InfoRow
            label="DWT"
            value={`${ship.deadweight.toLocaleString()}t`}
          />
        )}
        {ship.built && <InfoRow label="Built" value={ship.built} />}
        {ship.owner && <InfoRow label="Owner" value={ship.owner} />}
        {ship.zone && <InfoRow label="Zone" value={ship.zone} />}
        {ship.status && (
          <InfoRow label="Status" value={ship.status.toUpperCase()} />
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 mt-1 border-t border-white/[0.05] flex items-center justify-between">
        <span className="text-[9px] font-mono text-gray-700">
          {ship.live ? "LIVE AIS" : ship.source || "DEMO"}
        </span>
        <Link
          href={reportHref}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/25 text-[10px] font-mono text-orange-400 hover:bg-orange-500/20 transition-all"
        >
          Full Report
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </PopupShell>
  );
}

// ─── AIRCRAFT POPUP ─────────────────────────────────────────
export function AircraftDetailPopup({
  aircraft,
  reportHref,
  onClose,
}: {
  aircraft: AircraftData;
  reportHref: string;
  onClose: () => void;
}) {
  const catColors: Record<string, string> = {
    military: "#FF4444",
    cargo: "#FF8800",
    commercial: "#00CCFF",
  };
  const accentColor = catColors[aircraft.category] || "#88FF88";

  return (
    <PopupShell accentColor={accentColor} onClose={onClose}>
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center border"
            style={{
              backgroundColor: `${accentColor}15`,
              borderColor: `${accentColor}30`,
            }}
          >
            <Plane className="w-5 h-5" style={{ color: accentColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-white truncate">
              {aircraft.callsign || aircraft.icao24}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-[10px] font-mono uppercase"
                style={{ color: accentColor }}
              >
                {aircraft.category}
              </span>
              <span className="text-[10px] text-gray-600">•</span>
              <span className="text-[10px] font-mono text-gray-500">
                {aircraft.origin_country}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="px-5 pb-2 border-t border-white/[0.05] pt-3 space-y-0.5">
        <InfoRow
          label="ICAO24"
          value={aircraft.icao24}
          icon={<Plane className="w-3 h-3" />}
        />
        {aircraft.callsign && (
          <InfoRow label="Callsign" value={aircraft.callsign} />
        )}
        <InfoRow
          label="Altitude"
          value={`${Math.round(aircraft.altitude).toLocaleString()}m`}
          icon={<ArrowUpRight className="w-3 h-3" />}
        />
        <InfoRow
          label="Speed"
          value={`${Math.round(aircraft.velocity)} m/s`}
          icon={<Gauge className="w-3 h-3" />}
        />
        <InfoRow
          label="Heading"
          value={`${Math.round(aircraft.heading)}°`}
          icon={<Navigation className="w-3 h-3" />}
        />
        <InfoRow
          label="Vertical Rate"
          value={`${aircraft.vertical_rate > 0 ? "+" : ""}${Math.round(aircraft.vertical_rate)} m/s`}
          valueColor={
            aircraft.vertical_rate > 0
              ? "#4ADE80"
              : aircraft.vertical_rate < 0
                ? "#F87171"
                : undefined
          }
        />
        <InfoRow
          label="Position"
          value={`${aircraft.latitude.toFixed(4)}°, ${aircraft.longitude.toFixed(4)}°`}
          icon={<MapPin className="w-3 h-3" />}
        />
        <InfoRow
          label="Origin"
          value={aircraft.origin_country}
          icon={<Globe2 className="w-3 h-3" />}
        />
      </div>

      {/* Footer */}
      <div className="px-5 py-3 mt-1 border-t border-white/[0.05] flex items-center justify-between">
        <span className="text-[9px] font-mono text-gray-700">
          OpenSky Network
        </span>
        <Link
          href={reportHref}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-[10px] font-mono text-cyan-400 hover:bg-cyan-500/20 transition-all"
        >
          Full Report
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </PopupShell>
  );
}

// ─── EVENT POPUP ────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  military: "#FF4444",
  energy: "#FFB800",
  geopolitical: "#A855F7",
  economic: "#22D3EE",
  cyber: "#F43F5E",
  climate: "#10B981",
  supply_chain: "#F97316",
};

function getThreatBadge(score?: number) {
  if (!score) return null;
  const color =
    score >= 80
      ? "#FF4444"
      : score >= 60
        ? "#FF8800"
        : score >= 40
          ? "#FFB800"
          : "#22D3EE";
  const label =
    score >= 80
      ? "CRITICAL"
      : score >= 60
        ? "HIGH"
        : score >= 40
          ? "ELEVATED"
          : "LOW";
  return { color, label, score };
}

export function EventDetailPopup({
  event,
  reportHref,
  onClose,
}: {
  event: GlobeEvent;
  reportHref: string;
  onClose: () => void;
}) {
  const catColor = CATEGORY_COLORS[event.category] || "#CBD5E1";
  const threat = getThreatBadge(event.threatScore);
  const primaryLocation = event.locations[0];

  return (
    <PopupShell accentColor={catColor} onClose={onClose}>
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 mt-0.5"
            style={{
              backgroundColor: `${catColor}15`,
              borderColor: `${catColor}30`,
            }}
          >
            <Shield className="w-5 h-5" style={{ color: catColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-white leading-snug">
              {event.title}
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className="text-[10px] font-mono uppercase"
                style={{ color: catColor }}
              >
                {event.category}
              </span>
              {threat && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-[8px] font-mono font-bold border"
                  style={{
                    color: threat.color,
                    backgroundColor: `${threat.color}15`,
                    borderColor: `${threat.color}30`,
                  }}
                >
                  {threat.label} ({threat.score})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {event.description && (
        <div className="px-5 pb-3">
          <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-4">
            {event.description}
          </p>
        </div>
      )}

      {/* Details */}
      <div className="px-5 pb-2 border-t border-white/[0.05] pt-3 space-y-0.5">
        <InfoRow
          label="Source"
          value={event.source}
          icon={<Globe2 className="w-3 h-3" />}
        />
        <InfoRow
          label="Region"
          value={event.region}
          icon={<MapPin className="w-3 h-3" />}
        />
        {primaryLocation && (
          <InfoRow
            label="Location"
            value={`${primaryLocation.name} (${primaryLocation.lat.toFixed(2)}°, ${primaryLocation.lng.toFixed(2)}°)`}
          />
        )}
        <InfoRow
          label="Time"
          value={new Date(event.timestamp).toLocaleString()}
          icon={<Clock className="w-3 h-3" />}
        />
        {event.locations.length > 1 && (
          <InfoRow
            label="Locations"
            value={`${event.locations.length} linked points`}
          />
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 mt-1 border-t border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-3">
          {event.engagement && (
            <span className="text-[9px] font-mono text-gray-700">
              ▲{event.engagement.upvotes} • 💬{event.engagement.comments}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(event.link || event.url) && (
            <a
              href={event.link || event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              Source
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <Link
            href={reportHref}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-[10px] font-mono transition-all"
            style={{
              backgroundColor: `${catColor}10`,
              borderColor: `${catColor}25`,
              color: catColor,
            }}
          >
            Full Report
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </PopupShell>
  );
}
