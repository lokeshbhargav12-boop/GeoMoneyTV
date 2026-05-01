"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Newspaper,
  Users,
  Video,
  Mail,
  Atom,
  Plus,
  Settings,
  RefreshCw,
  Home,
  Sparkles,
  Share2,
} from "lucide-react";

interface Stats {
  articles: number;
  newsletters: number;
  rareEarth: number;
  users: number;
  videos: number;
}

const QUICK_ACTIONS = [
  {
    href: "/admin/articles/new",
    label: "Create Article",
    icon: Plus,
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  {
    href: "/admin/videos",
    label: "Manage Videos",
    icon: Video,
    color: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  {
    href: "/admin/rare-earth",
    label: "Manage Materials",
    icon: Atom,
    color: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  {
    href: "/admin/newsletters",
    label: "AI Newsletter",
    icon: Sparkles,
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  {
    href: "/admin/social-posts",
    label: "Social Posts",
    icon: Share2,
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  },
  {
    href: "/admin/homepage",
    label: "Edit Homepage",
    icon: Home,
    color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  },
  {
    href: "/admin/settings",
    label: "Site Settings",
    icon: Settings,
    color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: "Articles",
      value: stats?.articles ?? 0,
      icon: Newspaper,
      color: "text-blue-400",
    },
    {
      label: "Videos",
      value: stats?.videos ?? 0,
      icon: Video,
      color: "text-red-400",
    },
    {
      label: "Newsletters",
      value: stats?.newsletters ?? 0,
      icon: Mail,
      color: "text-purple-400",
    },
    {
      label: "Rare Earth",
      value: stats?.rareEarth ?? 0,
      icon: Atom,
      color: "text-green-400",
    },
    {
      label: "Users",
      value: stats?.users ?? 0,
      icon: Users,
      color: "text-yellow-400",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="mt-1 text-gray-400">GeoMoney TV Management Panel</p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-10">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:border-white/20 hover:bg-white/10"
          >
            <div className="flex items-center justify-between mb-3">
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {loading ? "..." : stat.value.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`flex items-center gap-3 rounded-xl border p-5 transition-all hover:scale-[1.02] ${action.color}`}
          >
            <action.icon className="w-5 h-5" />
            <span className="font-semibold">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
