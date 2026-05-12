import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
);

interface Props {
  symbol: string;
  height?: number | string;
  dateRange?: string;
  trendLineColor?: string;
  underLineColor?: string;
  logoCoverColor?: string;
}

export default function AlphaVantageMiniChart({
  symbol,
  height = 130,
  trendLineColor = 'rgba(212,175,55,1)',
  underLineColor = 'rgba(212,175,55,0.1)'
}: Props) {
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/alpha-vantage?symbol=${encodeURIComponent(symbol)}`);
        const json = await res.json();
        
        if (json.data && Array.isArray(json.data)) {
          // Mini charts usually show smaller range, e.g., last 30 days
          const recentData = json.data.slice(-30);
          const dates = recentData.map((d: any) => d.date);
          const prices = recentData.map((d: any) => d.close);
          
          setChartData({
            labels: dates,
            datasets: [
              {
                data: prices,
                borderColor: trendLineColor,
                backgroundColor: underLineColor,
                borderWidth: 1.5,
                pointRadius: 0,
                fill: true,
                tension: 0.1
              }
            ]
          });
        }
      } catch (err) {
        console.error("AlphaVantageMiniChart error:", err);
      }
    }
    fetchData();
  }, [symbol, trendLineColor, underLineColor]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }, // usually mini charts don't have tooltips
    },
    scales: {
      x: { display: false },
      y: { display: false }
    },
    layout: { padding: 0 },
    interaction: { mode: 'index' as const, intersect: false }
  };

  if (!chartData) {
    return <div style={{ height }} className="w-full bg-white/5 animate-pulse" />;
  }

  return (
    <div style={{ height }} className="w-full relative">
      <Line options={options} data={chartData} />
    </div>
  );
}