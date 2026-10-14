'use client'

import { AlertTriangle, Bell, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { STATUS_STYLES, signed, type IntelState } from './intel-types'

// C2 — Critical Materials Early-Warning banner for the material detail page.
export default function EarlyWarningBanner({ state }: { state: IntelState }) {
  const [expanded, setExpanded] = useState(false)
  const styles = STATUS_STYLES[state.status]

  return (
    <div className={`rounded-xl border p-4 ${styles.badge.replace('text-', 'border-').split(' ')[2]} bg-white/5`}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${styles.dot} ${state.status !== 'NORMAL' ? 'animate-pulse' : ''}`} />
          <div className="min-w-0">
            <p className="text-sm font-bold text-white">
              Early-Warning: <span className={styles.badge.split(' ')[1]}>{styles.label}</span>
            </p>
            <p className="text-xs text-gray-400 truncate">
              {state.signals7d} qualifying signal{state.signals7d === 1 ? '' : 's'} in 7 days
              {state.drivers.length > 0 ? ` — top driver: ${state.drivers[0].label}` : ' — no adverse signal accumulation'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
            <Delta label="24h" value={state.delta24h} />
            <Delta label="7d" value={state.delta7d} />
            <Delta label="30d" value={state.delta30d} />
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
          <div className="flex sm:hidden items-center gap-3 text-xs text-gray-400">
            <Delta label="24h" value={state.delta24h} />
            <Delta label="7d" value={state.delta7d} />
            <Delta label="30d" value={state.delta30d} />
          </div>
          {state.drivers.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-gray-300 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Drivers behind this status
              </p>
              <ul className="space-y-1.5">
                {state.drivers.map((driver, idx) => (
                  <li key={idx} className="flex items-center justify-between text-xs bg-black/30 rounded-lg px-3 py-2">
                    <span className="text-gray-300 truncate mr-3">{driver.label}</span>
                    <span className={driver.delta >= 0 ? 'text-red-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                      {signed(driver.delta)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5" /> No active drivers. Status de-escalates automatically when signals expire or are disproven.
            </p>
          )}
          <p className="text-[11px] text-gray-500">
            Status since {new Date(state.statusSince).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · Status accumulates signals over rolling windows rather than reacting to single headlines.
          </p>
        </div>
      )}
    </div>
  )
}

function Delta({ label, value }: { label: string; value: number }) {
  const color = value > 0 ? 'text-red-400' : value < 0 ? 'text-emerald-400' : 'text-gray-500'
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-gray-500">{label}</span>
      <span className={`font-semibold ${color}`}>{signed(value)}</span>
    </span>
  )
}
