"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Building2,
  Factory,
  Filter,
  Flame,
  Fuel,
  Gauge,
  Globe2,
  Layers,
  Route,
  Shield,
  Warehouse,
  Zap,
} from "lucide-react";

type FossilPlant = {
  id: string;
  name: string;
  tech: "Coal" | "Gas" | "Oil" | "LNG";
  status: "Operating" | "Construction" | "Permitting";
  capacity: number;
  region: "North America" | "Europe" | "Asia-Pacific" | "Middle East";
  owner: string;
  corridor: string;
  x: number;
  y: number;
  pressure: string;
  note: string;
};

type Corridor = {
  id: string;
  name: string;
  kind: string;
  region: FossilPlant["region"];
  throughput: string;
  status: string;
  summary: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

const TECHNOLOGIES = ["All", "Coal", "Gas", "Oil", "LNG"] as const;
const REGIONS = [
  "Global",
  "North America",
  "Europe",
  "Asia-Pacific",
  "Middle East",
] as const;
const STATUSES = ["Operating", "Construction", "Permitting"] as const;
const OVERLAYS = [
  "Gas Pipelines",
  "Coal Rail",
  "Export Terminals",
  "Grid Tie-Ins",
] as const;

const FOSSIL_PLANTS: FossilPlant[] = [
  {
    id: "powder-river",
    name: "Powder River Coal Belt",
    tech: "Coal",
    status: "Operating",
    capacity: 4200,
    region: "North America",
    owner: "US thermal baseload cluster",
    corridor: "BNSF coal rail and terminal chain",
    x: 18,
    y: 44,
    pressure: "Rail throughput tightening into export windows",
    note: "Coal mines, railheads, and plant demand are modeled together to keep the retired coal route visible inside the fossil desk.",
  },
  {
    id: "rotterdam-gas",
    name: "Rotterdam Flex Gas Hub",
    tech: "Gas",
    status: "Operating",
    capacity: 3100,
    region: "Europe",
    owner: "Northwest Europe peaker fleet",
    corridor: "North Sea pipelines and LNG backfill",
    x: 44,
    y: 28,
    pressure:
      "Storage levels healthy, imports still exposed to shipping disruptions",
    note: "Acts as a balancing cluster for gas-fired power and LNG regasification into the continental grid.",
  },
  {
    id: "japan-lng",
    name: "Tokyo Bay LNG and Power Block",
    tech: "LNG",
    status: "Operating",
    capacity: 5100,
    region: "Asia-Pacific",
    owner: "Utility consortium",
    corridor: "Pacific LNG lanes with coastal gas plants",
    x: 82,
    y: 34,
    pressure: "Spot LNG prices remain the main swing factor during heat events",
    note: "High-capacity import terminals feed multiple combined-cycle units and reserve generators.",
  },
  {
    id: "gujarat-coal",
    name: "Gujarat Coal and Port Arc",
    tech: "Coal",
    status: "Construction",
    capacity: 2800,
    region: "Asia-Pacific",
    owner: "Industrial generation corridor",
    corridor: "Imported coal terminals and inland conveyor links",
    x: 69,
    y: 48,
    pressure: "Port handling capacity is pacing the buildout schedule",
    note: "This cluster keeps the legacy coal storyline live while surfacing current port, rail, and cooling-water constraints.",
  },
  {
    id: "permian-thermal",
    name: "Permian Thermal Spine",
    tech: "Gas",
    status: "Permitting",
    capacity: 3600,
    region: "North America",
    owner: "Merchant generators and pipeline sponsors",
    corridor: "Gathering, takeaway, and power-market interconnects",
    x: 24,
    y: 58,
    pressure: "Pipeline takeaway and transformer lead times are gating COD",
    note: "Planned gas generation is grouped with its fuel transport dependencies rather than shown as isolated plants.",
  },
  {
    id: "abqaiq-oil",
    name: "Eastern Province Oil-Fired Reserve",
    tech: "Oil",
    status: "Operating",
    capacity: 1900,
    region: "Middle East",
    owner: "Strategic reserve generation",
    corridor: "Crude and product pipelines with backup generation",
    x: 58,
    y: 56,
    pressure:
      "Reserve role remains sensitive to refinery and export corridor events",
    note: "Oil-fired capacity remains relevant for reserve and industrial continuity despite lower utilization.",
  },
  {
    id: "med-lng",
    name: "East Med LNG Chain",
    tech: "LNG",
    status: "Construction",
    capacity: 2400,
    region: "Middle East",
    owner: "Regional export alliance",
    corridor: "Liquefaction trains, shipping lanes, and receiving plants",
    x: 55,
    y: 42,
    pressure:
      "Construction timing depends on marine works and compressor availability",
    note: "Tracks LNG infrastructure as a system from liquefaction to receiving generation assets.",
  },
  {
    id: "poland-coal",
    name: "Silesia Coal Reliability Pocket",
    tech: "Coal",
    status: "Operating",
    capacity: 2600,
    region: "Europe",
    owner: "Regional baseload fleet",
    corridor: "Mine-mouth coal, rail delivery, and balancing services",
    x: 49,
    y: 36,
    pressure:
      "Aging units need outage coordination against winter demand peaks",
    note: "Keeps coal reliability assets visible where retirement timing and system stress still matter.",
  },
];

const CORRIDORS: Corridor[] = [
  {
    id: "na-gas",
    name: "North America Gas Backbone",
    kind: "Gas Pipelines",
    region: "North America",
    throughput: "18.4 bcf/d mapped",
    status: "Operating",
    summary: "Interstate gas corridors feeding power and LNG export demand.",
    x1: 16,
    y1: 60,
    x2: 31,
    y2: 42,
  },
  {
    id: "eu-terminals",
    name: "North Sea Entry Arc",
    kind: "Export Terminals",
    region: "Europe",
    throughput: "6 terminals",
    status: "Operating",
    summary:
      "Import terminals, regas sites, and balancing plants around the North Sea.",
    x1: 40,
    y1: 30,
    x2: 50,
    y2: 36,
  },
  {
    id: "asia-coal",
    name: "West India Coal Rail",
    kind: "Coal Rail",
    region: "Asia-Pacific",
    throughput: "92 mtpa modeled",
    status: "Construction",
    summary: "Mine, port, and plant conveyor chain around Gujarat.",
    x1: 67,
    y1: 52,
    x2: 73,
    y2: 45,
  },
  {
    id: "pacific-lng",
    name: "Pacific LNG Dispatch",
    kind: "Export Terminals",
    region: "Asia-Pacific",
    throughput: "11.2 mtpa linked",
    status: "Operating",
    summary:
      "Shipping and receipt flows serving Tokyo Bay and nearby gas plants.",
    x1: 77,
    y1: 38,
    x2: 84,
    y2: 33,
  },
  {
    id: "gulf-grid",
    name: "Gulf Reserve Tie-In",
    kind: "Grid Tie-Ins",
    region: "Middle East",
    throughput: "4 cross-load corridors",
    status: "Operating",
    summary:
      "Reserve generation linkages between oil-fired assets and industrial demand nodes.",
    x1: 54,
    y1: 58,
    x2: 61,
    y2: 49,
  },
];

const OVERLAY_STYLES: Record<(typeof OVERLAYS)[number], string> = {
  "Gas Pipelines": "stroke-cyan-400/70",
  "Coal Rail": "stroke-amber-400/70",
  "Export Terminals": "stroke-rose-400/70",
  "Grid Tie-Ins": "stroke-emerald-400/70",
};

export default function FossilEnergyPage() {
  const [technology, setTechnology] =
    useState<(typeof TECHNOLOGIES)[number]>("All");
  const [region, setRegion] = useState<(typeof REGIONS)[number]>("Global");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("Operating");
  const [activeOverlays, setActiveOverlays] = useState<
    (typeof OVERLAYS)[number][]
  >(["Gas Pipelines", "Export Terminals"]);
  const [selectedPlantId, setSelectedPlantId] = useState<string>(
    FOSSIL_PLANTS[0].id,
  );

  const filteredPlants = useMemo(() => {
    return FOSSIL_PLANTS.filter((plant) => {
      if (technology !== "All" && plant.tech !== technology) return false;
      if (region !== "Global" && plant.region !== region) return false;
      if (plant.status !== status) return false;
      return true;
    });
  }, [region, status, technology]);

  const selectedPlant =
    filteredPlants.find((plant) => plant.id === selectedPlantId) ??
    filteredPlants[0] ??
    FOSSIL_PLANTS[0];

  const filteredCorridors = useMemo(() => {
    return CORRIDORS.filter((corridor) => {
      if (region !== "Global" && corridor.region !== region) return false;
      if (!activeOverlays.includes(corridor.kind as (typeof OVERLAYS)[number]))
        return false;
      return true;
    });
  }, [activeOverlays, region]);

  const totalCapacity = filteredPlants.reduce(
    (sum, plant) => sum + plant.capacity,
    0,
  );
  const operatingCount = filteredPlants.filter(
    (plant) => plant.status === "Operating",
  ).length;

  const toggleOverlay = (overlay: (typeof OVERLAYS)[number]) => {
    setActiveOverlays((current) =>
      current.includes(overlay)
        ? current.filter((item) => item !== overlay)
        : [...current, overlay],
    );
  };

  return (
    <main className="min-h-screen bg-[#06080d] text-white pt-32 pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <Link
            href="/energy"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-orange-300 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Energy Hub
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-orange-300 text-sm font-medium tracking-widest uppercase flex items-center gap-2">
              <Flame className="w-4 h-4" /> Fossil Energy Desk
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mt-2">
              Pipeline and{" "}
              <span className="bg-gradient-to-r from-orange-300 via-amber-400 to-red-400 bg-clip-text text-transparent">
                Plant Operations
              </span>
            </h1>
            <p className="text-gray-400 mt-4 max-w-3xl text-sm leading-relaxed">
              A fossil system control room for coal, gas, oil, and LNG assets.
              The dedicated coal page is back, while this desk keeps coal
              grouped with the transport corridors, terminals, and backup
              generation that actually control wider system availability.
            </p>
          </motion.div>
        </div>

        <div className="flex flex-wrap gap-3 mb-10">
          <Link
            href="/energy/coal"
            className="px-4 py-2 rounded-full border border-orange-400/30 bg-orange-400/10 text-orange-200 text-sm hover:bg-orange-400/20 transition-colors"
          >
            Coal Page
          </Link>
          <Link
            href="/energy/oil-and-gas"
            className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-gray-300 text-sm hover:border-orange-300/30 hover:text-orange-200 transition-colors"
          >
            Oil and Gas Intelligence
          </Link>
          <Link
            href="/energy/infrastructure"
            className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-gray-300 text-sm hover:border-orange-300/30 hover:text-orange-200 transition-colors"
          >
            Infrastructure Matrix
          </Link>
        </div>

        <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)] mb-16">
          <aside className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center gap-2 text-orange-200 mb-4 text-sm font-semibold uppercase tracking-[0.2em]">
                <Filter className="w-4 h-4" /> Control Legend
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">
                    Operating Plants
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                      <div className="text-2xl font-bold text-white">
                        {filteredPlants.length}
                      </div>
                      <div className="text-gray-500 text-xs mt-1">
                        Filtered assets
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                      <div className="text-2xl font-bold text-white">
                        {operatingCount}
                      </div>
                      <div className="text-gray-500 text-xs mt-1">
                        Live operations
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-3 col-span-2">
                      <div className="text-2xl font-bold text-white">
                        {totalCapacity.toLocaleString()} MW
                      </div>
                      <div className="text-gray-500 text-xs mt-1">
                        Modeled capacity behind the current filter stack
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">
                    Technology
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TECHNOLOGIES.map((item) => (
                      <button
                        key={item}
                        onClick={() => setTechnology(item)}
                        className={`px-3 py-1.5 rounded-full border text-xs transition-colors ${technology === item ? "border-orange-300/40 bg-orange-300/15 text-orange-100" : "border-white/10 bg-white/5 text-gray-400 hover:text-white"}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">
                    Region
                  </p>
                  <div className="space-y-2">
                    {REGIONS.map((item) => (
                      <button
                        key={item}
                        onClick={() => setRegion(item)}
                        className={`w-full rounded-2xl border px-3 py-2 text-left text-sm transition-colors ${region === item ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-100" : "border-white/10 bg-white/5 text-gray-400 hover:text-white"}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">
                    Plant Status
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map((item) => (
                      <button
                        key={item}
                        onClick={() => setStatus(item)}
                        className={`px-3 py-1.5 rounded-full border text-xs transition-colors ${status === item ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100" : "border-white/10 bg-white/5 text-gray-400 hover:text-white"}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">
                    Overlays
                  </p>
                  <div className="space-y-2">
                    {OVERLAYS.map((overlay) => (
                      <button
                        key={overlay}
                        onClick={() => toggleOverlay(overlay)}
                        className={`w-full rounded-2xl border px-3 py-2 text-left text-sm transition-colors ${activeOverlays.includes(overlay) ? "border-orange-300/40 bg-orange-300/10 text-orange-100" : "border-white/10 bg-white/5 text-gray-400 hover:text-white"}`}
                      >
                        {overlay}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                <Gauge className="w-4 h-4 text-orange-300" /> Bubble Size Guide
              </div>
              <div className="flex items-end gap-4 text-xs text-gray-400">
                {[1200, 2800, 5000].map((size) => (
                  <div key={size} className="flex flex-col items-center gap-2">
                    <div
                      style={{
                        width: `${18 + size / 180}px`,
                        height: `${18 + size / 180}px`,
                      }}
                      className="rounded-full border border-orange-300/40 bg-orange-300/15"
                    />
                    <span>
                      {size >= 1000
                        ? `${(size / 1000).toFixed(1)} GW`
                        : `${size} MW`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <div className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-[#08111c] overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 text-sm">
                <div className="flex flex-wrap gap-2 text-gray-300">
                  <span className="rounded-full bg-white/5 px-3 py-1.5 border border-white/10">
                    Zoom 7.0
                  </span>
                  <span className="rounded-full bg-white/5 px-3 py-1.5 border border-white/10">
                    Bubble size 1.0x
                  </span>
                  <span className="rounded-full bg-white/5 px-3 py-1.5 border border-white/10">
                    {region}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-emerald-400/10 px-3 py-1.5 border border-emerald-400/20 text-emerald-200">
                    Operating
                  </span>
                  <span className="rounded-full bg-orange-300/10 px-3 py-1.5 border border-orange-300/20 text-orange-100">
                    Pipelines enabled
                  </span>
                </div>
              </div>

              <div className="relative min-h-[560px] bg-[radial-gradient(circle_at_top,_rgba(255,173,93,0.12),_transparent_35%),linear-gradient(180deg,#09101a_0%,#06080d_100%)]">
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
                    backgroundSize: "56px 56px",
                  }}
                />

                <svg
                  className="absolute inset-0 h-full w-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  {filteredCorridors.map((corridor) => (
                    <line
                      key={corridor.id}
                      x1={corridor.x1}
                      y1={corridor.y1}
                      x2={corridor.x2}
                      y2={corridor.y2}
                      className={
                        OVERLAY_STYLES[
                          corridor.kind as (typeof OVERLAYS)[number]
                        ]
                      }
                      strokeWidth="0.8"
                      strokeDasharray={
                        corridor.status === "Construction" ? "2.5 1.4" : "0"
                      }
                    />
                  ))}
                </svg>

                <div className="absolute inset-0 p-5">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-sm">
                      <div className="flex items-center gap-2 text-white mb-1 text-sm font-semibold">
                        <Route className="w-4 h-4 text-cyan-300" /> Pipeline
                        coverage
                      </div>
                      <p className="text-xs text-gray-400">
                        Modeled corridors stay tied to plant clusters so
                        transport bottlenecks are visible inside the generation
                        view.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-sm">
                      <div className="flex items-center gap-2 text-white mb-1 text-sm font-semibold">
                        <Factory className="w-4 h-4 text-orange-300" /> Fossil
                        assets
                      </div>
                      <p className="text-xs text-gray-400">
                        Coal, gas, oil, and LNG are all filterable without
                        losing cross-fuel corridor context.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-sm">
                      <div className="flex items-center gap-2 text-white mb-1 text-sm font-semibold">
                        <Layers className="w-4 h-4 text-emerald-300" /> System
                        overlays
                      </div>
                      <p className="text-xs text-gray-400">
                        Rail, terminals, and tie-ins can be toggled
                        independently to match the live operating question.
                      </p>
                    </div>
                  </div>

                  {filteredPlants.map((plant) => {
                    const bubbleSize = 18 + plant.capacity / 170;
                    const active = selectedPlant.id === plant.id;
                    const plantColor =
                      plant.tech === "Coal"
                        ? "from-stone-300 to-orange-300"
                        : plant.tech === "Gas"
                          ? "from-cyan-300 to-sky-400"
                          : plant.tech === "Oil"
                            ? "from-red-300 to-orange-400"
                            : "from-violet-300 to-fuchsia-400";

                    return (
                      <button
                        key={plant.id}
                        onClick={() => setSelectedPlantId(plant.id)}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all ${active ? "border-white shadow-[0_0_25px_rgba(255,185,120,0.35)]" : "border-white/30 hover:border-white/70"}`}
                        style={{
                          left: `${plant.x}%`,
                          top: `${plant.y}%`,
                          width: `${bubbleSize}px`,
                          height: `${bubbleSize}px`,
                        }}
                        aria-label={plant.name}
                      >
                        <span
                          className={`block h-full w-full rounded-full bg-gradient-to-br ${plantColor} opacity-80`}
                        />
                      </button>
                    );
                  })}

                  <div className="absolute bottom-5 left-5 max-w-sm rounded-3xl border border-white/10 bg-black/55 p-5 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gray-500 mb-3">
                      <Shield className="w-4 h-4 text-orange-300" /> Operating
                      notes
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="text-gray-500 text-xs">
                          Corridors live
                        </div>
                        <div className="text-xl font-bold text-white mt-1">
                          {filteredCorridors.length}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="text-gray-500 text-xs">Filter mode</div>
                        <div className="text-xl font-bold text-white mt-1">
                          {technology}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute right-5 bottom-5 max-w-md rounded-3xl border border-orange-300/20 bg-[#0d1520]/90 p-5 shadow-2xl backdrop-blur-sm">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-orange-200/80 mb-2">
                          Selected asset
                        </p>
                        <h2 className="text-2xl font-bold text-white">
                          {selectedPlant.name}
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                          {selectedPlant.region} • {selectedPlant.tech} •{" "}
                          {selectedPlant.status}
                        </p>
                      </div>
                      <span className="rounded-full bg-white/5 px-3 py-1.5 text-sm border border-white/10 text-gray-200">
                        {selectedPlant.capacity.toLocaleString()} MW
                      </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 mb-4 text-sm">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="text-gray-500 text-xs mb-1">
                          Owner profile
                        </div>
                        <div className="text-white">{selectedPlant.owner}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="text-gray-500 text-xs mb-1">
                          Primary corridor
                        </div>
                        <div className="text-white">
                          {selectedPlant.corridor}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-orange-300/10 bg-orange-300/5 p-4 mb-3">
                      <div className="text-gray-500 text-xs uppercase tracking-[0.2em] mb-2">
                        System pressure
                      </div>
                      <p className="text-sm text-orange-100">
                        {selectedPlant.pressure}
                      </p>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {selectedPlant.note}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                  <Fuel className="w-4 h-4 text-rose-300" /> Terminal stack
                </div>
                <p className="text-sm text-gray-400">
                  Import and export terminals stay visible inside the same
                  operating pane so fuel routing is not separated from power
                  capacity.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                  <Warehouse className="w-4 h-4 text-amber-300" /> Stockpile
                  logic
                </div>
                <p className="text-sm text-gray-400">
                  Coal stockpiles, LNG tankage, and reserve fuel buffers are
                  treated as live operating constraints instead of afterthought
                  metadata.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                  <Zap className="w-4 h-4 text-emerald-300" /> Grid tie-ins
                </div>
                <p className="text-sm text-gray-400">
                  Plants remain linked to transmission and balancing
                  dependencies so dispatchability is visible at the route level.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-orange-300" /> Corridor
              Watchlist
            </h2>
            <span className="text-xs uppercase tracking-[0.2em] text-gray-500">
              Enabled overlays only
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredCorridors.map((corridor) => (
              <div
                key={corridor.id}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                      {corridor.kind}
                    </p>
                    <h3 className="text-lg font-bold text-white mt-1">
                      {corridor.name}
                    </h3>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs border ${corridor.status === "Construction" ? "bg-amber-400/10 text-amber-200 border-amber-400/20" : "bg-emerald-400/10 text-emerald-200 border-emerald-400/20"}`}
                  >
                    {corridor.status}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-4">{corridor.summary}</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                    <div className="text-xs text-gray-500 mb-1">Region</div>
                    <div className="text-white">{corridor.region}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                    <div className="text-xs text-gray-500 mb-1">Capacity</div>
                    <div className="text-white">{corridor.throughput}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Building2 className="w-6 h-6 text-cyan-300" /> Fossil Asset
              Roster
            </h2>
            <Link
              href="/energy/infrastructure"
              className="inline-flex items-center gap-2 text-sm text-orange-200 hover:text-orange-100 transition-colors"
            >
              Open infrastructure matrix <span aria-hidden="true">/</span>
            </Link>
          </div>
          <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.04]">
            <table className="min-w-full text-sm">
              <thead className="border-b border-white/10 text-gray-500 uppercase tracking-[0.2em] text-xs">
                <tr>
                  <th className="px-4 py-4 text-left">Asset</th>
                  <th className="px-4 py-4 text-left">Fuel</th>
                  <th className="px-4 py-4 text-left">Region</th>
                  <th className="px-4 py-4 text-left">Status</th>
                  <th className="px-4 py-4 text-left">Capacity</th>
                  <th className="px-4 py-4 text-left">Watch</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlants.map((plant) => (
                  <tr
                    key={plant.id}
                    className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-4">
                      <button
                        onClick={() => setSelectedPlantId(plant.id)}
                        className="text-left"
                      >
                        <div className="font-semibold text-white">
                          {plant.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {plant.corridor}
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-4 text-gray-300">{plant.tech}</td>
                    <td className="px-4 py-4 text-gray-300">{plant.region}</td>
                    <td className="px-4 py-4 text-gray-300">{plant.status}</td>
                    <td className="px-4 py-4 text-gray-300">
                      {plant.capacity.toLocaleString()} MW
                    </td>
                    <td className="px-4 py-4 text-gray-400">
                      {plant.pressure}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-16 rounded-3xl border border-orange-300/20 bg-gradient-to-r from-orange-300/10 via-transparent to-cyan-300/10 p-6">
          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-orange-200/80 mb-2">
                Route recovery
              </p>
              <h2 className="text-2xl font-bold text-white mb-3">
                Coal is available both here and on its own page.
              </h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                Use the coal page for dedicated calculators and coal-specific
                monitoring, or stay here when you need to compare coal against
                gas, oil, LNG, and shared corridor constraints in one operating
                view.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link
                href="/energy/coal"
                className="px-4 py-2 rounded-full border border-orange-300/30 bg-orange-300/10 text-orange-100 text-sm hover:bg-orange-300/20 transition-colors"
              >
                Open coal page
              </Link>
              <Link
                href="/energy/oil-and-gas"
                className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-gray-200 text-sm hover:border-white/20 transition-colors"
              >
                Open oil and gas
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
