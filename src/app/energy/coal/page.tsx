"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
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
  Shield,
  Train,
  Warehouse,
} from "lucide-react";

const COAL_BENCHMARKS = [
  {
    label: "Newcastle 6,000 kcal",
    price: "$137/t",
    change: "+2.4%",
    note: "Asia-Pacific benchmark for seaborne thermal coal.",
  },
  {
    label: "API2 Rotterdam",
    price: "$118/t",
    change: "-1.1%",
    note: "European delivered benchmark tied to power and carbon spreads.",
  },
  {
    label: "Illinois Basin",
    price: "$62/t",
    change: "+0.8%",
    note: "US inland benchmark for domestic utility procurement.",
  },
  {
    label: "Met Coal FOB Australia",
    price: "$241/t",
    change: "+3.6%",
    note: "Steelmaking benchmark sensitive to mine outages and rail flows.",
  },
];

const COAL_GRADES = [
  {
    name: "Sub-bituminous",
    heat: "17-24 MMBtu/t",
    sulfur: "Low",
    use: "Mine-mouth and domestic power fleets",
  },
  {
    name: "Bituminous Thermal",
    heat: "24-30 MMBtu/t",
    sulfur: "Medium",
    use: "Utility generation and export terminals",
  },
  {
    name: "Anthracite",
    heat: "25-28 MMBtu/t",
    sulfur: "Low",
    use: "Industrial heat and specialty blending",
  },
  {
    name: "Metallurgical",
    heat: "26-32 MMBtu/t",
    sulfur: "Low-Variable",
    use: "Blast furnace and coke production",
  },
];

const COAL_ROUTES = [
  {
    name: "Powder River to Gulf",
    mode: "Rail and export terminal",
    exposure: "Rail congestion and terminal slotting",
    watch:
      "Track stockpile draw vs. BNSF loadouts during export demand spikes.",
  },
  {
    name: "Newcastle Seaborne Arc",
    mode: "Mine, rail, and port chain",
    exposure: "Rainfall, channel queues, and maintenance windows",
    watch:
      "Australian weather still sets the tone for thermal coal pricing across Asia.",
  },
  {
    name: "Richards Bay Export Loop",
    mode: "Rail and bulk vessel corridor",
    exposure: "Power availability and rail theft disruptions",
    watch:
      "South African throughput remains a swing factor for Atlantic Basin supply.",
  },
  {
    name: "Indonesian Barge Network",
    mode: "River barge and coastal export",
    exposure: "Water levels, monsoon timing, and loading queues",
    watch:
      "Low-calorie thermal cargoes remain crucial for India and China shortfalls.",
  },
];

export default function CoalPage() {
  const [plantCapacity, setPlantCapacity] = useState("850");
  const [plantLoad, setPlantLoad] = useState("72");
  const [heatRate, setHeatRate] = useState("9800");
  const [coalEnergy, setCoalEnergy] = useState("24");

  const [stockpileTons, setStockpileTons] = useState("450000");
  const [dailyBurn, setDailyBurn] = useState("7800");
  const [dailyInbound, setDailyInbound] = useState("2200");

  const [emissionsCapacity, setEmissionsCapacity] = useState("850");
  const [emissionsLoad, setEmissionsLoad] = useState("72");
  const [emissionsFactor, setEmissionsFactor] = useState("0.98");

  const burnModel = useMemo(() => {
    const capacity = Number.parseFloat(plantCapacity) || 0;
    const capacityFactor = (Number.parseFloat(plantLoad) || 0) / 100;
    const rate = Number.parseFloat(heatRate) || 0;
    const heatContent = Number.parseFloat(coalEnergy) || 1;
    const annualMWh = capacity * capacityFactor * 8760;
    const annualMMBtu = annualMWh * (rate / 1000);
    const annualTons = heatContent > 0 ? annualMMBtu / heatContent : 0;
    const dailyTons = annualTons / 365;

    return {
      annualMWh,
      annualTons,
      dailyTons,
    };
  }, [coalEnergy, heatRate, plantCapacity, plantLoad]);

  const stockpileModel = useMemo(() => {
    const stockpile = Number.parseFloat(stockpileTons) || 0;
    const burn = Number.parseFloat(dailyBurn) || 0;
    const inbound = Number.parseFloat(dailyInbound) || 0;
    const netDraw = burn - inbound;
    const runwayDays = netDraw > 0 ? stockpile / netDraw : null;

    return {
      netDraw,
      runwayDays,
    };
  }, [dailyBurn, dailyInbound, stockpileTons]);

  const emissionsModel = useMemo(() => {
    const capacity = Number.parseFloat(emissionsCapacity) || 0;
    const capacityFactor = (Number.parseFloat(emissionsLoad) || 0) / 100;
    const factor = Number.parseFloat(emissionsFactor) || 0;
    const annualMWh = capacity * capacityFactor * 8760;
    const annualCo2 = annualMWh * factor;

    return {
      annualMWh,
      annualCo2,
    };
  }, [emissionsCapacity, emissionsFactor, emissionsLoad]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#090806] via-[#120d08] to-black text-white pt-28 pb-24">
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
              A dedicated coal page for benchmark pricing, stockpile planning,
              route monitoring, and plant calculators. This restores coal as a
              first-class desk instead of only nesting it inside the broader
              fossil route.
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
            href="#calculators"
            className="px-4 py-2 rounded-full border border-amber-300/20 bg-amber-300/10 text-amber-100 text-sm hover:bg-amber-300/20 transition-colors"
          >
            Coal Calculators
          </a>
          <a
            href="#routes"
            className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-gray-300 text-sm hover:border-amber-300/30 hover:text-amber-200 transition-colors"
          >
            Trade Routes
          </a>
          <a
            href="#grades"
            className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-gray-300 text-sm hover:border-amber-300/30 hover:text-amber-200 transition-colors"
          >
            Coal Grades
          </a>
        </div>

        <section className="mb-16">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {COAL_BENCHMARKS.map((benchmark) => (
              <div
                key={benchmark.label}
                className="rounded-2xl border border-amber-300/15 bg-amber-300/5 p-5"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">
                      Benchmark
                    </p>
                    <h2 className="text-lg font-bold text-white">
                      {benchmark.label}
                    </h2>
                  </div>
                  <span
                    className={`text-sm font-bold ${benchmark.change.startsWith("+") ? "text-green-400" : "text-red-400"}`}
                  >
                    {benchmark.change}
                  </span>
                </div>
                <div className="text-2xl font-bold text-amber-200 mb-2">
                  {benchmark.price}
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {benchmark.note}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="calculators"
          className="mb-16 rounded-3xl border border-white/10 bg-white/[0.04] p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Calculator className="w-6 h-6 text-amber-300" />
            <h2 className="text-2xl font-bold">Coal Calculators</h2>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Factory className="w-5 h-5 text-amber-300" />
                <h3 className="text-lg font-bold">Plant Burn Planner</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1.5">
                    Plant Capacity (MW)
                  </label>
                  <input
                    value={plantCapacity}
                    onChange={(e) => setPlantCapacity(e.target.value)}
                    className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-300"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1.5">
                    Capacity Factor (%)
                  </label>
                  <input
                    value={plantLoad}
                    onChange={(e) => setPlantLoad(e.target.value)}
                    className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-300"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1.5">
                    Heat Rate (Btu/kWh)
                  </label>
                  <input
                    value={heatRate}
                    onChange={(e) => setHeatRate(e.target.value)}
                    className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-300"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1.5">
                    Coal Heat Content (MMBtu/ton)
                  </label>
                  <input
                    value={coalEnergy}
                    onChange={(e) => setCoalEnergy(e.target.value)}
                    className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-300"
                  />
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-4">
                  <div className="text-xs text-gray-500 mb-1">
                    Annual output
                  </div>
                  <div className="text-xl font-bold text-white">
                    {burnModel.annualMWh.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}{" "}
                    MWh
                  </div>
                </div>
                <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-4">
                  <div className="text-xs text-gray-500 mb-1">
                    Annual coal burn
                  </div>
                  <div className="text-xl font-bold text-white">
                    {burnModel.annualTons.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}{" "}
                    t
                  </div>
                </div>
                <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-4">
                  <div className="text-xs text-gray-500 mb-1">Daily burn</div>
                  <div className="text-xl font-bold text-white">
                    {burnModel.dailyTons.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}{" "}
                    t/day
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Warehouse className="w-5 h-5 text-amber-300" />
                <h3 className="text-lg font-bold">Stockpile Runway</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1.5">
                    On-Site Stockpile (tons)
                  </label>
                  <input
                    value={stockpileTons}
                    onChange={(e) => setStockpileTons(e.target.value)}
                    className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-300"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1.5">
                    Daily Burn (tons/day)
                  </label>
                  <input
                    value={dailyBurn}
                    onChange={(e) => setDailyBurn(e.target.value)}
                    className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-300"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1.5">
                    Inbound Deliveries (tons/day)
                  </label>
                  <input
                    value={dailyInbound}
                    onChange={(e) => setDailyInbound(e.target.value)}
                    className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-300"
                  />
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                  <div className="text-xs text-gray-500 mb-1">
                    Net stockpile draw
                  </div>
                  <div className="text-xl font-bold text-white">
                    {stockpileModel.netDraw.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}{" "}
                    t/day
                  </div>
                </div>
                <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                  <div className="text-xs text-gray-500 mb-1">Runway</div>
                  <div className="text-xl font-bold text-white">
                    {stockpileModel.runwayDays === null
                      ? "Stable / Growing"
                      : `${stockpileModel.runwayDays.toLocaleString(undefined, { maximumFractionDigits: 1 })} days`}
                  </div>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Useful for checking how quickly a plant becomes exposed when
                  rail, conveyor, or port deliveries slip.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-amber-300" />
                <h3 className="text-lg font-bold">Emissions View</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1.5">
                    Capacity (MW)
                  </label>
                  <input
                    value={emissionsCapacity}
                    onChange={(e) => setEmissionsCapacity(e.target.value)}
                    className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-300"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1.5">
                    Capacity Factor (%)
                  </label>
                  <input
                    value={emissionsLoad}
                    onChange={(e) => setEmissionsLoad(e.target.value)}
                    className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-300"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1.5">
                    Emission Factor (tCO₂/MWh)
                  </label>
                  <input
                    value={emissionsFactor}
                    onChange={(e) => setEmissionsFactor(e.target.value)}
                    className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-300"
                  />
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4">
                  <div className="text-xs text-gray-500 mb-1">
                    Annual generation
                  </div>
                  <div className="text-xl font-bold text-white">
                    {emissionsModel.annualMWh.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}{" "}
                    MWh
                  </div>
                </div>
                <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4">
                  <div className="text-xs text-gray-500 mb-1">Annual CO₂</div>
                  <div className="text-xl font-bold text-white">
                    {emissionsModel.annualCo2.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}{" "}
                    t
                  </div>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Gives a quick planning baseline before you compare coal
                  dispatch against gas switching, outages, or carbon
                  constraints.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="routes" className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Route className="w-6 h-6 text-amber-300" />
            <h2 className="text-2xl font-bold">Coal Route Watchlist</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {COAL_ROUTES.map((route) => (
              <div
                key={route.name}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
              >
                <div className="flex items-center gap-2 mb-3 text-amber-200 text-sm font-semibold">
                  <Train className="w-4 h-4" /> {route.mode}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {route.name}
                </h3>
                <p className="text-sm text-gray-400 mb-4">{route.watch}</p>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-gray-300">
                  <span className="text-xs uppercase tracking-[0.2em] text-gray-500 block mb-1">
                    Primary exposure
                  </span>
                  {route.exposure}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="grades" className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-amber-300" />
            <h2 className="text-2xl font-bold">Coal Grade Reference</h2>
          </div>
          <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.04]">
            <table className="min-w-full text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-[0.2em] text-gray-500">
                <tr>
                  <th className="px-4 py-4 text-left">Grade</th>
                  <th className="px-4 py-4 text-left">Heat Content</th>
                  <th className="px-4 py-4 text-left">Sulfur</th>
                  <th className="px-4 py-4 text-left">Common Use</th>
                </tr>
              </thead>
              <tbody>
                {COAL_GRADES.map((grade) => (
                  <tr
                    key={grade.name}
                    className="border-b border-white/5 last:border-b-0"
                  >
                    <td className="px-4 py-4 font-semibold text-white">
                      {grade.name}
                    </td>
                    <td className="px-4 py-4 text-gray-300">{grade.heat}</td>
                    <td className="px-4 py-4 text-gray-300">{grade.sulfur}</td>
                    <td className="px-4 py-4 text-gray-300">{grade.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-amber-300/20 bg-gradient-to-r from-amber-300/10 via-transparent to-stone-300/10 p-6">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-amber-200/80 mb-2">
                Separate coal desk restored
              </p>
              <h2 className="text-2xl font-bold text-white mb-3">
                Coal now has its own page again.
              </h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                You can keep using the broader fossil desk for cross-fuel
                corridor context, but coal once again has dedicated calculators,
                benchmark tracking, and route monitoring in its own route.
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
