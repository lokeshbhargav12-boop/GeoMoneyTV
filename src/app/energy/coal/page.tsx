"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Calculator,
  Factory,
  Flame,
  Gauge,
  Mountain,
  Route,
  Ship,
  TrendingUp,
  Zap,
  Loader2,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import CoalAiBrief from "@/components/CoalAiBrief";
import CoalCalculators from "@/components/CoalCalculators";
import CoalArbitrage from "@/components/CoalArbitrage";
import CoalBenchmarkChart from "@/components/CoalBenchmarkChart";
import CoalIntelligenceFeed from "@/components/CoalIntelligenceFeed";

const CoalRouteMap = dynamic(() => import("@/components/CoalRouteMap"), { ssr: false });

interface CoalMarketData {
  timestamp: string;
  benchmarks: {
    label: string;
    symbol: string;
    price: number | null;
    change: number | null;
    changePercent: number | null;
    unit: string;
    note: string;
    live: boolean;
  }[];
  eia: {
    coalGeneration: number | null;
    coalStocks: number | null;
    coalProduction: number | null;
    coalExports: number | null;
  };
  routes: {
    id: string;
    name: string;
    mode: string;
    origin: [number, number];
    destination: [number, number];
    waypoints: [number, number][];
    exposure: string;
    watch: string;
    vesselCount: number;
    congestion: "low" | "moderate" | "high";
  }[];
  osint: any[];
  climate: any[];
  vessels: any[];
}

const BENCHMARK_COLORS: Record<string, string> = {
  NEWCASTLE: "#f59e0b",
  API2: "#f97316",
  ILLINOIS: "#84cc16",
  METCOAL: "#ef4444",
};

export default function CoalPage() {
  const [data, setData] = useState<CoalMarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/coal/market", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load coal market data");
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError("Live coal market data unavailable. Calculators and reference tools remain active.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 120000);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#090806] via-[#120d08] to-black text-white pt-32 pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <Link
            href="/energy"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-amber-300 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Energy Hub
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-amber-300 text-sm font-medium tracking-widest uppercase flex items-center gap-2">
              <Mountain className="w-4 h-4" /> Coal Operations
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mt-2">
              Coal Market and{" "}
              <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-stone-300 bg-clip-text text-transparent">
                Plant Intelligence
              </span>
            </h1>
            <p className="text-gray-400 mt-4 max-w-3xl text-sm leading-relaxed">
              A live coal desk for benchmark pricing, EIA coal data, route monitoring, vessel tracking,
              AI market briefings, and plant calculators. Every feed updates automatically.
            </p>
          </motion.div>
        </div>

        <div className="flex flex-wrap gap-3 mb-12">
          <Link
            href="/energy/fossil-energy"
            className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-gray-300 text-sm hover:border-amber-300/30 hover:text-amber-200 transition-colors"
          >
            Fossil Energy Desk
          </Link>
          <Link
            href="/energy/oil-and-gas"
            className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-gray-300 text-sm hover:border-amber-300/30 hover:text-amber-200 transition-colors"
          >
            Oil and Gas Intelligence
          </Link>
          <a
            href="#benchmarks"
            className="px-4 py-2 rounded-full border border-amber-300/20 bg-amber-300/10 text-amber-100 text-sm hover:bg-amber-300/20 transition-colors"
          >
            Benchmarks
          </a>
          <a
            href="#routes"
            className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-gray-300 text-sm hover:border-amber-300/30 hover:text-amber-200 transition-colors"
          >
            Trade Routes
          </a>
          <a
            href="#calculators"
            className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-gray-300 text-sm hover:border-amber-300/30 hover:text-amber-200 transition-colors"
          >
            Calculators
          </a>
          <a
            href="#intelligence"
            className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-gray-300 text-sm hover:border-amber-300/30 hover:text-amber-200 transition-colors"
          >
            Intelligence
          </a>
        </div>

        {/* Live Benchmarks */}
        <section id="benchmarks" className="mb-16">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-amber-300" /> Live Coal Benchmarks
            </h2>
            {data?.timestamp && (
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">
                Updated {new Date(data.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>

          {loading && !data && (
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-6">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading live benchmarks...
            </div>
          )}

          {error && !data && (
            <div className="p-4 bg-red-500/10 border-l-2 border-red-500 text-red-200 text-sm rounded-xl mb-6">
              {error}
              <button onClick={fetchData} className="ml-3 text-amber-400 hover:underline text-xs">Retry</button>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
            {data?.benchmarks.map((benchmark) => (
              <div
                key={benchmark.label}
                className={`rounded-2xl border p-5 ${benchmark.live ? "border-amber-300/15 bg-amber-300/5" : "border-white/10 bg-white/[0.04]"}`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">
                      {benchmark.live ? "Live Benchmark" : "Benchmark"}
                    </p>
                    <h2 className="text-lg font-bold text-white">{benchmark.label}</h2>
                  </div>
                  {benchmark.changePercent !== null && (
                    <span
                      className={`text-sm font-bold ${benchmark.changePercent >= 0 ? "text-green-400" : "text-red-400"}`}
                    >
                      {benchmark.changePercent >= 0 ? "+" : ""}
                      {benchmark.changePercent.toFixed(2)}%
                    </span>
                  )}
                </div>
                <div className="text-2xl font-bold text-amber-200 mb-2">
                  {benchmark.price !== null ? `$${benchmark.price.toFixed(2)}${benchmark.unit.replace("$", "")}` : "—"}
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{benchmark.note}</p>
              </div>
            ))}
          </div>

          {data && (
            <div className="grid gap-4 md:grid-cols-2">
              {data.benchmarks
                .filter((b) => b.live && b.price !== null)
                .map((benchmark) => (
                  <CoalBenchmarkChart
                    key={benchmark.symbol}
                    symbol={benchmark.symbol}
                    label={benchmark.label}
                    color={BENCHMARK_COLORS[benchmark.symbol] || "#f59e0b"}
                    height={280}
                  />
                ))}
            </div>
          )}
        </section>

        {/* EIA Coal Data */}
        {data?.eia && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <Gauge className="w-6 h-6 text-amber-300" />
              <h2 className="text-2xl font-bold">US Coal Fundamentals (EIA)</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Coal Generation", value: data.eia.coalGeneration, unit: "GWh" },
                { label: "Coal Stocks", value: data.eia.coalStocks, unit: "ktons" },
                { label: "Coal Production", value: data.eia.coalProduction, unit: "ktons" },
                { label: "Coal Exports", value: data.eia.coalExports, unit: "ktons" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">{item.label}</p>
                  <div className="text-2xl font-bold text-white">
                    {item.value !== null ? item.value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : "—"}
                    <span className="text-sm text-gray-500 ml-1">{item.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* AI Brief */}
        <section className="mb-16">
          <CoalAiBrief />
        </section>

        {/* Route Map */}
        <section id="routes" className="mb-16">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Ship className="w-6 h-6 text-amber-300" /> Coal Route Monitor
            </h2>
            <span className="text-xs uppercase tracking-widest text-gray-500">Live vessel positions</span>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <CoalRouteMap
              routes={data?.routes || []}
              vessels={data?.vessels || []}
              climate={data?.climate || []}
              height="560px"
              selectedRoute={selectedRoute}
              onRouteClick={setSelectedRoute}
            />
            <div className="space-y-3">
              {(data?.routes || []).map((route) => (
                <button
                  key={route.id}
                  onClick={() => setSelectedRoute(selectedRoute === route.id ? null : route.id)}
                  className={`w-full text-left rounded-xl border p-4 transition-all ${
                    selectedRoute === route.id
                      ? "border-amber-500/50 bg-amber-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-sm font-bold text-white">{route.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        route.congestion === "high"
                          ? "bg-red-500/20 text-red-400"
                          : route.congestion === "moderate"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-emerald-500/20 text-emerald-400"
                      }`}
                    >
                      {route.vesselCount} vessels
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500 mb-2">{route.mode}</div>
                  <p className="text-xs text-gray-400">{route.watch}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Calculators */}
        <CoalCalculators />

        {/* Arbitrage */}
        <section className="mb-16">
          <CoalArbitrage benchmarks={data?.benchmarks || []} />
        </section>

        {/* Intelligence Feed */}
        <section id="intelligence" className="mb-16">
          <CoalIntelligenceFeed osint={data?.osint || []} climate={data?.climate || []} />
        </section>

        {/* Footer CTA */}
        <section className="rounded-3xl border border-amber-300/20 bg-gradient-to-r from-amber-300/10 via-transparent to-stone-300/10 p-6">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-amber-200/80 mb-2">
                Separate coal desk restored
              </p>
              <h2 className="text-2xl font-bold text-white mb-3">
                Coal now has its own live desk again.
              </h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                Use the broader fossil desk for cross-fuel corridor context, but coal once again has
                dedicated live benchmarks, route monitoring, AI briefings, and plant calculators.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link
                href="/energy/fossil-energy"
                className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-gray-200 text-sm hover:border-white/20 transition-colors"
              >
                Open fossil desk
              </Link>
              <Link
                href="/energy"
                className="px-4 py-2 rounded-full border border-amber-300/30 bg-amber-300/10 text-amber-100 text-sm hover:bg-amber-300/20 transition-colors inline-flex items-center gap-2"
              >
                Return to hub <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
