"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

/* ── Instrument database ──────────────────────────────────────────────── */
export interface MarketInstrument {
  s: string; // TradingView symbol
  d: string; // display name
  c: string; // category
  color: string;
}

export const MARKET_INSTRUMENTS: MarketInstrument[] = [
  // Global Indices
  {
    s: "CAPITALCOM:US500",
    d: "S&P 500",
    c: "Global Indices",
    color: "#51cf66",
  },
  {
    s: "CAPITALCOM:US100",
    d: "NASDAQ 100",
    c: "Global Indices",
    color: "#51cf66",
  },
  {
    s: "CAPITALCOM:US30",
    d: "Dow Jones 30",
    c: "Global Indices",
    color: "#51cf66",
  },
  { s: "TVC:RUT", d: "Russell 2000", c: "Global Indices", color: "#74c0fc" },
  { s: "TVC:DEU40", d: "DAX 40", c: "Global Indices", color: "#74c0fc" },
  { s: "TVC:UK100", d: "FTSE 100", c: "Global Indices", color: "#74c0fc" },
  { s: "TVC:JP225", d: "Nikkei 225", c: "Global Indices", color: "#ffa94d" },
  { s: "TVC:HK50", d: "Hang Seng 50", c: "Global Indices", color: "#ffa94d" },
  { s: "TVC:FR40", d: "CAC 40", c: "Global Indices", color: "#74c0fc" },
  {
    s: "CAPITALCOM:AUS200",
    d: "ASX 200",
    c: "Global Indices",
    color: "#ffa94d",
  },
  { s: "TVC:SX5E", d: "Euro Stoxx 50", c: "Global Indices", color: "#74c0fc" },
  { s: "TVC:NSEI", d: "Nifty 50", c: "Global Indices", color: "#ffa94d" },
  // Commodities
  { s: "XAUUSD", d: "Gold", c: "Commodities", color: "#D4AF37" },
  { s: "CAPITALCOM:SILVER", d: "Silver", c: "Commodities", color: "#c8d6e5" },
  { s: "CAPITALCOM:COPPER", d: "Copper", c: "Commodities", color: "#cd7f32" },
  { s: "TVC:USOIL", d: "WTI Crude Oil", c: "Commodities", color: "#ff6b35" },
  { s: "TVC:UKOIL", d: "Brent Crude", c: "Commodities", color: "#ff8c42" },
  {
    s: "CAPITALCOM:NATURALGAS",
    d: "Natural Gas",
    c: "Commodities",
    color: "#ff85c2",
  },
  { s: "COMEX:PL1!", d: "Platinum", c: "Commodities", color: "#a8dadc" },
  { s: "CBOT:ZW1!", d: "Wheat", c: "Commodities", color: "#ffd43b" },
  { s: "CBOT:ZC1!", d: "Corn", c: "Commodities", color: "#ffd43b" },
  // Crypto
  { s: "BINANCE:BTCUSDT", d: "Bitcoin", c: "Crypto", color: "#f7931a" },
  { s: "BINANCE:ETHUSDT", d: "Ethereum", c: "Crypto", color: "#627eea" },
  { s: "BINANCE:SOLUSDT", d: "Solana", c: "Crypto", color: "#9945ff" },
  { s: "BINANCE:BNBUSDT", d: "BNB", c: "Crypto", color: "#f0b90b" },
  { s: "BINANCE:XRPUSDT", d: "XRP", c: "Crypto", color: "#346aa9" },
  { s: "BINANCE:ADAUSDT", d: "Cardano", c: "Crypto", color: "#0033ad" },
  { s: "BINANCE:DOGEUSDT", d: "Dogecoin", c: "Crypto", color: "#c2a633" },
  // Bonds & Yields
  { s: "TVC:US10Y", d: "US 10Y Yield", c: "Bonds & Yields", color: "#a29bfe" },
  { s: "TVC:US02Y", d: "US 2Y Yield", c: "Bonds & Yields", color: "#a29bfe" },
  { s: "TVC:US30Y", d: "US 30Y Yield", c: "Bonds & Yields", color: "#a29bfe" },
  { s: "TVC:DE10Y", d: "Germany 10Y", c: "Bonds & Yields", color: "#74c0fc" },
  { s: "TVC:GB10Y", d: "UK 10Y Gilt", c: "Bonds & Yields", color: "#74c0fc" },
  { s: "TVC:JP10Y", d: "Japan 10Y JGB", c: "Bonds & Yields", color: "#ffa94d" },
  // FX & Macro
  {
    s: "CAPITALCOM:DXY",
    d: "Dollar Index (DXY)",
    c: "FX & Macro",
    color: "#4dabf7",
  },
  { s: "FX:EURUSD", d: "EUR / USD", c: "FX & Macro", color: "#74c0fc" },
  { s: "FX:GBPUSD", d: "GBP / USD", c: "FX & Macro", color: "#74c0fc" },
  { s: "FX:USDJPY", d: "USD / JPY", c: "FX & Macro", color: "#ffa94d" },
  { s: "FX:USDCHF", d: "USD / CHF", c: "FX & Macro", color: "#74c0fc" },
  { s: "FX:AUDUSD", d: "AUD / USD", c: "FX & Macro", color: "#ffa94d" },
  { s: "FX:USDCAD", d: "USD / CAD", c: "FX & Macro", color: "#74c0fc" },
  { s: "FX:USDMXN", d: "USD / MXN", c: "FX & Macro", color: "#ff6b6b" },
  { s: "FX:USDBRL", d: "USD / BRL", c: "FX & Macro", color: "#ff6b6b" },
  // Top Stocks
  { s: "NASDAQ:AAPL", d: "Apple", c: "Top Stocks", color: "#51cf66" },
  { s: "NASDAQ:MSFT", d: "Microsoft", c: "Top Stocks", color: "#51cf66" },
  { s: "NASDAQ:NVDA", d: "NVIDIA", c: "Top Stocks", color: "#76b900" },
  { s: "NASDAQ:GOOGL", d: "Alphabet", c: "Top Stocks", color: "#4285f4" },
  { s: "NASDAQ:AMZN", d: "Amazon", c: "Top Stocks", color: "#ff9900" },
  { s: "NASDAQ:TSLA", d: "Tesla", c: "Top Stocks", color: "#cc0000" },
  { s: "NASDAQ:META", d: "Meta", c: "Top Stocks", color: "#1877f2" },
  { s: "NYSE:JPM", d: "JPMorgan", c: "Top Stocks", color: "#51cf66" },
  // Mining & Materials
  {
    s: "NYSE:NEM",
    d: "Newmont (Gold)",
    c: "Mining & Materials",
    color: "#D4AF37",
  },
  {
    s: "NYSE:FCX",
    d: "Freeport-McMoRan",
    c: "Mining & Materials",
    color: "#cd7f32",
  },
  {
    s: "NYSE:MP",
    d: "MP Materials",
    c: "Mining & Materials",
    color: "#a8dadc",
  },
  {
    s: "NYSE:ALB",
    d: "Albemarle (Li)",
    c: "Mining & Materials",
    color: "#74c0fc",
  },
  { s: "NYSE:RIO", d: "Rio Tinto", c: "Mining & Materials", color: "#ff6b35" },
  { s: "ASX:BHP", d: "BHP Group", c: "Mining & Materials", color: "#ff6b35" },
  // Energy Stocks
  { s: "NYSE:XOM", d: "ExxonMobil", c: "Energy Stocks", color: "#ff6b35" },
  { s: "NYSE:CVX", d: "Chevron", c: "Energy Stocks", color: "#ff8c42" },
  { s: "NYSE:BP", d: "BP", c: "Energy Stocks", color: "#009900" },
  { s: "NYSE:SHEL", d: "Shell", c: "Energy Stocks", color: "#ffd43b" },
  { s: "NYSE:COP", d: "ConocoPhillips", c: "Energy Stocks", color: "#ff8c42" },
  { s: "NYSE:SLB", d: "Schlumberger", c: "Energy Stocks", color: "#74c0fc" },
];

const CATEGORIES = [
  "Global Indices",
  "Commodities",
  "Crypto",
  "Bonds & Yields",
  "FX & Macro",
  "Top Stocks",
  "Mining & Materials",
  "Energy Stocks",
] as const;

type Category = (typeof CATEGORIES)[number];

/* ── Encode symbol for URL segment ──────────────────────────────────── */
export function encodeSymbolParam(s: string) {
  return encodeURIComponent(s.replace(/:/g, "_"));
}

export default function MacroMarketsPanel() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] =
    useState<Category>("Global Indices");
  const [query, setQuery] = useState("");

  const displayed = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = q
      ? MARKET_INSTRUMENTS.filter(
          (i) =>
            i.d.toLowerCase().includes(q) ||
            i.s.toLowerCase().includes(q) ||
            i.c.toLowerCase().includes(q),
        )
      : MARKET_INSTRUMENTS.filter((i) => i.c === activeCategory);
    return pool;
  }, [activeCategory, query]);

  function handleClick(inst: MarketInstrument) {
    router.push(`/features/analytics/instrument/${encodeSymbolParam(inst.s)}`);
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Search ─────────────────────────────────────────────────── */}
      <div className="flex-none px-3 pt-2.5 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search instruments…"
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-400/40 transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* ── Category pills ─────────────────────────────────────────── */}
      {!query && (
        <div
          className="flex-none flex gap-1.5 px-3 pb-2 overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-none px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                  : "bg-white/5 text-gray-500 border border-white/10 hover:text-gray-200 hover:bg-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* ── Table header ──────────────────────────────────────────── */}
      <div className="flex-none grid grid-cols-[1fr_auto] px-3 pb-1 border-b border-white/8">
        <span className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">
          Instrument
        </span>
        <span className="text-[10px] text-gray-600 uppercase tracking-wider font-medium text-right">
          Detail
        </span>
      </div>

      {/* ── Scrollable instrument list ─────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto min-h-0"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#333 transparent" }}
      >
        {displayed.length === 0 ? (
          <div className="flex items-center justify-center h-24">
            <p className="text-xs text-gray-600">No instruments found</p>
          </div>
        ) : (
          displayed.map((inst) => (
            <button
              key={inst.s}
              onClick={() => handleClick(inst)}
              className="w-full flex items-center gap-3 px-3 py-2.5 border-b border-white/5 hover:bg-white/5 transition-all group text-left"
            >
              {/* Color dot */}
              <div
                className="flex-none w-2 h-2 rounded-full"
                style={{ backgroundColor: inst.color }}
              />

              {/* Name + symbol */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white truncate group-hover:text-geo-gold transition-colors">
                  {inst.d}
                </div>
                <div className="text-[10px] text-gray-600 font-mono truncate">
                  {inst.s.includes(":") ? inst.s.split(":")[1] : inst.s}
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight className="flex-none w-3.5 h-3.5 text-gray-700 group-hover:text-geo-gold transition-colors" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
