"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
} from "lucide-react";

import MasterMap, {
  type DataLayerKey,
  type MapViewMode,
} from "@/components/energy-infrastructure/MasterMap";
import TrendChart from "@/components/energy-infrastructure/TrendChart";
import TabbedDataGrid from "@/components/energy-infrastructure/TabbedDataGrid";
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
} from "@/components/EnergyInfrastructureMap";

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
}

const DASHBOARD_NAV: InfrastructureNavItem[] = [
  { id: "global-map", label: "Global Map", icon: Map },
  { id: "market-trends", label: "Market Trends", icon: LineChart },
  { id: "refineries", label: "Regional Refineries", icon: Factory },
  { id: "alerts", label: "Alerts", icon: Bell },
];

const CORRIDOR_COORDINATES: Array<{ region: string; lat: number; lng: number }> = [
  { region: "Strait of Hormuz", lat: 26.0, lng: 56.0 },
  { region: "Euro ARA Hubs", lat: 52.0, lng: 4.0 },
  { region: "US Gulf Coast", lat: 28.0, lng: -92.0 },
  { region: "Singapore / Malacca", lat: 2.0, lng: 102.0 },
  { region: "South China Sea", lat: 14.0, lng: 113.0 },
];

function computePriceTrend(commodities: any[], points = 8) {
  const labels = Array.from({ length: points }, (_, i) => `T-${points - 1 - i}`);
  const values = Array.from({ length: points }, (_, i) => {
    const weight = 1 + i * 0.01;
    const avg =
      commodities.length > 0
        ? commodities.reduce((sum, commodity) => sum + (commodity.price ?? 0), 0) /
          commodities.length
        : 0;
    return avg * weight;
  });
  return { labels, values };
}

function computeOutputTrend(grid: any[], points = 8) {
  const labels = Array.from({ length: points }, (_, i) => `W${i + 1}`);
  const base =
    grid.length > 0
      ? grid.reduce((sum, series) => sum + (Number(series.value) || 0), 0) /
        grid.length
      : 100;
  const values = labels.map((_, index) => base * (0.92 + index * 0.02));
  return { labels, values };
}

function buildCategoryComparison(commodities: any[]) {
  const labels = commodities.slice(0, 6).map((item) => item.label || item.symbol);
  const values = commodities.slice(0, 6).map((item) => Number(item.price) || 0);
  return { labels, values };
}

function mapLiveGridStress(liveGridStress: any[] | undefined): GridStressNode[] {
  if (!liveGridStress || liveGridStress.length === 0) {
    return DEFAULT_GRID_STRESS;
  }

  return liveGridStress.map((node: any) => ({
    id: node.id,
    name: node.name,
    lat: node.lat,
    lng: node.lng,
    loadPercent:
      typeof node.loadPercent === "number" ? node.loadPercent : (node.loadGW ?? null),
    capacityGW: typeof node.capacityGW === "number" ? node.capacityGW : 0,
    alert:
      node.alert === "critical" || node.alert === "elevated" || node.alert === "normal"
        ? node.alert
        : "normal",
  }));
}

function mapEvents(events: any[] | undefined, fallbackType: string): MapEvent[] {
  return (events || []).map((event, index) => ({
    id: event.id ?? `${fallbackType}-${index}`,
    title: event.title ?? event.name ?? fallbackType,
    type: event.type ?? fallbackType,
    severity:
      typeof event.severity === "number"
        ? event.severity
        : typeof event.threatScore === "number"
          ? event.threatScore
          : 50,
    lat: Number(event.lat ?? event.latitude ?? 0),
    lng: Number(event.lng ?? event.longitude ?? 0),
    region: event.region ?? "Global",
    timestamp: event.timestamp,
  }));
}

function mapShips(shipCounts: any[] | undefined): MapShip[] {
  return (shipCounts || []).flatMap((entry, index) => {
    const coord = CORRIDOR_COORDINATES.find((item) => item.region === entry.region);
    if (!coord) return [];
    return [
      {
        mmsi: `tank-${index}`,
        name: `${entry.region} Tankers`,
        type: "tanker",
        latitude: coord.lat + 0.35,
        longitude: coord.lng + 0.35,
        speed: 12,
        destination: "Transit",
      },
      {
        mmsi: `lng-${index}`,
        name: `${entry.region} LNG`,
        type: "lng",
        latitude: coord.lat - 0.3,
        longitude: coord.lng - 0.3,
        speed: 10,
        destination: "Hub",
      },
    ];
  });
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

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const response = await fetch("/api/energy/infrastructure", {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Failed to load data");
        const payload = await response.json();
        setLive(payload);
        setError(null);
      } catch {
        setError("Live data unavailable. Using static reference layers.");
      } finally {
        setLoading(false);
      }
    };

    fetchLive();
    const refreshId = setInterval(fetchLive, 60_000);
    return () => clearInterval(refreshId);
  }, []);

  const assets = DEFAULT_ASSETS;
  const corridors = DEFAULT_CORRIDORS;
  const flows: FlowRoute[] = DEFAULT_FLOWS;
  const climateEvents = mapEvents(live?.climate, "climate");
  const osintEvents = mapEvents(live?.osint, "osint");
  const ships = mapShips(live?.shipCounts);
  const gridStress = mapLiveGridStress(live?.gridStress);

  const priceTrend = computePriceTrend(live?.commodities || []);
  const outputTrend = computeOutputTrend(live?.grid || []);
  const categoryComparison = buildCategoryComparison(live?.commodities || []);
  const refineryRows = buildRefineryRows(assets);

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
        label: "Live Commodity Feeds",
        value: live?.commodities?.length || 0,
        accent: "text-amber-300",
      },
      {
        label: "Grid Stress Nodes",
        value: gridStress.length,
        accent: "text-rose-300",
      },
      {
        label: "Active Alerts",
        value: alertRows.length,
        accent: "text-rose-400",
      },
    ],
    [alertRows.length, assets.length, gridStress.length, live?.commodities?.length],
  );

  return (
    <main className="h-screen overflow-hidden bg-gray-950 text-gray-100 pt-32 pb-6">
      <div className="mx-auto h-full max-w-[1700px] px-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <Link
              href="/energy"
              className="inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-cyan-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Energy Hub
            </Link>
            <div className="mt-2 flex items-center gap-2">
              <Globe2 className="h-5 w-5 text-cyan-400" />
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Energy Infrastructure Dashboard
              </h1>
            </div>
            <p className="mt-1 text-sm text-gray-400">
              Interactive operating picture across map intelligence, market trends, and
              infrastructure resilience.
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-gray-300 transition hover:text-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {topSummary.map((card) => (
            <div key={card.label} className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-[11px] uppercase tracking-widest text-gray-500">{card.label}</p>
              <p className={`mt-1 text-xl font-semibold ${card.accent}`}>{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid h-[calc(100vh-14rem)] gap-4 lg:grid-cols-[250px_minmax(0,1fr)]">
          <InfrastructureSidebar
            items={DASHBOARD_NAV}
            lastUpdated={live?.timestamp ?? null}
            error={error}
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
                        document
                          .getElementById(item.id)
                          ?.scrollIntoView({ behavior: "smooth", block: "start" });
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
                  <h2 className="text-lg font-semibold text-gray-100">Unified Geospatial Map</h2>
                  <p className="text-xs text-gray-400">
                    Single master map with 2D/3D toggle, dataset layers, and in-map stats.
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
              />
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
                  title="Energy Output Trend"
                  subtitle="Synthetic weekly trend from live grid aggregates"
                  labels={outputTrend.labels}
                  values={outputTrend.values}
                  variant="line"
                  accent="#22d3ee"
                  valueSuffix=" GW"
                />
                <TrendChart
                  title="Pricing Trend"
                  subtitle="Rolling trend from current commodity basket"
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

            <section id="refineries" className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <header className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-100">Regional Refineries</h2>
                  <p className="text-xs text-gray-400">
                    Consolidated tabbed container replacing long stacked regional tables.
                  </p>
                </div>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[10px] uppercase tracking-wider text-cyan-200">
                  #refineries
                </span>
              </header>

              <TabbedDataGrid
                title="Infrastructure Assets by Region"
                subtitle="Refineries, LNG and key processing hubs"
                rows={refineryRows}
              />
            </section>

            <section id="alerts" className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <header className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-100">Alerts & Resilience</h2>
                  <p className="text-xs text-gray-400">
                    Distilled operational constraints and resilience dimensions.
                  </p>
                </div>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[10px] uppercase tracking-wider text-cyan-200">
                  #alerts
                </span>
              </header>

              <div className="grid gap-3 lg:grid-cols-2">
                <article className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-100">
                    <AlertTriangle className="h-4 w-4 text-rose-400" />
                    Active Constraints
                  </h3>
                  <div className="space-y-2">
                    {alertRows.length === 0 ? (
                      <p className="text-xs text-gray-500">No active constraints.</p>
                    ) : (
                      alertRows.map((item: any) => (
                        <div
                          key={item.label}
                          className="rounded-lg border border-white/10 bg-white/5 p-2"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-gray-100">{item.label}</p>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${
                                item.sev === "high"
                                  ? "bg-rose-500/20 text-rose-300"
                                  : item.sev === "medium"
                                    ? "bg-amber-500/20 text-amber-300"
                                    : "bg-gray-700 text-gray-300"
                              }`}
                            >
                              {item.sev}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-gray-400">{item.desc}</p>
                        </div>
                      ))
                    )}
                  </div>
                </article>

                <article className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-100">
                    <Activity className="h-4 w-4 text-emerald-400" />
                    Resilience Dimensions
                  </h3>
                  <div className="space-y-2">
                    {resilienceRows.length === 0 ? (
                      <p className="text-xs text-gray-500">No resilience indicators loaded.</p>
                    ) : (
                      resilienceRows.map((item: any) => (
                        <div
                          key={item.dim}
                          className="rounded-lg border border-white/10 bg-white/5 p-2"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <p className="font-medium text-gray-100">{item.dim}</p>
                            <span className="text-gray-300">{item.score}%</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div
                              className={`h-full ${
                                item.status === "High Concern"
                                  ? "bg-rose-500"
                                  : item.status === "Moderate Concern"
                                    ? "bg-amber-400"
                                    : "bg-emerald-400"
                              }`}
                              style={{ width: `${item.score}%` }}
                            />
                          </div>
                          <p className="mt-1 text-[11px] text-gray-400">{item.evidence}</p>
                        </div>
                      ))
                    )}
                  </div>
                </article>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
