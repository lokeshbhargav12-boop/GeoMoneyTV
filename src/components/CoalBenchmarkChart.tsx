"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

type ChartInterval = "D" | "W" | "M";

interface MarketHistoryPoint {
  date: string;
  close: number;
}

interface CoalBenchmarkChartProps {
  symbol: string;
  label: string;
  color?: string;
  height?: number;
}

function formatLabel(value: string, interval: ChartInterval) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  if (interval === "D") {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
  }
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit" }).format(date);
}

export default function CoalBenchmarkChart({
  symbol,
  label,
  color = "#f59e0b",
  height = 320,
}: CoalBenchmarkChartProps) {
  const [history, setHistory] = useState<MarketHistoryPoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interval, setInterval] = useState<ChartInterval>("D");

  useEffect(() => {
    const controller = new AbortController();
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/coal/chart-history?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        const json = await res.json();
        const nextHistory = Array.isArray(json.data)
          ? json.data
              .filter(
                (point: MarketHistoryPoint) =>
                  point && typeof point.date === "string" && Number.isFinite(point.close),
              )
              .sort(
                (left: MarketHistoryPoint, right: MarketHistoryPoint) =>
                  new Date(left.date).getTime() - new Date(right.date).getTime(),
              )
              .slice(-200)
          : [];
        setHistory(nextHistory.length ? nextHistory : null);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("CoalBenchmarkChart error:", err);
        setError("Unable to load chart data.");
        setHistory(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    return () => controller.abort();
  }, [interval, symbol]);

  const chartData = useMemo(() => {
    if (!history) return null;
    return {
      labels: history.map((point) => formatLabel(point.date, interval)),
      datasets: [
        {
          label,
          data: history.map((point) => point.close),
          borderColor: color,
          backgroundColor: `${color}20`,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          fill: true,
          tension: 0.22,
        },
      ],
    };
  }, [color, history, interval, label]);

  const options = useMemo(
    () => ({
      animation: false as const,
      normalized: true,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: "index" as const,
          intersect: false,
          backgroundColor: "rgba(0,0,0,0.8)",
          titleColor: "#fff",
          bodyColor: color,
          borderColor: "rgba(255,255,255,0.1)",
          borderWidth: 1,
          callbacks: {
            label: (context: any) => {
              const value = typeof context?.parsed?.y === "number" ? context.parsed.y : 0;
              return `${label}: $${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: "rgba(255,255,255,0.5)", autoSkip: true, maxTicksLimit: 8 },
          grid: { color: "rgba(255,255,255,0.05)" },
        },
        y: {
          ticks: {
            color: "rgba(255,255,255,0.5)",
            callback: (value: string | number) =>
              Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 }),
          },
          grid: { color: "rgba(255,255,255,0.05)" },
        },
      },
      interaction: { mode: "nearest" as const, axis: "x" as const, intersect: false },
    }),
    [color, label],
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-bold text-white">{label}</div>
        <div className="flex gap-1">
          {(["D", "W", "M"] as ChartInterval[]).map((i) => (
            <button
              key={i}
              onClick={() => setInterval(i)}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                interval === i
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-white/5 text-gray-400 border border-transparent hover:border-white/10"
              }`}
            >
              {i === "D" ? "1D" : i === "W" ? "1W" : "1M"}
            </button>
          ))}
        </div>
      </div>
      <div style={{ height }} className="w-full">
        {loading ? (
          <div className="h-full flex items-center justify-center text-gray-500 text-xs">Loading chart...</div>
        ) : chartData ? (
          <Line options={options} data={chartData} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 text-xs">{error ?? "No data available."}</div>
        )}
      </div>
    </div>
  );
}
