"use client";

import { useEffect, useRef } from "react";

interface TradingViewMiniChartProps {
  symbol: string;
  height?: number;
  dateRange?: "1D" | "1M" | "3M" | "1Y" | "5Y";
  trendLineColor?: string;
  underLineColor?: string;
}

export default function TradingViewMiniChart({
  symbol,
  height = 160,
  dateRange = "1M",
  trendLineColor = "rgba(212, 175, 55, 1)",
  underLineColor = "rgba(212, 175, 55, 0.12)",
}: TradingViewMiniChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.text = JSON.stringify({
      symbol,
      width: "100%",
      height,
      locale: "en",
      dateRange,
      colorTheme: "dark",
      trendLineColor,
      underLineColor,
      isTransparent: true,
      autosize: true,
      largeChartUrl: "",
    });
    container.appendChild(script);

    return () => {
      if (container) container.innerHTML = "";
    };
  }, [symbol, height, dateRange, trendLineColor, underLineColor]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container w-full overflow-hidden"
      style={{ height: `${height}px` }}
    />
  );
}
