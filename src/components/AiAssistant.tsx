"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Loader2, AlertTriangle, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

const SUGGESTIONS = [
  "Show me news about China",
  "Latest intelligence on gold",
  "Open the Energy Hub",
  "What is happening with Nvidia?",
];

/** Client-side guard so a stalled request never leaves the UI spinning. */
const NAVIGATE_TIMEOUT_MS = 20_000;

export default function AiAssistant() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [lastPrompt, setLastPrompt] = useState("");
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
    setFeedback("Analyzing request...");

    try {
      const response = await fetch("/api/ai/navigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.path) {
        throw new Error(data?.error || "The assistant could not determine a destination.");
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
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about markets, or a topic…"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 pr-12 text-white placeholder-gray-400 focus:outline-none focus:border-geo-gold/50 focus:ring-1 focus:ring-geo-gold/50 transition-all font-light text-lg"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            aria-label="Send request"
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

        <div className="min-h-[1.5rem] text-sm text-gray-400 font-light flex items-center">
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
      </div>
    </motion.div>
  );
}
