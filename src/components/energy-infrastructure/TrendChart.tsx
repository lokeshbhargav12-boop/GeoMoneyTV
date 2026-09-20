"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
);

type ChartVariant = "line" | "bar";

interface TrendChartProps {
  title: string;
  subtitle?: string;
  labels: string[];
  values: number[];
  variant?: ChartVariant;
  accent?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  height?: number;
}

export default function TrendChart({
  title,
  subtitle,
  labels,
  values,
  variant = "line",
  accent = "#22d3ee",
  valuePrefix = "",
  valueSuffix = "",
  height = 260,
}: TrendChartProps) {
  const normalized = values.map((value) =>
    Number.isFinite(value) ? value : 0,
  );

  const data = {
    labels,
    datasets: [
      {
        label: title,
        data: normalized,
        borderColor: accent,
        backgroundColor:
          variant === "line"
            ? `${accent}22`
            : labels.map((_, index) =>
                index % 2 === 0 ? `${accent}cc` : `${accent}88`,
              ),
        borderWidth: variant === "line" ? 2 : 1,
        pointRadius: variant === "line" ? 2 : 0,
        pointHoverRadius: variant === "line" ? 4 : 0,
        fill: variant === "line",
        tension: 0.28,
        maxBarThickness: 24,
      },
    ],
  };

  const options = {
    animation: false as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.88)",
        borderColor: "rgba(255,255,255,0.15)",
        borderWidth: 1,
        titleColor: "#f3f4f6",
        bodyColor: "#e5e7eb",
        callbacks: {
          label: (context: any) => {
            const value =
              typeof context?.parsed?.y === "number" ? context.parsed.y : 0;
            return `${valuePrefix}${value.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}${valueSuffix}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "rgba(156,163,175,0.9)",
          autoSkip: true,
          maxTicksLimit: 7,
          font: { size: 10 },
        },
        grid: { color: "rgba(255,255,255,0.05)" },
      },
      y: {
        ticks: {
          color: "rgba(156,163,175,0.9)",
          font: { size: 10 },
          callback: (value: string | number) =>
            `${valuePrefix}${Number(value).toLocaleString(undefined, {
              maximumFractionDigits: 1,
            })}${valueSuffix}`,
        },
        grid: { color: "rgba(255,255,255,0.05)" },
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  };

  return (
    <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <header className="mb-3">
        <h3 className="text-sm font-semibold text-gray-100">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </header>
      <div style={{ height }}>
        {variant === "bar" ? (
          <Bar data={data} options={options} />
        ) : (
          <Line data={data} options={options} />
        )}
      </div>
    </article>
  );
}
