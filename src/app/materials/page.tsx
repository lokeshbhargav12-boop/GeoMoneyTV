"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Atom, Star } from "lucide-react";

interface RareEarthMaterial {
  id: string;
  name: string;
  symbol: string;
  category: string;
  description: string;
  price?: number;
  unit?: string;
}

export default function MaterialsPage() {
  const { data: session } = useSession();
  const [materials, setMaterials] = useState<RareEarthMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [trackedIds, setTrackedIds] = useState<Set<string>>(new Set());
  const [trackingInProgress, setTrackingInProgress] = useState<string | null>(
    null,
  );

  const categories = [
    "All",
    ...Array.from(new Set(materials.map((m) => m.category))),
  ];
  const filteredMaterials =
    activeCategory === "All"
      ? materials
      : materials.filter((m) => m.category === activeCategory);

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

  return (
    <div className="min-h-screen bg-geo-dark text-white pt-28 pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
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
                Critical{" "}
                <span className="text-geo-gold">Rare Earth Materials</span>
              </h1>
              <p className="mt-2 text-lg text-gray-400">
                Essential elements powering modern technology and geopolitical
                dynamics
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        {materials.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                  activeCategory === category
                    ? "bg-geo-gold text-black border-geo-gold"
                    : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:border-geo-gold/30"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 bg-white/5 p-6 animate-pulse h-48"
              />
            ))}
          </div>
        ) : materials.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMaterials.map((material) => (
              <Link
                key={material.id}
                href={`/materials/${material.symbol}`}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-geo-gold/50 hover:bg-white/10 cursor-pointer"
              >
                <div className="absolute right-4 top-4 text-5xl font-bold text-geo-gold/10 group-hover:text-geo-gold/20 transition-colors">
                  {material.symbol}
                </div>
                <div className="relative">
                  <h3 className="text-2xl font-bold group-hover:text-geo-gold transition-colors">
                    {material.name}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-geo-gold">
                    {material.category}
                  </p>
                  {material.price && (
                    <p className="mt-2 text-lg font-bold text-white">
                      ${material.price.toFixed(2)}
                      {material.unit && (
                        <span className="text-sm text-gray-400 ml-1">
                          /{material.unit}
                        </span>
                      )}
                    </p>
                  )}
                  <p className="mt-3 text-sm text-gray-400 line-clamp-3">
                    {material.description}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Critical Material
                  </span>
                  <div className="flex items-center gap-2">
                    {session?.user && (
                      <button
                        onClick={(e) => toggleTrack(e, material.id)}
                        disabled={trackingInProgress === material.id}
                        className={`p-1.5 rounded-md transition-all ${
                          trackedIds.has(material.id)
                            ? "text-geo-gold bg-geo-gold/20"
                            : "text-gray-500 hover:text-geo-gold hover:bg-white/10"
                        } disabled:opacity-50`}
                        title={
                          trackedIds.has(material.id)
                            ? "Untrack material"
                            : "Track material"
                        }
                      >
                        <Star
                          className={`w-4 h-4 ${trackedIds.has(material.id) ? "fill-current" : ""}`}
                        />
                      </button>
                    )}
                    <span className="text-geo-gold group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/5 p-16 text-center">
            <Atom className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 text-lg">
              No rare earth materials found.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Add materials from the admin panel.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
