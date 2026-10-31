"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Atom,
  Star,
  Trash2,
  Loader2,
  ExternalLink,
  Briefcase,
  Crown,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import PortfolioManager from "@/components/PortfolioManager";
import { WAITLIST_LAUNCH_MESSAGE } from "@/lib/waitlist";

interface TrackedMaterialItem {
  id: string;
  materialId: string;
  createdAt: string;
  material: {
    name: string;
    symbol: string;
    category: string;
    price?: number;
    unit?: string;
    description?: string;
  };
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tracked, setTracked] = useState<TrackedMaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [untrackingId, setUntrackingId] = useState<string | null>(null);
  const [onWaitlist, setOnWaitlist] = useState(false);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);
  const [waitlistMsg, setWaitlistMsg] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Fetch tracked materials
  const fetchTracked = useCallback(async () => {
    try {
      const res = await fetch("/api/user/tracked-materials");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setTracked(data.tracked || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchTracked();
      if (session.user.email) {
        fetch(`/api/waitlist?email=${encodeURIComponent(session.user.email)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data?.joined) setOnWaitlist(true);
          })
          .catch(() => {});
      }
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [session, status, fetchTracked]);

  const handleJoinWaitlist = async () => {
    if (!session?.user?.email) return;
    setJoiningWaitlist(true);
    setWaitlistMsg("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: session.user.name || session.user.email.split("@")[0],
          email: session.user.email,
          source: "user_profile",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setOnWaitlist(true);
        setWaitlistMsg("Priority access reserved on the GeoMoney Basic waitlist!");
      } else {
        setWaitlistMsg(data.error || "Failed to join waitlist");
      }
    } catch {
      setWaitlistMsg("Something went wrong. Please try again.");
    } finally {
      setJoiningWaitlist(false);
    }
  };

  const handleUntrack = useCallback(async (materialId: string) => {
    setUntrackingId(materialId);
    try {
      const res = await fetch("/api/user/tracked-materials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId }),
      });
      if (res.ok) {
        setTracked((prev) =>
          prev.filter((item) => item.materialId !== materialId),
        );
      }
    } catch {
      // silently fail
    } finally {
      setUntrackingId(null);
    }
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-geo-dark text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-geo-gold" />
          <span className="text-gray-400">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div className="min-h-screen bg-geo-dark text-white pt-32 pb-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-geo-gold mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-geo-gold to-yellow-600 flex items-center justify-center text-xl font-bold text-black">
              {session.user.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                My <span className="text-geo-gold">Profile</span>
              </h1>
              <p className="mt-1 text-gray-400">{session.user.email}</p>
            </div>
          </div>
        </div>

        {/* GeoMoney Basic Pre-Launch Waitlist Card */}
        <div className="rounded-2xl border border-geo-gold/30 bg-gradient-to-br from-amber-500/10 via-geo-gold/5 to-transparent p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-geo-gold/15 border border-geo-gold/30 px-3 py-1 text-xs font-semibold text-geo-gold">
                <Crown className="w-3.5 h-3.5" />
                GeoMoney Basic Priority Access
              </div>
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-geo-gold shrink-0 mt-1" />
                <p className="text-sm text-gray-200 leading-relaxed">
                  {WAITLIST_LAUNCH_MESSAGE}
                </p>
              </div>
              {waitlistMsg && (
                <p className="text-xs text-green-400 font-medium">{waitlistMsg}</p>
              )}
            </div>
            <div className="shrink-0">
              {onWaitlist ? (
                <div className="inline-flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/15 px-4 py-2.5 text-xs font-semibold text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  On GeoMoney Basic Waitlist
                </div>
              ) : (
                <button
                  onClick={handleJoinWaitlist}
                  disabled={joiningWaitlist}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-geo-gold to-yellow-500 px-5 py-3 text-sm font-bold text-black hover:brightness-110 transition-all disabled:opacity-50"
                >
                  <Crown className="w-4 h-4" />
                  {joiningWaitlist ? "Joining..." : "Join the Waitlist"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Portfolio Manager Section */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-white/10 flex items-center gap-3">
            <Briefcase className="w-5 h-5 text-geo-gold" />
            <h2 className="text-lg font-semibold">Portfolio Manager</h2>
          </div>
          <div className="p-6">
            <PortfolioManager />
          </div>
        </div>

        {/* Tracked Materials Section */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
          <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-geo-gold" />
              <h2 className="text-lg font-semibold">
                Tracked Critical Materials
              </h2>
            </div>
            <span className="text-sm text-gray-500">
              {tracked.length} material{tracked.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-geo-gold" />
              </div>
            ) : tracked.length === 0 ? (
              <div className="text-center py-16">
                <Atom className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 text-lg mb-2">
                  No tracked materials yet
                </p>
                <p className="text-gray-500 text-sm mb-6">
                  Browse critical materials and click the star icon to track
                  them.
                </p>
                <Link
                  href="/materials"
                  className="inline-flex items-center gap-2 rounded-xl border border-geo-gold/30 bg-geo-gold/10 px-5 py-3 text-sm font-semibold text-geo-gold hover:bg-geo-gold/20 transition-colors"
                >
                  <Atom className="w-4 h-4" />
                  Browse Critical Materials
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {tracked.map((item) => (
                  <Link
                    key={item.id}
                    href={`/materials/${item.material.symbol}`}
                    className="group relative rounded-xl border border-white/10 bg-white/5 p-5 transition-all hover:border-geo-gold/50 hover:bg-white/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold group-hover:text-geo-gold transition-colors truncate">
                          {item.material.name}
                        </h3>
                        <p className="text-xs text-geo-gold font-medium mt-0.5">
                          {item.material.symbol} &middot;{" "}
                          {item.material.category}
                        </p>
                        {item.material.price && (
                          <p className="mt-2 text-sm font-bold text-white">
                            ${item.material.price.toFixed(2)}
                            {item.material.unit && (
                              <span className="text-gray-400 text-xs ml-1">
                                /{item.material.unit}
                              </span>
                            )}
                          </p>
                        )}
                        {item.material.description && (
                          <p className="mt-2 text-xs text-gray-400 line-clamp-2">
                            {item.material.description}
                          </p>
                        )}
                        <p className="mt-2 text-[10px] text-gray-600">
                          Tracked{" "}
                          {new Date(item.createdAt).toLocaleDateString(
                            undefined,
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleUntrack(item.materialId);
                        }}
                        disabled={untrackingId === item.materialId}
                        className="shrink-0 p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        title="Untrack material"
                      >
                        {untrackingId === item.materialId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {tracked.length > 0 && (
              <div className="mt-6 text-center">
                <Link
                  href="/materials"
                  className="inline-flex items-center gap-2 text-sm text-geo-gold hover:text-geo-gold/80 transition-colors"
                >
                  <Atom className="w-4 h-4" />
                  Browse all critical materials
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
