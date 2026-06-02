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
import { Bar, Line } from "react-chartjs-2";

type ChartInterval = "1min" | "5min" | "15min" | "60min" | "D" | "W" | "M";
type ChartVariant = "line" | "bar";

type MarketHistoryPoint = {
  date: string;
  close: number;
};

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

interface Props {
  symbol: string;
  interval?: ChartInterval;
  height?: number | string;
  variant?: ChartVariant;
  lineColor?: string;
  fillColor?: string;
  barColor?: string;
}

function formatLabel(value: string, interval: ChartInterval) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  if (
    interval === "1min" ||
    interval === "5min" ||
    interval === "15min" ||
    interval === "60min"
  ) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  if (interval === "D") {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit",
  }).format(date);
}

export default function AlphaVantageChart({
  symbol,
  interval = "D",
  height = 580,
  variant = "line",
  lineColor = "rgba(212, 175, 55, 1)",
  fillColor = "rgba(212, 175, 55, 0.12)",
  barColor = "rgba(212, 175, 55, 0.78)",
}: Props) {
  const [history, setHistory] = useState<MarketHistoryPoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/alpha-vantage?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}`,
          { signal: controller.signal },
        );

        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }

        const json = await res.json();
        const nextHistory = Array.isArray(json.data)
          ? json.data
              .filter(
                (point: MarketHistoryPoint) =>
                  point &&
                  typeof point.date === "string" &&
                  Number.isFinite(point.close),
              )
              .sort(
                (left: MarketHistoryPoint, right: MarketHistoryPoint) =>
                  new Date(left.date).getTime() -
                  new Date(right.date).getTime(),
              )
              .slice(-400)
          : [];

        setHistory(nextHistory.length ? nextHistory : null);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        console.error("AlphaVantageChart error:", err);
        setError("Unable to load chart data right now.");
        setHistory(null);
      }

      setLoading(false);
    }

    fetchData();

    return () => controller.abort();
  }, [interval, symbol]);

  const chartData = useMemo(() => {
    if (!history) {
      return null;
    }

    return {
      labels: history.map((point) => formatLabel(point.date, interval)),
      datasets: [
        {
          label: symbol,
          data: history.map((point) => point.close),
          borderColor: lineColor,
          backgroundColor: variant === "line" ? fillColor : barColor,
          borderWidth: variant === "line" ? 2 : 1,
          pointRadius: 0,
          pointHoverRadius: variant === "line" ? 4 : 2,
          fill: variant === "line",
          tension: variant === "line" ? 0.22 : 0,
          maxBarThickness: 12,
        },
      ],
    };
  }, [barColor, fillColor, history, interval, lineColor, symbol, variant]);

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
          bodyColor: "#D4AF37",
          borderColor: "rgba(255,255,255,0.1)",
          borderWidth: 1,
          callbacks: {
            label: (context: any) => {
              const value =
                typeof context?.parsed?.y === "number" ? context.parsed.y : 0;

              return `Price: ${value.toLocaleString(undefined, {
                maximumFractionDigits: 4,
              })}`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: "rgba(255,255,255,0.5)",
            autoSkip: true,
            maxTicksLimit:
              interval === "1min" || interval === "5min" || interval === "15min"
                ? 8
                : 10,
          },
          grid: { color: "rgba(255,255,255,0.05)" },
        },
        y: {
          ticks: {
            color: "rgba(255,255,255,0.5)",
            callback: (value: string | number) =>
              Number(value).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              }),
          },
          grid: { color: "rgba(255,255,255,0.05)" },
        },
      },
      interaction: {
        mode: "nearest" as const,
        axis: "x" as const,
        intersect: false,
      },
    }),
    [interval],
  );

  if (loading) {
    return (
      <div
        style={{ height }}
        className="w-full flex items-center justify-center bg-white/5 rounded-xl border border-white/10"
      >
        <div className="w-7 h-7 border-2 border-geo-gold/40 border-t-geo-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!chartData) {
    return (
      <div
        style={{ height }}
        className="w-full flex items-center justify-center bg-white/5 rounded-xl border border-white/10 text-gray-500"
      >
        {error ?? "No data available for this symbol and resolution."}
      </div>
    );
  }

  return (
    <div style={{ height }} className="w-full bg-[#0B0E14] p-4 rounded-xl">
      {variant === "bar" ? (
        <Bar options={options} data={chartData} />
      ) : (
        <Line options={options} data={chartData} />
      )}
    </div>
  );
}
