"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { solarEstimate, windEstimate, carbonEstimate } from "@/lib/energy-calculations";
import EnergyDataNotice from "@/components/EnergyDataNotice";
import {
  ArrowLeft,
  Sun,
  Wind,
  Droplets,
  Atom,
  Flame,
  Zap,
  Calculator,
  Leaf,
  BrainCircuit,
  Globe2,
  TrendingUp,
  TrendingDown,
  Battery,
  Shield,
  Sparkles,
  Loader2,
  ArrowRight,
  BarChart3,
  Factory,
  Landmark,
  ChevronRight,
  Route,
  Mountain,
} from "lucide-react";

const ENERGY_DESKS = [
  {
    name: "Fossil Energy Desk",
    href: "/energy/fossil-energy",
    icon: Flame,
    accent: "from-orange-300 to-red-400",
    border: "border-orange-300/20",
    bg: "bg-orange-300/10",
    summary:
      "Coal, gas, oil, LNG, and pipeline corridors in one operating layout.",
  },
  {
    name: "Coal Intelligence",
    href: "/energy/coal",
    icon: Mountain,
    accent: "from-stone-300 to-amber-400",
    border: "border-stone-300/20",
    bg: "bg-stone-300/10",
    summary:
      "Dedicated coal benchmarks, stockpile calculators, plant burn, and route monitoring.",
  },
  {
    name: "Oil and Gas Intelligence",
    href: "/energy/oil-and-gas",
    icon: Route,
    accent: "from-amber-300 to-orange-400",
    border: "border-amber-300/20",
    bg: "bg-amber-300/10",
    summary:
      "Shipping, weather, refinery heat, and tactical hydrocarbon monitoring.",
  },
  {
    name: "Infrastructure Matrix",
    href: "/energy/infrastructure",
    icon: Factory,
    accent: "from-cyan-300 to-emerald-300",
    border: "border-cyan-300/20",
    bg: "bg-cyan-300/10",
    summary:
      "Cross-technology asset layers, constraints, storage, and resilience.",
  },
];

// ─── GLOBAL ENERGY MIX DATA ──────────────────────────────────
const ENERGY_SOURCES = [
  {
    name: "Solar",
    icon: Sun,
    capacity: "1,419 GW",
    growth: "+26.1%",
    status: "Accelerating",
    color: "from-yellow-500 to-orange-500",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    text: "text-yellow-400",
    desc: "Fastest growing energy source globally. China leads with 609 GW installed capacity.",
  },
  {
    name: "Wind",
    icon: Wind,
    capacity: "1,017 GW",
    growth: "+12.4%",
    status: "Strong Growth",
    color: "from-cyan-400 to-blue-500",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    text: "text-cyan-400",
    desc: "Offshore wind expanding rapidly. Europe and China dominate installations.",
  },
  {
    name: "Hydropower",
    icon: Droplets,
    capacity: "1,392 GW",
    growth: "+1.8%",
    status: "Mature",
    color: "from-blue-400 to-indigo-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-400",
    desc: "Largest renewable source by capacity. Critical for grid stability and storage.",
  },
  {
    name: "Nuclear",
    icon: Atom,
    capacity: "413 GW",
    growth: "+3.2%",
    status: "Revival",
    color: "from-purple-400 to-violet-600",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    text: "text-purple-400",
    desc: "SMR technology driving new interest. 60+ reactors under construction worldwide.",
  },
  {
    name: "Hydrogen",
    icon: Flame,
    capacity: "~1.4 GW",
    growth: "+94%",
    status: "Emerging",
    color: "from-emerald-400 to-teal-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
    desc: "Green hydrogen production scaling up. Expected to reach 134-240 GW by 2030.",
  },
  {
    name: "Geothermal",
    icon: Globe2,
    capacity: "16.1 GW",
    growth: "+3.5%",
    status: "Niche Growth",
    color: "from-red-400 to-rose-600",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    text: "text-red-400",
    desc: "Enhanced geothermal systems unlocking new potential. 24/7 baseload power.",
  },
];

interface LiveHubData {
  timestamp: string;
  commodities: any[];
  storage: any[];
  grid: any[];
  climate: any[];
  osint: any[];
  shipCounts: any[];
}

// ─── CRITICAL ENERGY COMMODITIES ──────────────────────────────
const ENERGY_COMMODITIES = [
  {
    symbol: "Li",
    name: "Lithium Carbonate",
    price: 13250,
    change: -4.2,
    unit: "$/tonne",
    use: "EV Batteries",
  },
  {
    symbol: "Co",
    name: "Cobalt",
    price: 28.5,
    change: +2.8,
    unit: "$/lb",
    use: "Battery Cathodes",
  },
  {
    symbol: "U₃O₈",
    name: "Uranium",
    price: 82.5,
    change: +12.3,
    unit: "$/lb",
    use: "Nuclear Fuel",
  },
  {
    symbol: "Cu",
    name: "Copper",
    price: 9420,
    change: +5.1,
    unit: "$/tonne",
    use: "Electrification",
  },
  {
    symbol: "Si",
    name: "Polysilicon",
    price: 6.85,
    change: -8.7,
    unit: "$/kg",
    use: "Solar Panels",
  },
  {
    symbol: "Ni",
    name: "Nickel",
    price: 16850,
    change: -2.1,
    unit: "$/tonne",
    use: "Battery Anodes",
  },
  {
    symbol: "Pt",
    name: "Platinum",
    price: 985,
    change: +1.4,
    unit: "$/oz",
    use: "Fuel Cells",
  },
  {
    symbol: "Ag",
    name: "Silver",
    price: 31.2,
    change: +3.6,
    unit: "$/oz",
    use: "Solar Contacts",
  },
  {
    symbol: "Mn",
    name: "Manganese",
    price: 4.8,
    change: +0.9,
    unit: "$/kg",
    use: "LFP Batteries",
  },
  {
    symbol: "GaAs",
    name: "Gallium",
    price: 320,
    change: +6.2,
    unit: "$/kg",
    use: "Advanced Solar",
  },
];

// ─── ENERGY POLICIES ──────────────────────────────────────────
const ENERGY_POLICIES = [
  {
    name: "US Inflation Reduction Act",
    country: "🇺🇸 USA",
    investment: "$369B",
    focus: "Clean energy tax credits, EV incentives, domestic manufacturing",
    year: "2022",
    status: "Active",
  },
  {
    name: "EU Green Deal",
    country: "🇪🇺 EU",
    investment: "€1T+",
    focus: "Carbon neutrality by 2050, Fit for 55 package, CBAM",
    year: "2019",
    status: "Active",
  },
  {
    name: "China 14th Five-Year Plan",
    country: "🇨🇳 China",
    investment: "$546B",
    focus: "1,200 GW wind+solar by 2030, EV dominance, nuclear expansion",
    year: "2021",
    status: "Active",
  },
  {
    name: "India National Solar Mission",
    country: "🇮🇳 India",
    investment: "$113B",
    focus: "500 GW non-fossil fuel capacity by 2030, green hydrogen",
    year: "2010",
    status: "Expanded",
  },
  {
    name: "Japan GX Strategy",
    country: "🇯🇵 Japan",
    investment: "$150B",
    focus: "Nuclear restart, hydrogen economy, carbon pricing",
    year: "2023",
    status: "Active",
  },
  {
    name: "Australia Net Zero Plan",
    country: "🇦🇺 Australia",
    investment: "$A20B",
    focus: "Capacity Investment Scheme, critical minerals, green hydrogen",
    year: "2022",
    status: "Active",
  },
];

// ─── ENERGY TRANSITION TIMELINE ───────────────────────────────
const TIMELINE_EVENTS = [
  {
    year: "2015",
    event: "Paris Agreement signed by 196 nations",
    type: "Policy",
  },
  {
    year: "2017",
    event: "Solar becomes cheapest electricity source in history",
    type: "Milestone",
  },
  {
    year: "2020",
    event: "Renewables generate 29% of global electricity",
    type: "Milestone",
  },
  {
    year: "2021",
    event: "IEA Net Zero by 2050 roadmap released",
    type: "Policy",
  },
  {
    year: "2022",
    event: "US passes Inflation Reduction Act ($369B)",
    type: "Policy",
  },
  {
    year: "2023",
    event: "Global EV sales surpass 14 million units",
    type: "Market",
  },
  {
    year: "2024",
    event: "Renewable capacity additions hit 510 GW record",
    type: "Milestone",
  },
  {
    year: "2025",
    event: "First commercial fusion power plant designs approved",
    type: "Technology",
  },
  {
    year: "2030",
    event: "Target: Triple global renewable energy capacity",
    type: "Target",
  },
  {
    year: "2050",
    event: "Target: Net-zero emissions globally",
    type: "Target",
  },
];

export default function EnergyPage() {
  // Solar Economics Calculator
  const [solarSize, setSolarSize] = useState<string>("");
  const [costPerWatt, setCostPerWatt] = useState<string>("2.50");
  const [electricityRate, setElectricityRate] = useState<string>("0.14");
  const [sunHours, setSunHours] = useState<string>("5");
  const [solarLocation, setSolarLocation] = useState<string>("");
  const [solarResult, setSolarResult] = useState<{
    annualProduction: string;
    annualSavings: string;
    payback: string;
    savings25: string;
  } | null>(null);

  // Wind Farm Calculator
  const [turbineCount, setTurbineCount] = useState<string>("");
  const [turbineRating, setTurbineRating] = useState<string>("3");
  const [capacityFactor, setCapacityFactor] = useState<string>("35");
  const [windLocation, setWindLocation] = useState<string>("");

  const captureLocation = (
    setter: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setter(
            `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
          );
        },
        () =>
          alert(
            "Could not capture location. Please check browser permissions or enter manually.",
          ),
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };
  const [windResult, setWindResult] = useState<{
    totalCapacity: string;
    annualOutput: string;
    homesPowered: string;
  } | null>(null);

  // Carbon Offset Estimator
  const [renewableCapacity, setRenewableCapacity] = useState<string>("");
  const [sourceType, setSourceType] = useState("solar");
  const [carbonResult, setCarbonResult] = useState<{
    co2Offset: string;
    trees: string;
    cars: string;
  } | null>(null);

  // AI Energy Analyzer
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    summary: string;
    strategic_implications: string[];
    affected_markets: { market: string; impact: string; direction: string }[];
    key_players: { name: string; role: string }[];
    outlook: { short_term: string; long_term: string };
    confidence: string;
  } | null>(null);
  const [aiError, setAiError] = useState("");
  const [calculationErrors, setCalculationErrors] = useState<Record<string, string>>({});
  const [feedError, setFeedError] = useState("");

  // Live hub data
  const [live, setLive] = useState<LiveHubData | null>(null);
  const [liveLoading, setLiveLoading] = useState(true);

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await fetch("/api/energy/infrastructure", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load live data");
        const data = await res.json();
        setLive(data);
        setFeedError("");
      } catch (e) {
        console.warn("[Energy Hub] Live data unavailable", e);
        setFeedError("Market refresh unavailable. Previous quotes may be stale; reference tools remain available.");
      } finally {
        setLiveLoading(false);
      }
    };
    fetchLive();
    const id = setInterval(fetchLive, 60000);
    return () => clearInterval(id);
  }, []);

  // ─── CALCULATORS ──────────────────────────────────────────
  const calculateSolarROI = () => {
    setSolarResult(null);
    try {
      const result = solarEstimate(solarSize, costPerWatt, electricityRate, sunHours);
      setCalculationErrors((prev) => ({ ...prev, solar: "" }));
      setSolarResult({
        annualProduction: result.annualProduction.toLocaleString(undefined, {
          maximumFractionDigits: 0,
        }),
        annualSavings: result.annualSavings.toLocaleString(undefined, {
          maximumFractionDigits: 0,
        }),
        payback: result.payback === null ? "No payback at zero savings" : `${result.payback.toFixed(1)} years`,
        savings25: result.savings25.toLocaleString(undefined, {
          maximumFractionDigits: 0,
        }),
      });
    } catch (error) {
      setCalculationErrors((prev) => ({ ...prev, solar: (error as Error).message }));
    }
  };

  const calculateWindFarm = () => {
    setWindResult(null);
    try {
      const result = windEstimate(turbineCount, turbineRating, capacityFactor);
      setCalculationErrors((prev) => ({ ...prev, wind: "" }));
      setWindResult({
        totalCapacity: result.totalCapacity.toLocaleString(undefined, {
          maximumFractionDigits: 1,
        }),
        annualOutput: result.annualOutput.toLocaleString(undefined, {
          maximumFractionDigits: 0,
        }),
        homesPowered: result.homesPowered.toLocaleString(),
      });
    } catch (error) {
      setCalculationErrors((prev) => ({ ...prev, wind: (error as Error).message }));
    }
  };

  const calculateCarbon = () => {
    setCarbonResult(null);
    try {
      const result = carbonEstimate(renewableCapacity, sourceType);
      setCalculationErrors((prev) => ({ ...prev, carbon: "" }));
      setCarbonResult({
        co2Offset: result.co2Offset.toLocaleString(undefined, { maximumFractionDigits: 0 }),
        trees: result.trees.toLocaleString(undefined, { maximumFractionDigits: 0 }),
        cars: result.cars.toLocaleString(undefined, { maximumFractionDigits: 0 }),
      });
    } catch (error) {
      setCalculationErrors((prev) => ({ ...prev, carbon: (error as Error).message }));
    }
  };

  // ─── AI ANALYZER ──────────────────────────────────────────
  const analyzeEnergy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    setAiLoading(true);
    setAiError("");
    setAiResult(null);

    try {
      const response = await fetch("/api/ai/energy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: aiQuery }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to analyze");
      setAiResult(data);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Could not analyze. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-geo-dark to-black text-white pt-32 pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ─── HEADER ──────────────────────────────── */}
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-geo-gold transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-emerald-400 text-sm font-medium tracking-widest uppercase flex items-center gap-2">
              <Zap className="w-4 h-4" /> Energy Hub
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mt-2">
              Global{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Energy
              </span>{" "}
              Intelligence
            </h1>
            <p className="text-gray-400 mt-4 max-w-2xl">
              Track renewable and fossil systems with AI-powered analysis,
              calculators, pipeline-aware operating desks, and geopolitical
              policy intelligence.
            </p>
          </motion.div>
        </div>

        {/* ─── HUB NAVIGATION ────────────────────────── */}
        <div
          className="flex overflow-x-auto gap-3 mb-12 pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          <Link
            href="/energy/coal"
            className="px-4 py-2 whitespace-nowrap bg-stone-300/10 border border-stone-300/20 rounded-full hover:bg-stone-300/20 hover:text-stone-100 transition-all text-sm"
          >
            Coal
          </Link>
          <Link
            href="/energy/fossil-energy"
            className="px-4 py-2 whitespace-nowrap bg-orange-300/10 border border-orange-300/20 rounded-full hover:bg-orange-300/20 hover:text-orange-100 transition-all text-sm"
          >
            Fossil Energy
          </Link>
          <a
            href="#dashboard"
            className="px-4 py-2 whitespace-nowrap bg-white/5 border border-white/10 rounded-full hover:bg-emerald-500/20 hover:text-emerald-400 transition-all text-sm"
          >
            Dashboard
          </a>
          <a
            href="#analyzer"
            className="px-4 py-2 whitespace-nowrap bg-white/5 border border-white/10 rounded-full hover:bg-emerald-500/20 hover:text-emerald-400 transition-all text-sm"
          >
            AI Analyzer
          </a>
          <a
            href="#calculators"
            className="px-4 py-2 whitespace-nowrap bg-white/5 border border-white/10 rounded-full hover:bg-emerald-500/20 hover:text-emerald-400 transition-all text-sm"
          >
            Calculators
          </a>
          <a
            href="#storage"
            className="px-4 py-2 whitespace-nowrap bg-white/5 border border-white/10 rounded-full hover:bg-emerald-500/20 hover:text-emerald-400 transition-all text-sm"
          >
            Energy Storage (ESS)
          </a>
          <a
            href="#policy"
            className="px-4 py-2 whitespace-nowrap bg-white/5 border border-white/10 rounded-full hover:bg-emerald-500/20 hover:text-emerald-400 transition-all text-sm"
          >
            Policy Tracker
          </a>
        </div>

        <section className="mb-16">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Factory className="w-6 h-6 text-orange-300" /> Operational Desks
            </h2>
            <span className="text-xs uppercase tracking-widest text-gray-500">
              Enabled routes
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {ENERGY_DESKS.map((desk) => {
              const Icon = desk.icon;

              return (
                <Link
                  key={desk.name}
                  href={desk.href}
                  className={`group rounded-2xl border ${desk.border} ${desk.bg} p-5 transition-all hover:-translate-y-1 hover:border-white/30`}
                >
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div
                      className={`inline-flex rounded-xl bg-gradient-to-r ${desk.accent} p-2 text-black`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {desk.name}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {desk.summary}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ═══ 1. GLOBAL ENERGY MIX DASHBOARD ═══════════ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          id="dashboard"
          className="mb-16"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Globe2 className="w-6 h-6 text-emerald-400" />
            Global Energy Mix Dashboard
          </h2>
          <p className="mb-4 text-sm text-gray-300">Static reference figures and commentary; reporting periods and sources are not yet verified. These are not current global capacity observations.</p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ENERGY_SOURCES.map((source) => {
              const Icon = source.icon;
              return (
                <div
                  key={source.name}
                  className={`group relative overflow-hidden rounded-xl border ${source.border} ${source.bg} p-6 backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-${source.text}/10`}
                >
                  {/* Gradient accent line */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${source.color}`}
                  />

                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-lg ${source.bg} border ${source.border}`}
                      >
                        <Icon className={`w-6 h-6 ${source.text}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          {source.name}
                        </h3>
                        <span
                          className={`text-xs font-semibold ${source.text} uppercase tracking-wider`}
                        >
                          {source.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-white">
                        {source.capacity}
                      </div>
                      <div
                        className={`text-sm font-bold ${source.growth.startsWith("+") ? "text-green-400" : "text-red-400"}`}
                      >
                        {source.growth}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-400 leading-relaxed">
                    {source.desc}
                  </p>

                  {/* Capacity bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                      <span>Installed Capacity</span>
                      <span>{source.capacity}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1.5, delay: 0.3 }}
                        className={`h-full rounded-full bg-gradient-to-r ${source.color}`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* ═══ 6. ENERGY GEOPOLITICS INTELLIGENCE ENGINE ═════════ */}
        <div id="analyzer"></div>
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <BrainCircuit className="w-6 h-6 text-emerald-400" />
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Energy Geopolitics Intelligence Engine
            </span>
          </h2>

          <div className="bg-white/5 rounded-xl border border-white/10 p-6 relative overflow-hidden">
            {/* Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-emerald-500/20 blur-xl" />

            <div className="flex items-center gap-2 text-emerald-400 mb-4">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="text-xs font-medium tracking-wider uppercase">
                Powered by GeoMoney AI
              </span>
            </div>

            <form onSubmit={analyzeEnergy} className="relative mb-4">
              <input
                type="text"
                value={aiQuery}
                  aria-label="Energy analysis question"
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Ask about energy geopolitics... (e.g., 'Impact of China's solar panel dominance on US energy security')"
                className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-4 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-light text-lg"
                disabled={aiLoading}
              />
              <button
                type="submit"
                disabled={aiLoading || !aiQuery.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {aiLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ArrowRight className="w-5 h-5" />
                )}
              </button>
            </form>

            {/* Suggested Queries */}
            {!aiResult && !aiLoading && (
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  "China's rare earth monopoly impact",
                  "US IRA effect on clean energy",
                  "Nuclear energy revival 2025",
                  "Green hydrogen economy outlook",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => setAiQuery(q)}
                    className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-gray-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {aiLoading && (
              <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                <div className="text-center">
                  <p className="font-semibold text-white">
                    Analyzing Energy Intelligence...
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Strategic Implications • Market Impact • Key Players •
                    Outlook
                  </p>
                </div>
              </div>
            )}

            {aiError && (
              <div className="p-4 bg-red-500/10 border-l-2 border-red-500 text-red-200 text-sm">
                {aiError}
                <button
                  onClick={analyzeEnergy as any}
                  className="ml-3 text-emerald-400 hover:underline text-xs"
                >
                  Retry
                </button>
              </div>
            )}

            {aiResult && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-0 rounded-xl border border-white/10 overflow-hidden">
                {/* Summary */}
                <div className="p-4 border-b border-white/5 bg-white/5">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Shield className="w-3 h-3" /> Executive Summary
                  </h4>
                  <p className="text-sm text-gray-200 leading-relaxed">
                    {aiResult.summary}
                  </p>
                </div>

                {/* Strategic Implications */}
                <div className="p-4 border-b border-white/5">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                    Strategic Implications
                  </h4>
                  <ul className="space-y-2">
                    {aiResult.strategic_implications.map((impl, idx) => (
                      <li
                        key={idx}
                        className="flex gap-2 text-sm text-gray-300"
                      >
                        <span className="text-emerald-400 font-bold shrink-0">
                          ▸
                        </span>
                        {impl}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Affected Markets */}
                {aiResult.affected_markets &&
                  aiResult.affected_markets.length > 0 && (
                    <div className="p-4 border-b border-white/5 bg-gradient-to-r from-green-900/10 to-red-900/10">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <BarChart3 className="w-3 h-3" /> Affected Markets
                      </h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {aiResult.affected_markets.map((market, idx) => (
                          <div
                            key={idx}
                            className={`rounded-lg border p-3 ${market.direction?.toLowerCase() === "positive pressure" || market.direction?.toLowerCase() === "bullish" ? "text-green-400 bg-green-500/10 border-green-500/20" : market.direction?.toLowerCase() === "negative pressure" || market.direction?.toLowerCase() === "bearish" ? "text-red-400 bg-red-500/10 border-red-500/20" : "text-gray-400 bg-gray-500/10 border-gray-500/20"}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-white text-sm">
                                {market.market}
                              </span>
                              <span className="text-xs font-bold uppercase">
                                {market.direction?.toLowerCase() === "bullish"
                                  ? "Positive Pressure"
                                  : market.direction?.toLowerCase() ===
                                      "bearish"
                                    ? "Negative Pressure"
                                    : market.direction}
                              </span>
                            </div>
                            <p className="text-xs opacity-80">
                              {market.impact}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Key Players */}
                {aiResult.key_players && aiResult.key_players.length > 0 && (
                  <div className="p-4 border-b border-white/5">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                      Key Players
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {aiResult.key_players.map((player, idx) => (
                        <div
                          key={idx}
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2"
                        >
                          <div className="text-sm font-bold text-white">
                            {player.name}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {player.role}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Outlook */}
                <div className="p-4 bg-emerald-500/5">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <TrendingUp className="w-3 h-3" /> Outlook
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                        Short-Term (6-12 months)
                      </div>
                      <p className="text-sm text-gray-200">
                        {aiResult.outlook?.short_term}
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                        Long-Term (3-5 years)
                      </div>
                      <p className="text-sm text-gray-200">
                        {aiResult.outlook?.long_term}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 text-right">
                    <span
                      className={`text-[10px] px-2 py-1 rounded-full border font-bold ${aiResult.confidence === "Elevated" || aiResult.confidence === "High" ? "bg-green-500/20 text-green-400 border-green-500/30" : aiResult.confidence === "Moderate" || aiResult.confidence === "Medium" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}
                    >
                      GeoMoney Assessment: {aiResult.confidence}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.section>

        {/* ═══ 2. CRITICAL ENERGY COMMODITIES ═══════════ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          id="commodities"
          className="mb-16"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Battery className="w-6 h-6 text-emerald-400" />
            Critical Energy Commodities
            {live && (
              <span className="text-[10px] text-gray-500 font-normal ml-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Provider snapshot
              </span>
            )}
          </h2>

          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <p className="text-gray-400 text-sm mb-6">
              Track prices for critical minerals and materials powering the
              energy transition.
            </p>
            <p className="mb-4 text-xs text-gray-300">Quotes are delayed or stale. Missing observations show “Unavailable”, not a sample price.</p>
            {feedError && <p role="status" className="mb-4 text-sm text-amber-200">{feedError}</p>}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {ENERGY_COMMODITIES.map((commodity) => {
                const liveCommodity = live?.commodities?.find(
                  (c: any) =>
                    c.label?.toLowerCase().includes(commodity.name.toLowerCase().split(" ")[0]) ||
                    (commodity.symbol === "Cu" && c.symbol === "COPPER") ||
                    (commodity.symbol === "Ag" && c.symbol === "SILVER") ||
                    (commodity.symbol === "U₃O₈" && c.symbol === "URANIUM") ||
                    (commodity.symbol === "Li" && c.symbol === "LITHIUM")
                );
                const price = liveCommodity ? liveCommodity.price : null;
                const change = liveCommodity ? liveCommodity.changePercent : 0;
                return (
                  <div
                    key={commodity.symbol}
                    className="bg-black/30 rounded-lg p-4 border border-white/10 hover:border-emerald-500/30 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-emerald-400 font-bold text-lg">
                        {commodity.symbol}
                      </span>
                      <span
                        className={`text-xs font-medium ${change >= 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        {liveCommodity && change >= 0 ? "+" : ""}
                        {liveCommodity ? `${change.toFixed(2)}%` : "—"}
                      </span>
                    </div>
                    <div className="text-white font-semibold">
                      {price === null ? "Unavailable" : `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                    </div>
                    <div className="text-gray-500 text-xs">{commodity.name}</div>
                    <EnergyDataNotice status={liveCommodity?.dataStatus || "unavailable"} source={liveCommodity?.source || "No provider quote"} observedAt={liveCommodity?.lastTradingTimestamp} />
                    <div className="mt-2 text-[10px] text-emerald-400/70 font-medium uppercase tracking-wider">
                      {commodity.use}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.section>

        {/* ═══ 3. SOLAR ECONOMICS CALCULATOR ══════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          id="calculators"
          className="mb-16"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Sun className="w-6 h-6 text-yellow-400" />
            Solar Economics Calculator
          </h2>

          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <p className="text-gray-400 text-sm mb-6">
              Calculate the return on investment for a solar panel installation
              based on entered system size, costs and sun hours.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm text-gray-400 flex justify-between items-center mb-1.5">
                  <span>Location Coordinates</span>
                  <button
                    onClick={() => captureLocation(setSolarLocation)}
                    className="text-xs text-yellow-500 hover:text-yellow-400 transition-colors"
                  >
                    Auto-Capture (GPS)
                  </button>
                </label>
                <input
                  type="text"
                  aria-label="Solar location coordinates (optional note)"
                  value={solarLocation}
                  onChange={(e) => setSolarLocation(e.target.value)}
                  placeholder="e.g. 34.05, -118.24"
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label htmlFor="energy-field-1" className="text-sm text-gray-400 block mb-1.5">
                  System Size (kW)
                </label>
                <input id="energy-field-1"
                  type="number" min="0" step="any"
                  value={solarSize}
                  onChange={(e) => setSolarSize(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="energy-field-2" className="text-sm text-gray-400 block mb-1.5">
                  Cost per Watt ($)
                </label>
                <input id="energy-field-2"
                  type="number" min="0" step="any"
                  value={costPerWatt}
                  onChange={(e) => setCostPerWatt(e.target.value)}
                  placeholder="e.g. 2.50"
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="energy-field-3" className="text-sm text-gray-400 block mb-1.5">
                  Electricity Rate ($/kWh)
                </label>
                <input id="energy-field-3"
                  type="number" min="0" step="any"
                  value={electricityRate}
                  onChange={(e) => setElectricityRate(e.target.value)}
                  placeholder="e.g. 0.14"
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="energy-field-4" className="text-sm text-gray-400 block mb-1.5">
                  Peak Sun Hours/Day
                </label>
                <input id="energy-field-4"
                  type="number" min="0" step="any"
                  value={sunHours}
                  onChange={(e) => setSunHours(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>
              <div>
                <div aria-hidden="true" className="h-6" />
                <button
                  onClick={calculateSolarROI}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold py-3 rounded-lg hover:from-yellow-400 hover:to-orange-400 transition-all"
                >
                  Calculate ROI
                </button>
              </div>
            </div>

            <p className="mt-3 text-xs text-gray-300">Simple estimate: no degradation, financing, maintenance, incentives or system losses. Coordinates are optional notes only; they do not adjust solar yield.</p>
            {calculationErrors.solar && <p role="alert" className="mt-3 text-sm text-rose-300">{calculationErrors.solar}</p>}
            {solarResult && (
              <div className="mt-6 grid md:grid-cols-4 gap-4">
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="text-sm text-gray-400">Annual Production</div>
                  <div className="text-xl font-bold text-yellow-400">
                    {solarResult.annualProduction} kWh
                  </div>
                </div>
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="text-sm text-gray-400">Annual Savings</div>
                  <div className="text-xl font-bold text-green-400">
                    ${solarResult.annualSavings}
                  </div>
                </div>
                <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                  <div className="text-sm text-gray-400">Payback Period</div>
                  <div className="text-xl font-bold text-cyan-400">
                    {solarResult.payback}
                  </div>
                </div>
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <div className="text-sm text-gray-400">
                    25-Year Net Savings
                  </div>
                  <div
                    className={`text-xl font-bold ${parseFloat(solarResult.savings25.replace(/,/g, "")) >= 0 ? "text-emerald-400" : "text-red-400"}`}
                  >
                    ${solarResult.savings25}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.section>

        {/* ═══ 4. WIND FARM CAPACITY CALCULATOR ═════════ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Wind className="w-6 h-6 text-cyan-400" />
            Wind Farm Capacity Calculator
          </h2>

          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <p className="text-gray-400 text-sm mb-6">
              Estimate wind farm output based on turbine specifications and
              capacity factor.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm text-gray-400 flex justify-between items-center mb-1.5">
                  <span>Location Coordinates</span>
                  <button
                    onClick={() => captureLocation(setWindLocation)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Auto-Capture (GPS)
                  </button>
                </label>
                <input
                  type="text"
                  aria-label="Wind location coordinates (optional note)"
                  value={windLocation}
                  onChange={(e) => setWindLocation(e.target.value)}
                  placeholder="e.g. 51.50, -0.12"
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="energy-field-5" className="text-sm text-gray-400 block mb-1.5">
                  Number of Turbines
                </label>
                <input id="energy-field-5"
                  type="number" min="0" step="any"
                  value={turbineCount}
                  onChange={(e) => setTurbineCount(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="energy-field-6" className="text-sm text-gray-400 block mb-1.5">
                  Turbine Rating (MW)
                </label>
                <input id="energy-field-6"
                  type="number" min="0" step="any"
                  value={turbineRating}
                  onChange={(e) => setTurbineRating(e.target.value)}
                  placeholder="e.g. 3"
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="energy-field-7" className="text-sm text-gray-400 block mb-1.5">
                  Capacity Factor (%)
                </label>
                <input id="energy-field-7"
                  type="number" min="0" step="any"
                  value={capacityFactor}
                  onChange={(e) => setCapacityFactor(e.target.value)}
                  placeholder="e.g. 35"
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
              <div>
                <div aria-hidden="true" className="h-6" />
                <button
                  onClick={calculateWindFarm}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-3 rounded-lg hover:from-cyan-400 hover:to-blue-400 transition-all"
                >
                  Calculate
                </button>
              </div>
            </div>

            <p className="mt-3 text-xs text-gray-300">Planning estimate using the entered capacity factor. Coordinates are optional notes only. Homes assume 10.5 MWh/year per household.</p>
            {calculationErrors.wind && <p role="alert" className="mt-3 text-sm text-rose-300">{calculationErrors.wind}</p>}
            {windResult && (
              <div className="mt-6 grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                  <div className="text-sm text-gray-400">Total Capacity</div>
                  <div className="text-xl font-bold text-cyan-400">
                    {windResult.totalCapacity} MW
                  </div>
                </div>
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="text-sm text-gray-400">Annual Output</div>
                  <div className="text-xl font-bold text-blue-400">
                    {windResult.annualOutput} MWh
                  </div>
                </div>
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <div className="text-sm text-gray-400">Homes Powered</div>
                  <div className="text-xl font-bold text-emerald-400">
                    {windResult.homesPowered}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.section>

        {/* ═══ 5. CARBON OFFSET ESTIMATOR ═══════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Leaf className="w-6 h-6 text-green-400" />
            Carbon Offset Estimator
          </h2>

          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <p className="text-gray-400 text-sm mb-6">
              Estimate the CO₂ offset from renewable energy installations versus
              coal-fired power generation.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1.5">
                  Renewable Capacity (MW)
                </label>
                <input
                  type="number" min="0" step="any"
                  value={renewableCapacity}
                  onChange={(e) => setRenewableCapacity(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="energy-field-8" className="text-sm text-gray-400 block mb-1.5">
                  Energy Source
                </label>
                <select id="energy-field-8"
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                >
                  <option value="solar">Solar PV</option>
                  <option value="wind">Wind</option>
                  <option value="hydro">Hydropower</option>
                  <option value="nuclear">Nuclear</option>
                  <option value="geothermal">Geothermal</option>
                </select>
              </div>
              <div>
                <div aria-hidden="true" className="h-6" />
                <button
                  onClick={calculateCarbon}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-black font-bold py-3 rounded-lg hover:from-green-400 hover:to-emerald-400 transition-all"
                >
                  Estimate Offset
                </button>
              </div>
            </div>

            <p className="mt-3 text-xs text-gray-300">Illustrative assumptions: 25% capacity factor for all sources, coal baseline 1 tCO₂/MWh, 45 trees/tCO₂/year and 4.6 tCO₂/car/year. Not a certified carbon credit calculation.</p>
            {calculationErrors.carbon && <p role="alert" className="mt-3 text-sm text-rose-300">{calculationErrors.carbon}</p>}
            {carbonResult && (
              <div className="mt-6 grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="text-sm text-gray-400">Annual CO₂ Offset</div>
                  <div className="text-xl font-bold text-green-400">
                    {carbonResult.co2Offset} tonnes
                  </div>
                </div>
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <div className="text-sm text-gray-400">
                    Equivalent Trees Planted
                  </div>
                  <div className="text-xl font-bold text-emerald-400">
                    🌳 {carbonResult.trees}
                  </div>
                </div>
                <div className="p-4 bg-teal-500/10 border border-teal-500/30 rounded-lg">
                  <div className="text-sm text-gray-400">
                    Equivalent Cars Removed
                  </div>
                  <div className="text-xl font-bold text-teal-400">
                    🚗 {carbonResult.cars}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.section>

        {/* ═══ ENERGY STORAGE ═══════════════════════════ */}
        <motion.section
          id="storage"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Battery className="w-6 h-6 text-purple-400" />
            Energy Storage Systems (ESS & BESS)
          </h2>
          <div className="bg-white/5 rounded-xl border border-white/10 p-6 flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <Zap className="w-12 h-12 text-purple-400/50 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">
                Energy Storage Overview
              </h3>
              <p className="text-gray-400 text-sm max-w-md mx-auto">
                Track battery energy storage systems, utility-scale storage
                deployments, and grid stability metrics.
              </p>
            </div>
          </div>
        </motion.section>
        <div id="policy"></div>
        {/* ═══ 7. ENERGY POLICY TRACKER ═════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Landmark className="w-6 h-6 text-emerald-400" />
            Global Energy Policy Tracker
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ENERGY_POLICIES.map((policy) => (
              <div
                key={policy.name}
                className="bg-white/5 rounded-xl border border-white/10 p-5 hover:border-emerald-500/30 transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">
                    {policy.country.split(" ")[0]}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-1 rounded-full font-bold tracking-wider uppercase ${policy.status === "Active" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"}`}
                  >
                    {policy.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">
                  {policy.name}
                </h3>
                <div className="text-sm text-emerald-400 font-bold mb-3">
                  {policy.investment} investment
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {policy.focus}
                </p>
                <div className="mt-3 text-xs text-gray-500">
                  Since {policy.year}
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ═══ 8. ENERGY TRANSITION TIMELINE ════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            Energy Transition Timeline
          </h2>

          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[60px] md:left-[80px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 via-cyan-500 to-purple-500" />

              <div className="space-y-6">
                {TIMELINE_EVENTS.map((event, idx) => {
                  const typeColors: { [key: string]: string } = {
                    Policy: "bg-blue-500/20 text-blue-400 border-blue-500/30",
                    Milestone:
                      "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
                    Market:
                      "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
                    Technology:
                      "bg-purple-500/20 text-purple-400 border-purple-500/30",
                    Target: "bg-red-500/20 text-red-400 border-red-500/30",
                  };
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * idx }}
                      className="flex items-center gap-4 group"
                    >
                      <div className="w-[50px] md:w-[70px] text-right shrink-0">
                        <span className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                          {event.year}
                        </span>
                      </div>
                      <div className="relative shrink-0">
                        <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-black shadow-lg shadow-emerald-500/30 group-hover:scale-125 transition-transform" />
                      </div>
                      <div className="flex-1 bg-black/30 rounded-lg p-3 border border-white/10 group-hover:border-emerald-500/30 transition-all">
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="text-sm text-gray-200 font-medium">
                            {event.event}
                          </p>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full border font-bold tracking-wider uppercase shrink-0 ${typeColors[event.type]}`}
                          >
                            {event.type}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
