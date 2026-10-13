"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import EnergyDataNotice from "@/components/EnergyDataNotice";
import {
  ArrowLeft,
  Globe2,
  Map,
  LineChart,
  Table2,
  Bell,
  Factory,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Activity,
  AlertTriangle,
  Gauge,
  Route,
  TrendingUp,
  TrendingDown,
  Sliders,
} from "lucide-react";

import MasterMap, {
  type DataLayerKey,
  type MapViewMode,
} from "@/components/energy-infrastructure/MasterMap";
import TrendChart from "@/components/energy-infrastructure/TrendChart";
import AssetInspectorTweaker from "@/components/energy-infrastructure/AssetInspectorTweaker";
import SupplyDemandEquilibrium from "@/components/energy-infrastructure/SupplyDemandEquilibrium";
import AssetFleetMatrix from "@/components/energy-infrastructure/AssetFleetMatrix";
import ThreatCalamityRadar from "@/components/energy-infrastructure/ThreatCalamityRadar";
import InfrastructureSidebar, {
  type InfrastructureNavItem,
} from "@/components/energy-infrastructure/InfrastructureSidebar";

import type {
  FlowRoute,
  GridStressNode,
  InfraLayer,
  MapAsset,
  MapEvent,
  MapShip,
} from "@/components/EnergyInfrastructureMap";
import {
  DEFAULT_ASSETS,
  DEFAULT_CORRIDORS,
  DEFAULT_FLOWS,
  DEFAULT_GRID_STRESS,
  getEnrichedAssets,
  enrichAssetWithTelemetry,
} from "@/components/energy-infrastructure/infraDefaults";

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
  gridStress: any[];
  interdependency: any;
  supplyDemandBalance?: any;
  macroIndicators?: any;
  notice?: string;
}

const DASHBOARD_NAV: InfrastructureNavItem[] = [
  { id: "global-map", label: "Unified Map", icon: Map },
  { id: "inspector", label: "Asset Inspector", icon: Sliders },
  { id: "supply-demand", label: "Supply / Demand", icon: Activity },
  { id: "threat-radar", label: "Threat Radar", icon: Bell },
  { id: "fleet-matrix", label: "Fleet Matrix", icon: Factory },
  { id: "market-trends", label: "Market Trends", icon: LineChart },
];

function computePriceTrend(commodities: any[]) {
  const crude = commodities.find((c) => c.symbol === "CRUDE");
  const currentPrice = Number(crude?.price) || 78.42;

  const labels = ["D-6", "D-5", "D-4", "D-3", "D-2", "D-1", "Today"];
  const values = [
    Number((currentPrice * 0.978).toFixed(2)),
    Number((currentPrice * 0.985).toFixed(2)),
    Number((currentPrice * 0.981).toFixed(2)),
    Number((currentPrice * 0.992).toFixed(2)),
    Number((currentPrice * 0.995).toFixed(2)),
    Number((currentPrice * 0.998).toFixed(2)),
    currentPrice,
  ];
  return { labels, values };
}

function computeOutputTrend(grid: any[]) {
  const labels = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "23:59"];
  const values = [48.5, 45.2, 59.4, 73.1, 77.8, 74.6, 57.2];
  return { labels, values };
}

function buildCategoryComparison(commodities: any[]) {
  if (commodities && commodities.length > 0) {
    const list = commodities.slice(0, 6);
    return {
      labels: list.map((item) => item.label || item.symbol),
      values: list.map((item) => Number(item.price) || 0),
    };
  }
  return {
    labels: ["WTI Crude", "Brent", "Henry Hub", "Dutch TTF", "Coal", "Uranium"],
    values: [78.42, 82.15, 24.8, 34.8, 132.5, 85.5],
  };
}

function mapLiveGridStress(liveGridStress: any[] | undefined): GridStressNode[] {
  if (!liveGridStress || liveGridStress.length === 0) {
    return []; // Missing demand observations must not become reference stress alerts.
  }

  return liveGridStress.map((node: any) => ({
    id: node.id,
    name: node.name,
    lat: node.lat,
    lng: node.lng,
    loadPercent: typeof node.loadPercent === "number" ? node.loadPercent : null,
    capacityGW: typeof node.capacityGW === "number" ? node.capacityGW : 0,
    alert:
      node.alert === "critical" || node.alert === "elevated" || node.alert === "normal"
        ? node.alert
        : "normal",
  }));
}

function mapEvents(events: any[] | undefined, fallbackType: string): MapEvent[] {
  return (events || []).filter((event) => Number.isFinite(event.lat ?? event.latitude) && Number.isFinite(event.lng ?? event.longitude)).map((event, index) => ({
    id: event.id ?? `${fallbackType}-${index}`,
    title: event.title ?? event.name ?? fallbackType,
    type: event.type ?? fallbackType,
    severity:
      typeof event.severity === "number"
        ? event.severity
        : typeof event.threatScore === "number"
          ? event.threatScore
          : 50,
    lat: Number(event.lat ?? event.latitude ?? NaN),
    lng: Number(event.lng ?? event.longitude ?? NaN),
    region: event.region ?? "Global",
    timestamp: event.timestamp,
  }));
}

function buildRefineryRows(assets: MapAsset[]) {
  return assets
    .filter(
      (asset) =>
        asset.name.toLowerCase().includes("refinery") ||
        asset.tech === "Oil" ||
        asset.tech === "LNG",
    )
    .slice(0, 18)
    .map((asset) => ({
      name: asset.name,
      region: asset.region,
      technology: asset.tech,
      layer: asset.layer,
      capacity: asset.capacity || "—",
      status: asset.status || "Unknown",
    }));
}

export default function EnergyInfrastructurePage() {
  const [live, setLive] = useState<LiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mapView, setMapView] = useState<MapViewMode>("2d");
  const [activeLayer, setActiveLayer] = useState<InfraLayer>("all");
  const [dataLayerState, setDataLayerState] = useState<Record<DataLayerKey, boolean>>({
    globalInfrastructure: true,
    liveAssetTracking: true,
    regionalHubs: true,
  });

  const [rawDataOpen, setRawDataOpen] = useState(false);

  const fetchLive = useCallback(async (refresh = false) => {
      setLoading(true);
      try {
        const response = await fetch(`/api/energy/infrastructure${refresh ? "?refresh=1" : ""}`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Failed to load data");
        const payload = await response.json();
        setLive(payload);
        setError(null);
      } catch {
        setError("Refresh failed. Previous observations may be stale; reference layers remain available.");
      } finally {
        setLoading(false);
      }
  }, []);
  useEffect(() => {
    fetchLive();
    const refreshId = setInterval(() => fetchLive(), 60_000);
    return () => clearInterval(refreshId);
  }, [fetchLive]);

  const enrichedAssets = useMemo(() => getEnrichedAssets(), []);
  const [selectedAsset, setSelectedAsset] = useState<MapAsset>(() => enrichedAssets[0]);
  const [monitoredAssetIds, setMonitoredAssetIds] = useState<string[]>([]);
  const [userNotesMap, setUserNotesMap] = useState<Record<string, string>>({});
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<
    "inspector" | "supply-demand" | "threat-radar" | "fleet-matrix"
  >("inspector");

  const navigateWorkspace = (id: string) => {
    const isTab = ["inspector", "supply-demand", "threat-radar", "fleet-matrix"].includes(id);
    if (isTab) setActiveWorkspaceTab(id as typeof activeWorkspaceTab);
    document.getElementById(isTab ? "workspace-console" : id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
  };

  // LocalStorage persistence for user's watched assets and notes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("geomoney_monitored_assets");
        if (saved) setMonitoredAssetIds(JSON.parse(saved));
        const savedNotes = localStorage.getItem("geomoney_asset_notes");
        if (savedNotes) setUserNotesMap(JSON.parse(savedNotes));
      } catch {}
    }
  }, []);

  const handleToggleMonitored = (assetId: string) => {
    setMonitoredAssetIds((prev) => {
      const next = prev.includes(assetId)
        ? prev.filter((id) => id !== assetId)
        : [...prev, assetId];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("geomoney_monitored_assets", JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  const handleSaveNotes = (assetId: string, notes: string) => {
    setUserNotesMap((prev) => {
      const next = { ...prev, [assetId]: notes };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("geomoney_asset_notes", JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  const assets = enrichedAssets;
  const corridors = DEFAULT_CORRIDORS;
  const flows: FlowRoute[] = DEFAULT_FLOWS;
  const climateEvents = mapEvents(live?.climate, "climate");
  const osintEvents = mapEvents(live?.osint, "osint");
  const ships: MapShip[] = []; // No position feed connected; never synthesize AIS markers.
  const gridStress = mapLiveGridStress(live?.gridStress);

  const priceTrend = computePriceTrend(live?.commodities || []);
  const outputTrend = computeOutputTrend(live?.grid || []);
  const categoryComparison = buildCategoryComparison(live?.commodities || []);
  const refineryRows = buildRefineryRows(assets);
  const interdependency = live?.interdependency ?? null;
  const supplyDemandBalance = live?.supplyDemandBalance ?? null;
  const macroIndicators = live?.macroIndicators ?? null;

  const alertRows = (live?.constraints || []).slice(0, 8);
  const resilienceRows = (live?.resilience || []).slice(0, 6);

  const onToggleDataLayer = (layer: DataLayerKey) => {
    setDataLayerState((previous) => ({
      ...previous,
      [layer]: !previous[layer],
    }));
  };

  const topSummary = useMemo(
    () => [
      {
        label: "Mapped Assets",
        value: assets.length,
        accent: "text-cyan-300",
      },
      {
        label: "Observed Quote Feeds",
        value: live?.commodities?.length ?? 0,
        accent: "text-amber-300",
      },
      {
        label: "Grid Stress Nodes",
        value: gridStress.length,
        accent: "text-rose-300",
      },
      {
        label: "Watched Assets",
        value: monitoredAssetIds.length,
        accent: "text-emerald-400",
      },
    ],
    [assets.length, gridStress.length, live?.commodities?.length, monitoredAssetIds.length],
  );

  const liveCommoditiesList = live?.commodities ?? [];

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 pt-28 pb-12">
      <div className="mx-auto max-w-[1720px] px-4 sm:px-6 lg:px-8">
        {/* Top Header */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
          <div>
            <Link
              href="/energy"
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 transition hover:text-cyan-300"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Energy Hub
            </Link>
            <div className="mt-1 flex items-center gap-2">
              <Globe2 className="h-6 w-6 text-cyan-400" />
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Energy Infrastructure Command Desk
              </h1>
            </div>
            <p className="mt-0.5 text-xs text-gray-400">
              Reference infrastructure, provider observations and clearly labelled planning simulations.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => fetchLive(true)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-gray-300 transition hover:text-white"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Feeds
            </button>
          </div>
        </div>

        <div role="status" className="mb-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-gray-300">
          {live?.notice || "Reference assets and illustrative scenario assumptions. Awaiting provider observations; no live vessel positions are connected."}
          {error && <p className="mt-2 text-rose-300">{error}</p>}
        </div>

        {/* Live Commodity Ticker Strip */}
        <div className="mb-4 overflow-x-auto rounded-xl border border-white/10 bg-black/60 p-2 backdrop-blur-md" style={{ scrollbarWidth: "none" }}>
          <div className="flex items-center gap-4 min-w-max">
            <div className="flex items-center gap-1.5 border-r border-white/15 pr-3 text-[11px] font-semibold uppercase tracking-wider text-cyan-300">
              <Activity className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
              Provider quotes
            </div>
            {liveCommoditiesList.map((c: any) => {
              const isUp = Number(c.changePercent || 0) >= 0;
              return (
                <div key={c.symbol} className="flex items-center gap-1.5 text-xs font-mono">
                  <span className="font-semibold text-gray-300">{c.label || c.symbol}:</span>
                  <EnergyDataNotice status={c.dataStatus || "unavailable"} source={c.source || "Stored quote"} observedAt={c.lastTradingTimestamp} />
                  <span className="font-bold text-white">${Number(c.price || 0).toFixed(2)}</span>
                  <span
                    className={`rounded px-1 py-0.2 text-[10px] font-bold ${
                      isUp ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                    }`}
                  >
                    {isUp ? "+" : ""}{Number(c.changePercent || 0).toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="mb-4 grid gap-3 grid-cols-2 lg:grid-cols-4">
          {topSummary.map((card) => (
            <div key={card.label} className="rounded-xl border border-white/10 bg-black/40 p-3">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">{card.label}</p>
              <p className={`mt-1 text-2xl font-bold font-mono ${card.accent}`}>{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid h-[calc(100vh-14rem)] gap-4 lg:grid-cols-[250px_minmax(0,1fr)]">
          <InfrastructureSidebar
            items={DASHBOARD_NAV}
            lastUpdated={live?.timestamp ?? null}
            error={error}
            onNavigate={navigateWorkspace}
          />

          <div className="h-full space-y-4 overflow-y-auto pr-1">
            <div className="sticky top-0 z-10 -mx-1 rounded-xl border border-white/10 bg-black/80 px-2 py-2 backdrop-blur-md lg:hidden">
              <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {DASHBOARD_NAV.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={(event) => {
                        event.preventDefault();
                        navigateWorkspace(item.id);
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] whitespace-nowrap text-gray-300"
                    >
                      <Icon className="h-3.5 w-3.5 text-cyan-300" />
                      {item.label}
                    </a>
                  );
                })}
              </div>
            </div>

            <section id="global-map" className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <header className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-100">Unified Geospatial Operating Picture</h2>
                  <p className="text-xs text-gray-400">
                    Interactive 2D/3D master map. Click any facility marker to inspect & simulate outage impact.
                  </p>
                </div>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[10px] uppercase tracking-wider text-cyan-200">
                  #global-map
                </span>
              </header>
              <MasterMap
                mapView={mapView}
                onMapViewChange={setMapView}
                activeLayer={activeLayer}
                onActiveLayerChange={setActiveLayer}
                dataLayerState={dataLayerState}
                onToggleDataLayer={onToggleDataLayer}
                assets={assets}
                corridors={corridors}
                flows={flows}
                gridStress={gridStress}
                climateEvents={climateEvents}
                osintEvents={osintEvents}
                ships={ships}
                updatedAt={live?.timestamp ?? null}
                onAssetClick={(clicked) => {
                  setSelectedAsset(enrichAssetWithTelemetry(clicked));
                  setActiveWorkspaceTab("inspector");
                  const el = document.getElementById("workspace-console");
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              />
            </section>
            {/* Contextual Intelligence & Outage Workspace */}
            <section id="workspace-console" className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-3">
                <div>
                  <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-amber-400" />
                    Infrastructure Intelligence & Outage Workspace
                  </h2>
                  <p className="text-xs text-gray-400">
                    Simulate outage impacts, inspect supply-demand balances, monitor threat radars, and manage your watchlist.
                  </p>
                </div>

                {/* Workspace Mode Tabs */}
                <div className="flex flex-wrap gap-1.5 self-start sm:self-auto">
                  <button
                    type="button"
                    aria-pressed={activeWorkspaceTab === "inspector"}
                  onClick={() => setActiveWorkspaceTab("inspector")}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      activeWorkspaceTab === "inspector"
                        ? "border-cyan-400/60 bg-cyan-400/20 text-cyan-300"
                        : "border-white/10 bg-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    <Sliders className="h-3.5 w-3.5" />
                    Asset Inspector & Tweaker
                  </button>
                  <button
                    type="button"
                    aria-pressed={activeWorkspaceTab === "supply-demand"}
                  onClick={() => setActiveWorkspaceTab("supply-demand")}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      activeWorkspaceTab === "supply-demand"
                        ? "border-amber-400/60 bg-amber-400/20 text-amber-300"
                        : "border-white/10 bg-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    <Activity className="h-3.5 w-3.5" />
                    Supply / Demand Balance
                  </button>
                  <button
                    type="button"
                    aria-pressed={activeWorkspaceTab === "threat-radar"}
                  onClick={() => setActiveWorkspaceTab("threat-radar")}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      activeWorkspaceTab === "threat-radar"
                        ? "border-rose-400/60 bg-rose-400/20 text-rose-300"
                        : "border-white/10 bg-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    <Bell className="h-3.5 w-3.5" />
                    Threat Radar
                  </button>
                  <button
                    type="button"
                    aria-pressed={activeWorkspaceTab === "fleet-matrix"}
                  onClick={() => setActiveWorkspaceTab("fleet-matrix")}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      activeWorkspaceTab === "fleet-matrix"
                        ? "border-purple-400/60 bg-purple-400/20 text-purple-300"
                        : "border-white/10 bg-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    <Factory className="h-3.5 w-3.5" />
                    Fleet Matrix ({monitoredAssetIds.length} Watched)
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="mt-4">
                {activeWorkspaceTab === "inspector" && (
                  <AssetInspectorTweaker
                    key={selectedAsset.id}
                    asset={selectedAsset}
                    climateEvents={live?.climate || []}
                    osintEvents={live?.osint || []}
                    commodities={live?.commodities || liveCommoditiesList}
                    isMonitored={monitoredAssetIds.includes(selectedAsset.id)}
                    onToggleMonitored={handleToggleMonitored}
                    userNotes={userNotesMap[selectedAsset.id] || ""}
                    onSaveNotes={handleSaveNotes}
                  />
                )}

                {activeWorkspaceTab === "supply-demand" && (
                  <SupplyDemandEquilibrium
                    balance={supplyDemandBalance}
                    macro={macroIndicators}
                  />
                )}

                {activeWorkspaceTab === "threat-radar" && (
                  <ThreatCalamityRadar climateEvents={live?.climate || []} osintEvents={live?.osint || []} />
                )}

                {activeWorkspaceTab === "fleet-matrix" && (
                  <AssetFleetMatrix
                    assets={assets}
                    selectedAssetId={selectedAsset.id}
                    onSelectAsset={(asset) => {
                      setSelectedAsset(enrichAssetWithTelemetry(asset));
                      setActiveWorkspaceTab("inspector");
                    }}
                    monitoredAssetIds={monitoredAssetIds}
                    onToggleMonitored={handleToggleMonitored}
                  />
                )}
              </div>
            </section>

            <section id="market-trends" className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <header className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-100">
                    Market Intelligence & Trends
                  </h2>
                  <p className="text-xs text-gray-400">
                    Visualization-first view with trend and comparison charts.
                  </p>
                </div>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[10px] uppercase tracking-wider text-cyan-200">
                  #market-trends
                </span>
              </header>

              <div className="grid gap-3 lg:grid-cols-3">
                <TrendChart
                  title="Illustrative Output Profile"
                  subtitle="Fixed example daily profile — not observed output"
                  labels={outputTrend.labels}
                  values={outputTrend.values}
                  variant="line"
                  accent="#22d3ee"
                  valueSuffix=" GW"
                />
                <TrendChart
                  title="Illustrative Pricing Profile"
                  subtitle="Modelled profile — not historical market prices"
                  labels={priceTrend.labels}
                  values={priceTrend.values}
                  variant="line"
                  accent="#f59e0b"
                  valuePrefix="$"
                />
                <TrendChart
                  title="Commodity Comparison"
                  subtitle="Current categorical price comparison"
                  labels={categoryComparison.labels}
                  values={categoryComparison.values}
                  variant="bar"
                  accent="#fb7185"
                  valuePrefix="$"
                />
              </div>

              <div className="mt-3">
                <button
                  onClick={() => setRawDataOpen((previous) => !previous)}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-gray-300 hover:text-gray-100"
                >
                  <Table2 className="h-3.5 w-3.5" />
                  {rawDataOpen ? "Hide Raw Data" : "View Raw Data"}
                  {rawDataOpen ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>

                {rawDataOpen && (
                  <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-black/40">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-gray-500">
                          <th className="px-3 py-2">Commodity</th>
                          <th className="px-3 py-2">Price</th>
                          <th className="px-3 py-2">Change %</th>
                          <th className="px-3 py-2">Market</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(live?.commodities || []).map((commodity: any) => (
                          <tr key={commodity.symbol} className="border-b border-white/5">
                            <td className="px-3 py-2 text-gray-100">{commodity.label}</td>
                            <td className="px-3 py-2 text-gray-300">
                              ${Number(commodity.price || 0).toFixed(2)}
                            </td>
                            <td
                              className={`px-3 py-2 ${
                                Number(commodity.changePercent) >= 0
                                  ? "text-emerald-300"
                                  : "text-rose-300"
                              }`}
                            >
                              {Number(commodity.changePercent || 0).toFixed(2)}%
                            </td>
                            <td className="px-3 py-2 text-gray-400">
                              {commodity.marketStatus || "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            <section id="interdependency" className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <header className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-100">
                    Illustrative Interdependency Models
                  </h2>
                  <p className="text-xs text-gray-400">
                    Heuristic planning indices, not validated trading signals. Missing feeds do not establish a balanced market or low risk.
                  </p>
                </div>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[10px] uppercase tracking-wider text-cyan-200">
                  #interdependency
                </span>
              </header>

              <div className="grid gap-3 lg:grid-cols-3">
                <TrendChart
                  title="Interdependency Pressure"
                  subtitle="Storage, corridor and utilization risk index"
                  labels={["Current", "Signal"]}
                  values={interdependency ? [interdependency.corridorStress, interdependency.pressureIndex] : [0, 0]}
                  variant="bar"
                  accent="#f59e0b"
                  valueSuffix=" pts"
                />
                <TrendChart
                  title="Oil / Gas Spread"
                  subtitle="WTI crude vs natural gas market transmission"
                  labels={["Current", "Signal"]}
                  values={interdependency?.oilGasSpread ? [interdependency.oilGasSpread, interdependency.oilGasSpread * 0.98] : [0, 0]}
                  variant="line"
                  accent="#fb7185"
                  valueSuffix="x"
                />
                <TrendChart
                  title="Supply Chain Resilience"
                  subtitle="Infrastructure capacity vs external shocks"
                  labels={["Current", "Signal"]}
                  values={interdependency ? [interdependency.pressureIndex, 100 - interdependency.pressureIndex] : [0, 0]}
                  variant="bar"
                  accent="#22d3ee"
                  valueSuffix=" pts"
                />
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-4">
                <article className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-widest text-gray-500">Market Bias</p>
                    <Gauge className="h-4 w-4 text-cyan-300" />
                  </div>
                  <p className="mt-2 text-lg font-semibold text-gray-100">
                    {interdependency?.marketBias ?? "Balanced"}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-400">
                    {interdependency?.traderStance ?? "Awaiting live feed"}
                  </p>
                </article>

                <article className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-widest text-gray-500">Routing Stress</p>
                    <Route className="h-4 w-4 text-amber-300" />
                  </div>
                  <p className="mt-2 text-lg font-semibold text-gray-100">
                    {interdependency ? `${interdependency.corridorStress}%` : "N/A"}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-400">
                    Chokepoints, ports, pipelines and terminal bottlenecks
                  </p>
                </article>

                <article className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-widest text-gray-500">Oil / Gas</p>
                    <TrendingUp className="h-4 w-4 text-emerald-300" />
                  </div>
                  <p className="mt-2 text-lg font-semibold text-gray-100">
                    {interdependency?.oilGasSpread ?? "N/A"}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-400">
                    Price spread used as a directional energy signal
                  </p>
                </article>

                <article className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-widest text-gray-500">Supply Chain</p>
                    <TrendingDown className="h-4 w-4 text-rose-300" />
                  </div>
                  <p className="mt-2 text-lg font-semibold text-gray-100">
                    {interdependency?.signals.length ?? 0} signals
                  </p>
                  <p className="mt-1 text-[11px] text-gray-400">
                    Storage, refinery utilization and corridor congestion
                  </p>
                </article>
              </div>
            </section>

            {/* Operational constraints are integrated inside the Threat & Calamity Radar tab */}
            <div className="hidden" />
          </div>
        </div>
      </div>
    </main>
  );
}
