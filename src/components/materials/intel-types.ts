// Shared types + formatting helpers for the Critical Materials Intelligence
// modules (mirror the API responses from material-events-service).

export type WarningStatus = 'NORMAL' | 'WATCH' | 'ELEVATED' | 'CRITICAL'

export interface IntelState {
  status: WarningStatus
  statusSince: string
  drivers: { label: string; delta: number }[]
  delta24h: number
  delta7d: number
  delta30d: number
  signals24h: number
  signals7d: number
}

export interface IntelPulse {
  score: number
  supplyRisk: number
  policyRisk: number
  demandPressure: number
  marketStress: number
  supplyResponse: number
  asOf: string
  contributions: { label: string; delta: number; component: string; eventId?: string }[]
}

export interface IntelEvent {
  id: string
  title: string
  summary: string | null
  eventType: string
  stage: string | null
  occurredAt: string
  sourceName: string | null
  sourceUrl: string | null
  severity: string
  confidence: string
  relevanceScore: number
  relevanceLevel: number
  relationshipType: string
  whyRelevant: string | null
  implication: {
    whatHappened: string
    supplyImplication: string
    supplySeverity: string | null
    demandImplication: string
    demandSeverity: string | null
    priceDirection: string
    affectedApplications: string[]
    timeHorizon: string
    watchTriggers: string[]
    assessment: string | null
    confidence: string
  } | null
}

export interface IntelCrossMaterial {
  eventId: string
  title: string
  occurredAt: string
  otherMaterials: { name: string; symbol: string; relevanceScore: number; relationshipType: string; whyRelevant: string | null }[]
}

export interface MaterialIntel {
  state: IntelState | null
  pulse: IntelPulse | null
  pulseHistory: { asOf: string; score: number }[]
  events: IntelEvent[]
  crossMaterial: IntelCrossMaterial[]
}

export const STATUS_STYLES: Record<WarningStatus, { badge: string; label: string; dot: string }> = {
  NORMAL: { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', label: 'Normal', dot: 'bg-emerald-400' },
  WATCH: { badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30', label: 'Watch', dot: 'bg-amber-400' },
  ELEVATED: { badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30', label: 'Elevated', dot: 'bg-orange-400' },
  CRITICAL: { badge: 'bg-red-500/15 text-red-400 border-red-500/30', label: 'Critical', dot: 'bg-red-400' },
}

export function pulseColor(score: number): string {
  if (score >= 75) return 'text-red-400'
  if (score >= 55) return 'text-orange-400'
  if (score >= 40) return 'text-amber-400'
  return 'text-emerald-400'
}

export function formatEventType(eventType: string): string {
  return eventType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diffMs / 3_600_000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function signed(value: number): string {
  return value > 0 ? `+${value}` : `${value}`
}
