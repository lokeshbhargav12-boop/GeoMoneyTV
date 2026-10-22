'use client'

import { ChevronDown, ChevronUp, ExternalLink, Eye, Newspaper, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { formatEventType, timeAgo, type IntelEvent } from './intel-types'

// C1 + C3 — Latest intelligence feed: every event carries its relevance
// score/level, a one-sentence "why relevant" and expandable structured
// implications (supply/demand/price direction, horizon, watch triggers).
export default function MaterialIntelFeed({ events }: { events: IntelEvent[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  if (events.length === 0) {
    return (
      <div className="bg-white/5 rounded-xl border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-3">
          <Newspaper className="w-5 h-5 text-geo-gold" />
          <h2 className="text-xl font-bold">Latest Intelligence</h2>
        </div>
        <p className="text-sm text-gray-400">
          No qualifying events for this material yet. Generic sector news is filtered out — only events with a
          demonstrated material linkage appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-6">
      <div className="flex items-center gap-3 mb-5">
        <Newspaper className="w-5 h-5 text-geo-gold" />
        <h2 className="text-xl font-bold">Latest Intelligence</h2>
        <span className="ml-auto text-[10px] text-gray-500 uppercase tracking-wide">{events.length} relevant event{events.length === 1 ? '' : 's'}</span>
      </div>

      <div className="space-y-3">
        {events.map((event) => {
          const open = openId === event.id
          const band = event.relevanceScore >= 90 ? 'Critical relevance' : event.relevanceScore >= 70 ? 'High relevance' : 'Moderate relevance'
          const bandColor = event.relevanceScore >= 90 ? 'bg-red-500/15 text-red-400 border-red-500/30' : event.relevanceScore >= 70 ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-sky-500/15 text-sky-400 border-sky-500/30'
          return (
            <div key={event.id} className="bg-black/30 rounded-lg border border-white/10 p-4">
              <button onClick={() => setOpenId(open ? null : event.id)} className="w-full text-left">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${bandColor}`}>{band} · {event.relevanceScore}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/10 text-gray-300">{formatEventType(event.eventType)}</span>
                      <span className="text-[10px] text-gray-500">{timeAgo(event.occurredAt)}</span>
                    </div>
                    <p className="text-sm font-semibold text-white leading-snug">{event.title}</p>
                    {event.whyRelevant && (
                      <p className="mt-1.5 text-xs text-gray-400 flex items-start gap-1.5">
                        <Eye className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-geo-gold" />
                        <span><span className="text-gray-500">Why shown:</span> {event.whyRelevant}</span>
                      </p>
                    )}
                  </div>
                  {open ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />}
                </div>
              </button>

              {open && <ImplicationPanel event={event} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ImplicationPanel({ event }: { event: IntelEvent }) {
  const imp = event.implication
  return (
    <div className="mt-4 pt-4 border-t border-white/10 space-y-3 text-xs">
      {event.summary && <p className="text-gray-300 leading-relaxed">{event.summary}</p>}

      <div className="flex items-center gap-4 flex-wrap text-[11px] text-gray-500">
        <span>Severity: <span className="text-gray-300 font-medium capitalize">{event.severity}</span></span>
        <span>Confidence: <span className="text-gray-300 font-medium capitalize">{event.confidence}</span></span>
        <span>Relevance level: <span className="text-gray-300 font-medium">{event.relevanceLevel === 1 ? 'Direct material event' : event.relevanceLevel === 2 ? 'Downstream implication' : 'Sector context'}</span></span>
      </div>

      {imp && (
        <div className="grid sm:grid-cols-3 gap-2">
          <ImplicationChip label="Supply" value={imp.supplyImplication} severity={imp.supplySeverity} />
          <ImplicationChip label="Demand" value={imp.demandImplication} severity={imp.demandSeverity} />
          <ImplicationChip label="Price pressure" value={imp.priceDirection} />
        </div>
      )}

      {imp?.affectedApplications && imp.affectedApplications.length > 0 && (
        <p className="text-gray-400"><span className="text-gray-500">Applications affected:</span> {imp.affectedApplications.join(', ')}</p>
      )}

      {imp?.timeHorizon && imp.timeHorizon !== 'uncertain' && (
        <p className="text-gray-400"><span className="text-gray-500">Time horizon:</span> <span className="capitalize">{imp.timeHorizon.replace(/_/g, ' ')}</span></p>
      )}

      {imp?.watchTriggers && imp.watchTriggers.length > 0 && (
        <div>
          <p className="text-gray-500 mb-1.5">What to watch next:</p>
          <ul className="space-y-1 list-disc list-inside text-gray-300">
            {imp.watchTriggers.map((trigger, idx) => <li key={idx}>{trigger}</li>)}
          </ul>
        </div>
      )}

      {imp?.assessment && (
        <div className="bg-geo-gold/5 border border-geo-gold/20 rounded-lg p-3">
          <p className="flex items-center gap-1.5 text-geo-gold font-semibold mb-1"><ShieldCheck className="w-3.5 h-3.5" /> GeoMoney assessment · {imp.confidence} confidence</p>
          <p className="text-gray-300 leading-relaxed">{imp.assessment}</p>
        </div>
      )}

      {event.sourceUrl && (
        <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-geo-gold hover:text-yellow-400 transition-colors">
          Source{event.sourceName ? `: ${event.sourceName}` : ''} <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  )
}

function ImplicationChip({ label, value, severity }: { label: string; value: string; severity?: string | null }) {
  const color =
    value === 'negative' || value === 'upward' ? 'text-red-400 border-red-500/30 bg-red-500/10'
    : value === 'positive' || value === 'downward' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
    : 'text-gray-400 border-white/10 bg-white/5'
  return (
    <div className={`rounded-lg border px-3 py-2 ${color}`}>
      <p className="text-[10px] uppercase tracking-wide opacity-70">{label}</p>
      <p className="font-semibold capitalize">{value}{severity ? ` (${severity})` : ''}</p>
    </div>
  )
}

