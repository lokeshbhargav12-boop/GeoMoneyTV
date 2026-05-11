"use client";

import { useEffect, useRef } from "react";

interface TradingViewMiniChartProps {
  symbol: string;
  height?: number;
  dateRange?: "1D" | "1M" | "3M" | "1Y" | "5Y";
  trendLineColor?: string;
  underLineColor?: string;
  logoCoverColor?: string;
}

export default function TradingViewMiniChart({
  symbol,
  height = 160,
  dateRange = "1M",
  trendLineColor = "rgba(212, 175, 55, 1)",
  underLineColor = "rgba(212, 175, 55, 0.12)",
  logoCoverColor = "#0d0d0d",
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
    // Render the widget 50 px taller than the visible area so the TV logo
    // row at the bottom is clipped by the outer container's overflow:hidden.
    script.text = JSON.stringify({
      symbol,
      width: "100%",
      height: height + 50,
      locale: "en",
      dateRange,
      colorTheme: "dark",
      trendLineColor,
      underLineColor,
      isTransparent: true,
      autosize: false,
      largeChartUrl: "",
      no_referrals: true,
      hide_legend: true,
    });
    container.appendChild(script);

    return () => {
      if (container) container.innerHTML = "";
    };
  }, [symbol, height, dateRange, trendLineColor, underLineColor]);

  return (
    <div
      style={{
        position: "relative",
        height: `${height}px`,
        overflow: "hidden",
      }}
    >
      <div
        ref={containerRef}
        className="tradingview-widget-container absolute top-0 left-0 w-full"
        style={{ height: `${height + 50}px` }}
      />
      {/* Fallback overlay to cover logo if it's still visible */}
      <div className="absolute bottom-0 left-0 w-full h-[6px] bg-[#0d0d0d] pointer-events-none z-10" />
    </div>
  );
}
