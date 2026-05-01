"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  Satellite,
  Terminal,
  Landmark,
  Factory,
  TrendingUp,
  TrendingDown,
  Activity,
  MapPin,
  ArrowUp,
  MessageSquare,
  Newspaper,
  Flame,
  Cpu,
  Wifi,
  Timer,
  Flag,
  Ban,
  Atom,
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
  ShieldAlert,
} from "lucide-react";
import OsintFeed from "@/components/OsintFeed";
import type { Webcam } from "@/lib/world-monitor-geo";
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
const THREAT_LEVELS = [
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
    dailyTraffic: "21M bbl/day",
    percentGlobal: "21%",
    status: "Elevated",
    risk: 72,
    lat: 26.5,
    lng: 56.2,
    radiusKm: 450,
  },
  {
    name: "Strait of Malacca",
    dailyTraffic: "16M bbl/day",
    percentGlobal: "25% trade",
    status: "Moderate",
    risk: 45,
    lat: 2.5,
    lng: 101.5,
    radiusKm: 500,
  },
  {
    name: "Suez Canal",
    dailyTraffic: "9.4M bbl/day",
    percentGlobal: "12%",
    status: "Disrupted",
    risk: 68,
    lat: 30.4,
    lng: 32.3,
    radiusKm: 400,
  },
  {
    name: "Bab el-Mandeb",
    dailyTraffic: "6.2M bbl/day",
    percentGlobal: "9%",
    status: "Critical",
    risk: 85,
    lat: 12.5,
    lng: 43.3,
    radiusKm: 400,
  },
  {
    name: "Panama Canal",
    dailyTraffic: "0.9M bbl/day",
    percentGlobal: "5% trade",
    status: "Constrained",
    risk: 55,
    lat: 9,
    lng: -79.6,
    radiusKm: 350,
  },
  {
    name: "Taiwan Strait",
    dailyTraffic: "N/A",
    percentGlobal: "88% adv chips",
    status: "Watched",
    risk: 62,
    lat: 24,
    lng: 119.5,
    radiusKm: 500,
  },
  {
    name: "GIUK Gap",
    dailyTraffic: "N/A",
    percentGlobal: "NATO Atlantic",
    status: "Active",
    risk: 38,
    lat: 63,
    lng: -15,
    radiusKm: 600,
  },
  {
    name: "Bosporus Strait",
    dailyTraffic: "3.3M bbl/day",
    percentGlobal: "3%",
    status: "Stable",
    risk: 30,
    lat: 41.1,
    lng: 29,
    radiusKm: 300,
  },
];

const AI_QUICK_QUERIES = [
  "How many ships are stranded in the Strait of Hormuz right now?",
  "Which chokepoint has the heaviest vessel density currently?",
  "Show the current military aircraft posture around the Middle East.",
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

// ─── ASSET TRACKING ─────────────────────────────────────────
const TRACKED_ASSETS = [
  { type: "Naval", icon: Ship, active: 187, total: 342 },
  { type: "Aerial", icon: Plane, active: 438, total: 1205 },
  { type: "Satellite", icon: Satellite, active: 89, total: 89 },
  { type: "Ground", icon: Factory, active: 1120, total: 2840 },
  { type: "Cyber", icon: Terminal, active: 15600, total: 15600 },
  { type: "Financial", icon: Landmark, active: 4200, total: 4200 },
];

// ─── SIGINT FEEDS ───────────────────────────────────────────
const SIGINT_FEEDS = [
  {
    source: "COMMS INTERCEPT",
    region: "Persian Gulf",
    freq: "HF-4.72MHz",
    classification: "CRITICAL",
    time: "2m ago",
    detail: "Iranian naval comms surge - IRGC fleet repositioning detected",
  },
  {
    source: "ELINT DETECTION",
    region: "South China Sea",
    freq: "X-Band Radar",
    classification: "HIGH",
    time: "8m ago",
    detail: "PLA-N fire-control radar active near Scarborough Shoal",
  },
  {
    source: "CYBER SIGINT",
    region: "Eastern Europe",
    freq: "TCP/443",
    classification: "ELEVATED",
    time: "14m ago",
    detail: "APT29 C2 infrastructure rotation - new domains registered",
  },
  {
    source: "SAT COMMS",
    region: "Horn of Africa",
    freq: "Ku-Band",
    classification: "HIGH",
    time: "22m ago",
    detail: "Houthi-affiliated SATPHONE traffic spike near Bab el-Mandeb",
  },
  {
    source: "COMMS INTERCEPT",
    region: "Baltic Sea",
    freq: "VHF-156.8MHz",
    classification: "MODERATE",
    time: "31m ago",
    detail: "Russian Baltic Fleet routine encrypted comms - pattern normal",
  },
  {
    source: "ELINT DETECTION",
    region: "Taiwan Strait",
    freq: "S-Band",
    classification: "HIGH",
    time: "45m ago",
    detail: "PLA air defense radar network activation - possible drill",
  },
  {
    source: "OSINT FUSION",
    region: "Arctic",
    freq: "AIS Blackout",
    classification: "ELEVATED",
    time: "1h ago",
    detail:
      "3 vessels AIS dark in Northern Sea Route - suspected sanctions evasion",
  },
  {
    source: "CYBER SIGINT",
    region: "Middle East",
    freq: "DNS/53",
    classification: "CRITICAL",
    time: "1h ago",
    detail: "Critical infrastructure probing from Iranian IP ranges detected",
  },
];

// ─── SANCTIONS TRACKER ──────────────────────────────────────
const SANCTIONS_DATA = [
  {
    entity: "Russia",
    type: "Country",
    packages: 14,
    sectors: "Energy, Finance, Tech",
    status: "Active",
    impact: 89,
    lastUpdate: "2d ago",
  },
  {
    entity: "Iran",
    type: "Country",
    packages: 8,
    sectors: "Oil, Nuclear, Military",
    status: "Escalating",
    impact: 92,
    lastUpdate: "1d ago",
  },
  {
    entity: "China (select)",
    type: "Sectoral",
    packages: 5,
    sectors: "Chips, AI, Quantum",
    status: "Active",
    impact: 76,
    lastUpdate: "5d ago",
  },
  {
    entity: "North Korea",
    type: "Country",
    packages: 11,
    sectors: "Comprehensive",
    status: "Active",
    impact: 95,
    lastUpdate: "14d ago",
  },
  {
    entity: "Myanmar",
    type: "Targeted",
    packages: 3,
    sectors: "Military, Timber",
    status: "Active",
    impact: 42,
    lastUpdate: "30d ago",
  },
  {
    entity: "Venezuela",
    type: "Sectoral",
    packages: 4,
    sectors: "Oil, Gold, Finance",
    status: "Partial lift",
    impact: 55,
    lastUpdate: "7d ago",
  },
];

// ─── COUNTRY BRIEFS ─────────────────────────────────────────
const COUNTRY_BRIEFS = [
  {
    country: "Iran",
    flag: "🇮🇷",
    threat: 88,
    stability: 22,
    brief:
      "Active conflict with US naval blockade. IRGC fast boat deployments. Nuclear program at 83.7% enrichment.",
    hotTopics: ["Blockade", "Nuclear", "Proxy War"],
  },
  {
    country: "China",
    flag: "🇨🇳",
    threat: 72,
    stability: 68,
    brief:
      "South China Sea tensions elevated. Taiwan Strait patrol frequency up 40%. Economic slowdown pressures.",
    hotTopics: ["Taiwan", "SCS", "Trade War"],
  },
  {
    country: "Russia",
    flag: "🇷🇺",
    threat: 78,
    stability: 45,
    brief:
      "Ukraine conflict ongoing Day 1510+. Arctic militarization. Sanctions evasion through shadow fleet.",
    hotTopics: ["Ukraine", "Arctic", "Sanctions"],
  },
  {
    country: "Ukraine",
    flag: "🇺🇦",
    threat: 85,
    stability: 35,
    brief:
      "Active conflict. Counteroffensive operations in eastern sectors. Critical infrastructure under drone attacks.",
    hotTopics: ["War", "Drones", "NATO Aid"],
  },
  {
    country: "Israel",
    flag: "🇮🇱",
    threat: 75,
    stability: 52,
    brief:
      "Multi-front security operations. Houthi missile threat persists. Northern border escalation risk.",
    hotTopics: ["Houthi", "Hezbollah", "Iran Proxy"],
  },
  {
    country: "North Korea",
    flag: "🇰🇵",
    threat: 68,
    stability: 55,
    brief:
      "ICBM testing cadence increased. Satellite launch preparations. Munitions exports to Russia confirmed.",
    hotTopics: ["ICBM", "Russia Aid", "Nuclear"],
  },
  {
    country: "Taiwan",
    flag: "🇹🇼",
    threat: 65,
    stability: 72,
    brief:
      "Cross-strait tensions high. TSMC export restrictions. US arms deliveries ongoing.",
    hotTopics: ["PLA Drills", "Chips", "Defense"],
  },
  {
    country: "India",
    flag: "🇮🇳",
    threat: 35,
    stability: 75,
    brief:
      "LAC tensions with China managed. Naval expansion in Indian Ocean. Energy diversification from Russia.",
    hotTopics: ["LAC", "Navy", "Energy"],
  },
];

// ─── NUCLEAR MONITOR ────────────────────────────────────────
const NUCLEAR_STATUS = [
  {
    state: "United States",
    warheads: 5044,
    deployed: 1770,
    status: "Steady",
    alert: "LOW",
    trend: "stable",
  },
  {
    state: "Russia",
    warheads: 5580,
    deployed: 1710,
    status: "Elevated",
    alert: "HIGH",
    trend: "up",
  },
  {
    state: "China",
    warheads: 500,
    deployed: 0,
    status: "Expanding",
    alert: "MODERATE",
    trend: "up",
  },
  {
    state: "France",
    warheads: 290,
    deployed: 280,
    status: "Steady",
    alert: "LOW",
    trend: "stable",
  },
  {
    state: "UK",
    warheads: 225,
    deployed: 120,
    status: "Steady",
    alert: "LOW",
    trend: "stable",
  },
  {
    state: "Pakistan",
    warheads: 170,
    deployed: 0,
    status: "Growing",
    alert: "MODERATE",
    trend: "up",
  },
  {
    state: "India",
    warheads: 172,
    deployed: 0,
    status: "Growing",
    alert: "MODERATE",
    trend: "up",
  },
  {
    state: "Israel",
    warheads: 90,
    deployed: 0,
    status: "Opaque",
    alert: "LOW",
    trend: "stable",
  },
  {
    state: "North Korea",
    warheads: 50,
    deployed: 0,
    status: "Testing",
    alert: "HIGH",
    trend: "up",
  },
  {
    state: "Iran",
    warheads: 0,
    deployed: 0,
    status: "Threshold",
    alert: "CRITICAL",
    trend: "up",
  },
];

// ─── RISK INDICES ───────────────────────────────────────────
const RISK_INDICES = [
  {
    name: "Conflict",
    value: 73,
    change: +4.2,
    color: "from-red-500 to-orange-500",
  },
  {
    name: "Economy",
    value: 58,
    change: -2.1,
    color: "from-yellow-500 to-amber-500",
  },
  {
    name: "Supply Chain",
    value: 44,
    change: -6.8,
    color: "from-orange-500 to-red-500",
  },
  {
    name: "Cyber",
    value: 81,
    change: +8.3,
    color: "from-purple-500 to-pink-500",
  },
  {
    name: "Energy",
    value: 52,
    change: +1.4,
    color: "from-blue-500 to-cyan-500",
  },
  {
    name: "Climate",
    value: 67,
    change: +3.7,
    color: "from-emerald-500 to-teal-500",
  },
];

// ─── THEATER REGIONS ────────────────────────────────────────
const REGIONS_SUMMARY = [
  { name: "INDOPACOM", threat: 4 },
  { name: "CENTCOM", threat: 4 },
  { name: "EUCOM", threat: 3 },
  { name: "AFRICOM", threat: 3 },
  { name: "NORTHCOM", threat: 2 },
  { name: "SOUTHCOM", threat: 2 },
  { name: "ARCTIC", threat: 3 },
];

const REGION_MAP: Record<string, string[]> = {
  INDOPACOM: ["Asia-Pacific"],
  CENTCOM: ["Middle East"],
  EUCOM: ["Europe"],
  AFRICOM: ["Africa"],
  NORTHCOM: ["North America"],
  SOUTHCOM: ["South America"],
  ARCTIC: ["Arctic"],
};

function computeThreatLevel(events: GlobeEvent[]) {
  if (events.length === 0) return THREAT_LEVELS[2];
  const avg =
    events.reduce((s, e) => s + (e.threatScore || 40), 0) / events.length;
  if (avg >= 75) return THREAT_LEVELS[4];
  if (avg >= 60) return THREAT_LEVELS[3];
  if (avg >= 45) return THREAT_LEVELS[2];
  if (avg >= 30) return THREAT_LEVELS[1];
  return THREAT_LEVELS[0];
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
    | "sigint"
    | "timeline"
    | "countries"
    | "sanctions"
    | "nuclear"
    | "climate"
    | "disease"
    | "cyber"
    | "aircraft"
    | "ships"
    | "ai-brief"
  >("feed");
  const [showDetail, setShowDetail] = useState(false);
  const [dataTimestamp, setDataTimestamp] = useState<string>("");

  // ─── NEW: Aircraft, Ships, AI Brief state ──────────────
  const [aircraftData, setAircraftData] = useState<AircraftData[]>([]);
  const [aircraftTotal, setAircraftTotal] = useState(0);
  const [aircraftUpdatedAt, setAircraftUpdatedAt] = useState<number | null>(
    null,
  );
  const [shipData, setShipData] = useState<ShipData[]>([]);
  const [shipTotal, setShipTotal] = useState(0);
  const [shipSource, setShipSource] = useState("Demo traffic model");
  const [shipDataLive, setShipDataLive] = useState(false);
  const [shipUpdatedAt, setShipUpdatedAt] = useState<number | null>(null);
  const [shipNotice, setShipNotice] = useState("");
  const [aiBrief, setAiBrief] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
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
      const [osintRes, eventsRes] = await Promise.all([
        fetch("/api/world-monitor/osint")
          .then((r) => r.json())
          .catch(() => ({ events: [] })),
        fetch("/api/world-monitor/events")
          .then((r) => r.json())
          .catch(() => ({ events: [] })),
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
      setDataTimestamp(new Date().toISOString());
    } catch (err) {
      console.error("World Monitor data fetch error:", err);
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
      if (!res.ok) return;
      const data = await res.json();
      setAircraftData(data.aircraft || []);
      setAircraftTotal(data.total || 0);
      setAircraftUpdatedAt(data.timestamp || Date.now());
    } catch (e) {
      console.warn("[Aircraft]", e);
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
      if (!res.ok) return;
      const data = await res.json();
      setShipData(data.ships || []);
      setShipTotal(data.total || 0);
      setShipSource(data.source || "Demo traffic model");
      setShipDataLive(Boolean(data.live));
      setShipUpdatedAt(data.timestamp || Date.now());
      setShipNotice(data.notice || "");
    } catch (e) {
      console.warn("[Ships]", e);
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
      setClimateData(data.events || []);
    } catch (e) {
      console.warn("[Climate]", e);
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
      setDiseaseData(data.events || []);
    } catch (e) {
      console.warn("[Disease]", e);
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
      setCyberData(data.events || []);
    } catch (e) {
      console.warn("[Cyber]", e);
    }
  }, []);

  useEffect(() => {
    fetchCyber();
    const id = setInterval(fetchCyber, 300_000);
    return () => clearInterval(id);
  }, [fetchCyber]);

  // ─── AI INTELLIGENCE BRIEF ──────────────────────────────
  const chokepointMetrics = useMemo(
    () =>
      CHOKEPOINTS.map((chokepoint) => {
        const vessels = shipData.filter((ship) =>
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

        return {
          ...chokepoint,
          vessels: vessels.length,
          strandedShips: strandedShips.length,
          aircraft: aircraft.length,
        };
      }).sort((left, right) => right.vessels - left.vessels),
    [aircraftData, shipData],
  );

  const trackedAssets = useMemo(
    () => [
      {
        type: "Naval",
        icon: Ship,
        active: shipData.length,
        total: Math.max(shipTotal, shipData.length),
      },
      {
        type: "Aerial",
        icon: Plane,
        active: aircraftData.length,
        total: Math.max(aircraftTotal, aircraftData.length),
      },
      ...TRACKED_ASSETS.slice(2),
    ],
    [aircraftData.length, aircraftTotal, shipData.length, shipTotal],
  );

  const assetContext = useMemo(
    () => ({
      aircraft: {
        visibleNow: aircraftData.length,
        totalTracked: aircraftTotal,
        source: "OpenSky Network",
      },
      vessels: {
        visibleNow: shipData.length,
        totalTracked: shipTotal,
        source: shipSource,
        live: shipDataLive,
        totalOnGlobe: shipData.length,
      },
      chokepoints: chokepointMetrics.slice(0, 8).map((chokepoint) => ({
        name: chokepoint.name,
        vessels: chokepoint.vessels,
        strandedShips: chokepoint.strandedShips,
        aircraft: chokepoint.aircraft,
      })),
      globalSummary: `${shipData.length} vessels visible on globe, ${aircraftData.length} aircraft tracked. Vessels in/near chokepoints: ${chokepointMetrics.reduce((s, c) => s + c.vessels, 0)}. Vessels currently slow/stopped: ${shipData.filter(s => s.speed <= 1).length}.`,
    }),
    [
      aircraftData.length,
      aircraftTotal,
      chokepointMetrics,
      shipData,
      shipDataLive,
      shipSource,
      shipTotal,
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
      try {
        const eventTitles = allEvents.slice(0, 15).map((e) => e.title);
        const res = await fetch("/api/world-monitor/ai-brief", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            events: eventTitles,
            query: query || "",
            assetContext,
          }),
        });
        if (!res.ok) throw new Error("AI brief failed");
        const data = await res.json();
        setAiBrief(data);
      } catch (e) {
        console.warn("[AI Brief]", e);
      } finally {
        setAiLoading(false);
      }
    },
    [allEvents, assetContext],
  );

  // Auto-fetch AI brief when events load
  useEffect(() => {
    if (allEvents.length > 0 && !aiBrief) {
      fetchAiBrief();
    }
  }, [allEvents.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const threatLevel = computeThreatLevel(osintEvents);

  const regionCounts = REGIONS_SUMMARY.map((r) => ({
    ...r,
    events: allEvents.filter((e) =>
      (REGION_MAP[r.name] || []).includes(e.region),
    ).length,
  }));

  const focusGlobeLocation = useCallback((target: GlobeFocusTarget) => {
    setApertureActive(false);
    setGlobeFocusTarget(target);
  }, []);

  const handleEventClick = useCallback(
    (event: GlobeEvent) => {
      setSelectedAircraft(null);
      setSelectedShip(null);
      setSelectedEvent(event);
      setShowDetail(true);
      setActivePanel("feed");

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
    },
    [focusGlobeLocation],
  );

  const handleAircraftClick = useCallback(
    (aircraft: AircraftData) => {
      setShowDetail(false);
      setSelectedEvent(null);
      setSelectedShip(null);
      setSelectedAircraft(aircraft);
      setActivePanel("aircraft");
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
      setShowDetail(false);
      setSelectedEvent(null);
      setSelectedAircraft(null);
      setSelectedShip(ship);
      setActivePanel("ships");
      focusGlobeLocation({
        key: `ship-${ship.mmsi}`,
        lat: ship.latitude,
        lng: ship.longitude,
        distance: 2.68,
        targetDepth: 0.85,
      });
    },
    [focusGlobeLocation],
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

  // ──────────────────────────────────────────────────────────
  return (
    <main className="relative flex h-dvh flex-col overflow-hidden pt-[104px] text-white sm:pt-[128px]">
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
                  <span className="text-white/80">World Monitor</span>
                </h1>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <div
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono ${threatLevel.bg} ${threatLevel.border}`}
            >
              <div
                className={`w-2 h-2 rounded-full ${threatLevel.pulse} animate-pulse`}
              />
              <span className={threatLevel.color}>
                THREATCON: {threatLevel.label}
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
          </div>
        </div>

        {/* Risk ticker bar */}
        <div className="px-4 py-1.5 border-t border-white/5 bg-black/40 flex items-center gap-4 overflow-x-auto">
          {RISK_INDICES.map((idx) => (
            <div key={idx.name} className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-gray-500 font-mono">
                {idx.name.toUpperCase()}
              </span>
              <span
                className={`text-xs font-bold font-mono ${getRiskColor(idx.value)}`}
              >
                {idx.value}
              </span>
              <span
                className={`text-[9px] font-mono ${idx.change > 0 ? "text-red-400" : "text-emerald-400"}`}
              >
                {idx.change > 0 ? "▲" : "▼"}
                {Math.abs(idx.change)}
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
      <div className="relative z-10 flex-1 flex overflow-hidden">
        {/* ICON SIDEBAR — Vision Pro glass */}
        <div className="absolute bottom-4 left-4 top-4 z-20 hidden w-[78px] flex-col gap-2 rounded-[28px] border border-white/[0.06] bg-black/60 px-2 py-3 shadow-2xl shadow-black/35 backdrop-blur-2xl xl:flex">
          {/* GeoMoney Aperture 2D Map Toggle */}
          <button
            onClick={() => setApertureActive(!apertureActive)}
            title="GeoMoney Aperture Street Map (2D)"
            className={`mb-1 flex w-full flex-col items-center gap-1 rounded-2xl px-2 py-3 text-center transition-all ${
              apertureActive
                ? "bg-cyan-400 text-black border border-cyan-300 shadow-lg shadow-cyan-500/30"
                : "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 hover:bg-cyan-500/30"
            }`}
          >
            <Map className="w-4 h-4 shrink-0" />
            <div className="flex flex-col items-center leading-none">
              <span className="text-[9px] font-bold tracking-[0.18em]">
                APERTURE
              </span>
              <span className="text-[8px] opacity-80">2D map</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setDesktopHudOpen((current) => !current)}
            title={
              desktopHudOpen ? "Collapse intel drawer" : "Open intel drawer"
            }
            className="flex w-full flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/5 px-2 py-3 text-center text-gray-300 transition-colors hover:border-geo-gold/30 hover:text-geo-gold"
          >
            <ChevronRight
              className={`h-4 w-4 transition-transform ${desktopHudOpen ? "rotate-180" : "rotate-0"}`}
            />
            <span className="text-[8px] font-medium tracking-[0.16em]">
              INTEL
            </span>
          </button>
          <div className="mb-1 h-px w-full bg-white/10" />
          {/* Panel tabs */}
          {[
            { key: "feed" as const, icon: Radio, label: "Feed" },
            {
              key: "chokepoints" as const,
              icon: Target,
              label: "Chokepoints",
            },
            {
              key: "aircraft" as const,
              icon: Plane,
              label: "Aircraft Tracker",
            },
            { key: "ships" as const, icon: Ship, label: "Ship Tracker" },
            { key: "assets" as const, icon: Crosshair, label: "Assets" },
            { key: "risks" as const, icon: BarChart3, label: "Risks" },
            { key: "sigint" as const, icon: Wifi, label: "SIGINT" },
            {
              key: "countries" as const,
              icon: Flag,
              label: "Country Briefs",
            },
            { key: "sanctions" as const, icon: Ban, label: "Sanctions" },
            { key: "nuclear" as const, icon: Atom, label: "Nuclear" },
            { key: "climate" as const, icon: Thermometer, label: "Climate" },
            { key: "disease" as const, icon: Bug, label: "Disease" },
            { key: "cyber" as const, icon: ShieldAlert, label: "Cyber" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActivePanel(tab.key);
                setDesktopHudOpen(true);
              }}
              title={tab.label}
              className={`flex w-full flex-col items-center gap-1 rounded-2xl px-2 py-3 text-center transition-all ${
                activePanel === tab.key
                  ? "bg-geo-gold/15 text-geo-gold shadow-lg shadow-geo-gold/5"
                  : "text-gray-600 hover:text-white hover:bg-white/5"
              }`}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              <span className="text-[9px] font-medium leading-tight">
                {tab.label}
              </span>
            </button>
          ))}
        </div>

        {/* LEFT PANEL — Vision Pro glass */}
        {desktopHudOpen && (
          <div className="absolute bottom-4 left-[106px] top-4 z-20 hidden w-[340px] overflow-hidden rounded-[30px] border border-white/[0.06] bg-black/78 shadow-2xl shadow-black/40 backdrop-blur-2xl xl:flex xl:flex-col">
            <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
              <div>
                <div className="text-[10px] font-mono tracking-[0.22em] text-geo-gold">
                  COMMAND DRAWER
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  Intel panels stay collapsible so the globe remains primary.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDesktopHudOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-gray-400 transition-colors hover:border-geo-gold/30 hover:text-geo-gold"
                aria-label="Close intel drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <AnimatePresence mode="wait">
              {activePanel === "feed" && (
                <motion.div
                  key="feed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <OsintFeed
                    events={allEvents}
                    selectedEvent={selectedEvent}
                    onEventSelect={handleEventClick}
                    isLoading={isLoading}
                  />
                </motion.div>
              )}

              {activePanel === "chokepoints" && (
                <motion.div
                  key="choke"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col h-full bg-black/60 backdrop-blur-xl border-l border-white/5"
                >
                  <div className="px-4 py-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-geo-gold" />
                      <h2 className="text-sm font-bold tracking-wide">
                        GLOBAL CHOKEPOINTS
                      </h2>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">
                      Critical maritime & strategic bottlenecks
                    </p>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                    {CHOKEPOINTS.map((cp) => (
                      <button
                        type="button"
                        key={cp.name}
                        onClick={() => handleChokepointClick(cp)}
                        className="w-full px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-white">
                            {cp.name}
                          </span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                              cp.risk >= 70
                                ? "text-red-400 bg-red-500/10 border-red-500/30"
                                : cp.risk >= 50
                                  ? "text-orange-400 bg-orange-500/10 border-orange-500/30"
                                  : cp.risk >= 30
                                    ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
                                    : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                            }`}
                          >
                            {cp.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-2">
                          <span>{cp.dailyTraffic}</span>
                          <span>{cp.percentGlobal} global</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${riskBarColor(cp.risk)}`}
                            style={{ width: `${cp.risk}%` }}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {activePanel === "assets" && (
                <motion.div
                  key="assets"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col h-full bg-black/60 backdrop-blur-xl border-l border-white/5"
                >
                  <div className="px-4 py-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Crosshair className="w-4 h-4 text-geo-gold" />
                      <h2 className="text-sm font-bold tracking-wide">
                        ASSET TRACKING
                      </h2>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">
                      Multi-domain surveillance systems
                    </p>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                    {trackedAssets.map((asset) => (
                      <div key={asset.type} className="px-4 py-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <asset.icon className="w-4 h-4 text-geo-gold" />
                            <span className="text-xs font-semibold text-white">
                              {asset.type}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400">
                            ACTIVE
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-2">
                          <span>{asset.active.toLocaleString()} active</span>
                          <span>{asset.total.toLocaleString()} total</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-geo-gold/60 rounded-full"
                            style={{
                              width: `${asset.total > 0 ? (asset.active / asset.total) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="px-4 py-4 bg-geo-gold/5">
                      <div className="text-[10px] text-gray-500 uppercase mb-1">
                        Total Active Monitoring
                      </div>
                      <div className="text-xl font-bold text-geo-gold font-mono">
                        {trackedAssets
                          .reduce((sum, asset) => sum + asset.active, 0)
                          .toLocaleString()}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activePanel === "risks" && (
                <motion.div
                  key="risks"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col h-full bg-black/60 backdrop-blur-xl border-l border-white/5"
                >
                  <div className="px-4 py-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-geo-gold" />
                      <h2 className="text-sm font-bold tracking-wide">
                        RISK INDICES
                      </h2>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                    {RISK_INDICES.map((idx) => (
                      <div key={idx.name} className="px-4 py-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-white">
                            {idx.name}
                          </span>
                          <span
                            className={`text-xs font-mono ${idx.change > 0 ? "text-red-400" : "text-emerald-400"}`}
                          >
                            {idx.change > 0 ? "▲" : "▼"} {Math.abs(idx.change)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`text-2xl font-bold font-mono ${getRiskColor(idx.value)}`}
                          >
                            {idx.value}
                          </span>
                          <span className="text-xs text-gray-600">/ 100</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${idx.color}`}
                            style={{ width: `${idx.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="px-4 py-4 bg-geo-gold/5">
                      <div className="text-[10px] text-gray-500 uppercase mb-1">
                        Composite Risk Index
                      </div>
                      <div className="text-3xl font-bold text-geo-gold font-mono">
                        {Math.round(
                          RISK_INDICES.reduce((s, i) => s + i.value, 0) /
                            RISK_INDICES.length,
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activePanel === "sigint" && (
                <motion.div
                  key="sigint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col h-full bg-black/60 backdrop-blur-xl border-l border-white/5"
                >
                  <div className="px-4 py-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-cyan-400" />
                      <h2 className="text-sm font-bold tracking-wide">
                        SIGNALS INTELLIGENCE
                      </h2>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">
                      COMINT \u2022 ELINT \u2022 CYBER \u2022 SATCOM intercepts
                    </p>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {SIGINT_FEEDS.map((sig, i) => (
                      <div
                        key={i}
                        className="px-4 py-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                              sig.classification === "CRITICAL"
                                ? "text-red-400 bg-red-500/10 border border-red-500/30"
                                : sig.classification === "HIGH"
                                  ? "text-orange-400 bg-orange-500/10 border border-orange-500/30"
                                  : sig.classification === "ELEVATED"
                                    ? "text-yellow-400 bg-yellow-500/10 border border-yellow-500/30"
                                    : "text-blue-400 bg-blue-500/10 border border-blue-500/30"
                            }`}
                          >
                            {sig.classification}
                          </span>
                          <span className="text-[9px] text-gray-600 font-mono">
                            {sig.time}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono text-cyan-400">
                            {sig.source}
                          </span>
                          <span className="text-[9px] text-gray-600">
                            \u2022
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {sig.region}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed mb-1.5">
                          {sig.detail}
                        </p>
                        <div className="text-[9px] font-mono text-gray-600">
                          FREQ: {sig.freq}
                        </div>
                      </div>
                    ))}
                    <div className="px-4 py-4 bg-cyan-500/5 border-t border-cyan-500/10">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                          <span className="text-[10px] text-cyan-400 font-mono">
                            {SIGINT_FEEDS.length} active intercepts
                          </span>
                        </div>
                        <div className="text-[9px] text-gray-600 font-mono">
                          {
                            SIGINT_FEEDS.filter(
                              (s) => s.classification === "CRITICAL",
                            ).length
                          }{" "}
                          critical
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activePanel === "countries" && (
                <motion.div
                  key="countries"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col h-full bg-black/60 backdrop-blur-xl border-l border-white/5"
                >
                  <div className="px-4 py-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4 text-geo-gold" />
                      <h2 className="text-sm font-bold tracking-wide">
                        COUNTRY BRIEFS
                      </h2>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">
                      Intelligence assessments &mdash; threat &amp; stability
                      indices
                    </p>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                    {COUNTRY_BRIEFS.map((cb) => (
                      <div
                        key={cb.country}
                        className="px-4 py-3 hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{cb.flag}</span>
                            <span className="text-xs font-bold text-white">
                              {cb.country}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-mono font-bold ${
                              cb.threat >= 80
                                ? "text-red-400"
                                : cb.threat >= 60
                                  ? "text-orange-400"
                                  : cb.threat >= 40
                                    ? "text-yellow-400"
                                    : "text-emerald-400"
                            }`}
                          >
                            THREAT: {cb.threat}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <div className="text-[9px] text-gray-600 uppercase">
                              Threat
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mt-1">
                              <div
                                className={`h-full rounded-full ${cb.threat >= 70 ? "bg-red-500" : cb.threat >= 50 ? "bg-orange-500" : "bg-yellow-500"}`}
                                style={{ width: `${cb.threat}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] text-gray-600 uppercase">
                              Stability
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mt-1">
                              <div
                                className={`h-full rounded-full ${cb.stability >= 60 ? "bg-emerald-500" : cb.stability >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                                style={{ width: `${cb.stability}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-relaxed mb-2">
                          {cb.brief}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {cb.hotTopics.map((topic) => (
                            <span
                              key={topic}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 font-mono"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activePanel === "sanctions" && (
                <motion.div
                  key="sanctions"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col h-full bg-black/60 backdrop-blur-xl border-l border-white/5"
                >
                  <div className="px-4 py-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Ban className="w-4 h-4 text-red-400" />
                      <h2 className="text-sm font-bold tracking-wide">
                        SANCTIONS TRACKER
                      </h2>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">
                      Active sanctions regimes &amp; economic warfare
                    </p>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                    {SANCTIONS_DATA.map((s) => (
                      <div
                        key={s.entity}
                        className="px-4 py-3 hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-white">
                            {s.entity}
                          </span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                              s.status === "Escalating"
                                ? "text-red-400 bg-red-500/10 border-red-500/30"
                                : s.status === "Active"
                                  ? "text-orange-400 bg-orange-500/10 border-orange-500/30"
                                  : "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
                            }`}
                          >
                            {s.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[10px] mb-2">
                          <div>
                            <div className="text-gray-600 text-[9px]">Type</div>
                            <div className="text-gray-400">{s.type}</div>
                          </div>
                          <div>
                            <div className="text-gray-600 text-[9px]">
                              Packages
                            </div>
                            <div className="text-gray-400 font-mono">
                              {s.packages}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600 text-[9px]">
                              Updated
                            </div>
                            <div className="text-gray-400">{s.lastUpdate}</div>
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-500 mb-2">
                          Sectors: {s.sectors}
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-[9px] mb-1">
                            <span className="text-gray-600">Impact Index</span>
                            <span
                              className={`font-mono font-bold ${s.impact >= 80 ? "text-red-400" : s.impact >= 60 ? "text-orange-400" : "text-yellow-400"}`}
                            >
                              {s.impact}/100
                            </span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${s.impact >= 80 ? "bg-red-500" : s.impact >= 60 ? "bg-orange-500" : "bg-yellow-500"}`}
                              style={{ width: `${s.impact}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="px-4 py-3 bg-red-500/5 border-t border-red-500/10">
                      <div className="text-[10px] text-gray-500 uppercase mb-1">
                        Total Active Regimes
                      </div>
                      <div className="text-xl font-bold text-red-400 font-mono">
                        {SANCTIONS_DATA.length}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activePanel === "nuclear" && (
                <motion.div
                  key="nuclear"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col h-full bg-black/60 backdrop-blur-xl border-l border-white/5"
                >
                  <div className="px-4 py-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Atom className="w-4 h-4 text-yellow-400" />
                      <h2 className="text-sm font-bold tracking-wide">
                        NUCLEAR MONITOR
                      </h2>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">
                      Global nuclear arsenal tracking &amp; proliferation
                    </p>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                    {NUCLEAR_STATUS.map((n) => (
                      <div
                        key={n.state}
                        className="px-4 py-3 hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-white">
                            {n.state}
                          </span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                              n.alert === "CRITICAL"
                                ? "text-red-400 bg-red-500/10 border-red-500/30 animate-pulse"
                                : n.alert === "HIGH"
                                  ? "text-orange-400 bg-orange-500/10 border-orange-500/30"
                                  : n.alert === "MODERATE"
                                    ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
                                    : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                            }`}
                          >
                            {n.alert}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[10px] mb-2">
                          <div>
                            <div className="text-gray-600 text-[9px]">
                              Total
                            </div>
                            <div className="text-gray-300 font-mono font-bold">
                              {n.warheads.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600 text-[9px]">
                              Deployed
                            </div>
                            <div className="text-gray-300 font-mono">
                              {n.deployed.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600 text-[9px]">
                              Status
                            </div>
                            <div
                              className={`${
                                n.status === "Expanding" ||
                                n.status === "Testing" ||
                                n.status === "Threshold"
                                  ? "text-red-400"
                                  : n.status === "Elevated" ||
                                      n.status === "Growing"
                                    ? "text-orange-400"
                                    : "text-emerald-400"
                              }`}
                            >
                              {n.status}
                            </div>
                          </div>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-yellow-500/70"
                            style={{
                              width: `${Math.min((n.warheads / 6000) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="px-4 py-3 bg-yellow-500/5 border-t border-yellow-500/10">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-[9px] text-gray-600 uppercase">
                            Global Warheads
                          </div>
                          <div className="text-lg font-bold text-yellow-400 font-mono">
                            {NUCLEAR_STATUS.reduce(
                              (s, n) => s + n.warheads,
                              0,
                            ).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] text-gray-600 uppercase">
                            Deployed
                          </div>
                          <div className="text-lg font-bold text-orange-400 font-mono">
                            {NUCLEAR_STATUS.reduce(
                              (s, n) => s + n.deployed,
                              0,
                            ).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ═══ CLIMATE HEAT MAP ═══════════════════════════ */}
              {activePanel === "climate" && (
                <motion.div
                  key="climate"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col h-full bg-black/60 backdrop-blur-xl border-l border-white/5"
                >
                  <div className="px-4 py-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-orange-400" />
                      <h2 className="text-sm font-bold tracking-wide">
                        CLIMATE HEAT MAP
                      </h2>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">
                      NASA EONET • Open-Meteo • GDACS — {climateData.length} active events
                    </p>
                  </div>
                  <div className="px-4 py-3 border-b border-white/5">
                    <div className="grid grid-cols-4 gap-2">
                      {["wildfire", "storm", "heat", "flood"].map((t) => {
                        const count = climateData.filter((e: any) => e.type === t).length;
                        const colors: Record<string, string> = { wildfire: "text-red-400", storm: "text-purple-400", heat: "text-orange-400", flood: "text-blue-400" };
                        return (
                          <div key={t} className="text-center">
                            <div className={`text-lg font-bold font-mono ${colors[t] || "text-gray-400"}`}>{count}</div>
                            <div className="text-[8px] uppercase text-gray-500">{t}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                    {climateData.length === 0 && (
                      <div className="px-4 py-8 text-center text-gray-600 text-xs">Loading climate data...</div>
                    )}
                    {climateData.map((event: any) => {
                      const typeColors: Record<string, string> = {
                        wildfire: "border-red-500/30 bg-red-500/10 text-red-400",
                        storm: "border-purple-500/30 bg-purple-500/10 text-purple-400",
                        heat: "border-orange-500/30 bg-orange-500/10 text-orange-400",
                        drought: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
                        flood: "border-blue-500/30 bg-blue-500/10 text-blue-400",
                        volcano: "border-red-500/30 bg-red-500/10 text-red-300",
                        earthquake: "border-amber-500/30 bg-amber-500/10 text-amber-400",
                        ice: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
                      };
                      return (
                        <div key={event.id} className="px-4 py-3 hover:bg-white/[0.02] transition-colors">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${typeColors[event.type] || "border-gray-500/30 bg-gray-500/10 text-gray-400"}`}>
                              {event.type.toUpperCase()}
                            </span>
                            <span className={`text-[9px] font-mono ${event.severity >= 70 ? "text-red-400" : event.severity >= 50 ? "text-yellow-400" : "text-emerald-400"}`}>
                              SEV {event.severity}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-white mt-1 line-clamp-2">{event.title}</div>
                          <div className="text-[10px] text-gray-500 mt-1">{event.region} • {event.source}</div>
                          <div className="w-full bg-white/5 rounded-full h-1 mt-2">
                            <div className={`h-1 rounded-full ${event.severity >= 70 ? "bg-red-500" : event.severity >= 50 ? "bg-yellow-500" : "bg-emerald-500"}`} style={{ width: `${event.severity}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* ═══ DISEASE OUTBREAK MAP ═══════════════════════ */}
              {activePanel === "disease" && (
                <motion.div
                  key="disease"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col h-full bg-black/60 backdrop-blur-xl border-l border-white/5"
                >
                  <div className="px-4 py-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Bug className="w-4 h-4 text-green-400" />
                      <h2 className="text-sm font-bold tracking-wide">
                        DISEASE OUTBREAK MAP
                      </h2>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">
                      WHO DON • ProMED • disease.sh — {diseaseData.length} tracked outbreaks
                    </p>
                  </div>
                  <div className="px-4 py-3 border-b border-white/5">
                    <div className="grid grid-cols-3 gap-2">
                      {["outbreak", "epidemic", "alert"].map((t) => {
                        const count = diseaseData.filter((e: any) => e.type === t).length;
                        const colors: Record<string, string> = { outbreak: "text-red-400", epidemic: "text-orange-400", alert: "text-yellow-400" };
                        return (
                          <div key={t} className="text-center">
                            <div className={`text-lg font-bold font-mono ${colors[t] || "text-gray-400"}`}>{count}</div>
                            <div className="text-[8px] uppercase text-gray-500">{t}s</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                    {diseaseData.length === 0 && (
                      <div className="px-4 py-8 text-center text-gray-600 text-xs">Loading disease data...</div>
                    )}
                    {diseaseData.map((event: any) => {
                      const typeColors: Record<string, string> = {
                        pandemic: "border-red-500/30 bg-red-500/15 text-red-400",
                        epidemic: "border-orange-500/30 bg-orange-500/10 text-orange-400",
                        outbreak: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
                        alert: "border-amber-500/30 bg-amber-500/10 text-amber-400",
                        update: "border-blue-500/30 bg-blue-500/10 text-blue-400",
                      };
                      return (
                        <div key={event.id} className="px-4 py-3 hover:bg-white/[0.02] transition-colors">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${typeColors[event.type] || "border-gray-500/30 bg-gray-500/10 text-gray-400"}`}>
                              {event.type.toUpperCase()}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono text-green-400">{event.pathogen}</span>
                              <span className={`text-[9px] font-mono ${event.severity >= 70 ? "text-red-400" : event.severity >= 50 ? "text-yellow-400" : "text-emerald-400"}`}>
                                SEV {event.severity}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs font-semibold text-white mt-1 line-clamp-2">{event.title}</div>
                          <div className="text-[10px] text-gray-500 mt-1">
                            {event.country} • {event.region} • {event.source}
                          </div>
                          {(event.cases || event.deaths) && (
                            <div className="flex gap-3 mt-2">
                              {event.cases && (
                                <span className="text-[9px] text-orange-400 font-mono">
                                  {event.cases.toLocaleString()} cases
                                </span>
                              )}
                              {event.deaths && (
                                <span className="text-[9px] text-red-400 font-mono">
                                  {event.deaths.toLocaleString()} deaths
                                </span>
                              )}
                            </div>
                          )}
                          <div className="w-full bg-white/5 rounded-full h-1 mt-2">
                            <div className={`h-1 rounded-full ${event.severity >= 70 ? "bg-red-500" : event.severity >= 50 ? "bg-yellow-500" : "bg-emerald-500"}`} style={{ width: `${event.severity}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* ═══ CYBER WARFARE GRID ═════════════════════════ */}
              {activePanel === "cyber" && (
                <motion.div
                  key="cyber"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col h-full bg-black/60 backdrop-blur-xl border-l border-white/5"
                >
                  <div className="px-4 py-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-purple-400" />
                      <h2 className="text-sm font-bold tracking-wide">
                        CYBER WARFARE GRID
                      </h2>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">
                      CVE/CIRCL • CISA KEV • Threat OSINT — {cyberData.length} threats
                    </p>
                  </div>
                  <div className="px-4 py-3 border-b border-white/5">
                    <div className="grid grid-cols-4 gap-2">
                      {["exploit", "ransomware", "vulnerability", "breach"].map((t) => {
                        const count = cyberData.filter((e: any) => e.type === t).length;
                        const colors: Record<string, string> = { exploit: "text-red-400", ransomware: "text-orange-400", vulnerability: "text-yellow-400", breach: "text-purple-400" };
                        return (
                          <div key={t} className="text-center">
                            <div className={`text-lg font-bold font-mono ${colors[t] || "text-gray-400"}`}>{count}</div>
                            <div className="text-[8px] uppercase text-gray-500">{t}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                    {cyberData.length === 0 && (
                      <div className="px-4 py-8 text-center text-gray-600 text-xs">Loading cyber threat data...</div>
                    )}
                    {cyberData.map((event: any) => {
                      const typeColors: Record<string, string> = {
                        exploit: "border-red-500/30 bg-red-500/10 text-red-400",
                        ransomware: "border-orange-500/30 bg-orange-500/10 text-orange-400",
                        vulnerability: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
                        apt: "border-purple-500/30 bg-purple-500/10 text-purple-400",
                        ddos: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
                        breach: "border-pink-500/30 bg-pink-500/10 text-pink-400",
                        phishing: "border-amber-500/30 bg-amber-500/10 text-amber-400",
                        infrastructure: "border-red-500/30 bg-red-500/15 text-red-300",
                      };
                      return (
                        <a
                          key={event.id}
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block px-4 py-3 hover:bg-white/[0.02] transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${typeColors[event.type] || "border-gray-500/30 bg-gray-500/10 text-gray-400"}`}>
                              {event.type.toUpperCase()}
                            </span>
                            <div className="flex items-center gap-2">
                              {event.cveId && (
                                <span className="text-[9px] font-mono text-cyan-400">{event.cveId}</span>
                              )}
                              <span className={`text-[9px] font-mono ${event.severity >= 75 ? "text-red-400" : event.severity >= 50 ? "text-yellow-400" : "text-emerald-400"}`}>
                                SEV {event.severity}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs font-semibold text-white mt-1 line-clamp-2">{event.title}</div>
                          <div className="text-[10px] text-gray-500 mt-1 line-clamp-2">
                            {event.description}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[9px] text-gray-600">{event.source}</span>
                            {event.targetSector && (
                              <span className="text-[9px] font-mono text-purple-400/70">TARGET: {event.targetSector}</span>
                            )}
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-1 mt-2">
                            <div className={`h-1 rounded-full ${event.severity >= 75 ? "bg-red-500" : event.severity >= 50 ? "bg-yellow-500" : "bg-emerald-500"}`} style={{ width: `${event.severity}%` }} />
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* ═══ AIRCRAFT TRACKER ═══════════════════════════ */}
              {activePanel === "aircraft" && (
                <motion.div
                  key="aircraft"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col h-full bg-black/60 backdrop-blur-xl border-l border-white/5"
                >
                  <div className="px-4 py-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Plane className="w-4 h-4 text-cyan-400" />
                      <h2 className="text-sm font-bold tracking-wide">
                        AIRCRAFT RADAR
                      </h2>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">
                      Live OpenSky Network • {aircraftTotal.toLocaleString()}{" "}
                      tracked globally
                    </p>
                  </div>
                  <div className="px-4 py-3 border-b border-white/5">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3">
                        <div className="text-[9px] text-gray-500 uppercase">
                          In Flight
                        </div>
                        <div className="text-xl font-bold text-cyan-400 font-mono">
                          {aircraftData.length.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-3">
                        <div className="text-[9px] text-gray-500 uppercase">
                          Military
                        </div>
                        <div className="text-xl font-bold text-orange-400 font-mono">
                          {
                            aircraftData.filter(
                              (a) => a.category === "military",
                            ).length
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-2 border-b border-white/5">
                    <div className="flex items-center justify-between text-[9px] font-mono text-gray-600">
                      <span>CATEGORY</span>
                      <span>COUNT</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                    {[
                      {
                        cat: "commercial",
                        label: "Commercial",
                        color: "text-cyan-400",
                        icon: "✈",
                      },
                      {
                        cat: "cargo",
                        label: "Cargo / Freight",
                        color: "text-orange-400",
                        icon: "📦",
                      },
                      {
                        cat: "military",
                        label: "Military",
                        color: "text-red-400",
                        icon: "🎖",
                      },
                      {
                        cat: "private",
                        label: "Private / GA",
                        color: "text-green-400",
                        icon: "🛩",
                      },
                      {
                        cat: "unknown",
                        label: "Unidentified",
                        color: "text-gray-400",
                        icon: "❓",
                      },
                    ].map((c) => {
                      const count = aircraftData.filter(
                        (a) => a.category === c.cat,
                      ).length;
                      return (
                        <div
                          key={c.cat}
                          className="px-4 py-2.5 flex items-center justify-between hover:bg-white/[0.02]"
                        >
                          <div className="flex items-center gap-2">
                            <span>{c.icon}</span>
                            <span className={`text-xs ${c.color}`}>
                              {c.label}
                            </span>
                          </div>
                          <span className="text-xs font-mono text-gray-300">
                            {count.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                    <div className="px-4 py-3">
                      <div className="text-[9px] text-gray-600 uppercase mb-2">
                        Top Countries
                      </div>
                      {Object.entries(
                        aircraftData.reduce<Record<string, number>>(
                          (acc, a) => {
                            acc[a.origin_country] =
                              (acc[a.origin_country] || 0) + 1;
                            return acc;
                          },
                          {},
                        ),
                      )
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10)
                        .map(([country, count]) => (
                          <div
                            key={country}
                            className="flex items-center justify-between text-[10px] mb-1"
                          >
                            <span className="text-gray-400">{country}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-cyan-500/60 rounded-full"
                                  style={{
                                    width: `${Math.min((count / aircraftData.length) * 100 * 3, 100)}%`,
                                  }}
                                />
                              </div>
                              <span className="text-gray-500 font-mono w-8 text-right">
                                {count}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                    <div className="px-4 py-3 bg-cyan-500/5 border-t border-cyan-500/10">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-[10px] text-cyan-400 font-mono">
                          OPENSKY •{" "}
                          {aircraftUpdatedAt
                            ? new Date(aircraftUpdatedAt).toLocaleTimeString()
                            : "Awaiting sync"}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ═══ SHIP TRACKER ═══════════════════════════════ */}
              {activePanel === "ships" && (
                <motion.div
                  key="ships"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col h-full bg-black/60 backdrop-blur-xl border-l border-white/5"
                >
                  <div className="px-4 py-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Ship className="w-4 h-4 text-orange-400" />
                      <h2 className="text-sm font-bold tracking-wide">
                        MARITIME TRACKER
                      </h2>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">
                      {shipSource} • {shipTotal} vessels
                    </p>
                  </div>
                  <div className="px-4 py-3 border-b border-white/5">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {
                          label: "Tankers",
                          count: shipData.filter((s) => s.type === "tanker")
                            .length,
                          color: "text-orange-400",
                        },
                        {
                          label: "Container",
                          count: shipData.filter((s) => s.type === "container")
                            .length,
                          color: "text-emerald-400",
                        },
                        {
                          label: "Military",
                          count: shipData.filter((s) => s.type === "military")
                            .length,
                          color: "text-red-400",
                        },
                      ].map((s) => (
                        <div
                          key={s.label}
                          className="bg-white/5 rounded-lg p-2 text-center"
                        >
                          <div
                            className="text-lg font-bold font-mono"
                            style={{
                              color: s.color
                                .replace("text-", "")
                                .includes("orange")
                                ? "#fb923c"
                                : s.color.includes("emerald")
                                  ? "#34d399"
                                  : "#f87171",
                            }}
                          >
                            {s.count}
                          </div>
                          <div className="text-[8px] text-gray-500 uppercase">
                            {s.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                    {shipData.map((ship) => (
                      <button
                        type="button"
                        key={ship.mmsi}
                        onClick={() => handleShipClick(ship)}
                        className={`w-full px-4 py-3 text-left transition-colors ${selectedShip?.mmsi === ship.mmsi ? "bg-orange-500/10" : "hover:bg-white/[0.02]"}`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                ship.type === "military"
                                  ? "bg-red-500"
                                  : ship.type === "tanker"
                                    ? "bg-orange-500"
                                    : ship.type === "container"
                                      ? "bg-emerald-500"
                                      : ship.type === "lng"
                                        ? "bg-yellow-500"
                                        : ship.type === "cruise"
                                          ? "bg-purple-500"
                                          : "bg-blue-500"
                              }`}
                            />
                            <span className="text-xs font-bold text-white">
                              {ship.name}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono text-gray-500 uppercase">
                            {ship.type}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-500">
                          <div>
                            <span className="text-gray-600">Flag:</span>{" "}
                            <span>
                              {ship.flagEmoji} {ship.flag}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Speed:</span>{" "}
                            <span className="font-mono">
                              {ship.speed.toFixed(1)}kn
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Len:</span>{" "}
                            <span className="font-mono">{ship.length}m</span>
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-600 mt-1">
                          → {ship.destination}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="px-4 py-3 bg-orange-500/5 border-t border-orange-500/10">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${shipDataLive ? "bg-orange-400 animate-pulse" : "bg-yellow-400"}`}
                      />
                      <span
                        className={`text-[10px] font-mono ${shipDataLive ? "text-orange-400" : "text-yellow-300"}`}
                      >
                        {shipDataLive ? "LIVE AIS" : "DEMO COVERAGE"} •{" "}
                        {shipData.filter((s) => s.type === "military").length}{" "}
                        military tracked
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        <div className="flex-1 relative">
          {!isCompactLayout && !desktopHudOpen && (
            <div className="pointer-events-none absolute left-[106px] top-4 z-20 hidden xl:block">
              <button
                type="button"
                onClick={() => setDesktopHudOpen(true)}
                className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/65 px-4 py-2 text-[11px] font-medium text-white shadow-lg shadow-black/25 backdrop-blur-xl transition-colors hover:border-geo-gold/30 hover:text-geo-gold"
              >
                <Layers className="h-3.5 w-3.5" />
                Open intel drawer
              </button>
            </div>
          )}
          <div className="absolute inset-0">
            <WorldGlobe
              events={allEvents}
              onEventClick={handleEventClick}
              onAircraftClick={handleAircraftClick}
              onShipClick={handleShipClick}
              selectedEvent={selectedEvent}
              aircraft={aircraftData}
              ships={shipData}
              focusTarget={globeFocusTarget}
              onZoomChange={setZoomLevel}
            />
          </div>

          {/* GEOMONEY APERTURE 2D MAP OVERLAY */}
          {apertureActive && (
            <GodsEyeMap
              aircraft={aircraftData}
              ships={shipData}
              visible={apertureActive}
              onClose={() => setApertureActive(false)}
              selectedWebcam={selectedWebcam}
              onSelectWebcam={setSelectedWebcam}
            />
          )}

          {!apertureActive && !isCompactLayout && (
            <div className="pointer-events-none absolute right-4 top-4 z-10">
              <div className="pointer-events-auto flex w-[min(24rem,calc(100vw-8rem))] flex-col gap-3">
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
                      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-mono ${shipDataLive ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-yellow-500/30 bg-yellow-500/10 text-yellow-300"}`}
                    >
                      <Radar className="h-3.5 w-3.5" />
                      {shipDataLive ? "Live AIS" : "Demo AIS"}
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
                          {new Date(
                            aiBrief.timestamp || Date.now(),
                          ).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="mt-1 text-sm font-semibold text-white">
                        {aiBrief.headline}
                      </div>
                      {aiBrief.queryAnswer && aiBrief.isQueryResponse && (
                        <div className="mt-2 rounded-xl border border-geo-gold/20 bg-geo-gold/5 p-2.5">
                          <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-geo-gold/70 mb-1">ANSWER</div>
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
                          {aiBrief.hotspots.slice(0, 3).map((hs: any, i: number) => (
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
                </div>

                <div className="rounded-[26px] border border-white/[0.08] bg-black/58 p-4 shadow-xl shadow-black/20 backdrop-blur-2xl">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-mono tracking-[0.22em] text-gray-500">
                        LIVE ASSET COVERAGE
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
                        {shipData.length.toLocaleString()}
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
                              {shipData.length.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              {shipDataLive ? "Live AIS" : shipSource}
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
                                {new Date(
                                  aiBrief.timestamp || Date.now(),
                                ).toLocaleTimeString()}
                              </div>
                            </div>
                            <div className="mt-1 text-sm font-semibold text-white">
                              {aiBrief.headline}
                            </div>
                            {aiBrief.queryAnswer && aiBrief.isQueryResponse && (
                              <div className="mt-2 rounded-xl border border-geo-gold/20 bg-geo-gold/5 p-2.5">
                                <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-geo-gold/70 mb-1">ANSWER</div>
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
                                {aiBrief.hotspots.slice(0, 3).map((hs: any, i: number) => (
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
                  <span className="font-mono">{shipData.length} vessels</span>
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
