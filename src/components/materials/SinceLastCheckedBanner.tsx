'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { CheckCheck, ChevronDown, ChevronUp, History, TrendingDown, TrendingUp } from 'lucide-react'
import { signed, timeAgo } from './intel-types'

interface Delta {
  tracked: boolean
  lastSeenAt: string | null
  newDevelopments: number
  highRelevanceDevelopments: number
  pulseNow: number | null
  pulseThen: number | null
  pulseDelta: number | null
  worsened: string[]
  improved: string[]
  topEvents: { id: string; title: string; occurredAt: string; relevanceScore: number; eventType: string }[]
}

// C6 — "Since You Last Checked": shown to signed-in users who track this
// material. Driven by the stored lastSeenAt timestamp, never inferred.
export default function SinceLastCheckedBanner({ symbol, materialId }: { symbol: string; materialId: string | null }) {
  const { data: session } = useSession()
  const [delta, setDelta] = useState<Delta | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [caughtUp, setCaughtUp] = useState(false)

  useEffect(() => {
    if (!session?.user) return
    fetch(`/api/materials/${encodeURIComponent(symbol)}/last-seen`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.tracked) setDelta(data)
      })
      .catch(() => {})
  }, [session, symbol])

  if (!delta || caughtUp) return null
  const nothingNew = delta.newDevelopments === 0 && (delta.pulseDelta == null || delta.pulseDelta === 0)

  const markCaughtUp = async () => {
    if (!materialId) return
    try {
      await fetch('/api/user/tracked-materials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialId }),
      })
      setCaughtUp(true)
    } catch {}
  }

  return (
    <div className="rounded-xl border border-geo-gold/30 bg-gradient-to-r from-geo-gold/10 to-transparent p-4">
      <button onClick={() => setExpanded((v) => !v)} className="w-full flex items-center justify-between gap-3 text-left">
        <div className="flex items-center gap-3 min-w-0">
          <History className="w-5 h-5 text-geo-gold flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-white">Since you last checked</p>
            <p className="text-xs text-gray-400 truncate">
              {nothingNew ? (
                <>Nothing material changed{delta.lastSeenAt ? ` since ${timeAgo(delta.lastSeenAt)}` : ''}.</>
              ) : (
                <>
                  <span className="text-gray-200 font-semibold">{delta.newDevelopments}</span> new development{delta.newDevelopments === 1 ? '' : 's'}
                  {delta.highRelevanceDevelopments > 0 && <> · <span className="text-amber-400 font-semibold">{delta.highRelevanceDevelopments} high relevance</span></>}
                  {delta.pulseDelta != null && delta.pulseNow != null && delta.pulseThen != null && (
                    <> · Risk Pulse {delta.pulseThen} → <span className={delta.pulseDelta > 0 ? 'text-red-400 font-semibold' : 'text-emerald-400 font-semibold'}>{delta.pulseNow}</span></>
                  )}
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-geo-gold font-semibold hidden sm:inline">Show me what changed</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-geo-gold/20 space-y-3">
          {(delta.worsened.length > 0 || delta.improved.length > 0) && (
            <div className="flex flex-wrap gap-2 text-xs">
              {delta.worsened.map((w) => (
                <span key={w} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/30">
                  <TrendingUp className="w-3 h-3" /> {w} worsened
                </span>
              ))}
              {delta.improved.map((i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <TrendingDown className="w-3 h-3" /> {i} improved
                </span>
              ))}
            </div>
          )}

          {delta.topEvents.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Largest drivers of change:</p>
              <ul className="space-y-1.5">
                {delta.topEvents.map((event) => (
                  <li key={event.id} className="flex items-center justify-between gap-3 text-xs bg-black/30 rounded-lg px-3 py-2">
                    <span className="text-gray-300 truncate">{event.title}</span>
                    <span className="text-gray-500 flex-shrink-0">{timeAgo(event.occurredAt)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {nothingNew && <p className="text-xs text-gray-400">No new qualifying events and no Risk Pulse movement since your last visit.</p>}

          <button
            onClick={markCaughtUp}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-geo-gold/20 text-geo-gold text-xs font-semibold hover:bg-geo-gold/30 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark as caught up
          </button>
        </div>
      )}
    </div>
  )
}
