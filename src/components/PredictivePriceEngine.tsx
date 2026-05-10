"use client";

import { useState, useEffect } from "react";
import { TrendingUp, MapPin, Clock } from "lucide-react";
import { motion } from "framer-motion";

type Commodity = "gas" | "petrol" | "diesel" | "wti" | "brent";
type Timeframe = "1week" | "1month";

interface GeolocationState {
  lat: number | null;
  lon: number | null;
  city: string;
  loading: boolean;
  error: string | null;
}

export function PredictivePriceEngine({
  simulationImpact = 0,
}: {
  simulationImpact?: number;
}) {
  const [commodity, setCommodity] = useState<Commodity>("petrol");
  const [timeframe, setTimeframe] = useState<Timeframe>("1week");
  const [geo, setGeo] = useState<GeolocationState>({
    lat: null,
    lon: null,
    city: "Detecting Location...",
    loading: true,
    error: null,
  });

  const [lastCalculated, setLastCalculated] = useState<string>("...");

  // Get User Geolocation and set time
  useEffect(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    setLastCalculated(
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    );

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Reverse geocoding (mocked or actual API)
            // For now, we simulate finding the city
            setGeo({
              lat: position.coords.latitude,
              lon: position.coords.longitude,
              city: "Local Region", // Replace with real reverse geocoding API
              loading: false,
              error: null,
            });
          } catch (err) {
            setGeo((prev) => ({ ...prev, loading: false, city: "Global Avg" }));
          }
        },
        (error) => {
          setGeo((prev) => ({
            ...prev,
            loading: false,
            error: "Location access denied",
            city: "Global Avg",
          }));
        },
      );
    } else {
      setGeo((prev) => ({
        ...prev,
        loading: false,
        error: "Geolocation unsupported",
        city: "Global Avg",
      }));
    }
  }, []);

  // Mock Data generation based on parameters
  const getMockData = (
    currentCommodity: Commodity,
    currentTimeframe: Timeframe,
  ) => {
    const points = currentTimeframe === "1week" ? 7 : 30;
    const basePrices = {
      gas: 2.8,
      petrol: 3.5,
      diesel: 3.8,
      wti: 75.0,
      brent: 80.0,
    };

    let base = basePrices[currentCommodity];

    return Array.from({ length: points }).map((_, i) => {
      const volatility = currentTimeframe === "1week" ? 0.05 : 0.15;
      const trend = Math.sin(i * 0.5) * volatility * base;
      const simBoost = i > 0 ? (simulationImpact / 100) * base : 0;
      const aiPrediction =
        base + trend + Math.random() * volatility * base * 0.5 + simBoost;
      return {
        baseline: base + trend * 0.5,
        predicted: aiPrediction,
      };
    });
  };

  const [chartData, setChartData] = useState<
    { baseline: number; predicted: number }[]
  >(() => {
    // Return empty array initially for stable SSR
    return [];
  });

  useEffect(() => {
    setChartData(getMockData(commodity, timeframe));
  }, [commodity, timeframe, simulationImpact]);

  const maxVal =
    chartData.length > 0
      ? Math.max(...chartData.map((d) => Math.max(d.baseline, d.predicted))) *
        1.1
      : 100;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden flex flex-col h-full">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="text-amber-500 w-5 h-5" />
          AI Predictive Price Engine
        </h3>

        <div className="flex items-center gap-2 text-xs font-mono text-gray-400 bg-black/20 px-3 py-1.5 rounded-full border border-white/5">
          <Clock className="w-3 h-3 text-geo-gold" />
          Updated: {lastCalculated}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-8 justify-between">
        {/* Geolocation Info */}
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <MapPin
            className={`w-4 h-4 ${geo.loading ? "text-gray-500 animate-pulse" : "text-blue-400"}`}
          />
          <span className="font-semibold">{geo.city}</span>
          {geo.error && (
            <span className="text-red-400 text-xs">({geo.error})</span>
          )}
        </div>

        {/* Commodity Selector */}
        <div className="flex gap-2">
          {(["petrol", "diesel", "gas", "wti", "brent"] as Commodity[]).map(
            (c) => (
              <button
                key={c}
                onClick={() => setCommodity(c)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors capitalize ${
                  commodity === c
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-200 font-bold"
                    : "bg-black/20 border-white/10 text-gray-400 hover:bg-white/5"
                }`}
              >
                {c.toUpperCase()}
              </button>
            ),
          )}
        </div>

        {/* Timeframe Selector */}
        <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-white/10">
          <button
            onClick={() => setTimeframe("1week")}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${timeframe === "1week" ? "bg-white/20 text-white" : "text-gray-400"}`}
          >
            1 Week
          </button>
          <button
            onClick={() => setTimeframe("1month")}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${timeframe === "1month" ? "bg-white/20 text-white" : "text-gray-400"}`}
          >
            1 Month
          </button>
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-64 flex items-end justify-between gap-1 sm:gap-2 border-b border-l border-white/10 pl-2 pb-2 relative mt-auto">
        {/* Grid lines */}
        {[33, 66].map((pct) => (
          <div
            key={pct}
            className="absolute w-full border-t border-white/5 left-0"
            style={{ bottom: `${pct}%` }}
          />
        ))}

        {chartData.map((data, i) => (
          <div
            key={i}
            className="relative w-full flex justify-center group h-full items-end"
          >
            {/* Baseline Bar */}
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(data.baseline / maxVal) * 100}%` }}
              transition={{
                duration: 0.5,
                delay: i * (timeframe === "1week" ? 0.05 : 0.01),
              }}
              className="w-full max-w-[40px] bg-blue-500/40 rounded-t-sm transition-all group-hover:bg-blue-500/60 relative flex justify-center"
            >
              {/* Display baseline price inside or on top of the bar */}
              <span className="absolute -top-4 text-[10px] text-blue-200 font-mono opacity-80 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                ${data.baseline.toFixed(2)}
              </span>
            </motion.div>

            {/* AI Prediction Line */}
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(data.predicted / maxVal) * 100}%` }}
              transition={{
                duration: 0.5,
                delay: 0.2 + i * (timeframe === "1week" ? 0.05 : 0.01),
              }}
              className="absolute w-[2px] bg-geo-gold shadow-[0_0_8px_rgba(255,215,0,0.8)] z-10 bottom-0 flex justify-center"
              style={{ maxHeight: "100%" }}
            >
              <div className="absolute -top-6 bg-black/60 px-1 py-0.5 rounded text-[10px] text-geo-gold font-bold font-mono whitespace-nowrap">
                ${data.predicted.toFixed(2)}
              </div>
            </motion.div>

            {/* Tooltip on Hover (Optional now, but keep for exact details) */}
            <div className="absolute -top-10 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 pointer-events-none">
              AI: ${data.predicted.toFixed(2)}
              <br />
              Base: ${data.baseline.toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* X-Axis Labels */}
      <div className="flex justify-between text-xs text-gray-500 mt-2 px-2 pb-4">
        <span>{timeframe === "1week" ? "Today" : "Day 1"}</span>
        {timeframe === "1week" ? (
          <>
            <span>Day 2</span>
            <span>Day 3</span>
            <span>Day 4</span>
            <span>Day 5</span>
            <span>Day 6</span>
          </>
        ) : (
          <>
            <span>Day 15</span>
          </>
        )}
        <span>{timeframe === "1week" ? "Day 7" : "Day 30"}</span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-2 text-xs font-medium pl-2 bg-black/20 p-3 rounded-lg border border-white/5">
        <div className="flex items-center gap-2 text-gray-400">
          <div className="w-3 h-3 bg-blue-500 border border-blue-400 rounded-sm opacity-60" />
          CURRENT / HISTORIC
        </div>
        <div className="flex items-center gap-2 text-geo-gold">
          <div className="w-3 h-3 bg-geo-gold rounded-full shadow-[0_0_5px_rgba(255,215,0,0.5)]" />
          AI PREDICTION
        </div>
      </div>
    </div>
  );
}
