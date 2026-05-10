"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, ArrowLeft, Filter, Search } from "lucide-react";

interface Article {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  category: string;
  sourceName: string | null;
  createdAt: string;
}

interface NewsCategory {
  label: string;
  value: string;
}

const DEFAULT_CATEGORIES: NewsCategory[] = [
  { label: "All", value: "all" },
  { label: "Geopolitics", value: "geopolitics" },
  { label: "Economy", value: "economy" },
  { label: "Commodities", value: "commodities" },
  { label: "Energy", value: "energy" },
  { label: "Technology", value: "technology" },
  { label: "News", value: "news" },
];

function NewsImageClient({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div
        className={`bg-gradient-to-br from-geo-dark to-black flex items-center justify-center ${className}`}
      >
        <span className="text-geo-gold/30 text-4xl font-black">GM</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}

export default function NewsPageClient() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);
  const [categories, setCategories] =
    useState<NewsCategory[]>(DEFAULT_CATEGORIES);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1); // Reset page on filter change
  }, [debouncedSearch, activeCategory]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams({
          paginate: "true",
          limit: "21", // Multiple of 3 for the grid layout
          page: page.toString(),
        });
        
        if (activeCategory !== "all") query.set("category", activeCategory);
        if (debouncedSearch) query.set("search", debouncedSearch);

        const res = await fetch(`/api/articles?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.articles) {
            setArticles(data.articles);
            setTotalPages(data.pagination?.totalPages || 1);
            setTotalArticles(data.pagination?.total || 0);
          } else {
            setArticles(data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch articles:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, [page, activeCategory, debouncedSearch]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.newsCategories && Array.isArray(data.newsCategories)) {
          setCategories([
            { label: "All", value: "all" },
            ...data.newsCategories.map((c: string) => ({
              label: c.charAt(0).toUpperCase() + c.slice(1),
              value: c.toLowerCase(),
            })),
          ]);
        }
      }
    } catch {
      // Use defaults
    }
  };

  const filteredArticles = articles; // Now filtered on the backend

  return (
    <div className="min-h-screen bg-geo-dark text-white pt-28 pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-geo-gold mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Intelligence Briefings
            </span>
          </h1>
          <p className="mt-2 text-gray-400">
            Archive of all global financial and geopolitical updates.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-geo-gold/50 focus:ring-1 focus:ring-geo-gold/50 transition-all"
            />
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-gray-500 mr-1" />
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeCategory === cat.value
                    ? "bg-geo-gold text-black"
                    : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-sm text-gray-500">
          {loading
            ? "Loading..."
            : `${totalArticles} article${totalArticles !== 1 ? "s" : ""} found`}
        </div>

        {/* Articles Grid */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl bg-white/5 border border-white/10 animate-pulse h-80"
              />
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-20 rounded-xl bg-white/5 border border-white/10">
            <p className="text-gray-400 text-lg">No articles found.</p>
            {(activeCategory !== "all" || searchQuery) && (
              <button
                onClick={() => {
                  setActiveCategory("all");
                  setSearchQuery("");
                }}
                className="mt-4 text-geo-gold hover:underline text-sm"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((article) => (
              <Link
                href={`/news/${article.slug}`}
                key={article.id}
                className="group flex flex-col overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:border-geo-gold/30 hover:bg-white/10 transition-all h-full"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-gray-900">
                  <NewsImageClient
                    src={article.imageUrl || "/globe-placeholder.jpg"}
                    alt={article.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 rounded-full bg-geo-gold px-3 py-1 text-xs font-bold text-black uppercase tracking-wider">
                    {article.category}
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(article.createdAt).toLocaleDateString()}
                    </span>
                    {article.sourceName && (
                      <>
                        <span className="text-gray-600">•</span>
                        <span className="text-geo-gold/70">
                          {article.sourceName}
                        </span>
                      </>
                    )}
                  </div>

                  <h2 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-geo-gold transition-colors">
                    {article.title}
                  </h2>

                  <p className="text-sm text-gray-400 line-clamp-3 mb-4 flex-1">
                    {article.description ||
                      "Read the full article for details."}
                    ...
                  </p>

                  <span className="text-sm font-semibold text-geo-gold mt-auto flex items-center gap-1">
                    Read Analysis →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */
        !loading && totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-50 hover:bg-white/10 transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-400 px-4">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-50 hover:bg-white/10 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
