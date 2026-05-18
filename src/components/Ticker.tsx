"use client";

import { useEffect, useMemo, useState } from "react";

interface TickerItem {
  label: string;
  symbol: string;
  price: number;
  change?: number;
  changePercent?: number;
  type?: string;
}

function formatPrice(value: number) {
  if (!Number.isFinite(value)) return "--";
  if (Math.abs(value) >= 1000) {
    return value.toLocaleString("en-US", {
      maximumFractionDigits: 2,
    });
  }

  if (Math.abs(value) >= 100) {
    return value.toFixed(2);
  }

  if (Math.abs(value) >= 1) {
    return value.toFixed(3);
  }

  return value.toFixed(4);
}

export default function Ticker() {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchTicker() {
      try {
        const res = await fetch("/api/ticker", { cache: "no-store" });
        if (!res.ok) throw new Error(`Ticker request failed: ${res.status}`);

        const data = await res.json();
        if (active && Array.isArray(data)) {
          setItems(data.filter((item) => Number.isFinite(item?.price)));
        }
      } catch (error) {
        console.error("Ticker fetch failed:", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchTicker();
    const intervalId = window.setInterval(fetchTicker, 60_000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const marqueeItems = useMemo(() => {
    if (!items.length) return [];
    return [...items, ...items];
  }, [items]);

  return (
    <div className="w-full overflow-hidden bg-black/95 backdrop-blur-md border-b border-geo-gold/20">
      <div className="relative flex h-11 items-center overflow-hidden">
        {loading && items.length === 0 ? (
          <div className="px-4 text-xs uppercase tracking-[0.24em] text-gray-500">
            Loading market ticker...
          </div>
        ) : null}

        {!loading && items.length === 0 ? (
          <div className="px-4 text-xs uppercase tracking-[0.24em] text-gray-500">
            Market data unavailable
          </div>
        ) : null}

        {marqueeItems.length > 0 ? (
          <div className="ticker-marquee flex min-w-max items-center gap-3 px-3">
            {marqueeItems.map((item, index) => {
              const change = Number(item.change ?? 0);
              const changePercent = Number(item.changePercent ?? 0);
              const positive = change >= 0;
              const accentClass = positive
                ? "text-emerald-400"
                : "text-red-400";

              return (
                <div
                  key={`${item.symbol}-${index}`}
                  className="flex items-center gap-3 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5"
                >
                  <div className="flex items-baseline gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-300">
                      {item.label}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-gray-600">
                      {item.symbol}
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-white">
                    {formatPrice(item.price)}
                  </div>

                  <div className={`text-xs font-medium ${accentClass}`}>
                    {positive ? "+" : ""}
                    {change.toFixed(2)}
                  </div>

                  <div className={`text-xs ${accentClass}`}>
                    ({positive ? "+" : ""}
                    {changePercent.toFixed(2)}%)
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
