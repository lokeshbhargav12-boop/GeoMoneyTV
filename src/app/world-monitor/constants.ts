import { Ship, Plane, Satellite, Factory, Terminal, Landmark } from "lucide-react";

export const CHOKEPOINTS = [
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

export const TRACKED_ASSETS = [
  { type: "Naval", icon: Ship, active: 187, total: 342 },
  { type: "Aerial", icon: Plane, active: 438, total: 1205 },
  { type: "Satellite", icon: Satellite, active: 89, total: 89 },
  { type: "Ground", icon: Factory, active: 1120, total: 2840 },
  { type: "Cyber", icon: Terminal, active: 15600, total: 15600 },
  { type: "Financial", icon: Landmark, active: 4200, total: 4200 },
];

export const SIGINT_FEEDS = [
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
    detail: "3 vessels AIS dark in Northern Sea Route - suspected sanctions evasion",
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

export const SANCTIONS_DATA = [
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

export const COUNTRY_BRIEFS = [
  {
    country: "Iran",
    flag: "🇮🇷",
    threat: 88,
    stability: 22,
    brief: "Active conflict with US naval blockade. IRGC fast boat deployments. Nuclear program at 83.7% enrichment.",
    hotTopics: ["Blockade", "Nuclear", "Proxy War"],
  },
  {
    country: "China",
    flag: "🇨🇳",
    threat: 72,
    stability: 68,
    brief: "South China Sea tensions elevated. Taiwan Strait patrol frequency up 40%. Economic slowdown pressures.",
    hotTopics: ["Taiwan", "SCS", "Trade War"],
  },
  {
    country: "Russia",
    flag: "🇷🇺",
    threat: 78,
    stability: 45,
    brief: "Ukraine conflict ongoing Day 1510+. Arctic militarization. Sanctions evasion through shadow fleet.",
    hotTopics: ["Ukraine", "Arctic", "Sanctions"],
  },
  {
    country: "Ukraine",
    flag: "🇺🇦",
    threat: 85,
    stability: 35,
    brief: "Active conflict. Counteroffensive operations in eastern sectors. Critical infrastructure under drone attacks.",
    hotTopics: ["War", "Drones", "NATO Aid"],
  },
  {
    country: "Israel",
    flag: "🇮🇱",
    threat: 75,
    stability: 52,
    brief: "Multi-front security operations. Houthi missile threat persists. Northern border escalation risk.",
    hotTopics: ["Houthi", "Hezbollah", "Iran Proxy"],
  },
  {
    country: "North Korea",
    flag: "🇰🇵",
    threat: 68,
    stability: 55,
    brief: "ICBM testing cadence increased. Satellite launch preparations. Munitions exports to Russia confirmed.",
    hotTopics: ["ICBM", "Russia Aid", "Nuclear"],
  },
  {
    country: "Taiwan",
    flag: "🇹🇼",
    threat: 65,
    stability: 72,
    brief: "Cross-strait tensions high. TSMC export restrictions. US arms deliveries ongoing.",
    hotTopics: ["PLA Drills", "Chips", "Defense"],
  },
  {
    country: "India",
    flag: "🇮🇳",
    threat: 35,
    stability: 75,
    brief: "LAC tensions with China managed. Naval expansion in Indian Ocean. Energy diversification from Russia.",
    hotTopics: ["LAC", "Navy", "Energy"],
  },
];

export const NUCLEAR_STATUS = [
  { state: "United States", warheads: 5044, deployed: 1770, status: "Steady", alert: "LOW", trend: "stable" },
  { state: "Russia", warheads: 5580, deployed: 1710, status: "Elevated", alert: "HIGH", trend: "up" },
  { state: "China", warheads: 500, deployed: 0, status: "Expanding", alert: "MODERATE", trend: "up" },
  { state: "France", warheads: 290, deployed: 280, status: "Steady", alert: "LOW", trend: "stable" },
  { state: "UK", warheads: 225, deployed: 120, status: "Steady", alert: "LOW", trend: "stable" },
  { state: "Pakistan", warheads: 170, deployed: 0, status: "Growing", alert: "MODERATE", trend: "up" },
  { state: "India", warheads: 172, deployed: 0, status: "Growing", alert: "MODERATE", trend: "up" },
  { state: "Israel", warheads: 90, deployed: 0, status: "Opaque", alert: "LOW", trend: "stable" },
  { state: "North Korea", warheads: 50, deployed: 0, status: "Testing", alert: "HIGH", trend: "up" },
  { state: "Iran", warheads: 0, deployed: 0, status: "Threshold", alert: "CRITICAL", trend: "up" },
];

export const RISK_INDICES = [
  { name: "Conflict", value: 73, change: +4.2, color: "from-red-500 to-orange-500" },
  { name: "Economy", value: 58, change: -2.1, color: "from-yellow-500 to-amber-500" },
  { name: "Supply Chain", value: 44, change: -6.8, color: "from-orange-500 to-red-500" },
  { name: "Cyber", value: 81, change: +8.3, color: "from-purple-500 to-pink-500" },
  { name: "Energy", value: 52, change: +1.4, color: "from-blue-500 to-cyan-500" },
  { name: "Climate", value: 67, change: +3.7, color: "from-emerald-500 to-teal-500" },
];

export function getRiskColor(v: number) {
  if (v >= 75) return "text-red-400";
  if (v >= 50) return "text-orange-400";
  if (v >= 25) return "text-yellow-400";
  return "text-emerald-400";
}

export function riskBarColor(r: number) {
  if (r >= 70) return "bg-red-500";
  if (r >= 50) return "bg-orange-500";
  return "bg-emerald-500";
}

export const AI_QUICK_QUERIES = ['How many ships are stranded in the Strait of Hormuz right now?', 'Which chokepoint has the heaviest vessel density currently?', 'Show the current military aircraft posture around the Middle East.'];

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) { const toRad = (value: number) => (value * Math.PI) / 180; const earthRadiusKm = 6371; const dLat = toRad(lat2 - lat1); const dLon = toRad(lon2 - lon1); const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2); return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); }

export function isNearChokepoint(lat: number, lng: number, chokepoint: any) { return haversineKm(lat, lng, chokepoint.lat, chokepoint.lng) <= chokepoint.radiusKm; }
