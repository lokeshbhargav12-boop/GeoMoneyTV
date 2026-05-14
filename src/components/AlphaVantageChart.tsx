import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface Props {
  symbol: string;
  interval?: string;
  height?: number | string;
}

export default function AlphaVantageChart({ symbol, height = 580 }: Props) {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/alpha-vantage?symbol=${encodeURIComponent(symbol)}`,
        );
        const json = await res.json();

        if (json.data && Array.isArray(json.data)) {
          // Last 100 days
          const dates = json.data.map((d: any) => d.date);
          const prices = json.data.map((d: any) => d.close);

          setChartData({
            labels: dates,
            datasets: [
              {
                label: "Price",
                data: prices,
                borderColor: "rgba(212, 175, 55, 1)", // geo-gold
                backgroundColor: "rgba(212, 175, 55, 0.1)",
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                fill: true,
                tension: 0.1,
              },
            ],
          });
        }
      } catch (err) {
        console.error("AlphaVantageChart error:", err);
      }
      setLoading(false);
    }
    fetchData();
  }, [symbol]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        backgroundColor: "rgba(0,0,0,0.8)",
        titleColor: "#fff",
        bodyColor: "#D4AF37", // geo-gold
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: "rgba(255,255,255,0.5)", maxTicksLimit: 7 },
        grid: { color: "rgba(255,255,255,0.05)" },
      },
      y: {
        ticks: { color: "rgba(255,255,255,0.5)" },
        grid: { color: "rgba(255,255,255,0.05)" },
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  };

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
        No Data Available
      </div>
    );
  }

  return (
    <div style={{ height }} className="w-full bg-[#0B0E14] p-4 rounded-xl">
      <Line options={options} data={chartData} />
    </div>
  );
}
