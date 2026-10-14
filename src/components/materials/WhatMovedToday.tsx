'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronDown, ChevronUp, Zap } from 'lucide-react'
import { formatEventType, timeAgo } from './intel-types'

export interface MovedEvent {
  id: string
  title: string
  summary: string | null
  eventType: string
  occurredAt: string
  severity: string
  confidence: string
  importance: number
  priceDirection: string | null
  materials: { name: string; symbol: string; relevanceScore: number; relationshipType: string; whyRelevant: string | null }[]
}

// C5 front-page module — "What Moved Critical Materials Today?" ranked by
// importance and number of affected materials, with an expandable
// relationship view. Each event is stored once and linked everywhere.
export default function WhatMovedToday({ events }: { events: MovedEvent[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  if (events.length === 0) {
    return (
      <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-8">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-geo-gold" />
          <h2 className="text-lg font-bold">What Moved Critical Materials Today?</h2>
        </div>
        <p className="mt-2 text-sm text-gray-400">No qualifying events in the last 72 hours. The module updates as the intelligence pipeline processes new sources.</p>
      </div>
    )
  }

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <Zap className="w-5 h-5 text-geo-gold" />
        <h2 className="text-lg font-bold">What Moved Critical Materials Today?</h2>
        <span className="ml-auto text-[10px] text-gray-500 uppercase tracking-wide">ranked by impact × materials affected</span>
      </div>

      <div className="space-y-2.5">
        {events.map((event, index) => {
          const open = openId === event.id
          return (
            <div key={event.id} className="bg-black/30 rounded-lg border border-white/10">
              <button onClick={() => setOpenId(open ? null : event.id)} className="w-full text-left p-3.5">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-md bg-geo-gold/15 text-geo-gold text-xs font-black flex items-center justify-center mt-0.5">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white leading-snug">{event.title}</p>
                    <div className="mt-1 flex items-center gap-2 flex-wrap text-[10px] text-gray-500">
                      <span className="px-1.5 py-0.5 rounded bg-white/10 text-gray-300">{formatEventType(event.eventType)}</span>
                      <span>{timeAgo(event.occurredAt)}</span>
                      <span>{event.materials.length} material{event.materials.length === 1 ? '' : 's'} affected</span>
                      <span className="capitalize">severity {event.severity}</span>
                      {event.priceDirection && event.priceDirection !== 'unclear' && (
                        <span className={event.priceDirection === 'upward' ? 'text-red-400' : event.priceDirection === 'downward' ? 'text-emerald-400' : 'text-gray-400'}>
                          price {event.priceDirection}
                        </span>
                      )}
                    </div>
                  </div>
                  {open ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />}
                </div>
              </button>

              {open && (
                <div className="px-3.5 pb-3.5 pt-1 border-t border-white/10">
                  <p className="text-[11px] text-gray-500 mb-2">Relationship view — why each material is affected:</p>
                  <div className="flex flex-wrap gap-2">
                    {event.materials.map((material) => (
                      <Link
                        key={material.symbol}
                        href={`/materials/${encodeURIComponent(material.symbol)}`}
                        title={material.whyRelevant ?? material.relationshipType.replace(/_/g, ' ')}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 hover:border-geo-gold/40 transition-colors"
                      >
                        <span className="text-geo-gold font-bold text-xs">{material.symbol}</span>
                        <span className="text-gray-300 text-xs">{material.name}</span>
                        <span className="text-[10px] text-gray-500">{material.relevanceScore}</span>
                      </Link>
                    ))}
                  </div>
                  {event.summary && <p className="mt-2.5 text-xs text-gray-400 leading-relaxed line-clamp-3">{event.summary}</p>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
