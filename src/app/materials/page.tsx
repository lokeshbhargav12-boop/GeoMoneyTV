"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft,
  Atom,
  Star,
  Search,
  Activity,
  Layers,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
} from "lucide-react";

interface RareEarthMaterial {
  id: string | null;
  name: string;
  symbol: string;
  category: string;
  description: string;
  price?: number | null;
  unit?: string | null;
  effectivePrice?: number | null;
  effectiveUnit?: string | null;
  priceAsOf?: string | null;
  priceIsLive?: boolean;
  priceChange?: number | null;
  priceChangePercent?: number | null;
  benchmarkLabel?: string | null;
}

type SortKey = "name" | "price-desc" | "price-asc" | "updated";

function formatPrice(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 10 ? 4 : 2,
  });
}

function ChangeChip({ pct }: { pct: number }) {
  const up = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${
        up ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
      }`}
    >
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {up ? "+" : ""}
      {pct.toFixed(2)}%
    </span>
  );
}

export default function MaterialsPage() {
  const { data: session } = useSession();
  const [materials, setMaterials] = useState<RareEarthMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [trackedIds, setTrackedIds] = useState<Set<string>>(new Set());
  const [trackingInProgress, setTrackingInProgress] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/rare-earth")
      .then((res) => res.json())
      .then((data) => {
        setMaterials(data.materials || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Fetch user's tracked materials
  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/user/tracked-materials")
      .then((res) => res.json())
      .then((data) => {
        if (data.tracked) {
          setTrackedIds(new Set(data.tracked.map((t: any) => t.materialId)));
        }
      })
      .catch(() => {});
  }, [session]);

  const toggleTrack = useCallback(
    async (e: React.MouseEvent, materialId: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (!session?.user) return;
      setTrackingInProgress(materialId);

      const isTracked = trackedIds.has(materialId);
      try {
        const res = await fetch("/api/user/tracked-materials", {
          method: isTracked ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ materialId }),
        });
        if (res.ok) {
          setTrackedIds((prev) => {
            const next = new Set(prev);
            if (isTracked) next.delete(materialId);
            else next.add(materialId);
            return next;
          });
        }
      } catch {
      } finally {
        setTrackingInProgress(null);
      }
    },
    [session, trackedIds],
  );


  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of materials) counts.set(m.category, (counts.get(m.category) ?? 0) + 1);
    return [
      { name: "All", count: materials.length },
      ...Array.from(counts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    ];
  }, [materials]);

  const stats = useMemo(() => {
    const liveFeeds = materials.filter((m) => m.priceIsLive).length;
    const withPrices = materials.filter((m) => (m.effectivePrice ?? m.price) != null).length;
    const lastUpdate = materials
      .map((m) => m.priceAsOf)
      .filter((v): v is string => Boolean(v))
      .sort()
      .pop();
    return { total: materials.length, categories: categories.length - 1, liveFeeds, withPrices, lastUpdate };
  }, [materials, categories]);

  const movers = useMemo(
    () =>
      materials
        .filter((m) => m.priceChangePercent != null)
        .sort((a, b) => Math.abs(b.priceChangePercent!) - Math.abs(a.priceChangePercent!))
        .slice(0, 4),
    [materials],
  );

  const filteredMaterials = useMemo(() => {
    let list = materials;
    if (activeCategory !== "All") list = list.filter((m) => m.category === activeCategory);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.symbol.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q),
      );
    }
    const sorted = [...list];
    switch (sort) {
      case "price-desc":
        sorted.sort((a, b) => (b.effectivePrice ?? b.price ?? -1) - (a.effectivePrice ?? a.price ?? -1));
        break;
      case "price-asc":
        sorted.sort(
          (a, b) =>
            (a.effectivePrice ?? a.price ?? Number.MAX_VALUE) -
            (b.effectivePrice ?? b.price ?? Number.MAX_VALUE),
        );
        break;
      case "updated":
        sorted.sort((a, b) => (b.priceAsOf ?? "").localeCompare(a.priceAsOf ?? ""));
        break;
      default:
        sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }, [materials, activeCategory, search, sort]);


  return (
    <div className="min-h-screen bg-geo-dark text-white pt-32 pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-geo-gold mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <Atom className="w-8 h-8 text-geo-gold" />
            <div>
              <h1 className="text-4xl font-bold tracking-tight">
                Critical Materials <span className="text-geo-gold">Intelligence</span>
              </h1>
              <p className="mt-2 text-lg text-gray-400 max-w-3xl">
                Supply chains, markets and geopolitical risk across the materials
                underpinning energy, technology, defence and advanced industry.
              </p>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wide">
              <Layers className="w-3.5 h-3.5 text-geo-gold" /> Materials Tracked
            </div>
            <div className="mt-2 text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wide">
              <Atom className="w-3.5 h-3.5 text-geo-gold" /> Categories
            </div>
            <div className="mt-2 text-2xl font-bold">{stats.categories}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wide">
              <Activity className="w-3.5 h-3.5 text-emerald-400" /> Live Price Feeds
            </div>
            <div className="mt-2 text-2xl font-bold">{stats.liveFeeds}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wide">
              <RefreshCw className="w-3.5 h-3.5 text-geo-gold" /> Last Price Update
            </div>
            <div className="mt-2 text-2xl font-bold">
              {stats.lastUpdate
                ? new Date(stats.lastUpdate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : "—"}
            </div>
          </div>
        </div>


        {/* Market movers (only when benchmark history exists) */}
        {movers.length > 0 && (
          <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-geo-gold" />
              <h2 className="font-bold">Benchmark Movers</h2>
              <span className="text-xs text-gray-500">latest vs previous observation</span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {movers.map((m) => (
                <Link
                  key={m.id ?? m.symbol}
                  href={`/materials/${encodeURIComponent(m.symbol)}`}
                  className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-white/10 hover:border-geo-gold/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-geo-gold font-bold">{m.symbol}</span>
                    <div className="min-w-0">
                      <div className="text-sm text-gray-200 truncate">{m.name}</div>
                      <div className="text-xs text-gray-500 truncate">{m.benchmarkLabel}</div>
                    </div>
                  </div>
                  <ChangeChip pct={m.priceChangePercent!} />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Controls: search + sort */}
        <div className="mb-6 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search materials, symbols, applications..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-geo-gold/50"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <ArrowUpDown className="w-4 h-4" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-geo-gold/50 [&>option]:bg-geo-dark"
            >
              <option value="name">Name A–Z</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="updated">Recently Updated</option>
            </select>
          </div>
        </div>

        {/* Category pills with counts */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={`px-3.5 py-1.5 rounded-full text-sm border transition-all ${
                activeCategory === cat.name
                  ? "bg-geo-gold/20 border-geo-gold/60 text-geo-gold"
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/25"
              }`}
            >
              {cat.name}
              <span className="ml-1.5 text-xs opacity-60">{cat.count}</span>
            </button>
          ))}
        </div>


        {/* Materials grid */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-56 rounded-xl border border-white/10 bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : filteredMaterials.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMaterials.map((material) => {
              const displayPrice = material.effectivePrice ?? material.price ?? null;
              const displayUnit = material.effectiveUnit ?? material.unit ?? null;
              const priceDate = material.priceAsOf
                ? new Date(material.priceAsOf).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : null;
              return (
                <Link
                  key={material.id ?? material.symbol}
                  href={`/materials/${encodeURIComponent(material.symbol)}`}
                  className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-geo-gold/50 hover:bg-white/10 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-geo-gold/25 to-yellow-600/10 border border-geo-gold/30 flex items-center justify-center text-geo-gold font-bold text-lg flex-shrink-0">
                        {material.symbol}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold group-hover:text-geo-gold transition-colors">
                          {material.name}
                        </h3>
                        <p className="text-xs font-medium text-geo-gold/80">{material.category}</p>
                      </div>
                    </div>
                    {material.priceIsLive && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex-shrink-0"
                        title="Live price feed"
                      >
                        <Activity className="w-2.5 h-2.5" /> LIVE
                      </span>
                    )}
                  </div>

                  {displayPrice != null && (
                    <div className="mt-4 flex items-center gap-2 flex-wrap">
                      <span className="text-lg font-bold text-white">
                        ${formatPrice(displayPrice)}
                        {displayUnit && (
                          <span className="text-sm text-gray-400 font-normal ml-1">/{displayUnit}</span>
                        )}
                      </span>
                      {material.priceChangePercent != null && (
                        <ChangeChip pct={material.priceChangePercent} />
                      )}
                    </div>
                  )}
                  {(material.benchmarkLabel || priceDate) && (
                    <p className="mt-1 text-xs text-gray-500">
                      {material.benchmarkLabel}
                      {material.benchmarkLabel && priceDate ? " · " : ""}
                      {priceDate ? `as of ${priceDate}` : ""}
                    </p>
                  )}

                  <p className="mt-3 text-sm text-gray-400 line-clamp-2">{material.description}</p>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Critical Material</span>
                    <div className="flex items-center gap-2">
                      {session?.user && material.id && (
                        <button
                          onClick={(e) => toggleTrack(e, material.id as string)}
                          disabled={trackingInProgress === material.id}
                          className={`p-1.5 rounded-md transition-all ${
                            trackedIds.has(material.id)
                              ? "text-geo-gold bg-geo-gold/20"
                              : "text-gray-500 hover:text-geo-gold hover:bg-white/10"
                          } disabled:opacity-50`}
                          title={trackedIds.has(material.id) ? "Untrack material" : "Track material"}
                        >
                          <Star
                            className={`w-4 h-4 ${trackedIds.has(material.id) ? "fill-current" : ""}`}
                          />
                        </button>
                      )}
                      <span className="text-geo-gold group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/5 p-16 text-center">
            <Atom className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 text-lg">No critical materials match your filters.</p>
            <p className="text-gray-500 text-sm mt-2">
              Try a different search or category, or add materials from the admin panel.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

