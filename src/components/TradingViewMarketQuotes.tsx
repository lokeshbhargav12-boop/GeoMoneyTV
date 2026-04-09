"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Search, X } from "lucide-react";

/* ── Instrument database ──────────────────────────────────────────────── */
interface Inst {
  s: string; // TradingView symbol
  d: string; // display name
  c: string; // category
}

const INSTRUMENT_DB: Inst[] = [
  // Global Indices
  { s: "CAPITALCOM:US500", d: "S&P 500", c: "Global Indices" },
  { s: "CAPITALCOM:US100", d: "NASDAQ 100", c: "Global Indices" },
  { s: "CAPITALCOM:US30", d: "Dow Jones 30", c: "Global Indices" },
  { s: "TVC:RUT", d: "Russell 2000", c: "Global Indices" },
  { s: "TVC:DEU40", d: "DAX 40", c: "Global Indices" },
  { s: "TVC:UK100", d: "FTSE 100", c: "Global Indices" },
  { s: "TVC:JP225", d: "Nikkei 225", c: "Global Indices" },
  { s: "TVC:HK50", d: "Hang Seng 50", c: "Global Indices" },
  { s: "TVC:FR40", d: "CAC 40", c: "Global Indices" },
  { s: "TVC:IBEX", d: "IBEX 35", c: "Global Indices" },
  { s: "CAPITALCOM:AUS200", d: "ASX 200", c: "Global Indices" },
  { s: "TVC:SX5E", d: "Euro Stoxx 50", c: "Global Indices" },
  { s: "BSE:SENSEX", d: "BSE Sensex", c: "Global Indices" },
  { s: "SSE:000001", d: "Shanghai Comp.", c: "Global Indices" },
  { s: "TVC:BIST100", d: "BIST 100", c: "Global Indices" },
  { s: "TVC:NSEI", d: "Nifty 50", c: "Global Indices" },
  // Commodities
  { s: "XAUUSD", d: "Gold", c: "Commodities" },
  { s: "COMEX:SI1!", d: "Silver", c: "Commodities" },
  { s: "COMEX:HG1!", d: "Copper", c: "Commodities" },
  { s: "TVC:USOIL", d: "WTI Crude Oil", c: "Commodities" },
  { s: "TVC:UKOIL", d: "Brent Crude", c: "Commodities" },
  { s: "NYMEX:NG1!", d: "Natural Gas", c: "Commodities" },
  { s: "COMEX:PL1!", d: "Platinum", c: "Commodities" },
  { s: "COMEX:PA1!", d: "Palladium", c: "Commodities" },
  { s: "CBOT:ZW1!", d: "Wheat", c: "Commodities" },
  { s: "CBOT:ZC1!", d: "Corn", c: "Commodities" },
  { s: "CBOT:ZS1!", d: "Soybeans", c: "Commodities" },
  { s: "NYMEX:RB1!", d: "Gasoline (RBOB)", c: "Commodities" },
  { s: "COMEX:GC1!", d: "Gold Futures", c: "Commodities" },
  // Crypto
  { s: "BINANCE:BTCUSDT", d: "Bitcoin (BTC)", c: "Crypto" },
  { s: "BINANCE:ETHUSDT", d: "Ethereum (ETH)", c: "Crypto" },
  { s: "BINANCE:SOLUSDT", d: "Solana (SOL)", c: "Crypto" },
  { s: "BINANCE:BNBUSDT", d: "BNB", c: "Crypto" },
  { s: "BINANCE:XRPUSDT", d: "XRP", c: "Crypto" },
  { s: "BINANCE:ADAUSDT", d: "Cardano (ADA)", c: "Crypto" },
  { s: "BINANCE:DOGEUSDT", d: "Dogecoin (DOGE)", c: "Crypto" },
  { s: "BINANCE:AVAXUSDT", d: "Avalanche (AVAX)", c: "Crypto" },
  { s: "BINANCE:DOTUSDT", d: "Polkadot (DOT)", c: "Crypto" },
  { s: "BINANCE:LINKUSDT", d: "Chainlink (LINK)", c: "Crypto" },
  { s: "BINANCE:LTCUSDT", d: "Litecoin (LTC)", c: "Crypto" },
  { s: "BINANCE:MATICUSDT", d: "Polygon (POL)", c: "Crypto" },
  // Bonds & Yields
  { s: "TVC:US10Y", d: "US 10Y Yield", c: "Bonds & Yields" },
  { s: "TVC:US02Y", d: "US 2Y Yield", c: "Bonds & Yields" },
  { s: "TVC:US30Y", d: "US 30Y Yield", c: "Bonds & Yields" },
  { s: "TVC:DE10Y", d: "Germany 10Y", c: "Bonds & Yields" },
  { s: "TVC:GB10Y", d: "UK 10Y Gilt", c: "Bonds & Yields" },
  { s: "TVC:JP10Y", d: "Japan 10Y JGB", c: "Bonds & Yields" },
  { s: "TVC:IT10Y", d: "Italy 10Y BTP", c: "Bonds & Yields" },
  { s: "TVC:AU10Y", d: "Australia 10Y", c: "Bonds & Yields" },
  { s: "TVC:CN10Y", d: "China 10Y", c: "Bonds & Yields" },
  // FX & Macro
  { s: "TVC:DXY", d: "Dollar Index (DXY)", c: "FX & Macro" },
  { s: "FX:EURUSD", d: "EUR / USD", c: "FX & Macro" },
  { s: "FX:GBPUSD", d: "GBP / USD", c: "FX & Macro" },
  { s: "FX:USDJPY", d: "USD / JPY", c: "FX & Macro" },
  { s: "FX:USDCHF", d: "USD / CHF", c: "FX & Macro" },
  { s: "FX:AUDUSD", d: "AUD / USD", c: "FX & Macro" },
  { s: "FX:USDCAD", d: "USD / CAD", c: "FX & Macro" },
  { s: "FX:NZDUSD", d: "NZD / USD", c: "FX & Macro" },
  { s: "FX:USDMXN", d: "USD / MXN", c: "FX & Macro" },
  { s: "FX:USDZAR", d: "USD / ZAR", c: "FX & Macro" },
  { s: "FX:USDBRL", d: "USD / BRL", c: "FX & Macro" },
  { s: "FX:USDCNY", d: "USD / CNY", c: "FX & Macro" },
  { s: "FX:USDSGD", d: "USD / SGD", c: "FX & Macro" },
  // Top Stocks
  { s: "NASDAQ:AAPL", d: "Apple", c: "Top Stocks" },
  { s: "NASDAQ:MSFT", d: "Microsoft", c: "Top Stocks" },
  { s: "NASDAQ:NVDA", d: "NVIDIA", c: "Top Stocks" },
  { s: "NASDAQ:GOOGL", d: "Alphabet", c: "Top Stocks" },
  { s: "NASDAQ:AMZN", d: "Amazon", c: "Top Stocks" },
  { s: "NASDAQ:TSLA", d: "Tesla", c: "Top Stocks" },
  { s: "NASDAQ:META", d: "Meta Platforms", c: "Top Stocks" },
  { s: "NYSE:JPM", d: "JPMorgan Chase", c: "Top Stocks" },
  { s: "NYSE:XOM", d: "ExxonMobil", c: "Top Stocks" },
  { s: "NYSE:BRK.B", d: "Berkshire B", c: "Top Stocks" },
  { s: "NYSE:BAC", d: "Bank of America", c: "Top Stocks" },
  { s: "NYSE:V", d: "Visa", c: "Top Stocks" },
  { s: "NYSE:MA", d: "Mastercard", c: "Top Stocks" },
  { s: "NYSE:WMT", d: "Walmart", c: "Top Stocks" },
  { s: "NYSE:UNH", d: "UnitedHealth", c: "Top Stocks" },
  // Mining & Materials
  { s: "NYSE:NEM", d: "Newmont (Gold)", c: "Mining & Materials" },
  { s: "NYSE:FCX", d: "Freeport-McMoRan", c: "Mining & Materials" },
  { s: "NYSE:MP", d: "MP Materials (REE)", c: "Mining & Materials" },
  { s: "NYSE:ALB", d: "Albemarle (Lithium)", c: "Mining & Materials" },
  { s: "NYSE:RIO", d: "Rio Tinto", c: "Mining & Materials" },
  { s: "NYSE:VALE", d: "Vale", c: "Mining & Materials" },
  { s: "NYSE:AA", d: "Alcoa (Aluminium)", c: "Mining & Materials" },
  { s: "ASX:BHP", d: "BHP Group", c: "Mining & Materials" },
  { s: "NYSE:GOLD", d: "Barrick Gold", c: "Mining & Materials" },
  { s: "NYSE:WPM", d: "Wheaton Precious", c: "Mining & Materials" },
  // Energy Stocks
  { s: "NYSE:CVX", d: "Chevron", c: "Energy Stocks" },
  { s: "NYSE:BP", d: "BP", c: "Energy Stocks" },
  { s: "NYSE:SHEL", d: "Shell", c: "Energy Stocks" },
  { s: "NYSE:COP", d: "ConocoPhillips", c: "Energy Stocks" },
  { s: "NYSE:SLB", d: "Schlumberger (SLB)", c: "Energy Stocks" },
  { s: "NYSE:OXY", d: "Occidental Petroleum", c: "Energy Stocks" },
  { s: "NYSE:EOG", d: "EOG Resources", c: "Energy Stocks" },
  { s: "NYSE:PSX", d: "Phillips 66", c: "Energy Stocks" },
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

function catSymbols(cat: Category): string[] {
  return INSTRUMENT_DB.filter((i) => i.c === cat).map((i) => i.s);
}

function buildSymbolGroups(symbols: string[]) {
  const byCategory: Record<string, { name: string; displayName: string }[]> =
    {};
  for (const sym of symbols) {
    const inst = INSTRUMENT_DB.find((i) => i.s === sym);
    if (!inst) continue;
    if (!byCategory[inst.c]) byCategory[inst.c] = [];
    byCategory[inst.c].push({ name: sym, displayName: inst.d });
  }
  return Object.entries(byCategory).map(([name, syms]) => ({
    name,
    originalName: name,
    symbols: syms,
  }));
}

export default function TradingViewMarketQuotes() {
  const [selected, setSelected] = useState<string[]>(() =>
    catSymbols("Global Indices"),
  );
  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [widgetHeight, setWidgetHeight] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const widgetAreaRef = useRef<HTMLDivElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  /* Detect which preset category matches current selection (if any) */
  const activeCategory = useMemo<Category | null>(() => {
    const selSet = new Set(selected);
    return (
      CATEGORIES.find((cat) => {
        const cs = catSymbols(cat);
        return (
          cs.length === selected.length && cs.every((s) => selSet.has(s))
        );
      }) ?? null
    );
  }, [selected]);

  /* Filtered results for the search dropdown */
  const results = useMemo<Inst[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return INSTRUMENT_DB;
    return INSTRUMENT_DB.filter(
      (i) =>
        i.d.toLowerCase().includes(q) ||
        i.s.toLowerCase().includes(q) ||
        i.c.toLowerCase().includes(q),
    ).slice(0, 25);
  }, [query]);

  /* Measure widget area so TradingView gets a real pixel height */
  useEffect(() => {
    const el = widgetAreaRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const h = Math.floor(entries[0]?.contentRect.height ?? 0);
      if (h > 50) setWidgetHeight(h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* Rebuild TradingView widget whenever selection or measured height changes */
  useEffect(() => {
    const container = containerRef.current;
    if (!container || widgetHeight === 0 || selected.length === 0) return;

    container.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    container.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js";
    script.text = JSON.stringify({
      width: "100%",
      height: widgetHeight,
      symbolsGroups: buildSymbolGroups(selected),
      showSymbolLogo: false,
      isTransparent: true,
      colorTheme: "dark",
      locale: "en",
    });
    container.appendChild(script);

    return () => {
      if (container) container.innerHTML = "";
    };
  }, [selected, widgetHeight]);

  /* Close dropdown on outside click */
  useEffect(() => {
    if (!dropdownOpen) return;
    function onDown(e: MouseEvent) {
      if (!searchWrapRef.current?.contains(e.target as Node)) {
        setDropdownOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [dropdownOpen]);

  const toggleSymbol = useCallback((sym: string) => {
    setSelected((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym],
    );
  }, []);

  const selectCategory = useCallback((cat: Category) => {
    setSelected(catSymbols(cat));
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* ── Search ─────────────────────────────────────────────────── */}
      <div ref={searchWrapRef} className="flex-none px-3 pt-2.5 pb-1.5 relative">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setDropdownOpen(true);
            }}
            onFocus={() => setDropdownOpen(true)}
            placeholder="Search & add instruments…"
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-7 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-400/40 transition-colors"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setDropdownOpen(false);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {dropdownOpen && (
          <div className="absolute left-3 right-3 top-full mt-1 z-50 bg-[#0e0e1a] border border-white/15 rounded-xl shadow-2xl overflow-hidden">
            <div
              className="overflow-y-auto max-h-56"
              style={{ scrollbarWidth: "thin", scrollbarColor: "#444 transparent" }}
            >
              {results.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-gray-600">
                  No instruments found
                </p>
              ) : (
                results.map((inst) => {
                  const isSelected = selected.includes(inst.s);
                  return (
                    <button
                      key={inst.s}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        toggleSymbol(inst.s);
                        setQuery("");
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/8 transition-colors text-left border-b border-white/5 last:border-0"
                    >
                      {/* Checkbox indicator */}
                      <span
                        className={`flex-none w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-blue-500 border-blue-500"
                            : "border-white/20 bg-white/5"
                        }`}
                      >
                        {isSelected && (
                          <svg
                            className="w-2.5 h-2.5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white truncate">
                          {inst.d}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {inst.c} &middot;{" "}
                          <span className="font-mono">
                            {inst.s.includes(":") ? inst.s.split(":")[1] : inst.s}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Category pills ─────────────────────────────────────────── */}
      <div
        className="flex-none flex gap-1.5 px-3 pb-2 overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => selectCategory(cat)}
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

      {/* ── TradingView widget ──────────────────────────────────────── */}
      <div ref={widgetAreaRef} className="flex-1 min-h-0 overflow-hidden">
        {selected.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-gray-600">
              Search above or select a category to display instruments.
            </p>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="tradingview-widget-container w-full h-full"
          />
        )}
      </div>
    </div>
  );
}

