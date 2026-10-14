'use client'

import Link from 'next/link'
import { Radar } from 'lucide-react'
import { pulseColor, signed, STATUS_STYLES, type WarningStatus } from './intel-types'

export interface BoardEntry {
  name: string
  symbol: string
  category: string
  status: WarningStatus
  score: number | null
  delta7d: number
  signals7d: number
}

// C2 + C4 overview — early-warning status board across all materials.
// Materials with an active (non-normal) status surface first so users see
// changing risk states before they have to connect signals manually.
export default function MaterialsStatusBoard({ board }: { board: BoardEntry[] }) {
  if (board.length === 0) return null

  const attention = board.filter((b) => b.status !== 'NORMAL' || (b.signals7d ?? 0) > 0)
  const display = (attention.length > 0 ? attention : board).slice(0, 10)

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <Radar className="w-5 h-5 text-geo-gold" />
        <h2 className="text-lg font-bold">Early-Warning Board</h2>
        <span className="ml-auto text-[10px] text-gray-500 uppercase tracking-wide">
          {attention.length > 0 ? `${attention.length} material${attention.length === 1 ? '' : 's'} need attention` : 'all materials normal'}
        </span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
        {display.map((entry) => {
          const styles = STATUS_STYLES[entry.status]
          return (
            <Link
              key={entry.symbol}
              href={`/materials/${encodeURIComponent(entry.symbol)}`}
              className="bg-black/30 rounded-lg border border-white/10 p-3 hover:border-geo-gold/40 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-geo-gold font-bold text-sm">{entry.symbol}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${styles.badge}`}>{styles.label}</span>
              </div>
              <p className="mt-1 text-xs text-gray-400 truncate">{entry.name}</p>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                {entry.score != null ? (
                  <span className={`font-bold ${pulseColor(entry.score)}`}>Pulse {entry.score}</span>
                ) : (
                  <span className="text-gray-600">Pulse —</span>
                )}
                <span className={entry.delta7d > 0 ? 'text-red-400' : entry.delta7d < 0 ? 'text-emerald-400' : 'text-gray-500'}>
                  7d {signed(entry.delta7d)}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
