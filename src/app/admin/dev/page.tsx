"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Database,
  RefreshCw,
  TerminalSquare,
  Settings,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

interface DevStatus {
  ok: boolean;
  latencyMs?: number;
  counts?: {
    users: number;
    articles: number;
    materials: number;
    videos: number;
    newsletters: number;
  };
  error?: string;
}

const CALIBRATION_ACTIONS = [
  {
    title: "Admin Users",
    description: "Manage admin access and roles",
    href: "/admin/users",
    icon: ShieldCheck,
  },
  {
    title: "Site Settings",
    description: "Global configuration and feature toggles",
    href: "/admin/settings",
    icon: Settings,
  },
  {
    title: "Content Review",
    description: "Articles, newsletters, and media review",
    href: "/admin/articles",
    icon: TerminalSquare,
  },
  {
    title: "Live Dashboard",
    description: "Back to the admin overview",
    href: "/admin",
    icon: ExternalLink,
  },
];

const AI_ANALYZERS = [
  {
    name: "AI Navigation Assistant",
    endpoint: "/api/ai/navigate",
    method: "POST",
    description: "Routes natural-language navigation prompts.",
    testPath: "/",
  },
  {
    name: "Energy AI Analyzer",
    endpoint: "/api/ai/energy",
    method: "POST",
    description: "Structured geopolitical energy analysis.",
    testPath: "/energy",
  },
  {
    name: "News Bias Analyzer",
    endpoint: "/api/ai/bias",
    method: "POST",
    description: "Bias + sentiment + market impact from news content.",
    testPath: "/news",
  },
  {
    name: "Article AI Summary",
    endpoint: "/api/ai/summarize",
    method: "POST",
    description: "Generates full AI summaries for truncated articles.",
    testPath: "/news",
  },
  {
    name: "Coal Market AI Brief",
    endpoint: "/api/ai/coal-commentary",
    method: "GET",
    description: "Coal market commentary with AI summaries.",
    testPath: "/energy/coal",
  },
  {
    name: "Market Sentiment Analyzer",
    endpoint: "/api/ai/market-sentiment",
    method: "POST",
    description: "Macro market sentiment for tracked instruments.",
    testPath: "/news",
  },
  {
    name: "World Monitor AI Brief",
    endpoint: "/api/world-monitor/ai-brief",
    method: "POST",
    description: "GeoMoney Aperture executive brief over live world-monitor data.",
    testPath: "/world-monitor",
  },
];

export default function DevPanelPage() {
  const [status, setStatus] = useState<DevStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/dev-status");
      const data = await res.json();
      setStatus(data);
    } catch (error) {
      console.error("Failed to fetch dev status:", error);
      setStatus({ ok: false, error: "Failed to reach dev status" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-geo-gold">Developer Admin Panel</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Calibration Console</h1>
          <p className="mt-2 text-sm text-gray-400">
            Use this panel to validate DB connectivity and manage calibration workflows locally.
          </p>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-sm text-gray-200 hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Status
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-black/30 p-5">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Database className="h-4 w-4 text-geo-gold" /> DB Connection
          </div>
          <div className="mt-3 text-2xl font-semibold text-white">
            {loading ? "Checking..." : status?.ok ? "Connected" : "Disconnected"}
          </div>
          {!loading && !status?.ok ? (
            <p className="mt-2 text-xs text-red-400">{status?.error ?? "Connection failed"}</p>
          ) : (
            <p className="mt-2 text-xs text-gray-500">Latency: {status?.latencyMs ?? 0} ms</p>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-5">
          <p className="text-sm text-gray-400">Database Snapshot</p>
          <div className="mt-3 space-y-2 text-sm text-gray-200">
            <div>Users: {loading ? "..." : status?.counts?.users ?? 0}</div>
            <div>Articles: {loading ? "..." : status?.counts?.articles ?? 0}</div>
            <div>Materials: {loading ? "..." : status?.counts?.materials ?? 0}</div>
            <div>Videos: {loading ? "..." : status?.counts?.videos ?? 0}</div>
            <div>Newsletters: {loading ? "..." : status?.counts?.newsletters ?? 0}</div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-5">
          <p className="text-sm text-gray-400">Local Calibration Checklist</p>
          <ul className="mt-3 space-y-2 text-sm text-gray-200">
            <li>1. Confirm DB is connected (status card)</li>
            <li>2. Review admin users + roles</li>
            <li>3. Validate newsletters + content feeds</li>
            <li>4. Test live dashboards + widgets</li>
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Calibration Shortcuts</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {CALIBRATION_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-start gap-4 rounded-xl border border-white/10 bg-black/30 p-4 transition hover:border-geo-gold/40"
            >
              <action.icon className="h-5 w-5 text-geo-gold" />
              <div>
                <div className="text-sm font-semibold text-white">{action.title}</div>
                <div className="text-xs text-gray-400">{action.description}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">AI Analyzer Components</h2>
            <p className="text-sm text-gray-400">
              Validate each analyzer by visiting the linked feature page or calling the endpoint.
            </p>
          </div>
          <span className="text-xs text-gray-500">Total: {AI_ANALYZERS.length}</span>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {AI_ANALYZERS.map((analyzer) => (
            <div
              key={analyzer.endpoint}
              className="rounded-xl border border-white/10 bg-black/30 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white">{analyzer.name}</div>
                <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] text-gray-300">
                  {analyzer.method}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-400">{analyzer.description}</div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                <code className="rounded bg-black/40 px-2 py-1 text-[11px] text-geo-gold">
                  {analyzer.endpoint}
                </code>
                <Link
                  href={analyzer.testPath}
                  className="text-geo-gold hover:text-yellow-300"
                >
                  Open {analyzer.testPath}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/40 p-6">
        <h2 className="text-lg font-semibold text-white">Run Locally</h2>
        <p className="mt-2 text-sm text-gray-400">
          Use these commands after pulling updates to boot the admin panel locally.
        </p>
        <div className="mt-4 space-y-3 rounded-lg border border-white/10 bg-black/50 p-4 font-mono text-xs text-gray-200">
          <div>npm install</div>
          <div>npm run dev</div>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Tip: ensure <span className="text-geo-gold">.env.local</span> has your DATABASE_URL.
        </p>
      </section>
    </div>
  );
}
