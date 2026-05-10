"use client";

import { useEffect, useRef } from "react";

interface TradingViewChartProps {
  symbol?: string;
  interval?: string;
  height?: number;
}

export default function TradingViewChart({
  symbol = "XAUUSD",
  interval = "D",
  height = 560,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.text = JSON.stringify({
      autosize: true,
      symbol,
      interval,
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "#050505",
      gridColor: "rgba(255, 255, 255, 0.04)",
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      calendar: false,
      hide_logo: true,
      no_referrals: true,
      watermark: "",
      studies: ["STD;Volume"],
      support_host: "https://www.tradingview.com",
    });
    container.appendChild(script);

    return () => {
      if (container) container.innerHTML = "";
    };
  }, [symbol, interval, height]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <div
        ref={containerRef}
        className="tradingview-widget-container"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "calc(100% + 40px)",
        }}
      />
      {/* Cover the TradingView logo in the bottom-left of the chart iframe */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "55px",
          height: "80px",
          background: "#050505",
          zIndex: 10,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
