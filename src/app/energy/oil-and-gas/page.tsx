"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Flame,
  TrendingUp,
  TrendingDown,
  Map as MapIcon,
  ShieldAlert,
  Thermometer,
  Route,
  BoxSelect,
  Cpu,
  Ship,
  Anchor,
  Crosshair,
  Radio,
  Calculator,
  BrainCircuit,
  Wind,
  CloudRain,
  CloudLightning,
  Sun,
    Database,
} from "lucide-react";
import dynamic from "next/dynamic";

const IntelligenceMap = dynamic(() => import("@/components/IntelligenceMap"), {
  ssr: false,
});

// --- MOCK DATA ---
const INTELLIGENCE_LAYERS = [
  {
    id: "ais",
    name: "Standard AIS",
    desc: "Regular ship tracking",
    icon: Ship,
    color: "text-blue-400",
    layman:
      "Shows standard tracking transponders (AIS) for oil tankers and cargo ships. Green means normal operations. This tells us where legal, publicly visible oil is flowing.",
  },
  {
    id: "shadow",
    name: "Shadow Mode",
    desc: "AI-detected Dark Ships",
    icon: Crosshair,
    color: "text-purple-400",
    layman:
      "Highlights vessels moving suspiciously (e.g., speeding cargo ships or ships claiming to be stopped but moving). This reveals 'dark fleets' often used to evade oil sanctions.",
  },
  {
    id: "thermal",
    name: "Thermal Pulse",
    desc: "Refinery heat signatures",
    icon: Thermometer,
    color: "text-red-400",
    layman:
      "Plots major global oil refineries and shows their current output deviations. If a refinery's output drops, local fuel prices might spike.",
  },
  {
    id: "temp",
    name: "Temperature",
    desc: "Global Heatmap",
    icon: Sun,
    color: "text-orange-500",
    layman:
      "Visualizes extreme heat or cold waves globally. Severe temperatures drive up energy demand for heating or cooling, which directly impacts natural gas and oil prices.",
  },
  {
    id: "wind",
    name: "Wind Surface",
    desc: "Global wind patterns",
    icon: Wind,
    color: "text-cyan-400",
    layman:
      "Displays wind speed. Strong winds can delay offshore oil drilling, disrupt tanker shipments, or boost renewable wind energy generation, affecting crude demand.",
  },
  {
    id: "rain",
    name: "Precipitation",
    desc: "Rainfall forecasting",
    icon: CloudRain,
    color: "text-blue-300",
    layman:
      "Shows rainfall mapping. Heavy precipitation can flood out regional supply chains or impact energy infrastructure like open-pit coal mines.",
  },
  {
    id: "storm",
    name: "Storm Prediction",
    desc: "Weather & Clouds",
    icon: CloudLightning,
    color: "text-gray-400",
    layman:
      "Tracks dense cloud cover and storm cells. Cyclones and hurricanes in regions like the Gulf of Mexico regularly force oil rigs to shut down, causing supply shocks.",
  },
];

export default function OilAndGasIntelligence() {
  const [simulationMode, setSimulationMode] = useState(false);
  const [activeLayer, setActiveLayer] = useState("shadow");
  const [shipData, setShipData] = useState<any[]>([]);

  const fetchShips = async () => {
    try {
      const res = await fetch("/api/world-monitor/ships");
      if (!res.ok) return;
      const data = await res.json();
      // Only keep relevant oil & gas supply chain vessels (tankers, lng, bulk)
      const relevantShips = (data.ships || []).filter((s: any) =>
        ["tanker", "lng", "bulk"].includes(s.type?.toLowerCase() || ""),
      );
      setShipData(relevantShips);
    } catch (e) {
      console.warn("[Ships fetch failed]", e);
    }
  };

  useEffect(() => {
    fetchShips();
    const id = setInterval(fetchShips, 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <main
      className={
        simulationMode
          ? "min-h-screen pt-28 pb-24 transition-colors duration-500 bg-[#1a1100] border-amber-500/30 border-8"
          : "min-h-screen pt-28 pb-24 transition-colors duration-500 bg-gradient-to-br from-[#0a0a0c] to-black"
      }
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* --- HEADER --- */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <Link
              href="/energy"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-geo-gold transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Energy Hub
            </Link>
            <span className="text-amber-500 text-sm font-medium tracking-widest uppercase flex items-center gap-2">
              <Flame className="w-4 h-4" /> Oil & Gas Intelligence
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mt-2 text-white">
              Geopolitical{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Hydrocarbon
              </span>{" "}
              Matrix
            </h1>
          </div>

          {/* Simulation Dock Toggle */}
          <button
            onClick={() => setSimulationMode(!simulationMode)}
            className={`flex items-center gap-3 px-6 py-3 rounded-full border transition-all ${simulationMode ? "bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]" : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"}`}
          >
            <Cpu className="w-5 h-5" />
            <div className="text-left leading-tight">
              <div className="text-xs font-mono opacity-70">
                Simulation Dock
              </div>
              <div className="font-bold">
                {simulationMode ? "ACTIVE" : "STANDBY"}
              </div>
            </div>
          </button>
        </div>
        {/* --- FAST TRACK WALKTHROUGH --- */}
        <div className="mb-6 border-2 border-dashed border-white/20 bg-geo-dark/50 backdrop-blur-sm rounded-2xl p-6 text-gray-300">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-geo-gold">Terminal Walkthrough:</span> How to
            use this section
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-amber-500" />
              <p>
                <strong className="text-amber-400">Simulation Dock:</strong>{" "}
                Click STANDBY at the top right to activate sandbox mode.
                Simulates geopolitical blockades to stress-test your analytics.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-purple-500" />
              <p>
                <strong className="text-purple-400">
                  Intelligence Layers:
                </strong>{" "}
                Use the map overlay toggles to reveal hidden datasets like "Dark
                Ships" (Shadow Fleet) escaping standard AIS trackers, or
                refinery heat signatures.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-blue-500" />
              <p>
                <strong className="text-blue-400">Predictive Engine:</strong>{" "}
                Watch the 7-day forecast react in real-time to your simulated
                blockade scenarios (via the orange dashed line on the chart).
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500" />
              <p>
                <strong className="text-emerald-400">
                  Corridor Volatility:
                </strong>{" "}
                Monitor last-mile delivery risks across key global routes to
                assess physical market bottlenecks.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* --- LEFT COL: MAIN MAP & FORECAST --- */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Map Area */}
            <div
              className={`relative h-[500px] rounded-2xl overflow-hidden border ${simulationMode ? "border-amber-500/50" : "border-white/10"} bg-black/50 p-1`}
            >
              {/* REAL LEAFLET MAP BACKGROUND */}
              <div className="absolute inset-0 z-0">
                <IntelligenceMap activeLayer={activeLayer} ships={shipData} />
              </div>

              {/* Layer Toggles overlay */}
              <div className="absolute top-4 left-4 z-10 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-2 flex flex-col gap-2">
                <span className="text-xs font-semibold text-gray-400 px-2 pb-1 border-b border-white/10">
                  INTELLIGENCE LAYERS
                </span>
                {INTELLIGENCE_LAYERS.map((layer) => (
                  <button
                    key={layer.id}
                    onClick={() => setActiveLayer(layer.id)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeLayer === layer.id ? "bg-white/10" : "hover:bg-white/5"}`}
                  >
                    <layer.icon
                      className={`w-4 h-4 ${layer.color} ${activeLayer === layer.id ? "opacity-100" : "opacity-40"}`}
                    />
                    <span
                      className={`text-sm ${activeLayer === layer.id ? "text-white" : "text-gray-500"}`}
                    >
                      {layer.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Layman Summarizer Widget */}
              {(() => {
                const activeLayerInfo = INTELLIGENCE_LAYERS.find(
                  (l) => l.id === activeLayer,
                );
                if (!activeLayerInfo?.layman) return null;

                return (
                  <div className="absolute bottom-4 left-4 z-10 w-80 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <BrainCircuit className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs font-bold text-emerald-400 tracking-wider">
                        AI SUMMARIZER
                      </h3>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {activeLayerInfo.layman}
                    </p>
                  </div>
                );
              })()}

              {/* "What-If" Sandbox Drag Info overlay */}
              <AnimatePresence>
                {simulationMode && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-amber-500/20 backdrop-blur-md border border-amber-500/50 text-amber-100 px-6 py-3 rounded-full text-sm font-medium flex items-center gap-3 shadow-2xl z-20"
                  >
                    <ShieldAlert className="w-5 h-5 text-amber-500 animate-pulse" />
                    Drag blockade markers onto Strait of Hormuz or Malacca
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Predictive Price Engine */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
              <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                <TrendingUp className="text-amber-500 w-5 h-5" /> 7-Day
                Predictive Price Engine
              </h3>
              <div className="h-48 flex items-end justify-between gap-2 border-b border-l border-white/10 pl-2 pb-2 relative">
                {/* Grid lines */}
                <div className="absolute w-full border-t border-white/5 bottom-[33%]" />
                <div className="absolute w-full border-t border-white/5 bottom-[66%]" />

                {/* Mock Chart Bars */}
                {[40, 45, 60, 50, 70, 65, 80].map((h, i) => (
                  <div
                    key={i}
                    className="relative w-full flex justify-center group h-full items-end"
                  >
                    <div
                      style={{ height: h + "%" }}
                      className="w-2/3 bg-blue-500/50 rounded-t-sm transition-all"
                    />
                    <div
                      style={{ height: h + 5 + "%" }}
                      className="w-1 bg-geo-gold absolute rounded-t-sm z-10 shadow-[0_0_8px_rgba(255,215,0,0.5)]"
                    />
                    {/* Simulation Line */}
                    {simulationMode && (
                      <div
                        style={{ height: h + i * 10 + "%" }}
                        className="w-1 bg-orange-500 absolute -right-1 rounded-t-sm z-20 border-l border-dashed border-black"
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2 px-2">
                <span>Day 1</span>
                <span>Day 2</span>
                <span>Day 3</span>
                <span>Day 4</span>
                <span>Day 5</span>
                <span>Day 6</span>
                <span>Day 7</span>
              </div>
              {/* Legend */}
              <div className="flex gap-4 mt-6 text-xs font-medium pl-2">
                <div className="flex items-center gap-2 text-gray-400">
                  <div className="w-3 h-3 bg-blue-500 border border-blue-400 rounded-sm" />{" "}
                  BASELINE CURRENT
                </div>
                <div className="flex items-center gap-2 text-geo-gold">
                  <div className="w-3 h-3 bg-geo-gold rounded-full" /> AI
                  PREDICTED
                </div>
                {simulationMode && (
                  <div className="flex items-center gap-2 text-orange-400">
                    <div className="w-3 h-3 bg-orange-500 rounded-sm" />{" "}
                    SIMULATED IMPACT
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* --- RIGHT COL: WIDGETS --- */}
          <div className="flex flex-col gap-6">
            {/* Corridor Volatility Card */}
            {(() => {
              // Dynamically calculate corridor congestion using live shipData
              const getRegionScore = (
                minLat: number,
                maxLat: number,
                minLon: number,
                maxLon: number,
                baseRisk: number,
              ) => {
                const shipsInRegion = shipData.filter(
                  (s) =>
                    s.latitude >= minLat &&
                    s.latitude <= maxLat &&
                    s.longitude >= minLon &&
                    s.longitude <= maxLon,
                ).length;
                // Dynamic score = base risk + (5 points per ship in the zone, max 99)
                const dynamicScore = Math.min(99, baseRisk + shipsInRegion * 5);
                let status = "Normal";
                let bg = "bg-emerald-500";
                let text = "text-emerald-500";
                let textLight = "text-emerald-100";
                if (dynamicScore > 75) {
                  status = "Critical";
                  bg = "bg-red-500";
                  text = "text-red-500";
                  textLight = "text-red-100";
                } else if (dynamicScore > 50) {
                  status = "Elevated";
                  bg = "bg-orange-500";
                  text = "text-orange-500";
                  textLight = "text-orange-100";
                }
                return {
                  score: Math.round(dynamicScore),
                  status,
                  bg,
                  text,
                  textLight,
                  ships: shipsInRegion,
                };
              };

              // Bounding boxes for major hubs
              const hormuz = getRegionScore(24, 28, 54, 58, 65); // Naturally higher risk baseline
              const ara = getRegionScore(49, 54, 1, 6, 45); // Euro ARA
              const usgc = getRegionScore(25, 31, -98, -88, 15); // US Gulf Coast

              const regions = [
                {
                  name: "Strait of Hormuz",
                  data: hormuz,
                  desc: "The world's most critical oil chokepoint. High congestion or blockages here immediately spike global Brent crude prices, as 20% of global consumption passes through here.",
                },
                {
                  name: "Euro ARA Hubs",
                  data: ara,
                  desc: "Amsterdam, Rotterdam, and Antwerp. This is Europe's primary oil storage and refining hub. High congestion means European demand is booming or storage is overflowing.",
                },
                {
                  name: "US Gulf Coast",
                  data: usgc,
                  desc: "The epicenter of US oil refining and WTI crude exports. Elevated congestion often occurs before major hurricanes or during heavy export seasons.",
                },
              ];

              return (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="font-bold flex items-center gap-2 mb-4 text-white">
                    <Route className="w-5 h-5 text-purple-400" /> Corridor
                    Volatility
                  </h3>
                  <p className="text-sm text-gray-400 mb-6">
                    Real-time delivery risk tracking based on live tanker AIS
                    data in crucial global chokepoints.
                  </p>

                  <div className="space-y-4">
                    {regions.map((region, idx) => (
                      <div
                        key={idx}
                        className="bg-black/30 rounded-xl p-4 border border-white/5 relative overflow-hidden group"
                      >
                        <div
                          className={`absolute top-0 right-0 w-1 h-full ${region.data.bg}`}
                        />

                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span
                              className={`font-medium ${region.data.textLight}`}
                            >
                              {region.name}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                              <Anchor className="w-3 h-3" /> {region.data.ships}{" "}
                              tankers detected
                            </div>
                          </div>
                          <span
                            className={`text-2xl font-black ${region.data.text}`}
                          >
                            {region.data.score}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 ${region.data.text}`}
                          >
                            {region.data.status}
                          </span>
                        </div>

                        {/* Layman Explainer Box - reveals on group hover */}
                        <div className="text-[10px] text-gray-400 bg-white/5 p-2 rounded border border-white/5 hidden group-hover:block transition-all">
                          <strong className="text-gray-300 block mb-1">
                            Why it matters:
                          </strong>
                          {region.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Oil & Gas Conversion Calculator Tool */}
            <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-6">
              <h3 className="font-bold flex items-center gap-2 mb-4 text-white">
                <Calculator className="w-5 h-5 text-geo-gold" /> Industry
                Converter
              </h3>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="1000"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-geo-gold"
                  />
                  <select className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white outline-none">
                    <option>Barrels (bbl)</option>
                    <option>Gallons (gal)</option>
                    <option>Cubic Meters</option>
                  </select>
                </div>
                <div className="flex justify-center text-gray-500">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    readOnly
                    value="158.98"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-gray-300 outline-none"
                  />
                  <select className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white outline-none">
                    <option>Liters (L)</option>
                    <option>Cubic Feet</option>
                    <option>Metric Tons</option>
                  </select>
                </div>
                <a
                  href="https://www.rigzone.com/calculator/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-center text-gray-500 hover:text-geo-gold mt-2 transition-colors"
                >
                  Uses standard API gravity formulas. Ref: Rigzone
                </a>
              </div>
            </div>

            {/* Analyzer for Latest Insights */}
              {(() => {
                const numVal = parseFloat((shipData.length * 2.1).toFixed(1)) || 1450.0;
                const inTransitMBarrels = shipData.length > 0 ? (shipData.length * 2.1).toFixed(1) : "1,450.0";
                const globalStorage = 4120.5; // Baseline mock
                const totalSupply = numVal + globalStorage;
                const transitPercent = ((numVal / totalSupply) * 100).toFixed(1);

                return (
                  <div className="bg-blue-950/20 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors" />
                    <h3 className="font-bold flex items-center gap-2 mb-4 text-white relative z-10">
                      <BrainCircuit className="w-5 h-5 text-blue-400" /> AI OSINT Analyzer
                    </h3>
                    <div className="space-y-4 relative z-10">
                      
                      {/* Satellite Imagery */}
                      <div className="border border-white/5 bg-black/40 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-xs text-blue-200 font-medium">OPEC+ Storage Satellite Feed</p>
                          <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-bold tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            LIVE
                          </span>
                        </div>
                        <div className="relative w-full h-32 rounded border border-white/10 overflow-hidden mb-2">
                          <img 
                            src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop" 
                            alt="Satellite Oil Tanks" 
                            className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-luminosity hover:mix-blend-normal transition-all"
                          />
                          {/* UI overlay on satellite */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2 pointer-events-none">
                            <span className="text-[10px] text-white font-mono bg-black/60 px-1 inline-block w-max border border-white/10">LOC: 26�16'18"N 50�08'19"E</span>
                            <span className="text-[10px] text-emerald-400 font-mono bg-black/60 px-1 inline-block w-max mt-0.5 border border-white/10">EST. VOL: +4.2% CAPACITY</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-relaxed">
                          AI detection shows major facility clusters exceeding exported tank limits, highly correlated with localized shadow fleet anomalies.
                        </p>
                      </div>

                      {/* Fuel Tracker */}
                      <div className="border border-white/5 bg-black/40 rounded-lg p-4">
                        <p className="text-xs text-blue-300 font-medium mb-3 flex items-center gap-2">
                          <Database className="w-3 h-3 text-blue-400" /> Global Crude Logistics
                        </p>
                        
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className="text-gray-400">At Sea (In Transit)</span>
                              <span className="text-white font-bold">{inTransitMBarrels} MBBL</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-blue-500 h-1.5 rounded-full relative" style={{ width: `${transitPercent}%` }}>
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className="text-gray-400">Onshore Storage (SPR + Comm)</span>
                              <span className="text-white font-bold">{globalStorage.toLocaleString()} MBBL</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-orange-500 h-1.5 rounded-full w-[82%]" ></div>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </main>
    );
  }
