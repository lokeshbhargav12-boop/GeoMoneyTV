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
} from "lucide-react";
import PortfolioManager from "@/components/PortfolioManager";

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
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [session, status, fetchTracked]);

  const handleUntrack = useCallback(
    async (materialId: string) => {
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
    },
    [],
  );

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
              <h2 className="text-lg font-semibold">Tracked Critical Materials</h2>
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
                  Browse critical materials and click the star icon to track them.
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
                          {item.material.symbol} &middot; {item.material.category}
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
                          {new Date(item.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
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