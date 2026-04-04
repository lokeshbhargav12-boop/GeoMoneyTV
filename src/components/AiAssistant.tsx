"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function AiAssistant() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const router = useRouter();

  const handleNavigate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setFeedback("Analyzing request...");

    try {
      const response = await fetch("/api/ai/navigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: query }),
      });

      const data = await response.json();

      if (data.path) {
        setFeedback(data.message || "Navigating...");
        // Small delay to read the feedback
        setTimeout(() => {
          router.push(data.path);
          // Reset query
          setQuery("");

          // Verify if we need to reset loading if it's a hash jump or search on same page
          if (
            data.path.startsWith("/#") ||
            data.path.startsWith("/?") ||
            data.path === "/"
          ) {
            setIsLoading(false);
            setFeedback("");
          }
        }, 800);
      } else {
        setFeedback("Could not determine destination.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Navigation failed", error);
      setFeedback("Error connecting to AI.");
      setIsLoading(false);
    }
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
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Where would you like to go today? (e.g., 'Show me news about China')"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 pr-12 text-white placeholder-gray-400 focus:outline-none focus:border-geo-gold/50 focus:ring-1 focus:ring-geo-gold/50 transition-all font-light text-lg"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-geo-gold/10 text-geo-gold hover:bg-geo-gold hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ArrowRight className="w-5 h-5" />
            )}
          </button>
        </form>

        <div className="h-6 text-sm text-gray-400 font-light flex items-center">
          {feedback && (
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
          )}
          {!feedback && (
            <span className="opacity-50 text-xs">Powered by GeoMoney AI</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
