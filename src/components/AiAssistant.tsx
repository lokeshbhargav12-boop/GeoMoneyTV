"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Newspaper,
  Calculator,
  Atom,
  Flame,
  Globe2,
  Compass,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import type { NavigationRecommendation } from "@/lib/ai-navigation";

const SUGGESTIONS = [
  "Show me news about China",
  "Latest intelligence on gold",
  "Open the Energy Hub",
  "What is happening with Nvidia?",
];

const RECOMMENDATION_ICONS: Record<NavigationRecommendation["category"], LucideIcon> = {
  News: Newspaper,
  Tool: Calculator,
  Energy: Flame,
  Materials: Atom,
  Monitor: Globe2,
};

/** Client-side guard so a stalled request never leaves the UI spinning. */
const NAVIGATE_TIMEOUT_MS = 20_000;

export default function AiAssistant() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [lastPrompt, setLastPrompt] = useState("");
  const [recommendations, setRecommendations] = useState<NavigationRecommendation[]>([]);
  const [resultQuery, setResultQuery] = useState("");
  const router = useRouter();
  const inFlight = useRef<AbortController | null>(null);

  const runNavigate = async (rawPrompt: string) => {
    const prompt = rawPrompt.trim();
    if (!prompt) return;

    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), NAVIGATE_TIMEOUT_MS);

    setLastPrompt(prompt);
    setIsLoading(true);
    setError("");
    setRecommendations([]);
    setResultQuery("");
    setFeedback("Finding the best GeoMoney tools and intelligence...");

    try {
      const response = await fetch("/api/ai/navigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "The assistant could not process your request.");
      }

      if (Array.isArray(data.recommendations) && data.recommendations.length > 0) {
        setRecommendations(data.recommendations);
        setResultQuery(data.query || prompt);
        setFeedback(data.message || "Choose where you would like to go next.");
        setIsLoading(false);
        return;
      }

      if (!data.path) {
        throw new Error("The assistant could not determine a destination.");
      }

      setFeedback(data.message || "Navigating...");
      setIsLoading(false);

      // Small delay so the feedback is readable before the route change.
      window.setTimeout(() => {
        router.push(data.path);
        setQuery("");
        setFeedback("");
      }, 800);
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === "AbortError";
      setError(
        aborted
          ? "The assistant took too long to respond. Please try again."
          : err instanceof Error
            ? err.message
            : "Error connecting to the assistant."
      );
      setFeedback("");
      setIsLoading(false);
    } finally {
      window.clearTimeout(timeoutId);
      inFlight.current = null;
    }
  };

  const handleNavigate = async (e: React.FormEvent) => {
    e.preventDefault();
    await runNavigate(query);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="w-full max-w-2xl mx-auto mt-12 p-6 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl relative overflow-hidden group hover:border-geo-gold/30 transition-colors"
    >
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-geo-gold/20 blur-xl group-hover:bg-geo-gold/40 transition-all" />

      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-2 text-geo-gold">
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span className="text-sm font-medium tracking-wider uppercase">
            AI Navigation Assistant
          </span>
        </div>

        <form onSubmit={handleNavigate} className="relative">
          <label htmlFor="ai-navigation-input" className="sr-only">
            Ask the AI navigation assistant
          </label>
          <input
            id="ai-navigation-input"
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (recommendations.length > 0) {
                setRecommendations([]);
                setResultQuery("");
                setFeedback("");
              }
            }}
            placeholder="Try gold, oil, lithium, or any market topic…"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 pr-12 text-white placeholder-gray-400 focus:outline-none focus:border-geo-gold/50 focus:ring-1 focus:ring-geo-gold/50 transition-all font-light text-lg"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            aria-label="Find related tools and intelligence"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-geo-gold/10 text-geo-gold hover:bg-geo-gold hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ArrowRight className="w-5 h-5" />
            )}
          </button>
        </form>

        {/* Suggestion chips */}
        {recommendations.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setQuery(suggestion);
                  void runNavigate(suggestion);
                }}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-400 hover:border-geo-gold/40 hover:text-geo-gold transition-colors disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <div
          className="min-h-[1.5rem] text-sm text-gray-400 font-light flex items-center"
          aria-live="polite"
        >
          {error ? (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-amber-300"
              role="alert"
            >
              <AlertTriangle className="w-4 h-4" />
              {error}
              <button
                type="button"
                onClick={() => void runNavigate(lastPrompt)}
                className="inline-flex items-center gap-1 text-geo-gold hover:underline"
              >
                <RotateCcw className="w-3 h-3" /> Retry
              </button>
            </motion.span>
          ) : feedback ? (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              {isLoading && (
                <span className="w-1.5 h-1.5 rounded-full bg-geo-gold animate-ping" />
              )}
              {feedback}
            </motion.span>
          ) : (
            <span className="opacity-50 text-xs">Powered by GeoMoney AI</span>
          )}
        </div>

        {recommendations.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            aria-label={`Tools and intelligence related to ${resultQuery}`}
            className="border-t border-white/10 pt-4"
          >
            <div className="mb-3 flex items-center gap-2">
              <Compass className="h-4 w-4 text-geo-gold" />
              <h2 className="text-sm font-semibold text-white">
                Explore <span className="capitalize text-geo-gold">{resultQuery}</span>
              </h2>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {recommendations.map((recommendation, index) => {
                const Icon = RECOMMENDATION_ICONS[recommendation.category];
                return (
                  <motion.div
                    key={`${recommendation.path}-${recommendation.title}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <Link
                      href={recommendation.path}
                      className="group/card flex h-full items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3.5 transition-all hover:border-geo-gold/40 hover:bg-geo-gold/[0.07]"
                    >
                      <span className="mt-0.5 rounded-lg border border-geo-gold/20 bg-geo-gold/10 p-2 text-geo-gold">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.16em] text-gray-500">
                          {recommendation.category}
                        </span>
                        <span className="block text-sm font-semibold text-gray-100 transition-colors group-hover/card:text-geo-gold">
                          {recommendation.title}
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-gray-400">
                          {recommendation.description}
                        </span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-gray-600 transition-all group-hover/card:-translate-y-0.5 group-hover/card:translate-x-0.5 group-hover/card:text-geo-gold" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}
      </div>
    </motion.div>
  );
}
