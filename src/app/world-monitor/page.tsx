"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  Clock,
  RefreshCw,
  Shield,
  Radio,
  Globe2,
  AlertTriangle,
  ExternalLink,
  X,
  ChevronRight,
  Crosshair,
  Target,
  Zap,
  BarChart3,
  Layers,
  Ship,
  Plane,
  Terminal,
  TrendingUp,
  TrendingDown,
  Activity,
  MapPin,
  ArrowUp,
  MessageSquare,
  Newspaper,
  Flame,
  Cpu,
  Timer,
  Flag,
  Radar,
  Maximize2,
  Minimize2,
  FileText,
  Users,
  Siren,
  Briefcase,
  Map,
  Camera,
  Video,
  Thermometer,
  Bug,
} from "lucide-react";
import OsintFeed from "@/components/OsintFeed";
import {
  ChokepointsWidget,
  AssetTrackingWidget,
  RiskIndicesWidget,
  CountryBriefsWidget,
} from "@/components/WorldMonitorWidgets";
import WorldMonitorTutorial, {
  useWorldMonitorTutorial,
} from "@/components/WorldMonitorTutorial";
import ShipClusterPanel, {
  findNearbyShips,
} from "@/components/ShipClusterPanel";
import EventClusterPanel, {
  findNearbyEvents,
} from "@/components/EventClusterPanel";
import {
  ShipDetailPopup,
  AircraftDetailPopup,
  EventDetailPopup,
} from "@/components/AssetDetailPopup";
import type { Webcam } from "@/lib/world-monitor-geo";
import type { ApertureSourceStatus } from "@/lib/aperture-analysis";
import {
  buildAircraftReportHref,
  buildEventReportHref,
  buildShipReportHref,
} from "@/lib/world-monitor-report-links";
import type {
  GlobeEvent,
  AircraftData,
  GlobeFocusTarget,
  ShipData,
} from "@/components/WorldGlobe";

// Dynamic import for 3D Globe — avoids SSR issues with Three.js
const WorldGlobe = dynamic(() => import("@/components/WorldGlobe"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-black/40">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-geo-gold/30 border-t-geo-gold rounded-full animate-spin mx-auto mb-4" />
        <div className="text-sm text-gray-500 font-mono">
          INITIALIZING GLOBE...
        </div>
        <div className="text-[10px] text-gray-700 font-mono mt-1">
          Loading 3D scene
        </div>
      </div>
    </div>
  ),
});

// Dynamic import for GeoMoney Aperture 2D Map
const GodsEyeMap = dynamic(() => import("@/components/GodsEyeMap"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-3" />
        <div className="text-xs text-cyan-400 font-mono">
          LOADING GEOMONEY APERTURE...
        </div>
      </div>
    </div>
  ),
});

// ─── THREAT LEVELS ──────────────────────────────────────────
const SIGNAL_LEVELS = [
  {
    level: 1,
    label: "NOMINAL",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    pulse: "bg-emerald-500",
  },
  {
    level: 2,
    label: "GUARDED",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    pulse: "bg-blue-500",
  },
  {
    level: 3,
    label: "ELEVATED",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    pulse: "bg-yellow-500",
  },
  {
    level: 4,
    label: "HIGH",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    pulse: "bg-orange-500",
  },
  {
    level: 5,
    label: "CRITICAL",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    pulse: "bg-red-500",
  },
];

// ─── CHOKEPOINTS ────────────────────────────────────────────
const CHOKEPOINTS = [
  {
    name: "Strait of Hormuz",
    lat: 26.5,
    lng: 56.2,
    radiusKm: 450,
  },
  {
    name: "Strait of Malacca",
    lat: 2.5,
    lng: 101.5,
    radiusKm: 500,
  },
  {
    name: "Suez Canal",
    lat: 30.4,
    lng: 32.3,
    radiusKm: 400,
  },
  {
    name: "Bab el-Mandeb",
    lat: 12.5,
    lng: 43.3,
    radiusKm: 400,
  },
  {
    name: "Panama Canal",
    lat: 9,
    lng: -79.6,
    radiusKm: 350,
  },
  {
    name: "Taiwan Strait",
    lat: 24,
    lng: 119.5,
    radiusKm: 500,
  },
  {
    name: "GIUK Gap",
    lat: 63,
    lng: -15,
    radiusKm: 600,
  },
  {
    name: "Bosporus Strait",
    lat: 41.1,
    lng: 29,
    radiusKm: 300,
  },
];

const AI_QUICK_QUERIES = [
  "How many ships are stranded in the Strait of Hormuz right now?",
  "Which chokepoint has the heaviest vessel density currently?",
  "Show the current observed aircraft activity around the Middle East.",
];

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isNearChokepoint(
  lat: number,
  lng: number,
  chokepoint: (typeof CHOKEPOINTS)[number],
) {
  return (
    haversineKm(lat, lng, chokepoint.lat, chokepoint.lng) <= chokepoint.radiusKm
  );
}

function computeSignalLevel(events: GlobeEvent[]) {
  if (events.length === 0) return SIGNAL_LEVELS[0];
  const avg =
    events.reduce((s, e) => s + (e.threatScore || 40), 0) / events.length;
  if (avg >= 75) return SIGNAL_LEVELS[4];
  if (avg >= 60) return SIGNAL_LEVELS[3];
  if (avg >= 45) return SIGNAL_LEVELS[2];
  if (avg >= 30) return SIGNAL_LEVELS[1];
  return SIGNAL_LEVELS[0];
}

function getRiskColor(v: number) {
  if (v >= 70) return "text-red-400";
  if (v >= 50) return "text-yellow-400";
  return "text-emerald-400";
}

function riskBarColor(r: number) {
  if (r >= 70) return "bg-red-500";
  if (r >= 50) return "bg-orange-500";
  if (r >= 30) return "bg-yellow-500";
  return "bg-emerald-500";
}

function clampRisk(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getNewestEventTimestamp(events: GlobeEvent[]): string | null {
  const timestamp = events.reduce((newest, event) => {
    const parsed = new Date(event.timestamp).getTime();
    return Number.isFinite(parsed) ? Math.max(newest, parsed) : newest;
  }, 0);
  return timestamp ? new Date(timestamp).toISOString() : null;
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function WorldMonitorPage() {
  const router = useRouter();
  const [allEvents, setAllEvents] = useState<GlobeEvent[]>([]);
  const [osintEvents, setOsintEvents] = useState<GlobeEvent[]>([]);
  const [articleEvents, setArticleEvents] = useState<GlobeEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<GlobeEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [systemTime, setSystemTime] = useState("");
  const [activePanel, setActivePanel] = useState<
    | "feed"
    | "chokepoints"
    | "assets"
    | "risks"
    | "timeline"
    | "countries"
    | "climate"
    | "disease"
    | "cyber"
    | "aircraft"
    | "ships"
    | "ai-brief"
  >("feed");
  const [showDetail, setShowDetail] = useState(false);
  const [dataTimestamp, setDataTimestamp] = useState<string>("");
  const [eventDataStale, setEventDataStale] = useState(false);

  // ─── NEW: Aircraft, Ships, AI Brief state ──────────────
  const [aircraftData, setAircraftData] = useState<AircraftData[]>([]);
  const [aircraftTotal, setAircraftTotal] = useState(0);
  const [aircraftUpdatedAt, setAircraftUpdatedAt] = useState<number | null>(
    null,
  );
  const [aircraftDataStale, setAircraftDataStale] = useState(false);
  const [shipData, setShipData] = useState<ShipData[]>([]);
  const [shipTotal, setShipTotal] = useState(0);
  const [shipSource, setShipSource] = useState("AIS unavailable");
  const [shipDataLive, setShipDataLive] = useState(false);
  const [shipDataStale, setShipDataStale] = useState(false);
  const [shipUpdatedAt, setShipUpdatedAt] = useState<number | null>(null);
  const [shipNotice, setShipNotice] = useState("");
  const [aiBrief, setAiBrief] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiError, setAiError] = useState("");
  const autoBriefEvidenceRef = useRef("");
  const autoBriefLastRunRef = useRef(0);
  const [zoomLevel, setZoomLevel] = useState(4.5);
  const [apertureActive, setApertureActive] = useState(false);
  const [aiNavigatorMinimized, setAiNavigatorMinimized] = useState(true);
  const [assetCoverageMinimized, setAssetCoverageMinimized] = useState(true);
  const [selectedWebcam, setSelectedWebcam] = useState<Webcam | null>(null);
  const [selectedAircraft, setSelectedAircraft] = useState<AircraftData | null>(
    null,
  );
  const [selectedShip, setSelectedShip] = useState<ShipData | null>(null);
  const [globeFocusTarget, setGlobeFocusTarget] =
    useState<GlobeFocusTarget | null>(null);
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const [desktopDefaultsApplied, setDesktopDefaultsApplied] = useState(false);
  const [desktopHudOpen, setDesktopHudOpen] = useState(false);
  const [mobileHudOpen, setMobileHudOpen] = useState(false);
  const [mobileHudTab, setMobileHudTab] = useState<
    "overview" | "ai" | "selection"
  >("overview");

  // ─── NEW: Climate, Disease, Cyber state ────────────────
  const [climateData, setClimateData] = useState<any[]>([]);
  const [diseaseData, setDiseaseData] = useState<any[]>([]);
  const [cyberData, setCyberData] = useState<any[]>([]);

  // Tutorial state
  const [showTutorial, dismissTutorial] = useWorldMonitorTutorial();
  const [tutorialForced, setTutorialForced] = useState(false);

  // Ship cluster state
  const [clusterShips, setClusterShips] = useState<ShipData[] | null>(null);
  const [clusterCenter, setClusterCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Event cluster state
  const [clusterEvents, setClusterEvents] = useState<GlobeEvent[] | null>(null);
  const [clusterEventCenter, setClusterEventCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Popup state for detail overlays
  const [popupShip, setPopupShip] = useState<ShipData | null>(null);
  const [popupAircraft, setPopupAircraft] = useState<AircraftData | null>(null);
  const [popupEvent, setPopupEvent] = useState<GlobeEvent | null>(null);

  // Real-time clock
  useEffect(() => {
    const tick = () =>
      setSystemTime(
        new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia("(max-width: 1279px), (pointer: coarse)");
    const updateLayoutMode = () => setIsCompactLayout(media.matches);

    updateLayoutMode();

    if (media.addEventListener) {
      media.addEventListener("change", updateLayoutMode);
      return () => media.removeEventListener("change", updateLayoutMode);
    }

    media.addListener(updateLayoutMode);
    return () => media.removeListener(updateLayoutMode);
  }, []);

  // Fetch data
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [osintResponse, eventsResponse] = await Promise.all([
        fetch("/api/world-monitor/osint", { cache: "no-store" }),
        fetch("/api/world-monitor/events", { cache: "no-store" }),
      ]);
      if (!osintResponse.ok || !eventsResponse.ok) {
        throw new Error("One or more intelligence feeds failed to respond.");
      }
      const [osintRes, eventsRes] = await Promise.all([
        osintResponse.json(),
        eventsResponse.json(),
      ]);

      const osint: GlobeEvent[] = osintRes.events || [];
      const articles: GlobeEvent[] = (eventsRes.events || []).map((a: any) => ({
        ...a,
        threatScore: undefined,
        engagement: undefined,
      }));

      setOsintEvents(osint);
      setArticleEvents(articles);
      setAllEvents([...osint, ...articles]);
      setDataTimestamp(
        getNewestEventTimestamp([...osint, ...articles])
          || osintRes.timestamp
          || new Date().toISOString(),
      );
      const latestObservation = getNewestEventTimestamp([...osint, ...articles]);
      setEventDataStale(Boolean(
        osintRes.stale
        || osintRes.success === false
        || eventsRes.success === false
        || !latestObservation
        || Date.now() - new Date(latestObservation).getTime() > 6 * 60 * 60 * 1000,
      ));
    } catch (err) {
      console.error("GeoMoney Aperture data fetch error:", err);
      setEventDataStale(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 2 min
  useEffect(() => {
    const id = setInterval(() => fetchData(true), 120_000);
    return () => clearInterval(id);
  }, [fetchData]);

  // ─── AIRCRAFT TRACKING (OpenSky Network) ────────────────
  const fetchAircraft = useCallback(async () => {
    try {
      const res = await fetch("/api/world-monitor/aircraft");
      if (!res.ok) throw new Error(`OpenSky request failed (${res.status})`);
      const data = await res.json();
      setAircraftData(data.aircraft || []);
      setAircraftTotal(data.total || 0);
      setAircraftUpdatedAt(data.timestamp || null);
      setAircraftDataStale(Boolean(
        data.stale
        || !data.timestamp
        || Date.now() - Number(data.timestamp) > 2 * 60 * 1000,
      ));
    } catch (e) {
      console.warn("[Aircraft]", e);
      setAircraftDataStale(true);
    }
  }, []);

  useEffect(() => {
    fetchAircraft();
    const id = setInterval(fetchAircraft, 25_000); // every 25s
    return () => clearInterval(id);
  }, [fetchAircraft]);

  // ─── SHIP TRACKING ──────────────────────────────────────
  const fetchShips = useCallback(async () => {
    try {
      const res = await fetch("/api/world-monitor/ships");
      if (!res.ok) throw new Error(`AIS request failed (${res.status})`);
      const data = await res.json();
      setShipData(data.ships || []);
      setShipTotal(data.total || 0);
      setShipSource(data.source || "AIS unavailable");
      setShipDataLive(Boolean(data.live));
      setShipUpdatedAt(data.timestamp || null);
      setShipNotice(data.notice || "");
      setShipDataStale(Boolean(
        data.stale
        || (data.live && (!data.timestamp || Date.now() - Number(data.timestamp) > 2 * 60 * 1000)),
      ));
    } catch (e) {
      console.warn("[Ships]", e);
      setShipDataStale(true);
    }
  }, []);

  useEffect(() => {
    fetchShips();
    const id = setInterval(fetchShips, 15_000); // every 15s
    return () => clearInterval(id);
  }, [fetchShips]);

  // ─── CLIMATE DATA ────────────────────────────────────────
  const fetchClimate = useCallback(async () => {
    try {
      const res = await fetch("/api/world-monitor/climate");
      if (!res.ok) return;
      const data = await res.json();
      setClimateData(data.success === false ? [] : data.events || []);
    } catch (e) {
      console.warn("[Climate]", e);
      setClimateData([]);
    }
  }, []);

  useEffect(() => {
    fetchClimate();
    const id = setInterval(fetchClimate, 120_000);
    return () => clearInterval(id);
  }, [fetchClimate]);

  // ─── DISEASE DATA ────────────────────────────────────────
  const fetchDisease = useCallback(async () => {
    try {
      const res = await fetch("/api/world-monitor/disease");
      if (!res.ok) return;
      const data = await res.json();
      setDiseaseData(data.success === false ? [] : data.events || []);
    } catch (e) {
      console.warn("[Disease]", e);
      setDiseaseData([]);
    }
  }, []);

  useEffect(() => {
    fetchDisease();
    const id = setInterval(fetchDisease, 300_000);
    return () => clearInterval(id);
  }, [fetchDisease]);

  // ─── CYBER DATA ──────────────────────────────────────────
  const fetchCyber = useCallback(async () => {
    try {
      const res = await fetch("/api/world-monitor/cyber");
      if (!res.ok) return;
      const data = await res.json();
      setCyberData(data.success === false ? [] : data.events || []);
    } catch (e) {
      console.warn("[Cyber]", e);
      setCyberData([]);
    }
  }, []);

  useEffect(() => {
    fetchCyber();
    const id = setInterval(fetchCyber, 300_000);
    return () => clearInterval(id);
  }, [fetchCyber]);

  // ─── AI INTELLIGENCE BRIEF ──────────────────────────────
  const realShipData = useMemo(
    () => shipDataLive ? shipData.filter((ship) => ship.live !== false) : [],
    [shipData, shipDataLive],
  );

  const sourceStatus = useMemo<{
    events: ApertureSourceStatus;
    aircraft: ApertureSourceStatus;
    vessels: ApertureSourceStatus;
  }>(() => ({
    events: {
      mode: eventDataStale ? "stale" : allEvents.length ? "live" : "unavailable",
      source: "GDELT, RSS, USGS, ReliefWeb, GDACS, Reddit and GeoMoney",
      observedAt: dataTimestamp || null,
      notice: eventDataStale ? "The latest OSINT refresh failed; retained observations may be stale." : undefined,
    },
    aircraft: {
      mode: aircraftDataStale ? "stale" : aircraftData.length ? "live" : "unavailable",
      source: "OpenSky Network",
      observedAt: aircraftUpdatedAt ? new Date(aircraftUpdatedAt).toISOString() : null,
      notice: aircraftDataStale ? "OpenSky is unavailable; showing the last successful snapshot." : undefined,
    },
    vessels: {
      mode: shipDataLive ? (shipDataStale ? "stale" : "live") : "unavailable",
      source: shipSource,
      observedAt: shipDataLive && shipUpdatedAt ? new Date(shipUpdatedAt).toISOString() : null,
      notice: shipDataStale
        ? "The latest AIS refresh failed or the newest observation is old; retained positions are stale."
        : shipDataLive
          ? shipNotice || undefined
          : "No current AIS observations are available. Simulated vessel positions are disabled.",
    },
  }), [
    aircraftData.length,
    aircraftDataStale,
    aircraftUpdatedAt,
    allEvents.length,
    dataTimestamp,
    eventDataStale,
    shipData.length,
    shipDataLive,
    shipDataStale,
    shipNotice,
    shipSource,
    shipUpdatedAt,
  ]);

  const chokepointMetrics = useMemo(
    () =>
      CHOKEPOINTS.map((chokepoint) => {
        const vessels = realShipData.filter((ship) =>
          isNearChokepoint(ship.latitude, ship.longitude, chokepoint),
        );
        const aircraft = aircraftData.filter((asset) =>
          isNearChokepoint(asset.latitude, asset.longitude, chokepoint),
        );
        const strandedShips = vessels.filter(
          (ship) =>
            ship.speed <= 1 ||
            ship.status === "anchored" ||
            ship.status === "moored",
        );
        const nearbyEvents = allEvents.filter((event) =>
          event.locations.some((location) =>
            isNearChokepoint(location.lat, location.lng, chokepoint),
          ),
        );
        const signalScore = clampRisk(
          Math.min(vessels.length * 2, 35)
          + Math.min(aircraft.length, 15)
          + Math.min(nearbyEvents.length * 8, 35),
        );

        return {
          ...chokepoint,
          signalScore,
          status: signalScore >= 75 ? "High signals" : signalScore >= 50 ? "Elevated signals" : signalScore >= 25 ? "Watched" : "Low signals",
          vessels: vessels.length,
          strandedShips: strandedShips.length,
          aircraft: aircraft.length,
          events: nearbyEvents.length,
        };
      }).sort((left, right) => right.vessels - left.vessels),
    [aircraftData, allEvents, realShipData],
  );

  const trackedAssets = useMemo(
    () => [
      {
        type: "Maritime AIS",
        icon: Ship,
        active: realShipData.length,
        total: shipDataLive ? Math.max(shipTotal, realShipData.length) : 0,
      },
      {
        type: "Aerial",
        icon: Plane,
        active: aircraftData.length,
        total: Math.max(aircraftTotal, aircraftData.length),
      },
      { type: "OSINT events", icon: Radio, active: osintEvents.length, total: osintEvents.length },
      { type: "Climate events", icon: Thermometer, active: climateData.length, total: climateData.length },
      { type: "Disease events", icon: Bug, active: diseaseData.length, total: diseaseData.length },
      { type: "Cyber events", icon: Terminal, active: cyberData.length, total: cyberData.length },
    ],
    [
      aircraftData.length,
      aircraftTotal,
      climateData.length,
      cyberData.length,
      diseaseData.length,
      osintEvents.length,
      realShipData.length,
      shipDataLive,
      shipTotal,
    ],
  );

  const liveRiskIndices = useMemo(() => {
    const scoreEvents = (events: any[], fallback = 40) => events.length
      ? events.reduce((sum, event) => sum + (Number(event.threatScore ?? event.severity) || fallback), 0) / events.length
      : 0;
    const matchingEvents = (pattern: RegExp) => allEvents.filter((event) =>
      pattern.test(`${event.title} ${event.description || ""} ${event.category}`),
    );
    const conflictEvents = matchingEvents(/war|conflict|attack|military|missile|strike|security|sanction/i);
    const economyEvents = matchingEvents(/econom|market|inflation|bank|trade|finance|currency|debt/i);
    const supplyEvents = matchingEvents(/supply|shipping|port|canal|commodity|export|import|logistic/i);
    const energyEvents = matchingEvents(/energy|oil|gas|lng|power|coal|nuclear|pipeline/i);

    return [
      { name: "Conflict", value: clampRisk(scoreEvents(conflictEvents)), signalCount: conflictEvents.length, color: "from-red-500 to-orange-500" },
      { name: "Economy", value: clampRisk(scoreEvents(economyEvents)), signalCount: economyEvents.length, color: "from-yellow-500 to-amber-500" },
      { name: "Supply Chain", value: clampRisk(scoreEvents(supplyEvents) + Math.min(realShipData.length / 20, 20)), signalCount: supplyEvents.length + realShipData.length, color: "from-orange-500 to-red-500" },
      { name: "Cyber", value: clampRisk(scoreEvents(cyberData, 45)), signalCount: cyberData.length, color: "from-purple-500 to-pink-500" },
      { name: "Energy", value: clampRisk(scoreEvents(energyEvents)), signalCount: energyEvents.length, color: "from-blue-500 to-cyan-500" },
      { name: "Climate", value: clampRisk(scoreEvents(climateData, 45)), signalCount: climateData.length, color: "from-emerald-500 to-teal-500" },
    ];
  }, [allEvents, climateData, cyberData, realShipData.length]);

  const liveCountryBriefs = useMemo(() => {
    const grouped = new globalThis.Map<string, GlobeEvent[]>();
    for (const event of allEvents) {
      for (const location of event.locations) {
        const country = location.name.trim();
        if (!country || country.length < 3) continue;
        const events = grouped.get(country) || [];
        if (!events.some((item: GlobeEvent) => item.id === event.id)) events.push(event);
        grouped.set(country, events);
      }
    }

    return Array.from(grouped.entries())
      .map(([country, events]: [string, GlobeEvent[]]) => {
        const sorted = [...events].sort(
          (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
        );
        const signalScore = clampRisk(
          sorted.reduce((sum, event) => sum + (event.threatScore || 40), 0) / sorted.length,
        );
        const latest = sorted[0];
        return {
          country: country.replace(/\b\w/g, (letter: string) => letter.toUpperCase()),
          flag: "🌐",
          signalScore,
          brief: latest.description || latest.title,
          hotTopics: Array.from(new Set(sorted.flatMap((event) => [event.category, event.sourceDetail || event.source]))).filter(Boolean).slice(0, 3),
          source: latest.sourceDetail || latest.source,
          timestamp: latest.timestamp,
          signalCount: sorted.length,
        };
      })
      .sort((left, right) => right.signalScore - left.signalScore || right.signalCount - left.signalCount)
      .slice(0, 8);
  }, [allEvents]);

  const assetContext = useMemo(
    () => ({
      aircraft: {
        visibleNow: aircraftData.length,
        totalTracked: aircraftTotal,
        source: sourceStatus.aircraft.source,
        sample: aircraftData.slice(0, 20).map((asset) => ({
          icao24: asset.icao24,
          callsign: asset.callsign,
          originCountry: asset.origin_country,
          category: asset.category,
          latitude: asset.latitude,
          longitude: asset.longitude,
          altitude: asset.altitude,
          velocity: asset.velocity,
          heading: asset.heading,
          lastContact: asset.lastContact || asset.timePosition || null,
        })),
      },
      vessels: {
        visibleNow: realShipData.length,
        totalTracked: shipDataLive ? shipTotal : 0,
        source: shipSource,
        live: shipDataLive,
        totalOnGlobe: realShipData.length,
        sample: realShipData.slice(0, 20).map((ship) => ({
          mmsi: ship.mmsi,
          name: ship.name,
          type: ship.type,
          latitude: ship.latitude,
          longitude: ship.longitude,
          speed: ship.speed,
          heading: ship.heading,
          destination: ship.destination,
          status: ship.status,
          lastUpdate: ship.lastUpdate || null,
        })),
      },
      chokepoints: chokepointMetrics.slice(0, 8).map((chokepoint) => ({
        name: chokepoint.name,
        vessels: chokepoint.vessels,
        strandedShips: chokepoint.strandedShips,
        aircraft: chokepoint.aircraft,
      })),
      globalSummary: `${realShipData.length} real AIS vessels visible, ${aircraftData.length} OpenSky aircraft observed. Vessels in/near chokepoints: ${chokepointMetrics.reduce((s, c) => s + c.vessels, 0)}. Real vessels currently slow/stopped: ${realShipData.filter((s) => s.speed <= 1).length}.`,
    }),
    [
      aircraftData.length,
      aircraftTotal,
      chokepointMetrics,
      realShipData,
      shipDataLive,
      shipSource,
      shipTotal,
      sourceStatus.aircraft.source,
    ],
  );

  const featuredChokepoints = useMemo(() => {
    const hormuz = chokepointMetrics.find(
      (chokepoint) => chokepoint.name === "Strait of Hormuz",
    );
    const remaining = chokepointMetrics.filter(
      (chokepoint) => chokepoint.name !== "Strait of Hormuz",
    );

    return hormuz
      ? [hormuz, ...remaining.slice(0, 2)]
      : chokepointMetrics.slice(0, 3);
  }, [chokepointMetrics]);

  const fetchAiBrief = useCallback(
    async (query?: string) => {
      setAiLoading(true);
      setAiError("");
      try {
        const evidenceEvents = allEvents.slice(0, 20).map((event) => ({
          id: event.id,
          title: event.title,
          description: event.description || "",
          source: event.source,
          sourceDetail: event.sourceDetail || "",
          timestamp: event.timestamp,
          region: event.region,
          category: event.category,
          url: event.url || event.link || "",
          threatScore: event.threatScore ?? null,
        }));
        const res = await fetch("/api/world-monitor/ai-brief", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            events: evidenceEvents,
            query: query || "",
            assetContext,
            sourceStatus,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `AI analyzer failed (${res.status})`);
        setAiBrief(data);
      } catch (e) {
        console.warn("[AI Brief]", e);
        setAiError(e instanceof Error ? e.message : "The AI analyzer is unavailable.");
      } finally {
        setAiLoading(false);
      }
    },
    [allEvents, assetContext, sourceStatus],
  );

  const autoBriefEvidenceKey = useMemo(
    () => JSON.stringify({
      events: allEvents.slice(0, 20).map((event) => [event.id, event.timestamp]),
      aircraft: [sourceStatus.aircraft.mode, sourceStatus.aircraft.observedAt],
      vessels: [sourceStatus.vessels.mode, sourceStatus.vessels.observedAt],
    }),
    [allEvents, sourceStatus.aircraft, sourceStatus.vessels],
  );

  // Refresh the automatic briefing only when its underlying evidence changes.
  useEffect(() => {
    if (
      !allEvents.length
      || autoBriefEvidenceRef.current === autoBriefEvidenceKey
      || Date.now() - autoBriefLastRunRef.current < 300_000
    ) return;
    autoBriefEvidenceRef.current = autoBriefEvidenceKey;
    autoBriefLastRunRef.current = Date.now();
    fetchAiBrief();
  }, [allEvents.length, autoBriefEvidenceKey, fetchAiBrief]);

  const sourceSignalLevel = computeSignalLevel(osintEvents);

  const focusGlobeLocation = useCallback((target: GlobeFocusTarget) => {
    setApertureActive(false);
    setGlobeFocusTarget(target);
  }, []);

  const handleEventClick = useCallback(
    (event: GlobeEvent) => {
      const primaryLocation = event.locations[0];
      if (primaryLocation) {
        // Check if there are 2+ events nearby (including this one) — show cluster panel instead
        const nearby = findNearbyEvents(
          primaryLocation.lat,
          primaryLocation.lng,
          allEvents,
          100,
        );
        if (nearby.length > 1) {
          setClusterEvents(nearby);
          setClusterEventCenter({
            lat: primaryLocation.lat,
            lng: primaryLocation.lng,
          });

          focusGlobeLocation({
            key: `event-cluster-${primaryLocation.lat}-${primaryLocation.lng}`,
            lat: primaryLocation.lat,
            lng: primaryLocation.lng,
            distance: 3.05,
            targetDepth: 0.78,
          });
          return;
        }
      }

      // Single event normal behavior
      setSelectedAircraft(null);
      setSelectedShip(null);
      setSelectedEvent(event);
      setShowDetail(true);
      setActivePanel("feed");
      setPopupEvent(event);
      setPopupAircraft(null);
      setPopupShip(null);
      setClusterEvents(null);
      setClusterEventCenter(null);

      if (primaryLocation) {
        focusGlobeLocation({
          key: `event-${event.id}-${primaryLocation.name}`,
          lat: primaryLocation.lat,
          lng: primaryLocation.lng,
          distance: 3.05,
          targetDepth: 0.78,
        });
      }
    },
    [allEvents, focusGlobeLocation],
  );

  const handleAircraftClick = useCallback(
    (aircraft: AircraftData) => {
      setShowDetail(false);
      setSelectedEvent(null);
      setSelectedShip(null);
      setSelectedAircraft(aircraft);
      setActivePanel("aircraft");
      setPopupAircraft(aircraft);
      setPopupShip(null);
      setPopupEvent(null);
      focusGlobeLocation({
        key: `aircraft-${aircraft.icao24}`,
        lat: aircraft.latitude,
        lng: aircraft.longitude,
        distance: 2.62,
        targetDepth: 0.86,
      });
    },
    [focusGlobeLocation],
  );

  const handleShipClick = useCallback(
    (ship: ShipData) => {
      // Check if there are 4+ ships nearby — show cluster panel instead
      const nearby = findNearbyShips(ship, shipData, 50);
      if (nearby.length >= 4) {
        setClusterShips(nearby);
        setClusterCenter({ lat: ship.latitude, lng: ship.longitude });
        // Still zoom to the area
        focusGlobeLocation({
          key: `cluster-${ship.latitude}-${ship.longitude}`,
          lat: ship.latitude,
          lng: ship.longitude,
          distance: 2.68,
          targetDepth: 0.85,
        });
        return;
      }

      // Single ship — normal behavior
      setShowDetail(false);
      setSelectedEvent(null);
      setSelectedAircraft(null);
      setSelectedShip(ship);
      setActivePanel("ships");
      setPopupShip(ship);
      setPopupAircraft(null);
      setPopupEvent(null);
      focusGlobeLocation({
        key: `ship-${ship.mmsi}`,
        lat: ship.latitude,
        lng: ship.longitude,
        distance: 2.68,
        targetDepth: 0.85,
      });
    },
    [focusGlobeLocation, shipData],
  );

  const handleChokepointClick = useCallback(
    (chokepoint: (typeof CHOKEPOINTS)[number]) => {
      setShowDetail(false);
      setSelectedEvent(null);
      setSelectedAircraft(null);
      setSelectedShip(null);
      setActivePanel("chokepoints");
      focusGlobeLocation({
        key: `chokepoint-${chokepoint.name}`,
        lat: chokepoint.lat,
        lng: chokepoint.lng,
        distance: 2.9,
        targetDepth: 0.8,
      });
    },
    [focusGlobeLocation],
  );

  const clearSelectedAsset = useCallback(() => {
    setSelectedAircraft(null);
    setSelectedShip(null);
  }, []);

  const selectedAsset = selectedAircraft
    ? {
        kind: "aircraft" as const,
        title: selectedAircraft.callsign || selectedAircraft.icao24,
        subtitle: selectedAircraft.origin_country || "Origin unknown",
        summary: `${selectedAircraft.category.toUpperCase()} • ALT ${Math.round(selectedAircraft.altitude).toLocaleString()}m • SPD ${Math.round(selectedAircraft.velocity)}m/s`,
        href: buildAircraftReportHref(selectedAircraft),
      }
    : selectedShip
      ? {
          kind: "ship" as const,
          title: selectedShip.name,
          subtitle: `${selectedShip.flagEmoji} ${selectedShip.flag}`,
          summary: `${selectedShip.type.toUpperCase()} • ${selectedShip.speed.toFixed(1)}kn • ${selectedShip.destination}`,
          href: buildShipReportHref(selectedShip),
        }
      : null;

  useEffect(() => {
    if (!isCompactLayout) {
      return;
    }

    if (selectedAsset || (showDetail && selectedEvent)) {
      setMobileHudTab("selection");
      setMobileHudOpen(true);
    }
  }, [isCompactLayout, selectedAsset, selectedEvent, showDetail]);

  useEffect(() => {
    if (isCompactLayout) {
      setDesktopDefaultsApplied(false);
      setDesktopHudOpen(false);
      return;
    }

    if (!desktopDefaultsApplied) {
      setDesktopHudOpen(false);
      setAiNavigatorMinimized(true);
      setAssetCoverageMinimized(true);
      setDesktopDefaultsApplied(true);
    }
  }, [desktopDefaultsApplied, isCompactLayout]);

  const openMobileHud = useCallback((tab: "overview" | "ai" | "selection") => {
    setMobileHudTab(tab);
    setMobileHudOpen(true);
  }, []);

  // ─── SECTION NAVIGATION ────────────────────────────────
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [sideNavMinimized, setSideNavMinimized] = useState(false);

  const SIDE_NAV_SECTIONS = [
    { id: "globe-hero", label: "Globe Monitor", icon: Globe2 },
    { id: "risk-indices", label: "Signal Scores", icon: Activity },
    { id: "chokepoints", label: "Chokepoints", icon: Target },
    { id: "asset-tracking", label: "Asset Tracking", icon: Layers },
    { id: "country-briefs", label: "Location Briefs", icon: Flag },
  ] as const;

  // IntersectionObserver — track which section is currently in view
  useEffect(() => {
    if (isCompactLayout) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
            break; // use the first visible one
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0.1 },
    );

    const currentRefs = sectionRefs.current;
    SIDE_NAV_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) {
        currentRefs[id] = el;
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompactLayout]);

  const scrollToSection = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(sectionId);
    }
  }, []);

  // ──────────────────────────────────────────────────────────
  return (
    <main className="relative flex min-h-dvh flex-col pt-[104px] text-white sm:pt-[128px]">
      {/* Tutorial overlay */}
      {(showTutorial || tutorialForced) && (
        <WorldMonitorTutorial
          onClose={() => {
            dismissTutorial();
            setTutorialForced(false);
          }}
        />
      )}

      {/* Event cluster overlay */}
      {clusterEvents && clusterEvents.length > 0 && clusterEventCenter && (
        <EventClusterPanel
          events={clusterEvents}
          center={clusterEventCenter}
          onSelectEvent={(event) => {
            setClusterEvents(null);
            setClusterEventCenter(null);
            setShowDetail(true);
            setSelectedEvent(event);
            setSelectedAircraft(null);
            setSelectedShip(null);
            setActivePanel("feed");
            setPopupEvent(event);
            setPopupAircraft(null);
            setPopupShip(null);

            const primaryLocation = event.locations[0];
            if (primaryLocation) {
              focusGlobeLocation({
                key: `event-${event.id}-${primaryLocation.name}`,
                lat: primaryLocation.lat,
                lng: primaryLocation.lng,
                distance: 3.05,
                targetDepth: 0.78,
              });
            }
          }}
          onClose={() => {
            setClusterEvents(null);
            setClusterEventCenter(null);
          }}
        />
      )}

      {/* Ship cluster overlay */}
      {clusterShips && clusterShips.length > 0 && clusterCenter && (
        <ShipClusterPanel
          ships={clusterShips}
          center={clusterCenter}
          onSelectShip={(ship) => {
            setClusterShips(null);
            setClusterCenter(null);
            setShowDetail(false);
            setSelectedEvent(null);
            setSelectedAircraft(null);
            setSelectedShip(ship);
            setActivePanel("ships");
            setPopupShip(ship);
            setPopupAircraft(null);
            setPopupEvent(null);
            focusGlobeLocation({
              key: `ship-${ship.mmsi}`,
              lat: ship.latitude,
              lng: ship.longitude,
              distance: 2.68,
              targetDepth: 0.85,
            });
          }}
          onClose={() => {
            setClusterShips(null);
            setClusterCenter(null);
          }}
        />
      )}

      {/* Detail popups for individual assets */}
      {popupShip && (
        <ShipDetailPopup
          ship={popupShip}
          reportHref={buildShipReportHref(popupShip)}
          onClose={() => setPopupShip(null)}
        />
      )}
      {popupAircraft && (
        <AircraftDetailPopup
          aircraft={popupAircraft}
          reportHref={buildAircraftReportHref(popupAircraft)}
          onClose={() => setPopupAircraft(null)}
        />
      )}
      {popupEvent && (
        <EventDetailPopup
          event={popupEvent}
          reportHref={buildEventReportHref(popupEvent)}
          onClose={() => setPopupEvent(null)}
        />
      )}

      {/* BG */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0d1b2a] via-[#060d18] to-[#030812]" />

      {/* ═══ TOP BAR — Vision Pro glass ════════════════════ */}
      <div className="relative z-20 border-b border-white/[0.06] bg-black/40 backdrop-blur-2xl">
        <div className="px-4 py-2 flex items-center justify-between">
          {/* Left */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-gray-500 hover:text-geo-gold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Eye className="w-6 h-6 text-geo-gold" />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight">
                  <span className="text-geo-gold">GEOMONEY APERTURE</span>
                  <span className="text-white/40 mx-2">|</span>
                  <span className="text-white/80">GeoMoney Aperture</span>
                </h1>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <div
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono ${sourceSignalLevel.bg} ${sourceSignalLevel.border}`}
            >
              <div
                className={`w-2 h-2 rounded-full ${sourceSignalLevel.pulse} animate-pulse`}
              />
              <span className={sourceSignalLevel.color}>
                SOURCE SIGNAL: {sourceSignalLevel.label}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg text-[11px] font-mono text-gray-400">
              <Clock className="w-3.5 h-3.5 text-geo-gold" />
              {systemTime}
            </div>
            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-geo-gold/10 hover:bg-geo-gold/20 border border-geo-gold/30 rounded-lg text-geo-gold text-xs font-medium transition-all disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">
                {isRefreshing ? "SCANNING" : "SCAN"}
              </span>
            </button>
            <button
              onClick={() => setTutorialForced(true)}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-geo-gold text-xs font-bold transition-all"
              title="How to use GeoMoney Aperture"
            >
              ?
            </button>
          </div>
        </div>

        {/* Risk ticker bar */}
        <div className="px-4 py-1.5 border-t border-white/5 bg-black/40 flex items-center gap-4 overflow-x-auto">
          {liveRiskIndices.map((idx) => (
            <div key={idx.name} className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-gray-500 font-mono">
                {idx.name.toUpperCase()}
              </span>
              <span
                className={`text-xs font-bold font-mono ${getRiskColor(idx.value)}`}
              >
                {idx.value}
              </span>
              <span className="text-[9px] font-mono text-gray-600">
                {idx.signalCount} signals
              </span>
            </div>
          ))}
          <div className="shrink-0 ml-auto text-[9px] text-gray-600 font-mono">
            {allEvents.length} events •{" "}
            {dataTimestamp
              ? new Date(dataTimestamp).toLocaleTimeString()
              : "--:--"}
          </div>
        </div>

        <div className="border-t border-white/5 bg-black/45 px-4 py-2 xl:hidden">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setApertureActive((current) => !current)}
              className={`shrink-0 rounded-full border px-3 py-2 text-[11px] font-semibold transition-colors ${
                apertureActive
                  ? "border-cyan-300 bg-cyan-400 text-black"
                  : "border-cyan-400/40 bg-cyan-500/10 text-cyan-300"
              }`}
            >
              {apertureActive ? "Close Aperture" : "Open Aperture"}
            </button>
            {!apertureActive && (
              <>
                <button
                  type="button"
                  onClick={() => openMobileHud("overview")}
                  className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-medium text-white"
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => openMobileHud("ai")}
                  className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-medium text-white"
                >
                  AI Navigator
                </button>
                <button
                  type="button"
                  onClick={() => openMobileHud("selection")}
                  className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-medium text-white"
                >
                  {selectedAsset || selectedEvent ? "Selection" : "Details"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ═══ MAIN LAYOUT ════════════════════════════════════ */}
      {/* ═══ HERO FRAME (GLOBE + HUD) ════════════════════════════════════ */}
      <div id="globe-hero" className="w-full max-w-[1920px] mx-auto p-4 md:p-6 lg:p-8 pb-0 scroll-mt-[140px]">
        <div className="flex flex-col xl:flex-row gap-4 md:gap-6 relative">
          <div
            className="relative z-10 flex-1 w-full h-[55vh] min-h-[450px] max-h-[700px] flex overflow-hidden rounded-[32px] border border-white/[0.08] shadow-2xl shadow-black/50"
          >
            <div className="flex-1 relative">
              {!isCompactLayout && (
                <div className="pointer-events-none absolute left-4 top-4 z-20 hidden lg:block">
                  <button
                    type="button"
                    onClick={() => setApertureActive(!apertureActive)}
                    title="GeoMoney Aperture Street Map (2D)"
                    className={`pointer-events-auto flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-bold tracking-[0.1em] transition-all shadow-lg backdrop-blur-xl ${
                      apertureActive
                        ? "bg-cyan-400 text-black border-cyan-300 shadow-cyan-500/30"
                        : "bg-black/65 text-cyan-300 border-white/10 hover:border-cyan-400/40 hover:bg-cyan-500/20"
                    }`}
                  >
                    <Map className="h-3.5 w-3.5" />
                    APERTURE 2D MAP
                  </button>
                </div>
              )}
              {/* Conditional rendering of 3D globe to prevent 2D map overlap */}
              <div className={`absolute inset-0 ${apertureActive ? "hidden" : "block"}`}>
                <WorldGlobe
                  events={allEvents}
                  onEventClick={handleEventClick}
                  onAircraftClick={handleAircraftClick}
                  onShipClick={handleShipClick}
                  selectedEvent={selectedEvent}
                  aircraft={aircraftData}
                  ships={realShipData}
                  focusTarget={globeFocusTarget}
                  onZoomChange={setZoomLevel}
                />
              </div>

              {/* GEOMONEY APERTURE 2D MAP OVERLAY */}
              {apertureActive && (
                <GodsEyeMap
                  aircraft={aircraftData}
                  ships={realShipData}
                  sourceStatus={{
                    aircraft: sourceStatus.aircraft,
                    vessels: sourceStatus.vessels,
                  }}
                  visible={apertureActive}
                  onClose={() => setApertureActive(false)}
                  selectedWebcam={selectedWebcam}
                  onSelectWebcam={setSelectedWebcam}
                />
              )}
            </div>
          </div>

          {/* ═══ RIGHT PANEL: TOPSIDE AI NAVIGATOR ════════════ */}
          {!apertureActive && !isCompactLayout && (
            <div className="w-full xl:w-[400px] shrink-0 h-[55vh] min-h-[450px] max-h-[700px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 z-20">
              <div className="flex flex-col gap-3 pb-4 pr-2">
                <div className="rounded-[26px] border border-white/[0.08] bg-black/58 p-4 shadow-xl shadow-black/20 backdrop-blur-2xl">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-mono tracking-[0.22em] text-geo-gold">
                        TOPSIDE AI NAVIGATOR
                      </div>
                      <h2 className="mt-1 text-sm font-semibold text-white">
                        Ask live questions about aircraft, vessels, and
                        chokepoints directly from the monitor.
                      </h2>
                    </div>
                    <div
                      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-mono ${sourceStatus.vessels.mode === "live" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : sourceStatus.vessels.mode === "stale" ? "border-orange-500/30 bg-orange-500/10 text-orange-300" : "border-yellow-500/30 bg-yellow-500/10 text-yellow-300"}`}
                    >
                      <Radar className="h-3.5 w-3.5" />
                      {sourceStatus.vessels.mode === "live" ? "Live AIS" : sourceStatus.vessels.mode === "stale" ? "Stale AIS" : "AIS unavailable"}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <input
                      type="text"
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && fetchAiBrief(aiQuery)
                      }
                      placeholder="Ask about Hormuz, vessel congestion, aircraft posture, or chokepoints..."
                      className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-gray-500 focus:border-geo-gold/40 focus:outline-none"
                    />
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      <button
                        type="button"
                        onClick={() => fetchAiBrief(aiQuery)}
                        disabled={aiLoading}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-geo-gold/30 bg-geo-gold/10 px-4 text-sm font-semibold text-geo-gold transition-colors hover:bg-geo-gold/20 disabled:opacity-50"
                      >
                        <Cpu className="h-4 w-4" />
                        {aiLoading ? "Analyzing..." : "Run AI query"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActivePanel("feed");
                          setDesktopHudOpen(true);
                        }}
                        className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-[11px] font-medium text-white transition-colors hover:border-geo-gold/30 hover:text-geo-gold"
                      >
                        Open feed
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {AI_QUICK_QUERIES.slice(0, 3).map((question) => (
                      <button
                        key={question}
                        type="button"
                        onClick={() => {
                          setAiQuery(question);
                          fetchAiBrief(question);
                        }}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-gray-300 transition-colors hover:border-geo-gold/30 hover:text-geo-gold"
                      >
                        {question}
                      </button>
                    ))}
                  </div>

                  {aiBrief && (
                    <div className="mt-4 rounded-2xl border border-purple-500/20 bg-purple-500/8 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-purple-300">
                          {aiBrief.threatLevel || "MONITOR"}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {new Date(aiBrief.generatedAt).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="mt-1 text-sm font-semibold text-white">
                        {aiBrief.headline}
                      </div>
                      <div className="mt-1 text-[9px] font-mono text-gray-600">
                        {aiBrief.model}{aiBrief.cached ? " · CACHED" : ""}{aiBrief.stale ? " · STALE" : ""}
                        {aiBrief.dataAsOf ? ` · DATA AS OF ${new Date(aiBrief.dataAsOf).toLocaleString()}` : ""}
                      </div>
                      {aiBrief.queryAnswer && aiBrief.isQueryResponse && (
                        <div className="mt-2 rounded-xl border border-geo-gold/20 bg-geo-gold/5 p-2.5">
                          <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-geo-gold/70 mb-1">
                            ANSWER
                          </div>
                          <p className="text-xs leading-relaxed text-white">
                            {aiBrief.queryAnswer}
                          </p>
                        </div>
                      )}
                      <p className="mt-2 text-xs leading-relaxed text-gray-300">
                        {aiBrief.summary}
                      </p>
                      {aiBrief.hotspots && aiBrief.hotspots.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {aiBrief.hotspots
                            .slice(0, 3)
                            .map((hs: any, i: number) => (
                              <span
                                key={i}
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-mono ${
                                  hs.severity === "critical"
                                    ? "bg-red-500/15 text-red-400 border border-red-500/20"
                                    : hs.severity === "high"
                                      ? "bg-orange-500/15 text-orange-400 border border-orange-500/20"
                                      : hs.severity === "medium"
                                        ? "bg-yellow-500/15 text-yellow-300 border border-yellow-500/20"
                                        : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                                }`}
                              >
                                {hs.region}: {hs.status}
                              </span>
                            ))}
                        </div>
                      )}
                      {aiBrief.keyInsight && (
                        <p className="mt-2 text-[11px] leading-relaxed text-gray-400 italic">
                          {aiBrief.keyInsight}
                        </p>
                      )}
                    </div>
                  )}
                  {aiError && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                      {aiError}
                    </div>
                  )}
                </div>

                <div className="rounded-[26px] border border-white/[0.08] bg-black/58 p-4 shadow-xl shadow-black/20 backdrop-blur-2xl">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-mono tracking-[0.22em] text-gray-500">
                        CURRENT SOURCE COVERAGE
                      </div>
                      <p className="mt-1 text-xs text-gray-400">
                        Keep counts visible while leaving the globe clear.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActivePanel("ships");
                        setDesktopHudOpen(true);
                      }}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-[11px] font-medium text-white transition-colors hover:border-geo-gold/30 hover:text-geo-gold"
                    >
                      Open drawer
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-3">
                      <div className="text-[10px] uppercase text-gray-500">
                        Aircraft
                      </div>
                      <div className="mt-1 text-xl font-bold font-mono text-cyan-400">
                        {aircraftData.length.toLocaleString()}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-3">
                      <div className="text-[10px] uppercase text-gray-500">
                        Vessels
                      </div>
                      <div className="mt-1 text-xl font-bold font-mono text-orange-400">
                        {realShipData.length.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-[11px] text-gray-400">
                    <div>
                      Focus: {featuredChokepoints[0]?.name || "Global monitor"}
                    </div>
                    <div className="mt-1">
                      {
                        allEvents.filter((event) => event.locations.length > 0)
                          .length
                      }{" "}
                      plotted events • {osintEvents.length} OSINT •{" "}
                      {articleEvents.length} intel
                    </div>
                    <div className="mt-1">
                      Zoom {zoomLevel.toFixed(1)} • Vessel sync{" "}
                      {shipUpdatedAt
                        ? new Date(shipUpdatedAt).toLocaleTimeString()
                        : "awaiting"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!apertureActive && isCompactLayout && (
            <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20">
              <div className="pointer-events-auto rounded-[24px] border border-white/10 bg-black/72 shadow-2xl shadow-black/40 backdrop-blur-2xl">
                <button
                  type="button"
                  onClick={() => setMobileHudOpen((current) => !current)}
                  className="flex w-full items-center justify-between px-4 py-3"
                >
                  <div>
                    <div className="text-[10px] font-mono tracking-[0.2em] text-geo-gold">
                      MOBILE COMMAND SURFACE
                    </div>
                    <div className="mt-1 text-xs text-gray-300">
                      Secondary controls stay in a sheet so the globe remains
                      draggable.
                    </div>
                  </div>
                  <ChevronRight
                    className={`h-5 w-5 text-gray-400 transition-transform ${mobileHudOpen ? "rotate-90" : "-rotate-90"}`}
                  />
                </button>

                <div className="border-t border-white/5 px-3 py-2">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ["overview", "Overview"],
                      ["ai", "AI"],
                      [
                        "selection",
                        selectedAsset || selectedEvent
                          ? "Selection"
                          : "Details",
                      ],
                    ].map(([key, label]) => {
                      const selected = mobileHudTab === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setMobileHudTab(
                              key as "overview" | "ai" | "selection",
                            );
                            setMobileHudOpen(true);
                          }}
                          className={`rounded-2xl border px-3 py-2 text-[11px] font-medium transition-colors ${
                            selected
                              ? "border-geo-gold/40 bg-geo-gold/15 text-geo-gold"
                              : "border-white/10 bg-white/5 text-gray-300"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {mobileHudOpen && (
                  <div className="max-h-[52vh] space-y-3 overflow-y-auto border-t border-white/5 px-4 py-4">
                    {mobileHudTab === "overview" && (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-3">
                            <div className="text-[10px] uppercase text-gray-500">
                              Aircraft
                            </div>
                            <div className="mt-1 text-xl font-bold font-mono text-cyan-400">
                              {aircraftData.length.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              Total {aircraftTotal.toLocaleString()}
                            </div>
                          </div>
                          <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-3">
                            <div className="text-[10px] uppercase text-gray-500">
                              Vessels
                            </div>
                            <div className="mt-1 text-xl font-bold font-mono text-orange-400">
                              {realShipData.length.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              {sourceStatus.vessels.mode === "live" ? "Live AIS" : sourceStatus.vessels.mode === "stale" ? `Stale · ${shipSource}` : shipSource}
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-gray-500">
                            Featured chokepoints
                          </div>
                          <div className="mt-3 grid gap-2">
                            {featuredChokepoints
                              .slice(0, 3)
                              .map((chokepoint) => (
                                <button
                                  type="button"
                                  key={chokepoint.name}
                                  onClick={() =>
                                    handleChokepointClick(
                                      CHOKEPOINTS.find(
                                        (candidate) =>
                                          candidate.name === chokepoint.name,
                                      ) || CHOKEPOINTS[0],
                                    )
                                  }
                                  className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 text-left"
                                >
                                  <div className="text-xs text-white">
                                    {chokepoint.name}
                                  </div>
                                  <div className="mt-1 text-[11px] text-gray-400">
                                    {chokepoint.vessels} vessels •{" "}
                                    {chokepoint.strandedShips} stranded •{" "}
                                    {chokepoint.aircraft} aircraft
                                  </div>
                                </button>
                              ))}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-[11px] text-gray-400">
                          <div>
                            {
                              allEvents.filter(
                                (event) => event.locations.length > 0,
                              ).length
                            }{" "}
                            plotted events • {osintEvents.length} OSINT •{" "}
                            {articleEvents.length} intel
                          </div>
                          <div className="mt-1">
                            Zoom {zoomLevel.toFixed(1)} • Aircraft sync{" "}
                            {aircraftUpdatedAt
                              ? new Date(aircraftUpdatedAt).toLocaleTimeString()
                              : "awaiting"}
                          </div>
                          <div className="mt-1">
                            Vessel sync{" "}
                            {shipUpdatedAt
                              ? new Date(shipUpdatedAt).toLocaleTimeString()
                              : "awaiting"}
                          </div>
                        </div>
                      </>
                    )}

                    {mobileHudTab === "ai" && (
                      <>
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={aiQuery}
                            onChange={(e) => setAiQuery(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && fetchAiBrief(aiQuery)
                            }
                            placeholder="Ask about chokepoints, vessel congestion, or flights..."
                            className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-gray-500 focus:border-geo-gold/40 focus:outline-none"
                          />
                          <button
                            onClick={() => fetchAiBrief(aiQuery)}
                            disabled={aiLoading}
                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-geo-gold/30 bg-geo-gold/10 px-4 text-sm font-semibold text-geo-gold transition-colors hover:bg-geo-gold/20 disabled:opacity-50"
                          >
                            <Cpu className="h-4 w-4" />
                            {aiLoading ? "Analyzing..." : "Run AI query"}
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {AI_QUICK_QUERIES.slice(0, 4).map((question) => (
                            <button
                              key={question}
                              onClick={() => {
                                setAiQuery(question);
                                fetchAiBrief(question);
                              }}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-gray-300"
                            >
                              {question}
                            </button>
                          ))}
                        </div>

                        {aiBrief && (
                          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/8 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-purple-300">
                                {aiBrief.threatLevel || "MONITOR"}
                              </div>
                              <div className="text-[10px] text-gray-500">
                                {new Date(aiBrief.generatedAt).toLocaleTimeString()}
                              </div>
                            </div>
                            <div className="mt-1 text-sm font-semibold text-white">
                              {aiBrief.headline}
                            </div>
                            <div className="mt-1 text-[9px] font-mono text-gray-600">
                              {aiBrief.model}{aiBrief.cached ? " · CACHED" : ""}{aiBrief.stale ? " · STALE" : ""}
                              {aiBrief.dataAsOf ? ` · DATA AS OF ${new Date(aiBrief.dataAsOf).toLocaleString()}` : ""}
                            </div>
                            {aiBrief.queryAnswer && aiBrief.isQueryResponse && (
                              <div className="mt-2 rounded-xl border border-geo-gold/20 bg-geo-gold/5 p-2.5">
                                <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-geo-gold/70 mb-1">
                                  ANSWER
                                </div>
                                <p className="text-xs leading-relaxed text-white">
                                  {aiBrief.queryAnswer}
                                </p>
                              </div>
                            )}
                            <p className="mt-2 text-xs leading-relaxed text-gray-300">
                              {aiBrief.summary}
                            </p>
                            {aiBrief.hotspots &&
                              aiBrief.hotspots.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {aiBrief.hotspots
                                    .slice(0, 3)
                                    .map((hs: any, i: number) => (
                                      <span
                                        key={i}
                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-mono ${
                                          hs.severity === "critical"
                                            ? "bg-red-500/15 text-red-400 border border-red-500/20"
                                            : hs.severity === "high"
                                              ? "bg-orange-500/15 text-orange-400 border border-orange-500/20"
                                              : hs.severity === "medium"
                                                ? "bg-yellow-500/15 text-yellow-300 border border-yellow-500/20"
                                                : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                                        }`}
                                      >
                                        {hs.region}: {hs.status}
                                      </span>
                                    ))}
                                </div>
                              )}
                            {aiBrief.keyInsight && (
                              <p className="mt-2 text-[11px] leading-relaxed text-gray-400 italic">
                                {aiBrief.keyInsight}
                              </p>
                            )}
                          </div>
                        )}
                        {aiError && (
                          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                            {aiError}
                          </div>
                        )}
                      </>
                    )}

                    {mobileHudTab === "selection" && (
                      <>
                        {selectedAsset ? (
                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-geo-gold">
                              {selectedAsset.kind === "aircraft"
                                ? "Aircraft selected"
                                : "Vessel selected"}
                            </div>
                            <div className="mt-2 text-base font-semibold text-white">
                              {selectedAsset.title}
                            </div>
                            <div className="text-xs text-gray-400">
                              {selectedAsset.subtitle}
                            </div>
                            <p className="mt-3 text-xs leading-relaxed text-gray-300">
                              {selectedAsset.summary}
                            </p>
                            <div className="mt-4 flex gap-2">
                              <button
                                onClick={() => router.push(selectedAsset.href)}
                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-geo-gold/30 bg-geo-gold/10 px-3 py-2 text-xs font-semibold text-geo-gold"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Open report
                              </button>
                              <button
                                onClick={clearSelectedAsset}
                                className="rounded-xl border border-white/10 px-3 py-2 text-xs text-gray-300"
                              >
                                Clear
                              </button>
                            </div>
                          </div>
                        ) : showDetail && selectedEvent ? (
                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded border border-geo-gold/30 bg-geo-gold/10 px-2 py-0.5 text-[10px] font-mono uppercase text-geo-gold">
                                {selectedEvent.category}
                              </span>
                              <span className="text-[10px] font-mono text-gray-500">
                                {selectedEvent.source}
                              </span>
                            </div>
                            <div className="mt-2 text-base font-semibold text-white">
                              {selectedEvent.title}
                            </div>
                            {selectedEvent.description && (
                              <p className="mt-3 text-xs leading-relaxed text-gray-300">
                                {selectedEvent.description}
                              </p>
                            )}
                            <div className="mt-4 flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  router.push(
                                    buildEventReportHref(selectedEvent),
                                  )
                                }
                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-geo-gold/30 bg-geo-gold/10 px-3 py-2 text-xs font-semibold text-geo-gold"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                Open report
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowDetail(false);
                                  setSelectedEvent(null);
                                }}
                                className="rounded-xl border border-white/10 px-3 py-2 text-xs text-gray-300"
                              >
                                Clear
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-center text-sm text-gray-500">
                            Tap an event, aircraft, or vessel on the globe to
                            inspect it here.
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Globe stats overlay (bottom-center) — Vision Pro glass */}
          {!apertureActive && !isCompactLayout && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <div className="bg-black/40 backdrop-blur-2xl border border-white/[0.08] rounded-2xl px-5 py-2.5 flex items-center gap-3 shadow-xl shadow-black/20">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <Globe2 className="w-3.5 h-3.5 text-geo-gold" />
                  <span className="font-mono">
                    {allEvents.filter((e) => e.locations.length > 0).length}{" "}
                    plotted
                  </span>
                </div>
                <div className="w-px h-3 bg-white/10" />
                <div className="flex items-center gap-1.5 text-[10px] text-cyan-400">
                  <Plane className="w-3.5 h-3.5" />
                  <span className="font-mono">
                    {aircraftData.length} aircraft
                  </span>
                </div>
                <div className="w-px h-3 bg-white/10" />
                <div className="flex items-center gap-1.5 text-[10px] text-orange-400">
                  <Ship className="w-3.5 h-3.5" />
                  <span className="font-mono">{realShipData.length} real AIS vessels</span>
                </div>
                <div className="w-px h-3 bg-white/10" />
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span className="font-mono">{osintEvents.length} OSINT</span>
                </div>
                <div className="w-px h-3 bg-white/10" />
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <Newspaper className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-mono">
                    {articleEvents.length} intel
                  </span>
                </div>
              </div>
            </div>
          )}

          {!apertureActive && !isCompactLayout && selectedAsset && (
            <div className="absolute right-4 bottom-20 w-[320px] max-w-[calc(100vw-2rem)]">
              <div className="rounded-2xl border border-white/10 bg-black/70 backdrop-blur-2xl p-4 shadow-2xl shadow-black/40">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-geo-gold">
                      {selectedAsset.kind === "aircraft"
                        ? "Aircraft Selected"
                        : "Vessel Selected"}
                    </div>
                    <div className="mt-1 text-base font-semibold text-white">
                      {selectedAsset.title}
                    </div>
                    <div className="text-xs text-gray-400">
                      {selectedAsset.subtitle}
                    </div>
                  </div>
                  <button
                    onClick={clearSelectedAsset}
                    className="rounded-lg border border-white/10 p-1.5 text-gray-500 transition-colors hover:text-white"
                    aria-label="Clear selected asset"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-gray-300">
                  {selectedAsset.summary}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => router.push(selectedAsset.href)}
                    className="inline-flex items-center gap-2 rounded-xl border border-geo-gold/30 bg-geo-gold/10 px-3 py-2 text-xs font-semibold text-geo-gold transition-colors hover:bg-geo-gold/20"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open report
                  </button>
                  <span className="text-[11px] text-gray-500">
                    Tap once to inspect, then open details explicitly.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ═══ SIDE NAVIGATION (3D mode desktop only) ══════ */}
        {!apertureActive && !isCompactLayout && (
          <div className="fixed left-0 top-1/2 -translate-y-1/2 z-40 pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-1"
            >
              {sideNavMinimized ? (
                <button
                  onClick={() => setSideNavMinimized(false)}
                  className="rounded-r-xl border border-white/10 border-l-0 bg-black/80 backdrop-blur-2xl px-2.5 py-4 text-gray-400 hover:text-geo-gold transition-colors shadow-2xl flex flex-col items-center gap-2 group"
                  title="Open section navigation"
                >
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  <span className="[writing-mode:vertical-lr] text-[9px] font-mono tracking-widest text-gray-500 uppercase group-hover:text-geo-gold">
                    Sections
                  </span>
                </button>
              ) : (
                <div className="rounded-r-2xl border border-white/15 border-l-0 bg-black/85 backdrop-blur-2xl p-2 shadow-2xl shadow-black/80 max-w-[210px]">
                  <div className="flex items-center justify-between px-2 pb-2 border-b border-white/10">
                    <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-geo-gold font-bold">
                      Sections
                    </span>
                    <button
                      onClick={() => setSideNavMinimized(true)}
                      className="text-gray-500 hover:text-white transition-colors p-0.5"
                      title="Minimize"
                    >
                      <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-0.5 pt-1.5">
                    {SIDE_NAV_SECTIONS.map((section) => {
                      const Icon = section.icon;
                      const isActive = activeSection === section.id;
                      return (
                        <button
                          key={section.id}
                          onClick={() => scrollToSection(section.id)}
                          className={`
                            flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-all group
                            ${isActive
                              ? "bg-geo-gold/15 border border-geo-gold/40 text-geo-gold font-semibold shadow-sm"
                              : "border border-transparent text-gray-400 hover:text-gray-100 hover:bg-white/5"
                            }
                          `}
                        >
                          <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-geo-gold" : "text-gray-500 group-hover:text-gray-300"}`} />
                          <span className="text-[10px] leading-tight truncate">
                            {section.label}
                          </span>
                          {isActive && (
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-geo-gold animate-pulse shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* ═══ DASHBOARD GRID LAYER ═════════════════════════ */}
        <div className="mt-6 flex flex-col gap-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <div id="risk-indices" className="scroll-mt-[140px]">
              <RiskIndicesWidget data={liveRiskIndices} />
            </div>
            <div id="chokepoints" className="scroll-mt-[140px]">
              <ChokepointsWidget
                data={chokepointMetrics}
                onChokepointClick={handleChokepointClick}
              />
            </div>
            <div id="asset-tracking" className="scroll-mt-[140px]">
              <AssetTrackingWidget data={trackedAssets} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6">
            <div id="country-briefs" className="scroll-mt-[140px]">
              <CountryBriefsWidget data={liveCountryBriefs} />
            </div>
          </div>
        </div>

        {/* ═══ RIGHT: EVENT DETAIL PANEL ════════════════════ */}
        <AnimatePresence>
          {!isCompactLayout && showDetail && selectedEvent && (
            <motion.div
              initial={{ x: 24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 24, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-y-4 right-4 z-20 w-[380px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-3xl border border-white/10 bg-black/80 shadow-2xl shadow-black/40 backdrop-blur-xl"
            >
              <div className="flex h-full w-[380px] max-w-full flex-col">
                {/* Header */}
                <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
                  <div className="text-xs font-mono text-geo-gold tracking-wider">
                    EVENT DETAIL
                  </div>
                  <button
                    onClick={() => {
                      setShowDetail(false);
                      setSelectedEvent(null);
                    }}
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-geo-gold/10 text-geo-gold border border-geo-gold/30 uppercase">
                      {selectedEvent.category}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {selectedEvent.source}
                    </span>
                    {selectedEvent.threatScore && (
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          selectedEvent.threatScore >= 70
                            ? "text-red-400 bg-red-500/10 border-red-500/30"
                            : selectedEvent.threatScore >= 50
                              ? "text-orange-400 bg-orange-500/10 border-orange-500/30"
                              : "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
                        }`}
                      >
                        THREAT: {selectedEvent.threatScore}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-white leading-snug">
                    {selectedEvent.title}
                  </h3>

                  {/* Description */}
                  {selectedEvent.description && (
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {selectedEvent.description}
                    </p>
                  )}

                  {/* Metadata grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-[9px] text-gray-500 uppercase mb-1">
                        Source
                      </div>
                      <div className="text-xs text-white">
                        {selectedEvent.sourceDetail || selectedEvent.source}
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-[9px] text-gray-500 uppercase mb-1">
                        Region
                      </div>
                      <div className="text-xs text-white">
                        {selectedEvent.region}
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-[9px] text-gray-500 uppercase mb-1">
                        Time
                      </div>
                      <div className="text-xs text-white">
                        {new Date(selectedEvent.timestamp).toLocaleString()}
                      </div>
                    </div>
                    {selectedEvent.locations.length > 0 && (
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-[9px] text-gray-500 uppercase mb-1">
                          Locations
                        </div>
                        <div className="text-xs text-white capitalize">
                          {selectedEvent.locations
                            .map((l) => l.name)
                            .join(", ")}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Social engagement */}
                  {selectedEvent.engagement && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-[9px] text-gray-500 uppercase mb-2">
                        Social Signal Strength
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-sm">
                          <ArrowUp className="w-4 h-4 text-orange-400" />
                          <span className="font-bold text-white">
                            {selectedEvent.engagement.upvotes.toLocaleString()}
                          </span>
                          <span className="text-gray-500 text-xs">upvotes</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm">
                          <MessageSquare className="w-4 h-4 text-blue-400" />
                          <span className="font-bold text-white">
                            {selectedEvent.engagement.comments.toLocaleString()}
                          </span>
                          <span className="text-gray-500 text-xs">
                            comments
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Threat gauge */}
                  {selectedEvent.threatScore && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-[9px] text-gray-500 uppercase mb-2">
                        Threat Assessment
                      </div>
                      <div className="h-3 bg-white/5 rounded-full overflow-hidden mb-2">
                        <div
                          className={`h-full rounded-full ${
                            selectedEvent.threatScore >= 70
                              ? "bg-gradient-to-r from-red-600 to-red-400"
                              : selectedEvent.threatScore >= 50
                                ? "bg-gradient-to-r from-orange-600 to-orange-400"
                                : "bg-gradient-to-r from-yellow-600 to-yellow-400"
                          }`}
                          style={{ width: `${selectedEvent.threatScore}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-gray-600 font-mono">
                        <span>LOW</span>
                        <span>MODERATE</span>
                        <span>CRITICAL</span>
                      </div>
                    </div>
                  )}

                  {/* CTA Link */}
                  <button
                    type="button"
                    onClick={() =>
                      router.push(buildEventReportHref(selectedEvent))
                    }
                    className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-medium transition-all"
                  >
                    <FileText className="w-4 h-4 text-geo-gold" />
                    Open Event Report
                  </button>

                  {(selectedEvent.link || selectedEvent.url) && (
                    <Link
                      href={selectedEvent.link || selectedEvent.url || "#"}
                      target={selectedEvent.url ? "_blank" : undefined}
                      rel={
                        selectedEvent.url ? "noopener noreferrer" : undefined
                      }
                      className="flex items-center justify-center gap-2 w-full py-3 bg-geo-gold/10 hover:bg-geo-gold/20 border border-geo-gold/30 rounded-xl text-geo-gold text-sm font-medium transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {selectedEvent.source === "geomoney"
                        ? "Read Full Article"
                        : "View Source"}
                    </Link>
                  )}

                  {/* Related Articles Funnel */}
                  {articleEvents.length > 0 &&
                    selectedEvent.source !== "geomoney" && (
                      <div>
                        <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-2 mt-2">
                          RELATED INTELLIGENCE
                        </div>
                        <div className="space-y-2">
                          {articleEvents.slice(0, 5).map((article) => (
                            <Link
                              key={article.id}
                              href={article.link || "#"}
                              className="block bg-white/5 hover:bg-white/10 rounded-lg p-3 transition-colors group"
                            >
                              <div className="flex items-start gap-3">
                                {article.imageUrl && (
                                  <img
                                    src={article.imageUrl}
                                    alt=""
                                    className="w-12 h-12 rounded object-cover shrink-0"
                                  />
                                )}
                                <div className="min-w-0">
                                  <p className="text-xs text-gray-300 line-clamp-2 group-hover:text-white transition-colors">
                                    {article.title}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9px] text-geo-gold font-mono">
                                      {article.category}
                                    </span>
                                    <span className="text-[9px] text-gray-600">
                                      {article.sourceDetail}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                        <Link
                          href="/news"
                          className="flex items-center justify-center gap-1.5 mt-3 text-xs text-geo-gold hover:text-geo-gold/80 transition-colors"
                        >
                          View all intelligence{" "}
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
