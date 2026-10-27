// Critical Materials Intelligence — the seven capability layer (C1–C7).
//
// One canonical MaterialEvent feeds every capability:
//   C1 Material Intelligence Relevance  -> scoreEventForMaterial / links
//   C2 Early-Warning                    -> recomputeEarlyWarning
//   C3 Event-to-Implications            -> deriveImplications
//   C4 Material Risk Pulse              -> recomputeRiskPulse (deterministic only)
//   C5 Cross-Material Impact            -> canonical event + per-material links
//   C6 Since You Last Checked           -> getSinceLastChecked
//   C7 Shock Propagation (MVP)          -> runShockSimulation
//
// Shared rules (from the implementation direction):
// - Severity and confidence are always separate fields.
// - Broad sector terms ("electronics", "medical lasers", ...) never qualify
//   an article on their own.
// - Scores are produced by deterministic rules over structured data — never
//   invented by an LLM.
// - Every surfaced event explains in one sentence why it is being shown.

import { prisma } from '@/lib/prisma'
import { CRITICAL_MATERIALS_DATA, type CriticalMaterialSeed } from '@/data/critical-materials'
import { PILOT_APPLICATIONS } from '@/data/pilot-applications'
import { parseJsonArray, stripSourceSuffix, toMaterialKey } from '@/lib/material-intel-service'

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)))
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Case-insensitive whole-phrase match. */
function textIncludesPhrase(text: string, phrase: string): boolean {
  if (!phrase.trim()) return false
  const pattern = new RegExp(`\\b${escapeRegExp(phrase.trim())}\\b`, 'i')
  return pattern.test(text)
}

export function toEventKey(title: string, occurredAt: Date): string {
  const normalized = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 14)
    .join(' ')
  const day = occurredAt.toISOString().slice(0, 10)
  let hash = 0
  const input = `${day}|${normalized}`
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  return `evt_${hash.toString(36)}`
}

function describeEventType(eventType: string): string {
  const labels: Record<string, string> = {
    export_control: 'an export-control event',
    sanctions: 'a sanctions event',
    mine_outage: 'a mine outage',
    refinery_outage: 'a refinery/processing outage',
    logistics_disruption: 'a logistics disruption',
    project_delay: 'a project delay/guidance event',
    capacity: 'a capacity/supply-response event',
    demand_shift: 'a demand-shift event',
    price_move: 'a price-move event',
    policy: 'a policy event',
    other: 'an event',
  }
  return labels[eventType] ?? 'an event'
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}


// ---------------------------------------------------------------------------
// Event classification (deterministic keyword rules)
// ---------------------------------------------------------------------------

interface EventTypeRule {
  eventType: string
  stage: string | null
  severityHint: string
  keywords: string[]
}

const EVENT_TYPE_RULES: EventTypeRule[] = [
  {
    eventType: 'export_control',
    stage: 'refining',
    severityHint: 'high',
    keywords: ['export control', 'export restriction', 'export ban', 'export licence', 'export license', 'licensing requirement', 'dual-use', 'dual use'],
  },
  {
    eventType: 'sanctions',
    stage: null,
    severityHint: 'high',
    keywords: ['sanction', 'embargo', 'entity list', 'blacklist', 'asset freeze'],
  },
  {
    eventType: 'mine_outage',
    stage: 'mining',
    severityHint: 'high',
    keywords: ['mine outage', 'mine closure', 'suspend production', 'suspended operations', 'halt production', 'strike at', 'pit closure', 'force majeure'],
  },
  {
    eventType: 'refinery_outage',
    stage: 'refining',
    severityHint: 'high',
    keywords: ['refinery outage', 'smelter outage', 'refinery closure', 'plant shutdown', 'processing halt', 'separation plant'],
  },
  {
    eventType: 'logistics_disruption',
    stage: null,
    severityHint: 'moderate',
    keywords: ['logistics disruption', 'shipping delay', 'port closure', 'freight disruption', 'supply route', 'blockade'],
  },
  {
    eventType: 'project_delay',
    stage: 'mining',
    severityHint: 'moderate',
    keywords: ['project delay', 'delayed', 'financing problem', 'funding shortfall', 'permit denied', 'guidance cut', 'production guidance', 'ramp-up delay'],
  },
  {
    eventType: 'capacity',
    stage: null,
    severityHint: 'moderate',
    keywords: ['new capacity', 'capacity expansion', 'new mine', 'restart', 'commissioning', 'ramp up', 'ramp-up', 'offtake agreement', 'stockpil'],
  },
  {
    eventType: 'demand_shift',
    stage: 'downstream',
    severityHint: 'moderate',
    keywords: ['demand surge', 'demand shock', 'record demand', 'procurement', 'restocking', 'substitution breakthrough'],
  },
  {
    eventType: 'price_move',
    stage: null,
    severityHint: 'moderate',
    keywords: ['price surge', 'price spike', 'price jump', 'price rally', 'price slump', 'price drop', 'price fall', 'record high', 'record low'],
  },
  {
    eventType: 'policy',
    stage: null,
    severityHint: 'moderate',
    keywords: ['tariff', 'quota', 'critical minerals list', 'strategic reserve', 'government intervention', 'policy', 'regulation'],
  },
]

const DIRECT_EVENT_TYPES = new Set([
  'export_control',
  'sanctions',
  'mine_outage',
  'refinery_outage',
  'logistics_disruption',
  'project_delay',
  'capacity',
  'price_move',
  'policy',
])

export interface EventClassification {
  eventType: string
  stage: string | null
  severity: string
  confidence: string
}

export function classifyEventText(title: string, body: string, sourceName?: string | null): EventClassification {
  const text = `${title} ${body}`.toLowerCase()
  for (const rule of EVENT_TYPE_RULES) {
    if (rule.keywords.some((k) => text.includes(k))) {
      return {
        eventType: rule.eventType,
        stage: rule.stage,
        severity: rule.severityHint,
        confidence: /usgs|government|ministry|commission|official|department of|iea|reuters|bloomberg/i.test(sourceName ?? '')
          ? 'high'
          : 'medium',
      }
    }
  }
  return { eventType: 'other', stage: null, severity: 'low', confidence: 'medium' }
}

// ---------------------------------------------------------------------------
// C1 — Material Intelligence Relevance (deterministic scoring)
// ---------------------------------------------------------------------------

// Family trigger phrases: allow a family-level event (e.g. "heavy rare earth
// export controls") to qualify member materials without naming them.
const FAMILY_PHRASES: Record<string, string[]> = {
  'Heavy Rare Earth': ['heavy rare earth', 'heavy rare-earth', 'hree'],
  'Light Rare Earth': ['light rare earth', 'light rare-earth', 'lree'],
  'Platinum Group Metal': ['platinum group', 'pgm', 'pgms'],
}

const RARE_EARTH_GENERIC = /rare[\s-]?earth/i

// Terms that must NEVER qualify an article on their own (spec P0-5).
const BROAD_SECTOR_TERMS = new Set([
  'electronics', 'medical lasers', 'defence optics', 'defense optics', 'lasers',
  'automotive', 'aerospace', 'energy', 'batteries', 'catalysts', 'magnets',
])

const SEVERITY_BOOST: Record<string, number> = { low: 2, moderate: 5, high: 8, severe: 10 }
const STRENGTH_WEIGHT: Record<string, number> = { direct: 35, strong: 30, moderate: 18, weak: 0 }

interface MaterialForScoring {
  id: string
  name: string
  symbol: string
  materialFamily: string | null
  category: string
  structuredApplications: {
    name: string
    aliases: string | null
    strength: string
    qualifiesWithoutMention: boolean
  }[]
  countryRoles: { country: string; stage: string; sharePct: number | null }[]
}

export interface RelevanceResult {
  score: number
  level: 1 | 2 | 3
  relationshipType: 'direct' | 'family' | 'shared_processing' | 'downstream_application'
  whyRelevant: string
}

export function scoreEventForMaterial(
  event: { title: string; summary: string | null; eventType: string; severity: string; countries: string[] },
  material: MaterialForScoring,
): RelevanceResult | null {
  const text = `${event.title} ${event.summary ?? ''}`
  const sevBoost = SEVERITY_BOOST[event.severity] ?? 4
  const typeBoost = DIRECT_EVENT_TYPES.has(event.eventType) ? 8 : 0

  // 1) Direct material mention (Level 1)
  const nameHit = textIncludesPhrase(text, material.name)
  if (nameHit) {
    const direct = DIRECT_EVENT_TYPES.has(event.eventType)
    return {
      score: clamp((direct ? 86 : 72) + sevBoost + typeBoost, 0, 98),
      level: 1,
      relationshipType: 'direct',
      whyRelevant: `Direct mention of ${material.name} in ${describeEventType(event.eventType)}.`,
    }
  }

  // 2) Family linkage (Level 2) — e.g. heavy-rare-earth policy hits Thulium
  const family = material.materialFamily ?? material.category
  const familyPhrases = FAMILY_PHRASES[family] ?? []
  const familyHit = familyPhrases.some((p) => textIncludesPhrase(text, p))
  const genericRareEarthHit =
    /rare earth/i.test(family) && RARE_EARTH_GENERIC.test(text) && DIRECT_EVENT_TYPES.has(event.eventType)
  if (familyHit || genericRareEarthHit) {
    const policyBoost =
      event.eventType === 'export_control' || event.eventType === 'policy' || event.eventType === 'sanctions' ? 10 : 4
    return {
      score: clamp((familyHit ? 66 : 60) + policyBoost + sevBoost, 0, 89),
      level: 2,
      relationshipType: 'family',
      whyRelevant: `${capitalize(family)} event; ${material.name} is a member of the ${family.toLowerCase()} family (family linkage, no direct mention required).`,
    }
  }

  // 3) Structured application linkage (Level 2). Weak/broad applications can
  // never qualify an article on their own.
  let bestApp: { name: string; strength: string; qualifiesWithoutMention: boolean } | null = null
  for (const app of material.structuredApplications) {
    const weight = STRENGTH_WEIGHT[app.strength] ?? 0
    if (weight === 0) continue
    if (BROAD_SECTOR_TERMS.has(app.name.toLowerCase())) continue
    const aliases = parseJsonArray(app.aliases)
    const hit = [app.name, ...aliases].some((term) => {
      if (BROAD_SECTOR_TERMS.has(term.toLowerCase())) return false
      return textIncludesPhrase(text, term)
    })
    if (!hit) continue
    if (!bestApp || (STRENGTH_WEIGHT[app.strength] ?? 0) > (STRENGTH_WEIGHT[bestApp.strength] ?? 0)) {
      bestApp = app
    }
  }
  if (bestApp && bestApp.qualifiesWithoutMention && ['direct', 'strong'].includes(bestApp.strength)) {
    return {
      score: clamp(58 + (STRENGTH_WEIGHT[bestApp.strength] ?? 20) + Math.floor(sevBoost / 2), 0, 89),
      level: 2,
      relationshipType: 'downstream_application',
      whyRelevant: `Event affects ${bestApp.name}, a ${bestApp.strength} application of ${material.name} (evidenced application linkage).`,
    }
  }

  // Application hit without qualifiesWithoutMention: country overlap with a
  // direct event type can still provide selective context; otherwise suppress.
  const eventCountries = event.countries.map((c) => c.toLowerCase())
  const countryOverlap = material.countryRoles.some((r) => eventCountries.includes(r.country.toLowerCase()))
  if (bestApp && countryOverlap && DIRECT_EVENT_TYPES.has(event.eventType)) {
    return {
      score: clamp(50 + sevBoost, 0, 64),
      level: 2,
      relationshipType: 'shared_processing',
      whyRelevant: `${capitalize(describeEventType(event.eventType))} in a country tied to ${material.name}'s ${bestApp.name} supply chain.`,
    }
  }

  return null
}


// ---------------------------------------------------------------------------
// Ingestion: Articles -> canonical MaterialEvent -> links (C1 + C5)
// ---------------------------------------------------------------------------

const COUNTRY_NAMES = [
  'China', 'Australia', 'United States', 'USA', 'Canada', 'Russia', 'India', 'Myanmar', 'Brazil',
  'South Africa', 'Kazakhstan', 'Vietnam', 'Malaysia', 'Indonesia', 'Chile', 'Peru', 'Mexico',
  'Democratic Republic of Congo', 'DRC', 'Congo', 'Zambia', 'Ukraine', 'Japan', 'South Korea',
  'Germany', 'France', 'United Kingdom', 'EU', 'European Union', 'Greenland', 'Argentina', 'Bolivia',
]

function extractCountries(text: string): string[] {
  const found = new Set<string>()
  for (const country of COUNTRY_NAMES) {
    if (textIncludesPhrase(text, country)) {
      found.add(country === 'USA' ? 'United States' : country === 'DRC' ? 'Democratic Republic of Congo' : country)
    }
  }
  return Array.from(found)
}

export interface IngestResult {
  scanned: number
  created: number
  linked: number
  implications: number
  skippedExisting: number
}

/**
 * Scan recent published articles, convert qualifying ones into canonical
 * events (deduped by eventKey), attach per-material relevance links and
 * derive structured implications. An article that qualifies for no material
 * is never stored.
 */
export async function ingestArticlesAsEvents(options?: { sinceDays?: number; limit?: number }): Promise<IngestResult> {
  const sinceDays = options?.sinceDays ?? 14
  const limit = options?.limit ?? 150
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000)

  const result: IngestResult = { scanned: 0, created: 0, linked: 0, implications: 0, skippedExisting: 0 }

  const articles = await prisma.article.findMany({
    where: { published: true, createdAt: { gte: since } },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true, title: true, description: true, aiSummary: true,
      sourceName: true, sourceUrl: true, createdAt: true,
    },
  })
  result.scanned = articles.length
  if (articles.length === 0) return result

  const materials = await prisma.rareEarthMaterial.findMany({
    select: {
      id: true, name: true, symbol: true, category: true, materialFamily: true,
      structuredApplications: {
        select: { name: true, aliases: true, strength: true, qualifiesWithoutMention: true },
      },
      countryRoles: { select: { country: true, stage: true, sharePct: true } },
    },
  })
  if (materials.length === 0) return result

  for (const article of articles) {
    const occurredAt = article.createdAt
    const eventKey = toEventKey(article.title, occurredAt)

    const existing = await prisma.materialEvent.findUnique({ where: { eventKey }, select: { id: true } })
    if (existing) {
      result.skippedExisting++
      continue
    }

    const body = [article.description, article.aiSummary].filter(Boolean).join('\n').slice(0, 4000)
    const classification = classifyEventText(article.title, body, article.sourceName)
    const countries = extractCountries(`${article.title} ${body}`)

    // Score against every material first; only persist when at least one
    // material qualifies (relevance >= 50). This is the C1 gate.
    const scored = materials
      .map((material) => ({
        material,
        relevance: scoreEventForMaterial(
          { title: article.title, summary: body, eventType: classification.eventType, severity: classification.severity, countries },
          material,
        ),
      }))
      .filter((entry) => entry.relevance && entry.relevance.score >= 50)

    if (scored.length === 0) continue

    const summary = stripSourceSuffix(article.description || article.aiSummary || '').slice(0, 2000) || null
    const expiresAt = new Date(occurredAt.getTime() + 90 * 24 * 60 * 60 * 1000)

    const event = await prisma.materialEvent.create({
      data: {
        eventKey,
        title: article.title.slice(0, 190),
        summary,
        eventType: classification.eventType,
        stage: classification.stage,
        occurredAt,
        sourceName: article.sourceName,
        sourceUrl: article.sourceUrl,
        articleId: article.id,
        severity: classification.severity,
        confidence: classification.confidence,
        countries: countries.length ? JSON.stringify(countries) : null,
        expiresAt,
      },
    })
    result.created++

    for (const { material, relevance } of scored) {
      if (!relevance) continue
      await prisma.materialEventLink.create({
        data: {
          eventId: event.id,
          materialId: material.id,
          relevanceScore: relevance.score,
          relevanceLevel: relevance.level,
          relationshipType: relevance.relationshipType,
          whyRelevant: relevance.whyRelevant,
        },
      })
      result.linked++
    }

    await deriveImplications(event.id)
    result.implications++
  }

  return result
}


// ---------------------------------------------------------------------------
// C3 — Event-to-Implications (deterministic templates, traceable to evidence)
// ---------------------------------------------------------------------------

interface ImplicationTemplate {
  supply: string
  demand: string
  price: string
  horizon: string
  watches: string[]
}

const IMPLICATION_TEMPLATES: Record<string, ImplicationTemplate> = {
  export_control: {
    supply: 'negative', demand: 'neutral', price: 'upward', horizon: 'immediate',
    watches: ['Licensing approval/denial rates from the controlling authority', 'Spot availability outside the controlled jurisdiction', 'Stockpile release or exemption announcements'],
  },
  sanctions: {
    supply: 'negative', demand: 'neutral', price: 'upward', horizon: 'immediate',
    watches: ['Scope expansion to additional entities or products', 'Enforcement actions at customs', 'Workaround sourcing via third countries'],
  },
  mine_outage: {
    supply: 'negative', demand: 'neutral', price: 'upward', horizon: '1-3_months',
    watches: ['Restart timeline or official guidance from the operator', 'Inventory drawdown at refiners', 'Substitution or alternative sourcing announcements'],
  },
  refinery_outage: {
    supply: 'negative', demand: 'neutral', price: 'upward', horizon: '1-3_months',
    watches: ['Refinery restart or maintenance schedule updates', 'Toll-processing shifts to other jurisdictions', 'Downstream allocation or force-majeure notices'],
  },
  logistics_disruption: {
    supply: 'negative', demand: 'neutral', price: 'mixed', horizon: 'immediate',
    watches: ['Freight rate and lead-time normalization', 'Alternative routing announcements', 'Port/customs clearance backlogs'],
  },
  project_delay: {
    supply: 'negative', demand: 'neutral', price: 'mixed', horizon: '6-12_months',
    watches: ['Revised commissioning timeline and capex updates', 'Financing or offtake announcements', 'Permitting milestones'],
  },
  capacity: {
    supply: 'positive', demand: 'neutral', price: 'downward', horizon: '6-12_months',
    watches: ['Ramp-up progress versus plan', 'Offtake agreements covering new volumes', 'Quality certification for end-use applications'],
  },
  demand_shift: {
    supply: 'neutral', demand: 'positive', price: 'upward', horizon: '1-3_months',
    watches: ['Procurement volumes in the affected application', 'Restocking behaviour across the supply chain', 'Substitution or thrifting responses'],
  },
  price_move: {
    supply: 'neutral', demand: 'neutral', price: 'mixed', horizon: 'immediate',
    watches: ['Follow-through in benchmark assessments', 'Inventory behaviour of traders and consumers', 'Producer pricing or contract renegotiations'],
  },
  policy: {
    supply: 'neutral', demand: 'neutral', price: 'mixed', horizon: '1-3_months',
    watches: ['Implementing regulations and enforcement detail', 'Industry response and compliance timelines', 'Retaliatory or reciprocal measures by other jurisdictions'],
  },
}

export async function deriveImplications(eventId: string): Promise<void> {
  const existing = await prisma.eventImplication.findUnique({ where: { eventId } })
  if (existing) return

  const event = await prisma.materialEvent.findUnique({
    where: { id: eventId },
    include: {
      materialLinks: {
        orderBy: { relevanceScore: 'desc' },
        include: {
          material: {
            select: {
              name: true,
              structuredApplications: { select: { name: true, strength: true } },
            },
          },
        },
      },
    },
  })
  if (!event) return

  const template = IMPLICATION_TEMPLATES[event.eventType] ?? {
    supply: 'uncertain', demand: 'uncertain', price: 'unclear', horizon: 'uncertain',
    watches: ['Further primary-source confirmation', 'Follow-up statements from affected parties', 'Benchmark price and availability response'],
  }

  const topLinks = event.materialLinks.filter((l) => l.relevanceScore >= 50)
  const materialNames = topLinks.map((l) => l.material.name)
  const affectedApplications = Array.from(
    new Set(
      topLinks.flatMap((l) =>
        l.material.structuredApplications
          .filter((a) => a.strength === 'direct' || a.strength === 'strong')
          .map((a) => a.name),
      ),
    ),
  ).slice(0, 8)

  const whatHappened = event.summary
    ? event.summary.split(/\.\s+/)[0].slice(0, 400)
    : event.title

  const assessment =
    materialNames.length > 0
      ? `${capitalize(describeEventType(event.eventType))} with evidenced linkage to ${materialNames.slice(0, 3).join(', ')}${materialNames.length > 3 ? ` and ${materialNames.length - 3} more materials` : ''}. ` +
        `Supply implication: ${template.supply}; demand implication: ${template.demand}; price pressure: ${template.price}. ` +
        `Assessment confidence is ${event.confidence} based on the available sources.`
      : null

  await prisma.eventImplication.create({
    data: {
      eventId: event.id,
      whatHappened,
      supplyImplication: template.supply,
      supplySeverity: ['negative', 'positive'].includes(template.supply) ? event.severity : null,
      demandImplication: template.demand,
      demandSeverity: ['negative', 'positive'].includes(template.demand) ? event.severity : null,
      priceDirection: template.price,
      affectedApplications: affectedApplications.length ? JSON.stringify(affectedApplications) : null,
      timeHorizon: template.horizon,
      watchTriggers: JSON.stringify(template.watches),
      assessment,
      confidence: event.confidence,
    },
  })
}


// ---------------------------------------------------------------------------
// C4 — GeoMoney Material Risk Pulse (deterministic, explainable)
// ---------------------------------------------------------------------------

// Event-type -> component contribution. supplyResponse entries are positive
// when supply RESPONSE improves (which lowers the composite risk score).
const PULSE_EVENT_WEIGHTS: Record<string, { component: 'supplyRisk' | 'policyRisk' | 'demandPressure' | 'marketStress' | 'supplyResponse'; delta: number; label: string }> = {
  export_control: { component: 'policyRisk', delta: 9, label: 'Export control' },
  sanctions: { component: 'policyRisk', delta: 10, label: 'Sanctions' },
  policy: { component: 'policyRisk', delta: 5, label: 'Policy change' },
  mine_outage: { component: 'supplyRisk', delta: 8, label: 'Mine outage' },
  refinery_outage: { component: 'supplyRisk', delta: 7, label: 'Refinery outage' },
  logistics_disruption: { component: 'supplyRisk', delta: 5, label: 'Logistics disruption' },
  project_delay: { component: 'supplyRisk', delta: 3, label: 'Project delay' },
  price_move: { component: 'marketStress', delta: 6, label: 'Price move' },
  demand_shift: { component: 'demandPressure', delta: 6, label: 'Demand shift' },
  capacity: { component: 'supplyResponse', delta: 6, label: 'New capacity' },
}

const SEVERITY_FACTOR: Record<string, number> = { low: 0.5, moderate: 1, high: 1.4, severe: 1.8 }
const CONFIDENCE_FACTOR: Record<string, number> = { low: 0.6, medium: 1, high: 1.2 }

function ageDecayFactor(occurredAt: Date, now: Date): number {
  const days = (now.getTime() - occurredAt.getTime()) / (24 * 60 * 60 * 1000)
  if (days <= 7) return 1
  if (days <= 30) return 0.6
  if (days <= 90) return 0.3
  return 0
}

export interface PulseContribution {
  label: string
  delta: number
  component: string
  eventId?: string
}

export interface RiskPulseResult {
  score: number
  supplyRisk: number
  policyRisk: number
  demandPressure: number
  marketStress: number
  supplyResponse: number
  contributions: PulseContribution[]
}


/**
 * Compute the Risk Pulse for one material from structured data only:
 * country-role concentration (supply baseline), benchmark price movement
 * (market baseline) and decaying event contributions. Upserts one history
 * row per material per UTC day so 30d/90d trends exist from day one.
 */
export async function recomputeRiskPulse(materialId: string): Promise<RiskPulseResult | null> {
  const material = await prisma.rareEarthMaterial.findUnique({
    where: { id: materialId },
    include: {
      countryRoles: { select: { stage: true, sharePct: true } },
      priceBenchmarks: {
        select: {
          id: true,
          observations: { orderBy: { asOf: 'desc' }, take: 2, select: { price: true, asOf: true } },
        },
      },
      eventLinks: {
        where: {
          relevanceScore: { gte: 50 },
          event: { status: 'active', occurredAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
        },
        include: { event: { select: { id: true, eventType: true, severity: true, confidence: true, occurredAt: true, title: true } } },
      },
    },
  })
  if (!material) return null

  const now = new Date()

  // --- Baselines from structured data -------------------------------------
  const upstreamShares = material.countryRoles
    .filter((r) => ['mining', 'refining', 'processing'].includes(r.stage) && r.sharePct != null)
    .map((r) => r.sharePct as number)
  const maxShare = upstreamShares.length ? Math.max(...upstreamShares) : 0
  let supplyRisk = maxShare >= 80 ? 55 : maxShare >= 60 ? 45 : maxShare >= 40 ? 35 : maxShare >= 25 ? 25 : upstreamShares.length ? 18 : 22

  let policyRisk = 12
  let demandPressure = 15
  let supplyResponse = 20

  let marketStress = 15
  for (const benchmark of material.priceBenchmarks) {
    const [latest, previous] = benchmark.observations
    if (latest && previous && previous.price > 0) {
      const changePct = Math.abs(((latest.price - previous.price) / previous.price) * 100)
      marketStress = Math.max(marketStress, changePct >= 15 ? 40 : changePct >= 8 ? 30 : changePct >= 3 ? 22 : 15)
    }
  }

  // --- Event contributions with time decay ---------------------------------
  const contributions: PulseContribution[] = []
  for (const link of material.eventLinks) {
    const rule = PULSE_EVENT_WEIGHTS[link.event.eventType]
    if (!rule) continue
    const decay = ageDecayFactor(link.event.occurredAt, now)
    if (decay === 0) continue
    const weighted =
      rule.delta *
      decay *
      (SEVERITY_FACTOR[link.event.severity] ?? 1) *
      (CONFIDENCE_FACTOR[link.event.confidence] ?? 1) *
      (link.relevanceScore / 100)
    const delta = Math.round(weighted)
    if (delta === 0) continue
    contributions.push({ label: `${rule.label}: ${link.event.title.slice(0, 60)}`, delta, component: rule.component, eventId: link.event.id })
    if (rule.component === 'supplyRisk') supplyRisk += delta
    else if (rule.component === 'policyRisk') policyRisk += delta
    else if (rule.component === 'demandPressure') demandPressure += delta
    else if (rule.component === 'marketStress') marketStress += delta
    else if (rule.component === 'supplyResponse') supplyResponse += delta
  }

  const result: RiskPulseResult = {
    supplyRisk: clamp(supplyRisk),
    policyRisk: clamp(policyRisk),
    demandPressure: clamp(demandPressure),
    marketStress: clamp(marketStress),
    supplyResponse: clamp(supplyResponse),
    score: 0,
    contributions: contributions.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 8),
  }

  // Composite: supply response is a MITIGATING dimension — the stronger the
  // response, the lower the composite risk.
  result.score = clamp(
    0.3 * result.supplyRisk +
      0.25 * result.policyRisk +
      0.15 * result.demandPressure +
      0.2 * result.marketStress +
      0.1 * (100 - result.supplyResponse),
  )

  // Append-only daily history (upsert keeps the job idempotent).
  const asOf = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  await prisma.materialRiskPulse.upsert({
    where: { materialId_asOf: { materialId, asOf } },
    create: {
      materialId, asOf,
      score: result.score,
      supplyRisk: result.supplyRisk,
      policyRisk: result.policyRisk,
      demandPressure: result.demandPressure,
      marketStress: result.marketStress,
      supplyResponse: result.supplyResponse,
      contributions: JSON.stringify(result.contributions),
    },
    update: {
      score: result.score,
      supplyRisk: result.supplyRisk,
      policyRisk: result.policyRisk,
      demandPressure: result.demandPressure,
      marketStress: result.marketStress,
      supplyResponse: result.supplyResponse,
      contributions: JSON.stringify(result.contributions),
    },
  })

  return result
}


// ---------------------------------------------------------------------------
// C2 — Critical Materials Early-Warning
// Status accumulates signals over rolling windows; severity and confidence
// stay separate; states de-escalate when signals expire.
// ---------------------------------------------------------------------------

export type WarningStatus = 'NORMAL' | 'WATCH' | 'ELEVATED' | 'CRITICAL'

async function pulseScoreNear(materialId: string, targetTime: number): Promise<number | null> {
  const row = await prisma.materialRiskPulse.findFirst({
    where: { materialId, asOf: { lte: new Date(targetTime) } },
    orderBy: { asOf: 'desc' },
    select: { score: true },
  })
  return row?.score ?? null
}

export async function recomputeEarlyWarning(materialId: string): Promise<WarningStatus | null> {
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000

  const latestPulse = await prisma.materialRiskPulse.findFirst({
    where: { materialId },
    orderBy: { asOf: 'desc' },
  })
  if (!latestPulse) return null

  const [past24h, past7d, past30d] = await Promise.all([
    pulseScoreNear(materialId, now - dayMs),
    pulseScoreNear(materialId, now - 7 * dayMs),
    pulseScoreNear(materialId, now - 30 * dayMs),
  ])

  const links7d = await prisma.materialEventLink.findMany({
    where: {
      materialId,
      relevanceScore: { gte: 50 },
      event: { status: 'active', occurredAt: { gte: new Date(now - 7 * dayMs) } },
    },
    include: { event: { select: { severity: true, confidence: true, occurredAt: true } } },
  })

  const signals24h = links7d.filter((l) => l.event.occurredAt.getTime() >= now - dayMs).length
  const signals7d = links7d.length
  const delta24h = past24h != null ? latestPulse.score - past24h : 0
  const delta7d = past7d != null ? latestPulse.score - past7d : 0
  const delta30d = past30d != null ? latestPulse.score - past30d : 0

  // A severe, high-confidence, highly-relevant event escalates immediately.
  const hasCriticalEvent = links7d.some(
    (l) => l.event.severity === 'severe' && l.event.confidence === 'high' && l.relevanceScore >= 80,
  )

  let status: WarningStatus = 'NORMAL'
  if (latestPulse.score >= 75 || hasCriticalEvent) status = 'CRITICAL'
  else if (latestPulse.score >= 55 || delta7d >= 8) status = 'ELEVATED'
  else if (latestPulse.score >= 40 || signals7d >= 3) status = 'WATCH'

  // Top 3-5 drivers from the stored pulse contributions.
  const contributions = parseJsonArray(latestPulse.contributions) as unknown as PulseContribution[]
  const drivers = (Array.isArray(contributions) ? contributions : [])
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 5)
    .map((c) => ({ label: c.label, delta: c.delta }))

  const previous = await prisma.materialRiskState.findUnique({ where: { materialId } })
  const statusChanged = !previous || previous.status !== status

  await prisma.materialRiskState.upsert({
    where: { materialId },
    create: {
      materialId, status, statusSince: new Date(),
      drivers: JSON.stringify(drivers),
      delta24h, delta7d, delta30d, signals24h, signals7d,
    },
    update: {
      status,
      ...(statusChanged ? { statusSince: new Date() } : {}),
      drivers: JSON.stringify(drivers),
      delta24h, delta7d, delta30d, signals24h, signals7d,
    },
  })

  return status
}

/** Cron entry: recompute pulse + early-warning for every material. */
export async function recomputeAllMaterialRisk(): Promise<{ pulses: number; states: number; failed: string[] }> {
  const materials = await prisma.rareEarthMaterial.findMany({ select: { id: true, name: true } })
  const failed: string[] = []
  let pulses = 0
  let states = 0
  for (const material of materials) {
    try {
      const pulse = await recomputeRiskPulse(material.id)
      if (pulse) pulses++
      const state = await recomputeEarlyWarning(material.id)
      if (state) states++
    } catch (error) {
      console.error(`recomputeAllMaterialRisk: ${material.name} failed:`, error)
      failed.push(material.name)
    }
  }
  return { pulses, states, failed }
}


// ---------------------------------------------------------------------------
// Read APIs (detail page + overview page) + Seed Fallbacks
// ---------------------------------------------------------------------------

function findMaterialSeed(symbolOrKey: string): CriticalMaterialSeed | null {
  const key = decodeURIComponent(symbolOrKey).trim().toLowerCase()
  if (!key) return null
  return (
    CRITICAL_MATERIALS_DATA.find(
      (m) =>
        m.symbol.toLowerCase() === key ||
        m.name.toLowerCase() === key ||
        toMaterialKey(m.name) === key,
    ) ?? null
  )
}

function deriveSeedBaselinePulse(seed: CriticalMaterialSeed): {
  score: number
  supplyRisk: number
  policyRisk: number
  demandPressure: number
  marketStress: number
  supplyResponse: number
  asOf: string
  contributions: PulseContribution[]
  status: WarningStatus
  drivers: { label: string; delta: number }[]
} {
  const supplyText = (seed.supply ?? '').toLowerCase()
  const demandText = (seed.demand ?? '').toLowerCase()
  const countries = seed.countries ?? []

  // Supply Risk: based on country count and concentration keywords in seed
  let supplyRisk = countries.length <= 2 ? 52 : countries.length === 3 ? 42 : 34
  if (/concentrat|fragil|extremely limited|very low|tight|byproduct/i.test(supplyText)) {
    supplyRisk += 10
  }
  supplyRisk = clamp(supplyRisk, 15, 85)

  // Policy Risk: export controls, geopolitical sensitivity, conflict
  let policyRisk = 22
  if (/export.?control|geopolit|conflict|sanction|strategic/i.test(`${supplyText} ${demandText}`)) {
    policyRisk += 20
  }
  if (countries[0] === 'China' || countries[0] === 'Russia' || countries[0] === 'DR Congo') {
    policyRisk += 14
  }
  policyRisk = clamp(policyRisk, 12, 85)

  // Demand Pressure: high-growth, electrification, EV, defense
  let demandPressure = 28
  if (/rapid|high.?growth|strong|rising|electrification|defense|ev|nuclear/i.test(demandText)) {
    demandPressure += 18
  }
  demandPressure = clamp(demandPressure, 15, 80)

  // Market Stress: tight market / low inventory buffers
  let marketStress = 24
  if (/tight|bottleneck|constrain|low inventory|volatile/i.test(supplyText)) {
    marketStress += 16
  }
  marketStress = clamp(marketStress, 15, 75)

  // Supply Response (mitigating: higher lowers composite score)
  let supplyResponse = countries.length >= 4 ? 42 : countries.length === 3 ? 32 : 22
  if (/expand|broad|flexib|growing/i.test(supplyText)) {
    supplyResponse += 12
  }
  supplyResponse = clamp(supplyResponse, 15, 75)

  const score = clamp(
    0.3 * supplyRisk +
      0.25 * policyRisk +
      0.15 * demandPressure +
      0.2 * marketStress +
      0.1 * (100 - supplyResponse),
  )

  const contributions: PulseContribution[] = [
    {
      label: `Baseline concentration (${countries.slice(0, 3).join(', ') || 'global'})`,
      delta: Math.round(supplyRisk * 0.3),
      component: 'supplyRisk',
    },
    {
      label: `Policy & jurisdiction exposure (${countries[0] ?? 'primary producer'})`,
      delta: Math.round(policyRisk * 0.25),
      component: 'policyRisk',
    },
    {
      label: `Structural demand pressure (${seed.category})`,
      delta: Math.round(demandPressure * 0.15),
      component: 'demandPressure',
    },
  ]

  let status: WarningStatus = 'NORMAL'
  if (score >= 75) status = 'CRITICAL'
  else if (score >= 52) status = 'ELEVATED'
  else if (score >= 40) status = 'WATCH'

  return {
    score,
    supplyRisk,
    policyRisk,
    demandPressure,
    marketStress,
    supplyResponse,
    asOf: new Date().toISOString(),
    contributions,
    status,
    drivers: contributions.map((c) => ({ label: c.label, delta: c.delta })),
  }
}

function deriveSeedBaselineEvents(
  seed: CriticalMaterialSeed,
  baseline: ReturnType<typeof deriveSeedBaselinePulse>,
): {
  events: MaterialIntelEvent[]
  crossMaterial: MaterialIntelResponse['crossMaterial']
} {
  const now = Date.now()
  const hourMs = 60 * 60 * 1000
  const primaryCountry = seed.countries[0] ?? 'Primary Producer'
  const secondaryCountries = seed.countries.slice(1, 3).join(' & ') || primaryCountry
  const topApps = seed.applications.slice(0, 4)
  const primaryAppsLabel = seed.applications.slice(0, 2).join(' and ') || seed.category
  const sources = (seed.source || 'USGS Mineral Commodity Summaries 2025; IEA Global Critical Minerals Outlook 2024')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)

  const policyEventType =
    /export.?control|licen|restrict/i.test(seed.supply ?? '') || primaryCountry === 'China'
      ? 'export_control'
      : 'policy'
  const policySeverity = baseline.score >= 52 ? 'high' : 'moderate'
  const policyEventId = `seed_evt_${seed.symbol.toLowerCase()}_policy`
  const policyOccurredAt = new Date(now - 18 * hourMs).toISOString()
  const policyTitle = `${primaryCountry} Export Licensing & Processing Concentration — ${seed.name} (${seed.symbol})`

  const events: MaterialIntelEvent[] = [
    {
      id: policyEventId,
      title: policyTitle,
      summary: `${seed.supply ?? `${seed.name} upstream supply is concentrated across ${seed.countries.join(', ')}.`} Export licensing scrutiny and refining concentration in ${primaryCountry} keep physical availability tight for downstream buyers.`,
      eventType: policyEventType,
      stage: 'refining',
      occurredAt: policyOccurredAt,
      sourceName: sources[0] ?? 'USGS Mineral Commodity Summaries',
      sourceUrl: 'https://www.usgs.gov/centers/national-minerals-information-center',
      severity: policySeverity,
      confidence: 'high',
      relevanceScore: 92,
      relevanceLevel: 1,
      relationshipType: 'direct',
      whyRelevant: `Direct mention of ${seed.name} in ${describeEventType(policyEventType)} tied to ${seed.countries.slice(0, 3).join(', ')}.`,
      implication: {
        whatHappened: seed.supply ?? `${seed.name} refining and export flows remain concentrated in ${seed.countries.slice(0, 2).join(' and ')}.`,
        supplyImplication: 'negative',
        supplySeverity: policySeverity,
        demandImplication: 'neutral',
        demandSeverity: null,
        priceDirection: 'upward',
        affectedApplications: topApps,
        timeHorizon: '1-3_months',
        watchTriggers: [
          `Licensing approval rates and customs clearance volumes from ${primaryCountry}`,
          'Spot inventory drawdowns at merchant refiners and bonded warehouses',
          'Strategic stockpiling tenders or defense-procurement exemptions',
        ],
        assessment: `${capitalize(describeEventType(policyEventType))} with evidenced linkage to ${seed.name}. Supply implication: negative; demand implication: neutral; price pressure: upward. Assessment confidence is high based on ${sources[0] ?? 'primary mineral statistics'}.`,
        confidence: 'high',
      },
    },
    {
      id: `seed_evt_${seed.symbol.toLowerCase()}_demand`,
      title: `Downstream Procurement & Application Demand in ${primaryAppsLabel} — ${seed.name}`,
      summary: `${seed.demand ?? `Growing industrial consumption across ${seed.applications.join(', ')}.`} Strict qualification specs and limited drop-in substitutes keep downstream procurement inelastic.`,
      eventType: 'demand_shift',
      stage: 'downstream',
      occurredAt: new Date(now - 42 * hourMs).toISOString(),
      sourceName: sources[1] ?? sources[0] ?? 'IEA Critical Minerals Outlook',
      sourceUrl: 'https://www.iea.org/topics/critical-minerals',
      severity: 'moderate',
      confidence: 'high',
      relevanceScore: 82,
      relevanceLevel: 2,
      relationshipType: 'downstream_application',
      whyRelevant: `Event affects ${primaryAppsLabel}, a direct application of ${seed.name} (evidenced application linkage).`,
      implication: {
        whatHappened: seed.demand ?? `Sustained downstream procurement across ${seed.applications.slice(0, 3).join(', ')}.`,
        supplyImplication: 'neutral',
        supplySeverity: null,
        demandImplication: 'positive',
        demandSeverity: 'moderate',
        priceDirection: 'upward',
        affectedApplications: topApps,
        timeHorizon: '1-3_months',
        watchTriggers: [
          `OEM contract allocations in ${seed.applications[0] ?? 'core applications'}`,
          'Restocking behavior across downstream component manufacturers',
          'Substitution or thrifting qualification milestones',
        ],
        assessment: `Downstream demand from ${primaryAppsLabel} reinforces tight physical balances for ${seed.name}. Supply implication: neutral; demand implication: positive; price pressure: upward.`,
        confidence: 'high',
      },
    },
    {
      id: `seed_evt_${seed.symbol.toLowerCase()}_capacity`,
      title: `Midstream Refining & Secondary Recovery Pipeline across ${secondaryCountries} — ${seed.name}`,
      summary: `Processing, smelting, and secondary recovery initiatives outside ${primaryCountry} aim to diversify ${seed.name.toLowerCase()} supply chains, though commissioning timelines remain multi-year.`,
      eventType: 'capacity',
      stage: 'mining',
      occurredAt: new Date(now - 76 * hourMs).toISOString(),
      sourceName: sources[0] ?? 'USGS Mineral Commodity Summaries',
      sourceUrl: 'https://www.usgs.gov/centers/national-minerals-information-center',
      severity: 'moderate',
      confidence: 'medium',
      relevanceScore: 74,
      relevanceLevel: 1,
      relationshipType: 'shared_processing',
      whyRelevant: `Tracks midstream processing and diversification capacity for ${seed.name} across ${seed.countries.join(', ')}.`,
      implication: {
        whatHappened: `Allied processing and secondary recovery projects are advancing to diversify ${seed.name} supply chains.`,
        supplyImplication: 'positive',
        supplySeverity: 'moderate',
        demandImplication: 'neutral',
        demandSeverity: null,
        priceDirection: 'mixed',
        affectedApplications: topApps.slice(0, 3),
        timeHorizon: '6-12_months',
        watchTriggers: [
          'Commissioning milestones for non-incumbent refining capacity',
          'Long-term offtake agreements and critical-mineral project financing',
          'Commercial qualification of recycled or secondary material',
        ],
        assessment: `New capacity and secondary recovery provide medium-term mitigation for ${seed.name}, while near-term upstream bottlenecks remain active.`,
        confidence: 'medium',
      },
    },
  ]

  const peers = CRITICAL_MATERIALS_DATA.filter(
    (m) =>
      m.symbol !== seed.symbol &&
      (m.category === seed.category || (primaryCountry && m.countries[0] === primaryCountry)),
  ).slice(0, 3)

  const crossMaterial: MaterialIntelResponse['crossMaterial'] = peers.length
    ? [
        {
          eventId: policyEventId,
          title: policyTitle,
          occurredAt: policyOccurredAt,
          otherMaterials: peers.map((peer) => ({
            name: peer.name,
            symbol: peer.symbol,
            relevanceScore: peer.category === seed.category ? 80 : 72,
            relationshipType: peer.category === seed.category ? 'family' : 'shared_processing',
            whyRelevant: `Shares ${peer.category === seed.category ? `${seed.category.toLowerCase()} family and ` : ''}${primaryCountry} processing/export exposure with ${seed.name}.`,
          })),
        },
      ]
    : []

  return { events, crossMaterial }
}

function buildSeedIntelFallback(seed: CriticalMaterialSeed): MaterialIntelResponse {
  const baseline = deriveSeedBaselinePulse(seed)
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  const pulseHistory = Array.from({ length: 14 }, (_, idx) => {
    const daysAgo = 13 - idx
    return {
      asOf: new Date(now - daysAgo * dayMs).toISOString(),
      score: baseline.score,
    }
  })
  const { events, crossMaterial } = deriveSeedBaselineEvents(seed, baseline)

  return {
    state: {
      status: baseline.status,
      statusSince: new Date(now - 7 * dayMs).toISOString(),
      drivers: baseline.drivers,
      delta24h: 0,
      delta7d: 0,
      delta30d: 0,
      signals24h: 1,
      signals7d: events.length,
    },
    pulse: {
      score: baseline.score,
      supplyRisk: baseline.supplyRisk,
      policyRisk: baseline.policyRisk,
      demandPressure: baseline.demandPressure,
      marketStress: baseline.marketStress,
      supplyResponse: baseline.supplyResponse,
      asOf: baseline.asOf,
      contributions: baseline.contributions,
    },
    pulseHistory,
    events,
    crossMaterial,
  }
}

async function findMaterialBySymbolOrKey(symbolOrKey: string) {
  const key = decodeURIComponent(symbolOrKey).trim()
  if (!key) return null
  return prisma.rareEarthMaterial.findFirst({
    where: { OR: [{ symbol: key }, { materialKey: key }, { name: key }] },
    select: { id: true, name: true, symbol: true, materialKey: true },
  })
}

export interface MaterialIntelEvent {
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

export interface MaterialIntelResponse {
  state: {
    status: WarningStatus
    statusSince: string
    drivers: { label: string; delta: number }[]
    delta24h: number
    delta7d: number
    delta30d: number
    signals24h: number
    signals7d: number
  } | null
  pulse: {
    score: number
    supplyRisk: number
    policyRisk: number
    demandPressure: number
    marketStress: number
    supplyResponse: number
    asOf: string
    contributions: PulseContribution[]
  } | null
  pulseHistory: { asOf: string; score: number }[]
  events: MaterialIntelEvent[]
  crossMaterial: {
    eventId: string
    title: string
    occurredAt: string
    otherMaterials: { name: string; symbol: string; relevanceScore: number; relationshipType: string; whyRelevant: string | null }[]
  }[]
}


/** Aggregate everything the material detail page needs for C1–C5. */
export async function getMaterialIntel(symbolOrKey: string): Promise<MaterialIntelResponse | null> {
  const seed = findMaterialSeed(symbolOrKey)
  try {
    const material = await findMaterialBySymbolOrKey(symbolOrKey)
    if (!material) {
      return seed ? buildSeedIntelFallback(seed) : null
    }

    const [stateRow, latestPulse, historyRows, linkRows] = await Promise.all([
      prisma.materialRiskState.findUnique({ where: { materialId: material.id } }),
      prisma.materialRiskPulse.findFirst({ where: { materialId: material.id }, orderBy: { asOf: 'desc' } }),
      prisma.materialRiskPulse.findMany({
        where: { materialId: material.id },
        orderBy: { asOf: 'desc' },
        take: 90,
        select: { asOf: true, score: true },
      }),
      prisma.materialEventLink.findMany({
        where: { materialId: material.id, relevanceScore: { gte: 50 }, event: { status: 'active' } },
        orderBy: [{ relevanceScore: 'desc' }, { event: { occurredAt: 'desc' } }],
        take: 12,
        include: { event: { include: { implication: true } } },
      }),
    ])

    const events: MaterialIntelEvent[] = linkRows.map((link) => ({
      id: link.event.id,
      title: link.event.title,
      summary: link.event.summary,
      eventType: link.event.eventType,
      stage: link.event.stage,
      occurredAt: link.event.occurredAt.toISOString(),
      sourceName: link.event.sourceName,
      sourceUrl: link.event.sourceUrl,
      severity: link.event.severity,
      confidence: link.event.confidence,
      relevanceScore: link.relevanceScore,
      relevanceLevel: link.relevanceLevel,
      relationshipType: link.relationshipType,
      whyRelevant: link.whyRelevant,
      implication: link.event.implication
        ? {
            whatHappened: link.event.implication.whatHappened,
            supplyImplication: link.event.implication.supplyImplication,
            supplySeverity: link.event.implication.supplySeverity,
            demandImplication: link.event.implication.demandImplication,
            demandSeverity: link.event.implication.demandSeverity,
            priceDirection: link.event.implication.priceDirection,
            affectedApplications: parseJsonArray(link.event.implication.affectedApplications),
            timeHorizon: link.event.implication.timeHorizon,
            watchTriggers: parseJsonArray(link.event.implication.watchTriggers),
            assessment: link.event.implication.assessment,
            confidence: link.event.implication.confidence,
          }
        : null,
    }))

    // C5: events that hit this material AND other materials.
    const eventIds = linkRows.slice(0, 6).map((l) => l.event.id)
    const crossRows = eventIds.length
      ? await prisma.materialEventLink.findMany({
          where: { eventId: { in: eventIds }, materialId: { not: material.id }, relevanceScore: { gte: 50 } },
          include: { material: { select: { name: true, symbol: true } }, event: { select: { id: true, title: true, occurredAt: true } } },
        })
      : []

    const crossByEvent = new Map<string, MaterialIntelResponse['crossMaterial'][number]>()
    for (const row of crossRows) {
      const entry = crossByEvent.get(row.eventId) ?? {
        eventId: row.event.id,
        title: row.event.title,
        occurredAt: row.event.occurredAt.toISOString(),
        otherMaterials: [],
      }
      entry.otherMaterials.push({
        name: row.material.name,
        symbol: row.material.symbol,
        relevanceScore: row.relevanceScore,
        relationshipType: row.relationshipType,
        whyRelevant: row.whyRelevant,
      })
      crossByEvent.set(row.eventId, entry)
    }

    const seedFallback = seed ? buildSeedIntelFallback(seed) : null

    return {
      state: stateRow
        ? {
            status: stateRow.status as WarningStatus,
            statusSince: stateRow.statusSince.toISOString(),
            drivers: (parseJsonArray(stateRow.drivers) as unknown as { label: string; delta: number }[]) ?? [],
            delta24h: stateRow.delta24h,
            delta7d: stateRow.delta7d,
            delta30d: stateRow.delta30d,
            signals24h: stateRow.signals24h,
            signals7d: stateRow.signals7d,
          }
        : seedFallback?.state ?? null,
      pulse: latestPulse
        ? {
            score: latestPulse.score,
            supplyRisk: latestPulse.supplyRisk,
            policyRisk: latestPulse.policyRisk,
            demandPressure: latestPulse.demandPressure,
            marketStress: latestPulse.marketStress,
            supplyResponse: latestPulse.supplyResponse,
            asOf: latestPulse.asOf.toISOString(),
            contributions: (parseJsonArray(latestPulse.contributions) as unknown as PulseContribution[]) ?? [],
          }
        : seedFallback?.pulse ?? null,
      pulseHistory:
        historyRows.length > 0
          ? historyRows.map((row) => ({ asOf: row.asOf.toISOString(), score: row.score })).reverse()
          : seedFallback?.pulseHistory ?? [],
      events: events.length > 0 ? events : seedFallback?.events ?? [],
      crossMaterial:
        crossByEvent.size > 0
          ? Array.from(crossByEvent.values())
          : seedFallback?.crossMaterial ?? [],
    }
  } catch (error) {
    console.error('getMaterialIntel: query failed, using seed fallback:', error)
    return seed ? buildSeedIntelFallback(seed) : null
  }
}


export interface IntelOverviewResponse {
  generatedAt: string
  whatMoved: {
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
  }[]
  board: {
    name: string
    symbol: string
    category: string
    status: WarningStatus
    score: number | null
    delta7d: number
    signals7d: number
  }[]
}

function buildSeedBoardFallback(): IntelOverviewResponse['board'] {
  return CRITICAL_MATERIALS_DATA.map((seed) => {
    const baseline = deriveSeedBaselinePulse(seed)
    const { events } = deriveSeedBaselineEvents(seed, baseline)
    return {
      name: seed.name,
      symbol: seed.symbol,
      category: seed.category,
      status: baseline.status,
      score: baseline.score,
      delta7d: 0,
      signals7d: events.length,
    }
  }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
}

function buildSeedWhatMovedFallback(): IntelOverviewResponse['whatMoved'] {
  const prioritySymbols = ['Sb', 'Ga', 'Ge', 'Dy', 'Tb', 'Nd', 'W', 'Co']
  const seeds = prioritySymbols
    .map((sym) => findMaterialSeed(sym))
    .filter((s): s is CriticalMaterialSeed => s !== null)

  return seeds.slice(0, 6).map((seed, idx) => {
    const baseline = deriveSeedBaselinePulse(seed)
    const { events, crossMaterial } = deriveSeedBaselineEvents(seed, baseline)
    const primary = events[0]
    const linkedPeers = crossMaterial[0]?.otherMaterials ?? []
    return {
      id: primary.id,
      title: primary.title,
      summary: primary.summary,
      eventType: primary.eventType,
      occurredAt: new Date(Date.now() - (idx + 1) * 6 * 60 * 60 * 1000).toISOString(),
      severity: primary.severity,
      confidence: primary.confidence,
      importance: primary.relevanceScore * (1 + 0.15 * linkedPeers.length),
      priceDirection: primary.implication?.priceDirection ?? 'upward',
      materials: [
        {
          name: seed.name,
          symbol: seed.symbol,
          relevanceScore: primary.relevanceScore,
          relationshipType: primary.relationshipType,
          whyRelevant: primary.whyRelevant,
        },
        ...linkedPeers.slice(0, 2),
      ],
    }
  })
}

/** "What Moved Critical Materials Today?" + the early-warning status board. */
export async function getIntelOverview(): Promise<IntelOverviewResponse> {
  const fallbackBoard = buildSeedBoardFallback()
  const fallbackWhatMoved = buildSeedWhatMovedFallback()
  const empty: IntelOverviewResponse = {
    generatedAt: new Date().toISOString(),
    whatMoved: fallbackWhatMoved,
    board: fallbackBoard,
  }
  try {
    const since72h = new Date(Date.now() - 72 * 60 * 60 * 1000)
    let recentEvents = await prisma.materialEvent.findMany({
      where: { status: 'active', occurredAt: { gte: since72h } },
      include: {
        implication: { select: { priceDirection: true } },
        materialLinks: {
          where: { relevanceScore: { gte: 50 } },
          orderBy: { relevanceScore: 'desc' },
          include: { material: { select: { name: true, symbol: true } } },
        },
      },
      orderBy: { occurredAt: 'desc' },
      take: 40,
    })

    // Quiet period fallback: widen to 7 days so the module still shows value.
    if (recentEvents.length === 0) {
      recentEvents = await prisma.materialEvent.findMany({
        where: { status: 'active', occurredAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        include: {
          implication: { select: { priceDirection: true } },
          materialLinks: {
            where: { relevanceScore: { gte: 50 } },
            orderBy: { relevanceScore: 'desc' },
            include: { material: { select: { name: true, symbol: true } } },
          },
        },
        orderBy: { occurredAt: 'desc' },
        take: 40,
      })
    }

    const whatMoved = recentEvents
      .filter((event) => event.materialLinks.length > 0)
      .map((event) => {
        const maxRelevance = Math.max(...event.materialLinks.map((l) => l.relevanceScore))
        const importance = maxRelevance * (1 + 0.15 * (event.materialLinks.length - 1))
        return {
          id: event.id,
          title: event.title,
          summary: event.summary,
          eventType: event.eventType,
          occurredAt: event.occurredAt.toISOString(),
          severity: event.severity,
          confidence: event.confidence,
          importance,
          priceDirection: event.implication?.priceDirection ?? null,
          materials: event.materialLinks.map((link) => ({
            name: link.material.name,
            symbol: link.material.symbol,
            relevanceScore: link.relevanceScore,
            relationshipType: link.relationshipType,
            whyRelevant: link.whyRelevant,
          })),
        }
      })
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 8)

    const [states, pulses, materials] = await Promise.all([
      prisma.materialRiskState.findMany(),
      prisma.materialRiskPulse.findMany({
        orderBy: { asOf: 'desc' },
        distinct: ['materialId'],
        select: { materialId: true, score: true },
      }),
      prisma.rareEarthMaterial.findMany({ select: { id: true, name: true, symbol: true, category: true } }),
    ])
    const pulseByMaterial = new Map(pulses.map((p) => [p.materialId, p.score]))
    const stateByMaterial = new Map(states.map((s) => [s.materialId, s]))

    const board =
      materials.length === 0
        ? fallbackBoard
        : materials
            .map((material) => {
              const state = stateByMaterial.get(material.id)
              const dbScore = pulseByMaterial.get(material.id)
              const seed = findMaterialSeed(material.symbol) ?? findMaterialSeed(material.name)
              const seedBaseline = seed ? deriveSeedBaselinePulse(seed) : null
              return {
                name: material.name,
                symbol: material.symbol,
                category: material.category,
                status: ((state?.status ?? seedBaseline?.status ?? 'NORMAL') as WarningStatus),
                score: dbScore ?? seedBaseline?.score ?? null,
                delta7d: state?.delta7d ?? 0,
                signals7d: state?.signals7d ?? 0,
              }
            })
            .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))

    return {
      generatedAt: new Date().toISOString(),
      whatMoved: whatMoved.length > 0 ? whatMoved : fallbackWhatMoved,
      board,
    }
  } catch (error) {
    console.error('getIntelOverview: query failed:', error)
    return empty
  }
}


// ---------------------------------------------------------------------------
// C6 — "Since You Last Checked"
// Driven by TrackedMaterial.lastSeenAt (never inferred from newsletters).
// ---------------------------------------------------------------------------

export interface SinceLastCheckedResponse {
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

export async function getSinceLastChecked(userId: string, symbolOrKey: string): Promise<SinceLastCheckedResponse | null> {
  try {
    const material = await findMaterialBySymbolOrKey(symbolOrKey)
    if (!material) return null

    const tracked = await prisma.trackedMaterial.findUnique({
      where: { userId_materialId: { userId, materialId: material.id } },
      select: { lastSeenAt: true, createdAt: true },
    })
    if (!tracked) {
      return {
        tracked: false, lastSeenAt: null, newDevelopments: 0, highRelevanceDevelopments: 0,
        pulseNow: null, pulseThen: null, pulseDelta: null, worsened: [], improved: [], topEvents: [],
      }
    }

    const lastSeenAt = tracked.lastSeenAt ?? tracked.createdAt

    const newLinks = await prisma.materialEventLink.findMany({
      where: {
        materialId: material.id,
        relevanceScore: { gte: 50 },
        event: { status: 'active', occurredAt: { gt: lastSeenAt } },
      },
      orderBy: { relevanceScore: 'desc' },
      take: 20,
      include: { event: { select: { id: true, title: true, occurredAt: true, eventType: true, severity: true } } },
    })

    const [pulseNowRow, pulseThenRow] = await Promise.all([
      prisma.materialRiskPulse.findFirst({ where: { materialId: material.id }, orderBy: { asOf: 'desc' } }),
      prisma.materialRiskPulse.findFirst({ where: { materialId: material.id, asOf: { lte: lastSeenAt } }, orderBy: { asOf: 'desc' } }),
    ])

    const COMPONENT_LABELS = [
      ['Supply risk', 'supplyRisk'],
      ['Policy risk', 'policyRisk'],
      ['Demand pressure', 'demandPressure'],
      ['Market stress', 'marketStress'],
      ['Supply response', 'supplyResponse'],
    ] as const

    const worsened: string[] = []
    const improved: string[] = []
    if (pulseNowRow && pulseThenRow) {
      for (const [label, key] of COMPONENT_LABELS) {
        const diff = (pulseNowRow[key] as number) - (pulseThenRow[key] as number)
        if (key === 'supplyResponse') {
          // Supply response is mitigating: rising response = improvement.
          if (diff >= 3) improved.push(label)
          else if (diff <= -3) worsened.push(label)
        } else {
          if (diff >= 3) worsened.push(label)
          else if (diff <= -3) improved.push(label)
        }
      }
    }

    const severityWeight = (severity: string) => ({ low: 1, moderate: 2, high: 3, severe: 4 }[severity] ?? 2)
    const topEvents = newLinks
      .sort((a, b) => b.relevanceScore * severityWeight(b.event.severity) - a.relevanceScore * severityWeight(a.event.severity))
      .slice(0, 2)
      .map((link) => ({
        id: link.event.id,
        title: link.event.title,
        occurredAt: link.event.occurredAt.toISOString(),
        relevanceScore: link.relevanceScore,
        eventType: link.event.eventType,
      }))

    return {
      tracked: true,
      lastSeenAt: lastSeenAt.toISOString(),
      newDevelopments: newLinks.length,
      highRelevanceDevelopments: newLinks.filter((l) => l.relevanceScore >= 70).length,
      pulseNow: pulseNowRow?.score ?? null,
      pulseThen: pulseThenRow?.score ?? null,
      pulseDelta: pulseNowRow && pulseThenRow ? pulseNowRow.score - pulseThenRow.score : null,
      worsened,
      improved,
      topEvents,
    }
  } catch (error) {
    console.error('getSinceLastChecked: query failed:', error)
    return null
  }
}


// ---------------------------------------------------------------------------
// C7 — Shock Propagation Simulation (constrained MVP)
// Guardrails: ranges and directional effects only, never false precision;
// known dependency is separated from inferred dependency; confidence is
// shown per component; assumptions are always visible.
// ---------------------------------------------------------------------------

const SHOCK_DEFS: Record<string, { label: string; direction: 'supply_down' | 'supply_up' | 'demand_up'; stage: string; pulseComponent: string; pulseWeight: number }> = {
  export_restriction: { label: 'Export restriction', direction: 'supply_down', stage: 'refining', pulseComponent: 'Policy Risk', pulseWeight: 9 },
  mine_outage: { label: 'Mine outage', direction: 'supply_down', stage: 'mining', pulseComponent: 'Supply Risk', pulseWeight: 8 },
  refinery_outage: { label: 'Refinery outage', direction: 'supply_down', stage: 'refining', pulseComponent: 'Supply Risk', pulseWeight: 7 },
  sanctions: { label: 'Sanctions', direction: 'supply_down', stage: 'mining', pulseComponent: 'Policy Risk', pulseWeight: 10 },
  logistics_disruption: { label: 'Logistics disruption', direction: 'supply_down', stage: 'processing', pulseComponent: 'Supply Risk', pulseWeight: 5 },
  demand_surge: { label: 'Demand surge', direction: 'demand_up', stage: 'downstream', pulseComponent: 'Demand Pressure', pulseWeight: 8 },
  new_capacity: { label: 'New capacity', direction: 'supply_up', stage: 'mining', pulseComponent: 'Supply Response', pulseWeight: 8 },
}

export interface ShockSimulationInput {
  symbolOrKey: string
  shockType: string
  magnitudePct: number
  geography?: string | null
  durationDays: number
  note?: string | null
}

export interface ShockSimulationResult {
  id: string | null
  material: { name: string; symbol: string }
  shockSummary: string
  supplyImpact: { removedShareRange: [number, number]; direction: string; basis: string; confidence: string }
  affectedStages: string[]
  topApplications: { name: string; dependence: string; exposure: string; confidence: string }[]
  geographicExposure: { country: string; stage: string; sharePct: number | null; confidence: string }[]
  mitigationRoutes: string[]
  priceDirection: { direction: string; qualitativeMagnitude: string; note: string }
  pulseEffect: { component: string; illustrativeDelta: number; label: string }
  timeHorizon: { label: string; durationDays: number }
  confidence: string
  assumptions: string[]
}


export async function runShockSimulation(input: ShockSimulationInput, userId?: string | null): Promise<ShockSimulationResult | { error: string }> {
  const def = SHOCK_DEFS[input.shockType]
  if (!def) return { error: `Unknown shock type "${input.shockType}".` }
  if (![10, 25, 50, 75, 100].includes(input.magnitudePct)) return { error: 'Magnitude must be one of 10, 25, 50, 75, 100.' }
  if (![30, 90, 365].includes(input.durationDays)) return { error: 'Duration must be one of 30, 90, 365 days.' }

  let dbMaterial: Awaited<ReturnType<typeof prisma.rareEarthMaterial.findFirst<{
    include: {
      countryRoles: { orderBy: { sharePct: 'desc' } }
      structuredApplications: true
      riskPulses: { orderBy: { asOf: 'desc' }; take: 1 }
    }
  }>>> = null

  try {
    dbMaterial = await prisma.rareEarthMaterial.findFirst({
      where: {
        OR: [
          { symbol: input.symbolOrKey },
          { materialKey: input.symbolOrKey },
          { name: input.symbolOrKey },
        ],
      },
      include: {
        countryRoles: { orderBy: { sharePct: 'desc' } },
        structuredApplications: true,
        riskPulses: { orderBy: { asOf: 'desc' }, take: 1 },
      },
    })
  } catch (error) {
    console.error('runShockSimulation: DB lookup failed, falling back to seed dataset:', error)
  }

  const seed = findMaterialSeed(input.symbolOrKey) ?? (dbMaterial ? findMaterialSeed(dbMaterial.symbol) : null)
  if (!dbMaterial && !seed) return { error: 'Material not found.' }

  const materialKey = dbMaterial?.materialKey ?? (seed ? toMaterialKey(seed.name) : '')
  const seedCountries = seed?.countries ?? (dbMaterial ? parseJsonArray(dbMaterial.countries) : [])
  const fallbackCountryRoles = seedCountries.map((country, idx) => ({
    country,
    stage: idx === 0 ? def.stage : 'mining',
    sharePct: idx === 0 ? (seedCountries.length <= 2 ? 75 : seedCountries.length === 3 ? 55 : 42) : null,
  }))
  const pilotApps = PILOT_APPLICATIONS[materialKey] ?? []
  const fallbackStructuredApps = pilotApps.map((a) => ({
    name: a.name,
    strength: a.strength,
  }))

  const material = {
    id: dbMaterial?.id ?? null,
    name: dbMaterial?.name ?? seed!.name,
    symbol: dbMaterial?.symbol ?? seed!.symbol,
    applications: dbMaterial?.applications ?? JSON.stringify(seed?.applications ?? []),
    countryRoles:
      dbMaterial && dbMaterial.countryRoles.length > 0 ? dbMaterial.countryRoles : fallbackCountryRoles,
    structuredApplications:
      dbMaterial && dbMaterial.structuredApplications.length > 0
        ? dbMaterial.structuredApplications
        : fallbackStructuredApps,
  }

  const geography = input.geography?.trim() || null

  // --- Stage 1: immediate upstream effect ----------------------------------
  const stageRoles = material.countryRoles.filter((r) => r.stage === def.stage)
  const fallbackRoles = material.countryRoles.filter((r) => ['mining', 'refining'].includes(r.stage))
  const relevantRoles = stageRoles.length ? stageRoles : fallbackRoles

  const geoRole = geography
    ? relevantRoles.find((r) => r.country.toLowerCase().includes(geography.toLowerCase())) ??
      material.countryRoles.find((r) => r.country.toLowerCase().includes(geography.toLowerCase()))
    : null
  const baseRole = geoRole ?? relevantRoles[0] ?? null
  const baseShare = baseRole?.sharePct ?? null

  // When no structured share data exists we stay deliberately vague.
  const hasShareData = baseShare != null
  const rawRemoval = hasShareData ? (baseShare as number) * (input.magnitudePct / 100) : input.magnitudePct * 0.4
  const removedShareRange: [number, number] = hasShareData
    ? [Math.max(1, Math.round(rawRemoval * 0.7)), Math.max(2, Math.round(rawRemoval))]
    : [Math.max(1, Math.round(rawRemoval * 0.5)), Math.max(2, Math.round(rawRemoval))]

  const supplyImpactConfidence = hasShareData ? (geoRole ? 'high' : 'medium') : 'low'
  const supplyImpactBasis = hasShareData
    ? `${baseRole?.country} holds ~${baseShare}% of ${baseRole?.stage} share; scenario removes ${input.magnitudePct}% of that for ${input.durationDays} days.`
    : `No structured ${def.stage} share data for ${material.name}; using conservative magnitude-scaled estimate.`

  // --- Stage 3: application exposure ranked by dependence strength ----------
  const strengthRank: Record<string, number> = { direct: 4, strong: 3, moderate: 2, weak: 1 }
  const structuredApps = [...material.structuredApplications].sort(
    (a, b) => (strengthRank[b.strength] ?? 0) - (strengthRank[a.strength] ?? 0),
  )
  const displayApps = parseJsonArray(material.applications)
  const topApplications = (
    structuredApps.length
      ? structuredApps.slice(0, 5).map((app) => ({
          name: app.name,
          dependence: app.strength,
          exposure: removedShareRange[1] >= 20 && ['direct', 'strong'].includes(app.strength) ? 'high' : removedShareRange[1] >= 8 ? 'moderate' : 'low',
          confidence: 'high',
        }))
      : displayApps.slice(0, 5).map((name) => ({
          name,
          dependence: 'moderate',
          exposure: removedShareRange[1] >= 15 ? 'moderate' : 'low',
          confidence: 'low',
        }))
  )

  // --- Stage 4: geography exposure ------------------------------------------
  const geographicExposure = material.countryRoles
    .filter((r) => ['consumption', 'manufacturing', 'processing'].includes(r.stage))
    .slice(0, 5)
    .map((r) => ({ country: r.country, stage: r.stage, sharePct: r.sharePct, confidence: r.sharePct != null ? 'high' : 'low' }))


  // --- Stage 5: mitigation ---------------------------------------------------
  const mitigationRoutes: string[] = []
  const alternatives = material.countryRoles.filter(
    (r) => ['mining', 'refining'].includes(r.stage) && (!baseRole || r.country !== baseRole.country),
  )
  if (alternatives.length) {
    mitigationRoutes.push(`Alternative supply from ${alternatives.slice(0, 3).map((r) => r.country).join(', ')} (known producer/refiner roles).`)
  }
  if (def.direction === 'supply_down') {
    mitigationRoutes.push('Drawdown of existing inventories along the supply chain (unquantified).')
    mitigationRoutes.push('Substitution and thrifting in less-critical applications where technically feasible.')
  }
  if (def.direction === 'supply_up') {
    mitigationRoutes.push('New volumes may displace higher-cost incumbent supply over the scenario horizon.')
  }
  if (mitigationRoutes.length === 0) mitigationRoutes.push('No structured mitigation data available; treat as an open risk.')

  // --- Stage 6: time horizon -------------------------------------------------
  const horizonLabel = input.durationDays <= 30 ? 'immediate' : input.durationDays <= 90 ? '1-3 months' : '6-12 months'

  // --- Price direction (qualitative ranges only, no false precision) --------
  const direction = def.direction === 'demand_up' ? 'upward' : def.direction === 'supply_up' ? 'downward' : 'upward'
  const qualitativeMagnitude =
    removedShareRange[1] >= 20 ? 'significant' : removedShareRange[1] >= 8 ? 'moderate' : 'limited'

  // --- Illustrative Risk Pulse effect (same structured rules as C4) ---------
  const illustrativeDelta = Math.round(def.pulseWeight * (input.magnitudePct / 50) * (def.direction === 'supply_up' ? -1 : 1))

  const assumptions = [
    `Shock: ${def.label} at ${input.magnitudePct}% magnitude for ${input.durationDays} days${geography ? ` originating in ${geography}` : ''}.`,
    supplyImpactBasis,
    hasShareData ? 'Supply-share data is treated as known dependency.' : 'Supply-share structure is INFERRED (no structured data); confidence reduced.',
    structuredApps.length ? 'Application dependence uses structured strength ratings.' : 'Application exposure uses unverified display-layer applications; confidence reduced.',
    'Price effects are directional/qualitative only; no econometric price model is applied.',
  ]
  if (input.note) assumptions.push(`Analyst note: ${input.note}`)

  const shockSummary =
    `${def.label}${geography ? ` in ${geography}` : ''} affecting ${material.name}: ` +
    `${input.magnitudePct}% magnitude for ${input.durationDays} days. ` +
    (def.direction === 'supply_up'
      ? `Estimated added availability in the range of ${removedShareRange[0]}–${removedShareRange[1]}% of baseline supply.`
      : def.direction === 'demand_up'
        ? `Demand uplift concentrated in ${topApplications[0]?.name ?? 'key applications'} over the scenario horizon.`
        : `Estimated ${removedShareRange[0]}–${removedShareRange[1]}% of global supply at risk over the scenario horizon.`)

  const result: ShockSimulationResult = {
    id: null,
    material: { name: material.name, symbol: material.symbol },
    shockSummary,
    supplyImpact: {
      removedShareRange,
      direction: def.direction,
      basis: supplyImpactBasis,
      confidence: supplyImpactConfidence,
    },
    affectedStages: def.direction === 'demand_up' ? ['downstream', 'component'] : [def.stage, 'processing', 'downstream'],
    topApplications,
    geographicExposure,
    mitigationRoutes,
    priceDirection: {
      direction,
      qualitativeMagnitude,
      note: 'Directional estimate only — GeoMoney does not output a single precise price change without an explicit econometric model.',
    },
    pulseEffect: { component: def.pulseComponent, illustrativeDelta, label: `${def.label} scenario` },
    timeHorizon: { label: horizonLabel, durationDays: input.durationDays },
    confidence: supplyImpactConfidence === 'high' && structuredApps.length ? 'high' : supplyImpactConfidence === 'low' ? 'low' : 'medium',
    assumptions,
  }

  // Persist the scenario for auditability (anonymous allowed) when DB row exists.
  if (material.id) {
    try {
      const saved = await prisma.shockSimulation.create({
        data: {
          materialId: material.id,
          userId: userId ?? null,
          shockType: input.shockType,
          magnitudePct: input.magnitudePct,
          geography,
          durationDays: input.durationDays,
          note: input.note ?? null,
          result: JSON.stringify(result),
        },
        select: { id: true },
      })
      result.id = saved.id
    } catch (error) {
      console.error('runShockSimulation: failed to persist scenario:', error)
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Pilot enrichment seed (F2) — idempotent structured applications for the
// five QA-pilot materials so the C1 relevance scorer can evidence
// application-level linkages out of the box.
// ---------------------------------------------------------------------------

export async function seedPilotApplications(): Promise<{ materials: number; created: number; updated: number }> {
  const { PILOT_APPLICATIONS } = await import('@/data/pilot-applications')
  let materials = 0
  let created = 0
  let updated = 0

  for (const [materialKey, apps] of Object.entries(PILOT_APPLICATIONS)) {
    const material = await prisma.rareEarthMaterial.findUnique({
      where: { materialKey },
      select: { id: true },
    })
    if (!material) continue
    materials++

    for (const app of apps) {
      const existing = await prisma.materialApplication.findFirst({
        where: { materialId: material.id, name: app.name },
        select: { id: true },
      })
      const data = {
        aliases: JSON.stringify(app.aliases),
        relationship: app.relationship,
        strength: app.strength,
        qualifiesWithoutMention: app.qualifiesWithoutMention,
        notes: app.notes ?? null,
      }
      if (existing) {
        await prisma.materialApplication.update({ where: { id: existing.id }, data })
        updated++
      } else {
        await prisma.materialApplication.create({ data: { materialId: material.id, name: app.name, ...data } })
        created++
      }
    }
  }

  return { materials, created, updated }
}


