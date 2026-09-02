"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, Shield, TrendingUp, AlertTriangle, Loader2, Sparkles } from "lucide-react";

interface CoalCommentary {
  summary: string;
  priceOutlook: string;
  routeRisks: { route: string; risk: string; severity: "low" | "moderate" | "high" }[];
  watchpoints: string[];
  confidence: "Low" | "Moderate" | "High";
  timestamp?: string;
  fetchedAt?: string;
}

export default function CoalAiBrief() {
  const [commentary, setCommentary] = useState<CoalCommentary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommentary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/coal-commentary", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load commentary");
      const data = await res.json();
      setCommentary(data);
    } catch (e) {
      setError("AI briefing unavailable. Live data feeds remain active.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommentary();
  }, []);

  const severityClass = (severity: string) => {
    if (severity === "high") return "bg-red-500/10 border-red-500/20 text-red-400";
    if (severity === "moderate") return "bg-amber-500/10 border-amber-500/20 text-amber-400";
    return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
  };

  const confidenceClass = (confidence: string) => {
    if (confidence === "High") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (confidence === "Moderate") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-amber-300/20 bg-gradient-to-br from-amber-300/10 via-transparent to-stone-300/10 p-6"
    >
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <BrainCircuit className="w-6 h-6 text-amber-300" />
          <h2 className="text-2xl font-bold">Coal AI Market Brief</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Powered by GeoMoney AI</span>
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
        </div>
      </div>

      {loading && (
        <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <div className="text-center">
            <p className="font-semibold text-white">Analyzing coal market intelligence...</p>
            <p className="text-xs text-gray-500 mt-1">Benchmarks • Routes • OSINT • Climate</p>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 bg-red-500/10 border-l-2 border-red-500 text-red-200 text-sm rounded-xl">
          {error}
          <button onClick={fetchCommentary} className="ml-3 text-amber-400 hover:underline text-xs">Retry</button>
        </div>
      )}

      {commentary && !loading && (
        <div className="space-y-5">
          <div className="p-4 border border-white/10 bg-white/5 rounded-xl">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Shield className="w-3 h-3" /> Executive Summary
            </h4>
            <p className="text-sm text-gray-200 leading-relaxed">{commentary.summary}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border border-white/10 bg-white/5 rounded-xl">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <TrendingUp className="w-3 h-3" /> Price Outlook
              </h4>
              <p className="text-sm text-gray-300 leading-relaxed">{commentary.priceOutlook}</p>
            </div>

            <div className="p-4 border border-white/10 bg-white/5 rounded-xl">
              <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <AlertTriangle className="w-3 h-3" /> Route Risks
              </h4>
              <div className="space-y-2">
                {commentary.routeRisks.slice(0, 4).map((risk, idx) => (
                  <div key={idx} className={`text-xs p-2 rounded-lg border ${severityClass(risk.severity)}`}>
                    <span className="font-bold">{risk.route}:</span> {risk.risk}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 border border-white/10 bg-white/5 rounded-xl">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Watchpoints</h4>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {commentary.watchpoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="text-amber-400 font-bold shrink-0">▸</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={fetchCommentary}
                className="text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-gray-300 hover:text-amber-300 hover:border-amber-300/30 transition-colors"
              >
                Regenerate briefing
              </button>
              {(commentary.fetchedAt || commentary.timestamp) && (
                <span className="text-[10px] text-gray-500">
                  Briefing updated {new Date(commentary.fetchedAt || commentary.timestamp || "").toLocaleString()}
                </span>
              )}
            </div>
            <span className={`text-[10px] px-2 py-1 rounded-full border font-bold ${confidenceClass(commentary.confidence)}`}>
              Confidence: {commentary.confidence}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
