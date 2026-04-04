'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface RareEarthMaterial {
  id: string
  name: string
  symbol: string
  category: string
  description: string
}

export default function RareEarthSection() {
  const [materials, setMaterials] = useState<RareEarthMaterial[]>([])

  useEffect(() => {
    fetch('/api/rare-earth')
      .then((res) => res.json())
      .then((data) => setMaterials(data.materials?.slice(0, 6) || []))
      .catch((err) => console.error(err))
  }, [])

  return (
    <section className="border-t border-white/10 bg-gradient-to-br from-geo-dark to-black py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold tracking-tight">
            Critical <span className="text-geo-gold">Rare Earth Materials</span>
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            Essential elements powering modern technology and geopolitical dynamics
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((material) => (
            <Link
              key={material.id}
              href={`/materials/${material.symbol}`}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-geo-gold/50 hover:bg-white/10 cursor-pointer"
            >
              <div className="absolute right-4 top-4 text-5xl font-bold text-geo-gold/10 group-hover:text-geo-gold/20 transition-colors">
                {material.symbol}
              </div>
              <div className="relative">
                <h3 className="text-2xl font-bold group-hover:text-geo-gold transition-colors">{material.name}</h3>
                <p className="mt-1 text-sm font-medium text-geo-gold">{material.category}</p>
                <p className="mt-4 text-sm text-gray-400 line-clamp-3">
                  {material.description}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-gray-500">Critical Material</span>
                <span className="text-geo-gold group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          ))}
        </div>

        {/* View All Link */}
        <div className="mt-10 text-center">
          <Link
            href="/materials/La"
            className="inline-flex items-center gap-2 px-6 py-3 bg-geo-gold/10 border border-geo-gold/30 rounded-lg text-geo-gold font-medium hover:bg-geo-gold/20 transition-all"
          >
            Explore All Materials
            <span>→</span>
          </Link>
        </div>

        {materials.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
            <p className="text-gray-400">Loading rare earth materials data...</p>
          </div>
        )}
      </div>
    </section>
  )
}
