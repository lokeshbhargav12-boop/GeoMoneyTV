"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Zap,
  Globe2,
  Factory,
  Battery,
  Sun,
  Wind,
  Droplets,
  Atom,
  Flame,
  Gauge,
  AlertTriangle,
  Shield,
  ChevronRight,
  BarChart3,
  Fuel,
  Warehouse,
  Cable,
  TrendingUp,
  TrendingDown,
  Loader2,
  Server,
  RefreshCw,
  AlertCircle,
  Container,
  Truck,
  Layers,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const INFRASTRUCTURE_LAYERS = [
  { id: "resource-input", label: "Resource Input", icon: Globe2, desc: "Physical energy sources before extraction.", color: "emerald" },
  { id: "extraction", label: "Extraction / Generation", icon: Factory, desc: "Assets that bring energy into usable system flow.", color: "blue" },
  { id: "processing", label: "Processing / Conversion", icon: Flame, desc: "Assets that transform raw energy into usable forms.", color: "amber" },
  { id: "transport", label: "Transport / Transmission", icon: Container, desc: "Assets that move energy over distance.", color: "cyan" },
  { id: "storage", label: "Storage / Buffering", icon: Warehouse, desc: "Assets that hold energy for later use.", color: "purple" },
  { id: "import-export", label: "Import / Export", icon: Fuel, desc: "Facilities connecting local systems to external flows.", color: "rose" },
  { id: "distribution", label: "Distribution / Delivery", icon: Cable, desc: "Assets delivering energy to final users.", color: "teal" },
  { id: "control", label: "Control & Operations", icon: Server, desc: "Systems to manage infrastructure.", color: "indigo" },
];

const TECH_CATS = [
  { id: "all", label: "All Technologies" },
  { id: "fossil", label: "Fossil Fuels" },
  { id: "renewable", label: "Renewables" },
  { id: "storage", label: "Storage" },
  { id: "grid", label: "Grid" },
];

type MV = "Core" | "Supporting" | "Conditional" | "Limited" | "N/A";
const MCOLS = ["Oil", "Gas", "Coal", "Solar", "Wind", "Hydro", "Batteries", "Pumped Hydro", "Hydrogen", "Grid"];
const MROWS = ["Resource Input", "Extraction / Generation", "Processing / Conversion", "Transport / Transmission", "Storage / Buffering", "Import / Export", "Distribution / Delivery", "Control & Operations"];
const MDATA: Record<string, MV[]> = {
  "Resource Input": ["Core", "Core", "Core", "Core", "Core", "Core", "N/A", "Core", "N/A", "N/A"],
  "Extraction / Generation": ["Core", "Core", "Core", "Core", "Core", "Core", "N/A", "Supporting", "Conditional", "N/A"],
  "Processing / Conversion": ["Core", "Core", "Supporting", "Limited", "N/A", "N/A", "N/A", "N/A", "Core", "N/A"],
  "Transport / Transmission": ["Core", "Core", "Core", "Supporting", "Supporting", "Supporting", "Limited", "N/A", "Conditional", "Core"],
  "Storage / Buffering": ["Core", "Core", "Core", "Conditional", "Conditional", "Supporting", "Core", "Core", "Core", "Supporting"],
  "Import / Export": ["Core", "Core", "Core", "N/A", "Limited", "Limited", "N/A", "N/A", "Conditional", "Supporting"],
  "Distribution / Delivery": ["Core", "Core", "Core", "Supporting", "Supporting", "Supporting", "Supporting", "N/A", "Conditional", "Core"],
  "Control & Operations": ["Supporting", "Supporting", "Supporting", "Supporting", "Supporting", "Supporting", "Core", "Supporting", "Conditional", "Core"],
};
const MCOL: Record<MV, string> = {
  Core: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Supporting: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  Conditional: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  Limited: "bg-gray-500/15 text-gray-400 border-gray-500/20",
  "N/A": "bg-white/5 text-gray-500 border-white/10",
};

const ASSETS = [
  { id: "oil-fields", name: "Oil Fields & Wells", layer: "Extraction / Generation", tech: "Oil", role: "Extract crude oil from underground reservoirs.", metrics: ["bbl/d capacity", "Well count", "Recovery rate"], cons: ["Depletion", "Permitting"], icon: Fuel, detail: "Oil fields range from giant onshore fields in the Middle East to deepwater offshore platforms." },
  { id: "gas-fields", name: "Gas Fields & Wells", layer: "Extraction / Generation", tech: "Gas", role: "Produce natural gas from conventional and shale formations.", metrics: ["mcf/d capacity", "Well count", "EUR per well"], cons: ["Depletion", "Flaring restrictions"], icon: Flame, detail: "Key regions include the Permian Basin, Marcellus Shale, and global LNG supply basins." },
  { id: "solar-farms", name: "Solar PV Farms", layer: "Extraction / Generation", tech: "Solar", role: "Convert sunlight into electricity using photovoltaic panels.", metrics: ["Installed MW", "Capacity factor 15-28%", "Degradation rate"], cons: ["Interconnection queue", "Land availability"], icon: Sun, detail: "Utility-scale solar farms range from 50 MW to 1+ GW. Fastest-growing generation source globally." },
  { id: "wind-farms", name: "Wind Farms", layer: "Extraction / Generation", tech: "Wind", role: "Convert kinetic wind energy using turbine arrays.", metrics: ["Installed MW", "Capacity factor 30-55%", "Turbine MW rating"], cons: ["Interconnection queue", "Offshore cable"], icon: Wind, detail: "Offshore wind expanding rapidly with turbine ratings exceeding 15 MW." },
  { id: "refineries", name: "Oil Refineries", layer: "Processing / Conversion", tech: "Oil", role: "Convert crude oil into refined products.", metrics: ["bbl/d capacity", "Utilization %", "Complexity index"], cons: ["Maintenance turnaround", "Feedstock availability"], icon: Factory, detail: "Global refining capacity is ~101 million bbl/d. US Gulf Coast and Asia-Pacific lead." },
  { id: "lng", name: "LNG Liquefaction Terminals", layer: "Processing / Conversion", tech: "Gas", role: "Cool natural gas to -162°C for LNG transport.", metrics: ["mtpa capacity", "Train count", "Utilization %"], cons: ["Berth availability", "Feedgas supply"], icon: Fuel, detail: "Major exporters: Qatar, Australia, US, Russia. Each train produces 4-8 mtpa." },
  { id: "pipelines", name: "Oil & Gas Pipelines", layer: "Transport / Transmission", tech: "Fossil", role: "Transport crude oil, products, and gas over distance.", metrics: ["bbl/d or bcf/d capacity", "Length km", "Utilization %"], cons: ["Permitting", "Aging infrastructure"], icon: Container, detail: "US has ~4 million km of pipelines, the world's largest network." },
  { id: "transmission", name: "Electricity Transmission", layer: "Transport / Transmission", tech: "Grid", role: "Transfer bulk electricity at high voltage.", metrics: ["MW capacity", "Voltage kV", "Loading %"], cons: ["Congestion", "Transformer availability"], icon: Zap, detail: "HVDC enables long-distance transport with lower losses." },
  { id: "bess", name: "Battery Storage (BESS)", layer: "Storage / Buffering", tech: "Batteries", role: "Store electricity for grid balancing and peak shaving.", metrics: ["MW capacity", "Duration hours", "Efficiency %"], cons: ["Supply chain", "Fire safety"], icon: Battery, detail: "Global BESS deployments reached ~100 GW in 2025. LFP chemistry dominates." },
  { id: "ugs", name: "Underground Gas Storage", layer: "Storage / Buffering", tech: "Gas", role: "Store gas in depleted reservoirs or salt caverns.", metrics: ["bcf working gas", "Deliverability bcf/d", "Fill level"], cons: ["Withdrawal limits", "Refill constraints"], icon: Warehouse, detail: "Injection runs April-October; withdrawal November-March." },
  { id: "electrolyzers", name: "Hydrogen Electrolyzers", layer: "Processing / Conversion", tech: "Hydrogen", role: "Produce green hydrogen from renewable electricity.", metrics: ["MW capacity", "kWh/kg efficiency", "Stack life"], cons: ["Electricity cost", "Water availability"], icon: Atom, detail: "Installed capacity ~1.4 GW in 2025. PEM and alkaline dominate." },
  { id: "coal-export", name: "Coal Export Terminals", layer: "Import / Export", tech: "Coal", role: "Load coal onto vessels for seaborne trade.", metrics: ["mtpa throughput", "Storage tonnes", "Berth depth"], cons: ["Port congestion", "Rail delivery"], icon: Container, detail: "Major hubs: Newcastle (AU), Richards Bay (SA), US Gulf Coast." },
];

const STORAGE = [
  { name: "Crude Oil Tanks", cap: "~6 wks demand", dur: "Days-months", resp: "Hours", role: "Logistics buffer", icon: Fuel },
  { name: "Strategic Petroleum Reserve", cap: "1.8B bbl", dur: "Months", resp: "Days", role: "Emergency supply", icon: Shield },
  { name: "Underground Gas Storage", cap: "Trillions cf", dur: "Seasonal", resp: "Hours-days", role: "Heating buffer", icon: Flame },
  { name: "Coal Stockpiles", cap: "Weeks-months", dur: "Weeks-months", resp: "Days", role: "Power plant buffer", icon: Warehouse },
  { name: "Battery Storage (BESS)", cap: "GWh typical", dur: "1-4 hrs", resp: "ms", role: "Grid balancing", icon: Battery },
  { name: "Pumped Hydro", cap: "Thousands MWh", dur: "6-16 hrs", resp: "Minutes", role: "Bulk storage", icon: Droplets },
  { name: "Hydrogen Storage", cap: "TWh potential", dur: "Days-seasons", resp: "Hours", role: "Seasonal backup", icon: Atom },
  { name: "LNG Storage", cap: "Days-weeks", dur: "Days-weeks", resp: "Hours", role: "Regas buffer", icon: Fuel },
];

const GRID = [
  { label: "Generation Step-Up", desc: "Transformers step up voltage for efficient transport." },
  { label: "Transmission Backbone", desc: "High-voltage lines carry bulk power across regions." },
  { label: "Substations", desc: "Nodes for voltage transformation and power flow control." },
  { label: "Distribution Networks", desc: "Lower-voltage lines deliver to end users." },
  { label: "Interconnectors", desc: "Cross-border links enabling electricity trade." },
  { label: "Control Centers", desc: "SCADA and balancing authorities manage the grid." },
  { label: "Grid-Scale Batteries", desc: "Fast frequency response and renewable smoothing." },
  { label: "Demand Response", desc: "Programs adjusting consumption to grid conditions." },
];

interface LiveData {
  timestamp: string;
  commodities: any[];
  storage: any[];
  grid: any[];
  climate: any[];
  osint: any[];
  shipCounts: any[];
  assets: any[];
  constraints: any[];
  resilience: any[];
  scenarios: any[];
}

export default function EnergyInfrastructurePage() {
  const [tech, setTech] = useState("all");
  const [layer, setLayer] = useState<string | null>(null);
  const [selAsset, setSelAsset] = useState<string | null>(null);
  const [selScenario, setSelScenario] = useState<string | null>(null);
  const [scenarioImpact, setScenarioImpact] = useState<string | null>(null);
  const [impactLoading, setImpactLoading] = useState(false);
  const [live, setLive] = useState<LiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLive = async () => {
    try {
      const res = await fetch("/api/energy/infrastructure", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load live data");
      const data = await res.json();
      setLive(data);
      setError(null);
    } catch (e) {
      setError("Live data unavailable. Showing static reference data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLive();
    const id = setInterval(fetchLive, 60000);
    return () => clearInterval(id);
  }, []);

  const handleScenarioClick = async (id: string) => {
    if (selScenario === id) {
      setSelScenario(null);
      setScenarioImpact(null);
      return;
    }
    setSelScenario(id);
    setScenarioImpact(null);
    setImpactLoading(true);
    try {
      const res = await fetch("/api/energy/infrastructure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: id }),
      });
      const data = await res.json();
      setScenarioImpact(data.impact);
    } catch {
      setScenarioImpact("Impact analysis unavailable.");
    } finally {
      setImpactLoading(false);
    }
  };

  const filtered = tech === "all" ? ASSETS : ASSETS.filter((a) => {
    if (tech === "fossil") return ["Oil", "Gas", "Coal"].includes(a.tech);
    if (tech === "renewable") return ["Solar", "Wind", "Hydro"].includes(a.tech);
    if (tech === "storage") return ["Batteries"].includes(a.tech);
    if (tech === "grid") return a.tech === "Grid";
    return true;
  });

  const layerFiltered = layer ? filtered.filter((a) => a.layer.toLowerCase().replace(/ \//g, "-").replace(/ /g, "-") === layer) : filtered;

  const colorMap: Record<string, string> = {
    emerald: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
    blue: "border-blue-500/50 bg-blue-500/10 text-blue-400",
    amber: "border-amber-500/50 bg-amber-500/10 text-amber-400",
    cyan: "border-cyan-500/50 bg-cyan-500/10 text-cyan-400",
    purple: "border-purple-500/50 bg-purple-500/10 text-purple-400",
    rose: "border-rose-500/50 bg-rose-500/10 text-rose-400",
    teal: "border-teal-500/50 bg-teal-500/10 text-teal-400",
    indigo: "border-indigo-500/50 bg-indigo-500/10 text-indigo-400",
  };

  const getAssetLive = (id: string) => live?.assets?.find((a: any) => a.id === id);

  const formatPrice = (price?: number, change?: number) => {
    if (price === undefined || price === null) return null;
    const isUp = (change || 0) >= 0;
    return (
      <span className={`text-[10px] font-bold ${isUp ? "text-green-400" : "text-red-400"}`}>
        ${price.toFixed(2)} {isUp ? "▲" : "▼"} {Math.abs(change || 0).toFixed(2)}%
      </span>
    );
  };

  return (
    <main className="min-h-screen bg-geo-dark text-white pt-32 pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* HERO */}
        <div className="mb-12">
          <Link href="/energy" className="inline-flex items-center gap-2 text-gray-400 hover:text-amber-400 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Energy Hub
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-amber-400 text-sm font-medium tracking-widest uppercase flex items-center gap-2">
              <Globe2 className="w-4 h-4" /> Energy Hub
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mt-2">
              Energy <span className="bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">Infrastructure</span>
            </h1>
            <p className="text-gray-400 mt-4 max-w-3xl text-sm leading-relaxed">
              Physical networks that produce, convert, move, store, and deliver energy across fossil, renewable, storage, and electricity systems.
            </p>
            {live && (
              <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live data updated {new Date(live.timestamp).toLocaleTimeString()}
              </p>
            )}
            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
          </motion.div>
        </div>

        {/* QUICK NAV */}
        <div className="flex overflow-x-auto gap-3 mb-12 pb-2" style={{ scrollbarWidth: "none" }}>
          {["layer-map", "matrix", "assets", "constraints", "storage", "grid", "resilience", "scenarios"].map((h) => (
            <a key={h} href={"#" + h} className="px-4 py-2 whitespace-nowrap bg-white/5 border border-white/10 rounded-full hover:bg-amber-500/20 hover:text-amber-400 transition-all text-sm">
              {h.charAt(0).toUpperCase() + h.slice(1)}
            </a>
          ))}
        </div>

        {/* LIVE COMMODITY STRIP */}
        {live?.commodities && live.commodities.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-gray-300">Live Energy Commodities</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {live.commodities.map((c: any) => (
                <div key={c.symbol} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">{c.label}</div>
                  <div className="text-sm font-bold text-white">${c.price.toFixed(2)}</div>
                  <div className={`text-[10px] font-bold ${c.changePercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {c.changePercent >= 0 ? "+" : ""}{c.changePercent.toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 1. LAYER MAP */}
        <section id="layer-map" className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Layers className="w-6 h-6 text-amber-400" /> Infrastructure Layer Map
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {INFRASTRUCTURE_LAYERS.map((l) => {
              const Icon = l.icon;
              const active = layer === l.id;
              const liveCount = l.id === "transport" ? live?.shipCounts?.reduce((acc: number, s: any) => acc + s.total, 0) : undefined;
              return (
                <button key={l.id} onClick={() => setLayer(active ? null : l.id)} className={`text-left p-4 rounded-xl border transition-all ${active ? colorMap[l.color] : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${active ? "bg-black/20" : "bg-white/10"}`}><Icon className="w-5 h-5" /></div>
                    <span className="text-sm font-bold">{l.label}</span>
                  </div>
                  <p className="text-xs text-gray-400">{l.desc}</p>
                  {liveCount !== undefined && (
                    <div className="mt-2 text-[10px] text-cyan-400 font-medium">{liveCount} vessels tracked</div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* TECH FILTER */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {TECH_CATS.map((c) => (
              <button key={c.id} onClick={() => { setTech(c.id); setLayer(null); }} className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${tech === c.id ? "bg-amber-500/20 text-amber-400 border-amber-500/40" : "bg-white/5 text-gray-400 border-white/10 hover:text-white"}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. MATRIX */}
        <section id="matrix" className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-amber-400" /> Technology Coverage Matrix
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-2 py-2 text-gray-500 font-medium">Layer</th>
                  {MCOLS.map((c) => <th key={c} className="px-2 py-2 text-gray-500 font-medium text-center text-xs">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {MROWS.map((row) => (
                  <tr key={row} className="border-t border-white/5">
                    <td className="px-2 py-2 text-gray-300 text-xs whitespace-nowrap">{row}</td>
                    {MDATA[row].map((v, i) => (
                      <td key={i} className="px-1.5 py-1.5 text-center">
                        <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded border font-medium ${MCOL[v]}`}>{v}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. ASSET EXPLORER */}
        <section id="assets" className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Factory className="w-6 h-6 text-amber-400" /> Infrastructure Asset Explorer <span className="text-sm font-normal text-gray-500 ml-2">({layerFiltered.length})</span>
          </h2>
          {loading && <div className="flex items-center gap-2 text-gray-500 text-sm mb-4"><Loader2 className="w-4 h-4 animate-spin" /> Loading live asset data...</div>}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {layerFiltered.map((a) => {
              const Icon = a.icon;
              const liveAsset = getAssetLive(a.id);
              return (
                <button key={a.id} onClick={() => setSelAsset(selAsset === a.id ? null : a.id)} className={`text-left rounded-xl border p-4 transition-all ${selAsset === a.id ? "border-amber-500/50 bg-amber-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-amber-400 shrink-0" />
                    <h3 className="text-sm font-bold">{a.name}</h3>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{a.role}</p>
                  {liveAsset && (
                    <div className="mb-2 space-y-1">
                      {liveAsset.price && <div className="text-[10px]">{formatPrice(liveAsset.price.price, liveAsset.price.changePercent)}</div>}
                      {liveAsset.storage && liveAsset.storage.value !== null && (
                        <div className="text-[10px] text-blue-400">{liveAsset.storage.name}: {liveAsset.storage.value.toFixed(1)} {liveAsset.storage.unit}</div>
                      )}
                      {liveAsset.shipCount && (
                        <div className="text-[10px] text-cyan-400">{liveAsset.shipCount.region}: {liveAsset.shipCount.total} vessels</div>
                      )}
                      {liveAsset.headline && (
                        <div className="text-[10px] text-gray-500 truncate" title={liveAsset.headline}>📰 {liveAsset.headline}</div>
                      )}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {a.cons.slice(0, 2).map((c) => <span key={c} className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">{c}</span>)}
                  </div>
                  {selAsset === a.id && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-xs text-gray-300 mb-3">{a.detail}</p>
                      <div className="text-[10px] text-gray-500 font-medium mb-1">Metrics:</div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {a.metrics.map((m) => <span key={m} className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">{m}</span>)}
                      </div>
                      <div className="text-[10px] text-gray-500 font-medium mb-1">Constraints:</div>
                      <div className="flex flex-wrap gap-1">
                        {a.cons.map((c) => <span key={c} className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">{c}</span>)}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {layerFiltered.length === 0 && <div className="text-center py-12 text-gray-500 text-sm">No assets match current filters.</div>}
        </section>

        {/* 4. CONSTRAINTS */}
        <section id="constraints" className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400" /> Infrastructure Constraints
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(live?.constraints || []).map((c: any) => {
              const Icon = c.label === "Physical Capacity" ? Gauge : c.label === "Interconnection Limits" ? Cable : c.label === "Permitting" ? AlertCircle : c.label === "Maintenance" ? RefreshCw : c.label === "Weather Exposure" ? Sun : c.label === "Logistics" ? Truck : c.label === "Equipment Supply" ? RefreshCw : Warehouse;
              const sc = c.sev === "high" ? "border-red-500/30 bg-red-500/10" : c.sev === "medium" ? "border-yellow-500/30 bg-yellow-500/10" : "border-gray-500/30 bg-gray-500/10";
              return (
                <div key={c.label} className={`rounded-xl border p-4 ${sc}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-bold">{c.label}</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{c.desc}</p>
                  <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${c.sev === "high" ? "bg-red-500" : c.sev === "medium" ? "bg-yellow-500" : "bg-gray-500"}`} style={{ width: `${c.score}%` }} />
                  </div>
                  <div className="mt-2 text-[10px] uppercase tracking-wider font-bold text-gray-500">
                    Severity: <span className={c.sev === "high" ? "text-red-400" : c.sev === "medium" ? "text-yellow-400" : "text-gray-400"}>{c.sev}</span>
                  </div>
                  {c.evidence?.length > 0 && (
                    <div className="mt-2 text-[10px] text-gray-500 truncate" title={c.evidence.join(" | ")}>Evidence: {c.evidence[0]}</div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. STORAGE */}
        <section id="storage" className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Battery className="w-6 h-6 text-purple-400" /> Storage & Buffering Comparison
          </h2>
          {live?.storage && live.storage.length > 0 && (
            <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {live.storage.map((s: any) => (
                <div key={s.name} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">{s.name}</div>
                  <div className="text-lg font-bold text-white">{s.value !== null ? s.value.toFixed(1) : "--"} <span className="text-xs text-gray-500">{s.unit}</span></div>
                  {s.change !== null && (
                    <div className={`text-[10px] font-bold ${s.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {s.change >= 0 ? "+" : ""}{s.change.toFixed(1)} ({s.changePercent?.toFixed(1) ?? "--"}%)
                    </div>
                  )}
                  <div className="text-[9px] text-gray-600 mt-1">{new Date(s.date).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STORAGE.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.name} className="rounded-xl border border-white/10 bg-white/5 p-4 hover:border-purple-500/30 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-purple-500/10"><Icon className="w-4 h-4 text-purple-400" /></div>
                    <span className="text-sm font-bold">{s.name}</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-gray-500">Capacity:</span><span className="text-gray-300">{s.cap}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Duration:</span><span className="text-gray-300">{s.dur}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Response:</span><span className="text-gray-300">{s.resp}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Role:</span><span className="text-gray-300">{s.role}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 6. GRID */}
        <section id="grid" className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Zap className="w-6 h-6 text-yellow-400" /> Grid & Integration
          </h2>
          {live?.grid && live.grid.length > 0 && (
            <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {live.grid.map((g: any) => (
                <div key={g.name} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">{g.name}</div>
                  <div className="text-lg font-bold text-white">{g.value !== null ? g.value.toLocaleString() : "--"} <span className="text-xs text-gray-500">{g.unit}</span></div>
                  <div className="text-[9px] text-gray-600 mt-1">{new Date(g.date).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {GRID.map((g) => (
              <div key={g.label} className="rounded-xl border border-white/10 bg-white/5 p-4 hover:border-yellow-500/30 transition-all">
                <div className="text-sm font-bold mb-1">{g.label}</div>
                <p className="text-xs text-gray-400">{g.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 7. RESILIENCE */}
        <section id="resilience" className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Shield className="w-6 h-6 text-emerald-400" /> Resilience & Vulnerability
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(live?.resilience || []).map((r: any) => (
              <div key={r.dim} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold">{r.dim}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${r.status === "Low Concern" ? "bg-emerald-500/20 text-emerald-400" : r.status === "Moderate Concern" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
                    {r.status}
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
                  <div className={`h-full rounded-full ${r.status === "Low Concern" ? "bg-emerald-500" : r.status === "Moderate Concern" ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${r.score}%` }} />
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-3 h-3 shrink-0" /><span className="text-gray-400">{r.low}</span></div>
                  <div className="flex items-center gap-2 text-red-400"><XCircle className="w-3 h-3 shrink-0" /><span className="text-gray-400">{r.high}</span></div>
                </div>
                <p className="text-[10px] text-gray-600 mt-2 italic">{r.evidence}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-600 mt-3 italic">Scores are derived from live EIA, climate, AIS, and OSINT feeds. Each dimension is backed by documented data sources and methodology notes.</p>
        </section>

        {/* 8. SCENARIOS */}
        <section id="scenarios" className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <RefreshCw className="w-6 h-6 text-amber-400" /> Scenario Stress View
          </h2>
          <p className="text-gray-400 text-sm mb-6 max-w-3xl">
            Live scenarios showing how infrastructure stress moves through the physical system. Click a scenario for an AI-generated current-impact summary.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {(live?.scenarios || []).map((s: any) => (
              <button key={s.id} onClick={() => handleScenarioClick(s.id)} className={`text-left rounded-xl border p-5 transition-all ${selScenario === s.id ? "border-red-500/50 bg-red-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-red-400/70" />
                      <span className="text-sm font-bold">{s.label}</span>
                    </div>
                    <p className="text-xs text-gray-400">{s.desc}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 mt-1 transition-transform ${selScenario === s.id ? "rotate-90" : ""} text-gray-500`} />
                </div>
                {selScenario === s.id && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="text-[10px] text-gray-500 font-medium mb-2">Affected Infrastructure Layers:</div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {s.affected.map((a: string) => <span key={a} className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">{a}</span>)}
                    </div>
                    {impactLoading ? (
                      <div className="flex items-center gap-2 text-[10px] text-gray-500"><Loader2 className="w-3 h-3 animate-spin" /> Generating impact analysis...</div>
                    ) : (
                      <p className="text-xs text-gray-300 leading-relaxed">{scenarioImpact || s.desc}</p>
                    )}
                    <p className="text-[9px] text-gray-600 mt-2 italic">Live AI impact &middot; Not a forecast &middot; Based on current data</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* RELATED */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-bold mb-4">Related Pages</h3>
          <div className="flex flex-wrap gap-3">
            <Link href="/energy" className="text-xs px-3 py-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors">Energy Hub</Link>
            <Link href="/energy/oil-and-gas" className="text-xs px-3 py-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors">Oil & Gas</Link>
            <Link href="/world-monitor" className="text-xs px-3 py-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors">GeoMoney Aperture</Link>
            <Link href="/news" className="text-xs px-3 py-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors">Intelligence</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
