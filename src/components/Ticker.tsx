"use client";

import { useEffect, useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Types — mirrors the API response shape from /api/ticker
// ---------------------------------------------------------------------------

type MarketStatus = "OPEN" | "CLOSED" | "PRE_MARKET" | "POST_MARKET";

interface TickerItem {
  label: string;
  symbol: string;
  price: number;
  change?: number;
  changePercent?: number;
  type?: string;
  marketStatus: MarketStatus;
  sessionLabel: string;
  lastTradingTimestamp: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(value: number) {
  if (!Number.isFinite(value)) return "--";
  if (Math.abs(value) >= 1000) {
    return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
  if (Math.abs(value) >= 100) {
    return value.toFixed(2);
  }
  if (Math.abs(value) >= 1) {
    return value.toFixed(3);
  }
  return value.toFixed(4);
}

/** Returns a short relative time label for a closed market's last trade. */
function relativeTimeLabel(iso: string | null): string | null {
  if (!iso) return null;
  try {
    const ms = Date.now() - new Date(iso).getTime();
    if (ms < 0) return "just now";
    const mins = Math.floor(ms / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return null;
  }
}

function statusDotColor(status: MarketStatus): string {
  switch (status) {
    case "OPEN":
      return "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]";
    case "PRE_MARKET":
    case "POST_MARKET":
      return "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]";
    case "CLOSED":
      return "bg-gray-500";
    default:
      return "bg-gray-500";
  }
}

function statusLabelStyle(status: MarketStatus): string {
  switch (status) {
    case "OPEN":
      return "text-emerald-400 border-emerald-400/30 bg-emerald-400/8";
    case "PRE_MARKET":
    case "POST_MARKET":
      return "text-amber-400 border-amber-400/30 bg-amber-400/8";
    case "CLOSED":
      return "text-gray-500 border-gray-600/40 bg-gray-500/8";
    default:
      return "text-gray-500 border-gray-600/40 bg-gray-500/8";
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

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
          setItems(
            data.filter(
              (item: TickerItem) =>
                Number.isFinite(item?.price) && typeof item?.marketStatus === "string",
            ),
          );
        }
      } catch (error) {
        console.error("Ticker fetch failed:", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchTicker();
    const intervalId = window.setInterval(fetchTicker, 30_000);

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
    <div className="w-full overflow-hidden border-b border-geo-gold/20 bg-black/95 backdrop-blur-md">
      <div className="relative flex h-12 items-center overflow-hidden">
        {/* ---- Loading ---- */}
        {loading && items.length === 0 && (
          <div className="px-4 text-xs uppercase tracking-[0.24em] text-gray-500">
            Loading market ticker…
          </div>
        )}

        {/* ---- Empty ---- */}
        {!loading && items.length === 0 && (
          <div className="px-4 text-xs uppercase tracking-[0.24em] text-gray-500">
            Market data unavailable
          </div>
        )}

        {/* ---- Marquee ---- */}
        {marqueeItems.length > 0 && (
          <div className="ticker-marquee flex min-w-max items-center px-4">
            {marqueeItems.map((item, index) => {
              const isActive =
                item.marketStatus === "OPEN" ||
                item.marketStatus === "PRE_MARKET" ||
                item.marketStatus === "POST_MARKET";

              const change = Number(item.change ?? 0);
              const changePercent = Number(item.changePercent ?? 0);
              const positive = change >= 0;
              const accentClass = isActive
                ? positive
                  ? "text-emerald-400"
                  : "text-red-400"
                : "text-gray-600";

              const relativeTime = !isActive
                ? relativeTimeLabel(item.lastTradingTimestamp)
                : null;

              return (
                <div
                  key={`${item.symbol}-${index}`}
                  className={`
                    mx-1.5 flex items-center gap-2.5 rounded-full border px-3 py-1.5 transition-colors
                    ${isActive
                      ? "border-white/10 bg-white/[0.04]"
                      : "border-white/[0.03] bg-white/[0.01]"
                    }
                  `}
                >
                  {/* ---- Status Dot ---- */}
                  <span
                    className={`inline-block h-2 w-2 flex-shrink-0 rounded-full ${statusDotColor(item.marketStatus)}`}
                    title={item.sessionLabel}
                  />

                  {/* ---- Label & Symbol ---- */}
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className={`text-[11px] font-semibold uppercase tracking-[0.20em] ${
                        isActive ? "text-gray-200" : "text-gray-500"
                      }`}
                    >
                      {item.label}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.16em] text-gray-600">
                      {item.symbol}
                    </span>
                  </div>

                  {/* ---- Price ---- */}
                  <div
                    className={`text-sm font-semibold tabular-nums ${isActive ? "text-white" : "text-gray-500"}`}
                  >
                    {formatPrice(item.price)}
                  </div>

                  {/* ---- Change (active markets only) ---- */}
                  {isActive && (
                    <>
                      <div className={`text-xs font-medium tabular-nums ${accentClass}`}>
                        {positive ? "+" : ""}
                        {change.toFixed(2)}
                      </div>
                      <div className={`text-xs tabular-nums ${accentClass}`}>
                        ({positive ? "+" : ""}
                        {changePercent.toFixed(2)}%)
                      </div>
                    </>
                  )}

                  {/* ---- Status Badge ---- */}
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusLabelStyle(item.marketStatus)}`}
                  >
                    {item.sessionLabel}
                  </span>

                  {/* ---- Last Trade Tooltip (closed only) ---- */}
                  {!isActive && relativeTime && (
                    <span
                      className="text-[10px] text-gray-600"
                      title={`Last trade: ${new Date(item.lastTradingTimestamp!).toLocaleString()}`}
                    >
                      Last: {relativeTime}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}