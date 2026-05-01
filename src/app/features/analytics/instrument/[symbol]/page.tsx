"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  BarChart3,
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Newspaper,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import { MARKET_INSTRUMENTS } from "@/components/MacroMarketsPanel";

const TradingViewChart = dynamic(
  () => import("@/components/TradingViewChart"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-white/5 rounded-xl border border-white/10">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-geo-gold/40 border-t-geo-gold rounded-full animate-spin" />
          <span className="text-gray-500 text-sm">Loading chart…</span>
        </div>
      </div>
    ),
  },
);

/* ── Decode symbol from URL segment ──────────────────────────────────── */
function decodeSymbolParam(raw: string) {
  return decodeURIComponent(raw).replace(/_/g, ":");
}

/* ── Types ───────────────────────────────────────────────────────────── */
interface SentimentData {
  trend: "BULLISH" | "BEARISH" | "NEUTRAL";
  trend_strength: number;
  structure: string;
  signal: string;
  bias_score: number;
  key_resistance: string[];
  key_support: string[];
  macro_drivers: string[];
  analysis: string;
  risk_factors: string[];
  instrumentName: string;
  timestamp: string;
}

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sourceName: string | null;
  category: string;
  createdAt: string;
}

/** Map a TradingView symbol to the best search term for news */
function newsSearchTerm(symbol: string, displayName: string): string {
  const s = symbol.toUpperCase();
  if (s.includes("XAUUSD") || displayName.toLowerCase().includes("gold"))
    return "gold";
  if (
    s.includes("USOIL") ||
    s.includes("UKOIL") ||
    displayName.toLowerCase().includes("oil")
  )
    return "oil";
  if (
    s.includes("NATURALGAS") ||
    s.includes("NG1") ||
    displayName.toLowerCase().includes("gas")
  )
    return "natural gas";
  if (s.includes("SILVER") || s.includes("SI1")) return "silver";
  if (s.includes("COPPER") || s.includes("HG1")) return "copper";
  if (s.includes("DXY") || displayName.toLowerCase().includes("dollar"))
    return "dollar";
  if (
    s.includes("US500") ||
    s.includes("SPX") ||
    displayName.toLowerCase().includes("s&p")
  )
    return "s&p 500";
  if (s.includes("US100") || displayName.toLowerCase().includes("nasdaq"))
    return "nasdaq";
  if (s.includes("BTC") || displayName.toLowerCase().includes("bitcoin"))
    return "bitcoin";
  if (s.includes("ETH") || displayName.toLowerCase().includes("ethereum"))
    return "ethereum";
  if (
    s.includes("US10Y") ||
    s.includes("ZN1") ||
    displayName.toLowerCase().includes("treasury")
  )
    return "treasury";
  if (s.includes("EURUSD")) return "euro dollar";
  if (s.includes("USDJPY")) return "japan yen";
  if (s.includes("RARE") || displayName.toLowerCase().includes("rare"))
    return "rare earth";
  if (s.includes("LITHIUM") || displayName.toLowerCase().includes("lithium"))
    return "lithium";
  if (s.includes("SENSEX") || displayName.toLowerCase().includes("india"))
    return "india";
  if (s.includes("JP225") || displayName.toLowerCase().includes("nikkei"))
    return "japan";
  if (s.includes("HK50") || displayName.toLowerCase().includes("hang seng"))
    return "china";
  // fallback: use first word of display name
  return displayName.split(/[\s/]/)[0];
}

const TIMEFRAMES = [
  { label: "1D", interval: "60" },
  { label: "1W", interval: "D" },
  { label: "1M", interval: "W" },
  { label: "3M", interval: "W" },
  { label: "1Y", interval: "M" },
] as const;

export default function InstrumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawSymbol = typeof params.symbol === "string" ? params.symbol : "";
  const tvSymbol = decodeSymbolParam(rawSymbol);

  const instrument = MARKET_INSTRUMENTS.find((i) => i.s === tvSymbol) ?? {
    s: tvSymbol,
    d: tvSymbol,
    c: "Unknown",
    color: "#888888",
  };

  const [interval, setInterval] = useState<string>("D");
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);

  async function fetchNews() {
    setNewsLoading(true);
    try {
      const term = newsSearchTerm(tvSymbol, instrument.d);
      const res = await fetch(
        `/api/articles?search=${encodeURIComponent(term)}&limit=6`,
      );
      if (res.ok) {
        const data: NewsArticle[] = await res.json();
        setNews(data);
      }
    } catch {
      // non-critical, fail silently
    } finally {
      setNewsLoading(false);
    }
  }

  async function fetchSentiment(force = false) {
    if (!force && sentiment) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/market-sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: tvSymbol }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data: SentimentData = await res.json();
      setSentiment(data);
    } catch {
      setError("Unable to load market intelligence. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSentiment();
    fetchNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tvSymbol]);

  const trendColor =
    sentiment?.trend === "BULLISH"
      ? "#51cf66"
      : sentiment?.trend === "BEARISH"
        ? "#ff6b6b"
        : sentiment
          ? "#f59f00"
          : "#888888";

  const TrendIcon =
    sentiment?.trend === "BULLISH"
      ? TrendingUp
      : sentiment?.trend === "BEARISH"
        ? TrendingDown
        : Minus;

  return (
    <main className="min-h-screen bg-geo-dark text-white pt-32">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div
        className="sticky z-20 border-b border-white/10 bg-black/60 backdrop-blur-xl"
        style={{ top: "128px" }}
      >
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-geo-gold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Color dot */}
          <div
            className="w-3 h-3 rounded-full flex-none"
            style={{ backgroundColor: instrument.color }}
          />

          <div>
            <h1 className="text-sm font-bold text-white">{instrument.d}</h1>
            <p className="text-xs text-gray-500 font-mono">
              {tvSymbol} · {instrument.c}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Timeframe selector */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.label}
                  onClick={() => setInterval(tf.interval)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    interval === tf.interval
                      ? "bg-geo-gold/20 text-geo-gold"
                      : "text-gray-500 hover:text-white"
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            <Link
              href="/features/analytics"
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-geo-gold transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 pt-6 pb-16 space-y-6">
        {/* Chart */}
        <div className="rounded-xl border border-white/10 overflow-hidden bg-black h-[520px] xl:h-[640px]">
          <TradingViewChart
            symbol={tvSymbol}
            interval={interval}
            height={640}
          />
        </div>

        {/* ── Market Intelligence ──────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Brain className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-bold text-white">
                Market Intelligence
              </h2>
              <span className="px-2.5 py-0.5 bg-purple-500/15 text-purple-400 text-xs rounded-full border border-purple-500/25 font-medium">
                AI-POWERED
              </span>
            </div>
            <button
              onClick={() => fetchSentiment(true)}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-400 hover:text-white transition-all disabled:opacity-40"
            >
              <RefreshCw
                className={`w-3 h-3 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="grid md:grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-52 bg-white/5 rounded-xl border border-white/10 animate-pulse"
                />
              ))}
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="flex items-center gap-3 p-4 bg-red-950/20 border border-red-500/30 rounded-xl text-red-400">
              <AlertCircle className="w-5 h-5 flex-none" />
              <span className="text-sm">{error}</span>
              <button
                onClick={() => fetchSentiment(true)}
                className="ml-auto text-xs underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Analysis */}
          {sentiment && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              {/* Row 1 */}
              <div className="grid md:grid-cols-3 gap-4">
                {/* Macro Structure */}
                <div
                  className="relative rounded-xl border p-5 overflow-hidden"
                  style={{
                    borderColor: `${trendColor}40`,
                    backgroundColor: `${trendColor}08`,
                  }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: trendColor }}
                  />
                  <div className="text-xs text-gray-500 font-mono tracking-widest mb-3 uppercase">
                    Macro Structure
                  </div>
                  <div className="flex items-center gap-3 mb-1">
                    <TrendIcon
                      className="w-8 h-8"
                      style={{ color: trendColor }}
                    />
                    <span
                      className="text-3xl font-black tracking-tight"
                      style={{ color: trendColor }}
                    >
                      {sentiment.trend === "BULLISH"
                        ? "BOS ↑"
                        : sentiment.trend === "BEARISH"
                          ? "BOS ↓"
                          : "ChoCH"}
                    </span>
                  </div>
                  <div
                    className="text-base font-bold mb-1"
                    style={{ color: trendColor }}
                  >
                    {sentiment.trend}
                  </div>
                  <div className="text-xs text-gray-400 mb-4">
                    {sentiment.structure}
                  </div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Trend Strength</span>
                    <span style={{ color: trendColor }}>
                      {sentiment.trend_strength}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${sentiment.trend_strength}%`,
                        backgroundColor: trendColor,
                      }}
                    />
                  </div>
                  <div className="mt-3 text-xs text-gray-300 italic border-t border-white/10 pt-3">
                    &ldquo;{sentiment.signal}&rdquo;
                  </div>
                </div>

                {/* Key Price Zones */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <div className="text-xs text-gray-500 font-mono tracking-widest mb-4 uppercase">
                    Key Price Zones
                  </div>
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-sm bg-red-500" />
                      <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">
                        Supply Zones
                      </span>
                    </div>
                    {sentiment.key_resistance.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 mb-1.5">
                        <div className="w-1 h-3.5 rounded bg-red-500/50 flex-none mt-0.5" />
                        <span className="text-xs text-red-300 leading-snug">
                          {r}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-sm bg-green-500" />
                      <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">
                        Demand Zones
                      </span>
                    </div>
                    {sentiment.key_support.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 mb-1.5">
                        <div className="w-1 h-3.5 rounded bg-green-500/50 flex-none mt-0.5" />
                        <span className="text-xs text-green-300 leading-snug">
                          {s}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Macro Drivers */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <div className="text-xs text-gray-500 font-mono tracking-widest mb-4 uppercase">
                    Macro Drivers
                  </div>
                  <div className="space-y-2.5 mb-4">
                    {sentiment.macro_drivers.map((driver, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-none"
                          style={{
                            backgroundColor: `${instrument.color}25`,
                            color: instrument.color,
                          }}
                        >
                          {i + 1}
                        </div>
                        <span className="text-sm text-gray-300 leading-snug">
                          {driver}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-white/10 pt-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-red-400">Bearish</span>
                      <span className="text-gray-500">Macro Bias</span>
                      <span className="text-green-400">Bullish</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden relative">
                      <div className="absolute inset-0 flex justify-center">
                        <div className="w-px h-full bg-white/20" />
                      </div>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.abs(sentiment.bias_score) / 2}%`,
                          marginLeft:
                            sentiment.bias_score >= 0
                              ? "50%"
                              : `${50 - Math.abs(sentiment.bias_score) / 2}%`,
                        }}
                        transition={{ duration: 0.8 }}
                        className="h-full rounded-full"
                        style={{
                          backgroundColor:
                            sentiment.bias_score >= 0 ? "#51cf66" : "#ff6b6b",
                        }}
                      />
                    </div>
                    <div
                      className="text-center text-xs mt-1 font-bold"
                      style={{
                        color:
                          sentiment.bias_score >= 0 ? "#51cf66" : "#ff6b6b",
                      }}
                    >
                      {sentiment.bias_score > 0 ? "+" : ""}
                      {sentiment.bias_score}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2 rounded-xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-gray-500 font-mono tracking-widest uppercase">
                      GeoMoney AI Analysis
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {sentiment.analysis}
                  </p>
                  {sentiment.timestamp && (
                    <div className="mt-3 text-xs text-gray-600">
                      Generated:{" "}
                      {new Date(sentiment.timestamp).toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="rounded-xl border border-yellow-500/20 bg-yellow-950/10 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs text-gray-500 font-mono tracking-widest uppercase">
                      Risk Factors
                    </span>
                  </div>
                  <div className="space-y-3">
                    {sentiment.risk_factors.map((risk, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-none mt-1.5" />
                        <span className="text-sm text-yellow-200/80 leading-snug">
                          {risk}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </section>

        {/* ── Related News ─────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Newspaper className="w-5 h-5 text-geo-gold" />
              <h2 className="text-lg font-bold text-white">Related News</h2>
              <span className="text-xs text-gray-500">
                {instrument.d} · Latest coverage
              </span>
            </div>
            <Link
              href="/news"
              className="text-xs text-gray-500 hover:text-geo-gold transition-colors flex items-center gap-1"
            >
              All news <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {newsLoading && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-36 bg-white/5 rounded-xl border border-white/10 animate-pulse"
                />
              ))}
            </div>
          )}

          {!newsLoading && news.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
              <Newspaper className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                No related news found for {instrument.d}.
              </p>
            </div>
          )}

          {!newsLoading && news.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {news.map((article, i) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <Link href={`/news/${article.slug}`}>
                    <div className="group h-full rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20 transition-all overflow-hidden cursor-pointer">
                      {article.imageUrl && (
                        <div className="h-32 overflow-hidden">
                          <img
                            src={article.imageUrl}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide"
                            style={{
                              color: instrument.color,
                              backgroundColor: `${instrument.color}18`,
                            }}
                          >
                            {article.category}
                          </span>
                          {article.sourceName && (
                            <span className="text-[10px] text-gray-600 truncate">
                              {article.sourceName}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-white leading-snug mb-2 line-clamp-2 group-hover:text-geo-gold transition-colors">
                          {article.title}
                        </h3>
                        {article.description && (
                          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">
                            {article.description}
                          </p>
                        )}
                        <div className="flex items-center gap-1 text-[10px] text-gray-600">
                          <Clock className="w-3 h-3" />
                          {new Date(article.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <div className="border-t border-white/10 pt-6 text-center">
          <p className="text-xs text-gray-600">
            GeoMoney Intelligence Platform · AI analysis for informational
            purposes only. Not financial advice.
          </p>
        </div>
      </div>
    </main>
  );
}
