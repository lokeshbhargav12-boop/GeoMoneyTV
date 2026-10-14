'use client'

import Link from 'next/link'
import { Network } from 'lucide-react'
import { timeAgo, type IntelCrossMaterial } from './intel-types'

// C5 — Cross-Material Impact: one canonical event, propagated across the
// material universe. Shows which OTHER materials are affected by the events
// that hit this material, with the relationship type for each.
export default function CrossMaterialImpact({ items }: { items: IntelCrossMaterial[] }) {
  if (items.length === 0) return null

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Network className="w-5 h-5 text-geo-gold" />
        <h2 className="text-xl font-bold">Cross-Material Impact</h2>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Events affecting this material also propagate to these materials — stored once, linked everywhere, never duplicated.
      </p>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.eventId} className="bg-black/30 rounded-lg border border-white/10 p-4">
            <p className="text-sm font-semibold text-white leading-snug">{item.title}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{timeAgo(item.occurredAt)}</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {item.otherMaterials.map((material) => (
                <Link
                  key={material.symbol}
                  href={`/materials/${encodeURIComponent(material.symbol)}`}
                  title={material.whyRelevant ?? `${material.name} (${material.relationshipType.replace(/_/g, ' ')})`}
                  className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 hover:border-geo-gold/40 transition-colors"
                >
                  <span className="text-geo-gold font-bold text-xs">{material.symbol}</span>
                  <span className="text-gray-300 text-xs">{material.name}</span>
                  <span className="text-[10px] text-gray-500">{material.relevanceScore}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
