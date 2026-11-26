"use client";

import { useEffect, useMemo, useState } from "react";
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
import dynamic from "next/dynamic";
import TierGate from "@/components/entitlement/TierGate";
import {
  REGION_BBOX,
  STATUS_LABELS,
  type FuelType,
  type PlantStatus,
} from "@/config/energyLayers";
const EnergyInfrastructureGlobe = dynamic(
  () => import("@/components/EnergyInfrastructureGlobe"),
  { ssr: false },
);

type FossilPlant = {
  id: string;
  name: string;
  fuel: FuelType;
  status: PlantStatus;
  capacityMW: number | null;
  owner: string | null;
  country: string;
  year: number | null;
  source: string;
};

type PlantFeature = {
  properties: FossilPlant;
};

type PlantResponse = {
  features: PlantFeature[];
  metadata?: {
    totalCount?: number;
    totalCapacityMW?: number;
  };
};

type FossilRegion = "North America" | "Europe" | "Asia-Pacific" | "Middle East";

type Corridor = {
  id: string;
  name: string;
  kind: string;
  region: FossilRegion;
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
const ROSTER_PAGE_SIZE = 25;

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

/**
 * Basic-tier gate (src/lib/entitlements.ts): Energy Hub Beta desks are part
 * of the GeoMoney Basic subscription. Free/guest viewers see the locked panel
 * with the Get Basic unlock CTA; Basic+ and admins get the full desk.
 */
export default function FossilEnergyPage() {
  return (
    <TierGate
      module="energy-hub"
      mode="replace"
      heading="Fossil Energy Desk — Energy Hub (Beta)"
      previewImage="/images/energy/desk-fossil.jpg"
      className="flex min-h-screen items-center justify-center bg-[#06080d] px-4 py-24"
    >
      <FossilEnergyExperience />
    </TierGate>
  );
}

function FossilEnergyExperience() {
  const [technology, setTechnology] =
    useState<(typeof TECHNOLOGIES)[number]>("All");
  const [region, setRegion] = useState<(typeof REGIONS)[number]>("Global");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("Operating");
  const [activeOverlays, setActiveOverlays] = useState<
    (typeof OVERLAYS)[number][]
  >(["Gas Pipelines", "Export Terminals"]);
  const [plants, setPlants] = useState<FossilPlant[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalCapacityMW, setTotalCapacityMW] = useState(0);
  const [rosterPage, setRosterPage] = useState(1);
  const [requestVersion, setRequestVersion] = useState(0);
  const [plantsLoading, setPlantsLoading] = useState(true);
  const [plantError, setPlantError] = useState<string | null>(null);

  const filteredCorridors = useMemo(() => {
    return CORRIDORS.filter((corridor) => {
      if (region !== "Global" && corridor.region !== region) return false;
      if (!activeOverlays.includes(corridor.kind as (typeof OVERLAYS)[number]))
        return false;
      return true;
    });
  }, [activeOverlays, region]);

  const toggleOverlay = (overlay: (typeof OVERLAYS)[number]) => {
    setActiveOverlays((current) =>
      current.includes(overlay)
        ? current.filter((item) => item !== overlay)
        : [...current, overlay],
    );
  };

  const plantQuery = useMemo(() => {
    const techMap: Record<string, FuelType[]> = {
      Coal: ["Coal"],
      Gas: ["Gas"],
      Oil: ["Oil"],
      LNG: ["Gas"],
    };
    const statusMap: Record<string, PlantStatus[]> = {
      Operating: ["operating"],
      Construction: ["construction"],
      Permitting: ["announced", "pre-construction"],
    };
    return {
      fuels: technology === "All" ? ["Coal", "Gas", "Oil"] as FuelType[] : techMap[technology],
      statuses: statusMap[status] ?? ["operating"],
      bbox: region === "Global" ? undefined : REGION_BBOX[region],
      minMW: 50,
    };
  }, [technology, region, status]);
  const plantQueryKey = JSON.stringify(plantQuery);

  useEffect(() => {
    setRosterPage(1);
  }, [plantQueryKey]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (plantQuery.fuels?.length) params.set("fuels", plantQuery.fuels.join(","));
    if (plantQuery.statuses?.length) params.set("status", plantQuery.statuses.join(","));
    if (plantQuery.bbox) params.set("bbox", plantQuery.bbox.join(","));
    params.set("minMW", String(plantQuery.minMW));
    params.set("limit", String(ROSTER_PAGE_SIZE));
    params.set("offset", String((rosterPage - 1) * ROSTER_PAGE_SIZE));

    async function loadPlants() {
      setPlantsLoading(true);
      setPlantError(null);
      setPlants([]);
      try {
        const response = await fetch(`/api/map/power-plants?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Plant inventory returned HTTP ${response.status}`);
        const data = (await response.json()) as PlantResponse;
        setPlants(data.features.map((feature) => feature.properties));
        setTotalCount(data.metadata?.totalCount ?? data.features.length);
        setTotalCapacityMW(data.metadata?.totalCapacityMW ?? 0);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("[Fossil roster] plant inventory failed:", error);
        setTotalCount(0);
        setTotalCapacityMW(0);
        setPlantError("The sourced fossil asset roster could not load. Please retry.");
      } finally {
        if (!controller.signal.aborted) setPlantsLoading(false);
      }
    }

    loadPlants();
    return () => controller.abort();
    // The serialized query is the stable request contract; object identity changes each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plantQueryKey, rosterPage, requestVersion]);

  const totalPages = Math.max(1, Math.ceil(totalCount / ROSTER_PAGE_SIZE));
  const pageStart = totalCount === 0 ? 0 : (rosterPage - 1) * ROSTER_PAGE_SIZE + 1;
  const pageEnd = Math.min(rosterPage * ROSTER_PAGE_SIZE, totalCount);

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
                    Sourced Plant Inventory
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                      <div className="text-2xl font-bold text-white">
                        {plantsLoading ? "…" : totalCount.toLocaleString()}
                      </div>
                      <div className="text-gray-500 text-xs mt-1">
                        Matching source records
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                      <div className="text-2xl font-bold text-white">
                        {plants.length}
                      </div>
                      <div className="text-gray-500 text-xs mt-1">
                        Assets on this page
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-3 col-span-2">
                      <div className="text-2xl font-bold text-white">
                        {Math.round(totalCapacityMW).toLocaleString()} MW
                      </div>
                      <div className="text-gray-500 text-xs mt-1">
                        Reported capacity behind the current filter stack
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
                        aria-pressed={technology === item}
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
                        aria-pressed={region === item}
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
                        aria-pressed={status === item}
                        className={`px-3 py-1.5 rounded-full border text-xs transition-colors ${status === item ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100" : "border-white/10 bg-white/5 text-gray-400 hover:text-white"}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">
                    Watchlist categories (not map overlays)
                  </p>
                  <div className="space-y-2">
                    {OVERLAYS.map((overlay) => (
                      <button
                        key={overlay}
                        onClick={() => toggleOverlay(overlay)}
                        aria-pressed={activeOverlays.includes(overlay)}
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
          <div className="rounded-3xl border border-white/10 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 text-sm">
              <div className="flex flex-wrap gap-2 text-gray-300">
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-emerald-200">
                  Reference: WRI GPPD v1.3 · 34.9k plants
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">{region}</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  {technology} • {status}
                </span>
              </div>
            </div>
            <p className="p-4 text-xs text-gray-300">Historical reference inventory, not current operating telemetry. All source records are classified operating; construction/permitting coverage is unavailable. LNG maps gas-fired plants, not LNG terminals. Corridor watchlist entries remain separate illustrative clusters; roster totals and rows use the sourced WRI inventory.</p>
            {/*
              Always render the map. Previously a non-"Operating" status filter
              replaced the whole panel with a one-line empty message, which made
              the page look like it had no data (client feedback).
            */}
            <EnergyInfrastructureGlobe plants={plantQuery} height="560px" />
            {status !== "Operating" && (
              <div role="status" className="border-t border-white/10 p-4 text-xs leading-relaxed text-gray-300">
                <span className="mr-2 inline-block rounded border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 font-semibold uppercase tracking-wider text-amber-200">
                  Coverage note
                </span>
                The current reference dataset contains no <strong>{status.toLowerCase()}</strong> records for this filter,
                so the map and roster show no matching source rows. Absence in this reference dataset is not evidence
                that no such projects exist.
              </div>
            )}
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
              Selected watchlist categories
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

        <section aria-busy={plantsLoading}>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Building2 className="w-6 h-6 text-cyan-300" /> Fossil Asset Roster
              </h2>
              <p className="mt-2 text-xs text-gray-400">
                {plantsLoading ? "Loading sourced inventory…" : `${totalCount.toLocaleString()} WRI reference records match these filters`}
              </p>
            </div>
            <Link
              href="/energy/infrastructure"
              className="inline-flex items-center gap-2 text-sm text-orange-200 hover:text-orange-100 transition-colors"
            >
              Open infrastructure matrix <span aria-hidden="true">/</span>
            </Link>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b border-white/10 text-gray-500 uppercase tracking-[0.2em] text-xs">
                  <tr>
                    <th className="px-4 py-4 text-left">Asset</th>
                    <th className="px-4 py-4 text-left">Fuel</th>
                    <th className="px-4 py-4 text-left">Country</th>
                    <th className="px-4 py-4 text-left">Status</th>
                    <th className="px-4 py-4 text-left">Capacity</th>
                    <th className="px-4 py-4 text-left">Source / year</th>
                  </tr>
                </thead>
                <tbody>
                  {plantsLoading && (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-300">Loading sourced fossil assets…</td></tr>
                  )}
                  {!plantsLoading && plantError && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center">
                        <p role="alert" className="text-amber-200">{plantError}</p>
                        <button
                          type="button"
                          onClick={() => setRequestVersion((version) => version + 1)}
                          className="mt-4 rounded-full border border-orange-300/30 bg-orange-300/10 px-4 py-2 text-xs text-orange-100 hover:bg-orange-300/20"
                        >
                          Retry roster
                        </button>
                      </td>
                    </tr>
                  )}
                  {!plantsLoading && !plantError && plants.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-300">No WRI reference records match these filters. This source has no construction/permitting coverage; absence is not evidence that no real assets exist.</td></tr>
                  )}
                  {!plantsLoading && !plantError && plants.map((plant) => (
                    <tr
                      key={plant.id}
                      className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-4">
                        <div className="font-semibold text-white">{plant.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {plant.owner || "Owner not reported"}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-300">{plant.fuel}</td>
                      <td className="px-4 py-4 text-gray-300">{plant.country}</td>
                      <td className="px-4 py-4 text-gray-300">{STATUS_LABELS[plant.status]}</td>
                      <td className="px-4 py-4 text-gray-300 whitespace-nowrap">
                        {plant.capacityMW == null
                          ? "Not reported"
                          : `${plant.capacityMW.toLocaleString(undefined, { maximumFractionDigits: 1 })} MW`}
                      </td>
                      <td className="px-4 py-4 text-gray-400">
                        <div>{plant.source}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          {plant.year == null ? "Commissioning year not reported" : `Commissioned: ${plant.year}`}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <nav aria-label="Fossil asset roster pages" className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-xs">
              <span className="text-gray-400" aria-live="polite">
                {totalCount > 0 ? `Showing ${pageStart.toLocaleString()}–${pageEnd.toLocaleString()} of ${totalCount.toLocaleString()}` : "No records to display"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRosterPage((current) => Math.max(1, current - 1))}
                  disabled={plantsLoading || rosterPage <= 1}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-gray-300 enabled:hover:bg-white/10 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-2 text-gray-400">Page {rosterPage} of {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setRosterPage((current) => Math.min(totalPages, current + 1))}
                  disabled={plantsLoading || rosterPage >= totalPages}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-gray-300 enabled:hover:bg-white/10 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </nav>
          </div>
        </section>

        <section className="mt-16 rounded-3xl border border-orange-300/20 bg-gradient-to-r from-orange-300/10 via-transparent to-cyan-300/10 p-6">
          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-orange-200/80 mb-2">
                Dedicated coal tools
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
