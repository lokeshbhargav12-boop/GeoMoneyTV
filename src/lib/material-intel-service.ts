// Critical Materials Intelligence — server-side service layer.
//
// Responsibilities:
// - Permanent material keys (P0-16) via toMaterialKey().
// - Idempotent seeding of materials, provenance Sources + links (F4) and
//   price benchmark definitions (F5) from the seed datasets.
// - Detail/list reads with graceful fallback to the static seed dataset when
//   the database is unavailable or not seeded yet, so the frontend never 404s
//   for a known material.
// - Live price scraping (syncMaterialPrices) into the append-only
//   PriceObservation table.

import YahooFinance from 'yahoo-finance2'
import { prisma } from '@/lib/prisma'
import { CRITICAL_MATERIALS_DATA, type CriticalMaterialSeed } from '@/data/critical-materials'
import { MATERIAL_BENCHMARKS, benchmarksForMaterial, type MaterialBenchmarkSeed } from '@/data/material-benchmarks'

// Permanent display-name-independent key, e.g. "Gallium" -> "mat_gallium",
// "Natural Graphite" -> "mat_natural_graphite" (P0-16).
export function toMaterialKey(name: string): string {
  return `mat_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`
}

export function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : []
  } catch {
    return []
  }
}

// The legacy seed appended "\n\nSource: ..." to descriptions; strip it for
// display now that provenance lives in the Source layer.
export function stripSourceSuffix(description: string | null | undefined): string {
  if (!description) return ''
  return description.split(/\n\nSource:/i)[0].trim()
}

// ---------------------------------------------------------------------------
// Source provenance parsing (F4)
// ---------------------------------------------------------------------------

const KNOWN_PUBLISHERS = [
  'World Platinum Investment Council',
  'World Nuclear Association',
  'European Commission',
  'U.S. DOE',
  'USGS',
  'IEA',
  'DOE',
  'OECD',
  'IAEA',
  'Johnson Matthey',
]

export interface ParsedSourceEntry {
  publisher: string
  document: string | null
  dataYear: number | null
}

// "USGS Mineral Commodity Summaries 2025; IEA EV Outlook 2025" ->
// [{ publisher: 'USGS', document: 'Mineral Commodity Summaries 2025', dataYear: 2025 }, ...]
export function parseSourceEntries(source: string | null | undefined): ParsedSourceEntry[] {
  if (!source) return []
  return source
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const publisher = KNOWN_PUBLISHERS.find((p) => entry.toLowerCase().startsWith(p.toLowerCase()))
      const yearMatch = entry.match(/\b(19|20)\d{2}\b/)
      return {
        publisher: publisher ?? entry.split(/\s+/)[0],
        document: publisher ? entry.slice(publisher.length).trim() || null : entry,
        dataYear: yearMatch ? parseInt(yearMatch[0], 10) : null,
      }
    })
}

// ---------------------------------------------------------------------------
// Seeding (idempotent: match by materialKey -> symbol -> name)
// ---------------------------------------------------------------------------

async function findMaterialRow(seed: CriticalMaterialSeed) {
  const materialKey = toMaterialKey(seed.name)
  return prisma.rareEarthMaterial.findFirst({
    where: { OR: [{ materialKey }, { symbol: seed.symbol }, { name: seed.name }] },
  })
}

export async function seedCriticalMaterials(): Promise<{ created: number; updated: number }> {
  let created = 0
  let updated = 0

  for (const material of CRITICAL_MATERIALS_DATA) {
    const materialKey = toMaterialKey(material.name)
    const data = {
      materialKey,
      name: material.name,
      symbol: material.symbol,
      category: material.category,
      // Provisional: backend family starts as the visible category until the
      // family/application/strategic tag enrichment pass (P0-15).
      materialFamily: material.category,
      description: `${material.description}\n\nSource: ${material.source}`,
      supply: material.supply || null,
      demand: material.demand || null,
      unit: material.unit || 'kg',
      price: material.price ?? null,
      applications: JSON.stringify(material.applications),
      countries: JSON.stringify(material.countries),
      lastUpdated: new Date(),
    }

    const existing = await findMaterialRow(material)
    if (existing) {
      await prisma.rareEarthMaterial.update({ where: { id: existing.id }, data })
      updated++
    } else {
      await prisma.rareEarthMaterial.create({ data })
      created++
    }
  }

  return { created, updated }
}


// Creates Source records (one per publisher/document) and links them to the
// material via MaterialSourceLink (field = 'profile').
export async function seedMaterialSources(): Promise<{ sources: number; links: number }> {
  let sources = 0
  let links = 0

  for (const seed of CRITICAL_MATERIALS_DATA) {
    const material = await findMaterialRow(seed)
    if (!material) continue

    for (const entry of parseSourceEntries(seed.source)) {
      let source = await prisma.source.findFirst({
        where: { publisher: entry.publisher, document: entry.document },
      })
      if (!source) {
        source = await prisma.source.create({
          data: {
            publisher: entry.publisher,
            document: entry.document,
            dataYear: entry.dataYear,
            notes: `Seeded from critical-materials dataset reference: "${entry.document ?? entry.publisher}"`,
          },
        })
        sources++
      } else if (entry.dataYear && !source.dataYear) {
        await prisma.source.update({ where: { id: source.id }, data: { dataYear: entry.dataYear } })
      }

      const link = await prisma.materialSourceLink.upsert({
        where: {
          materialId_sourceId_field: { materialId: material.id, sourceId: source.id, field: 'profile' },
        },
        create: { materialId: material.id, sourceId: source.id, field: 'profile' },
        update: {},
      })
      if (link) links++
    }
  }

  return { sources, links }
}

// Creates PriceBenchmark definitions (F5) for every material.
export async function seedMaterialBenchmarks(): Promise<{ benchmarks: number }> {
  let created = 0

  for (const seed of MATERIAL_BENCHMARKS) {
    const material = await prisma.rareEarthMaterial.findFirst({
      where: { materialKey: seed.materialKey },
    })
    if (!material) continue

    let sourceId: string | null = null
    if (seed.sourcePublisher) {
      const source = await prisma.source.findFirst({ where: { publisher: seed.sourcePublisher } })
      sourceId = source?.id ?? null
    }

    const existing = await prisma.priceBenchmark.findFirst({
      where: { materialId: material.id, productForm: seed.productForm, unit: seed.unit },
    })
    if (existing) continue

    await prisma.priceBenchmark.create({
      data: {
        materialId: material.id,
        productForm: seed.productForm,
        grade: seed.grade ?? null,
        benchmarkName: seed.benchmarkName ?? null,
        market: seed.market ?? null,
        currency: seed.currency ?? 'USD',
        unit: seed.unit,
        updateFrequency: seed.updateFrequency ?? null,
        sourceId,
      },
    })
    created++
  }

  return { benchmarks: created }
}

export async function seedMaterialIntelligence() {
  const materials = await seedCriticalMaterials()
  const sources = await seedMaterialSources()
  const benchmarks = await seedMaterialBenchmarks()
  return { materials, sources, benchmarks }
}

// ---------------------------------------------------------------------------
// Read models
// ---------------------------------------------------------------------------

export interface MaterialBenchmarkInfo {
  id: string | null
  productForm: string
  grade: string | null
  benchmarkName: string | null
  market: string | null
  currency: string
  unit: string
  updateFrequency: string | null
  isProxy: boolean
  isLive: boolean
  latest: { price: number; asOf: string } | null
  change: number | null
  changePercent: number | null
  source: { publisher: string; url: string | null } | null
}

export interface MaterialSourceInfo {
  publisher: string
  document: string | null
  url: string | null
  dataYear: number | null
}

export interface MaterialDetail {
  id: string | null
  materialKey: string
  name: string
  symbol: string
  category: string
  materialFamily: string | null
  description: string
  supply: string | null
  demand: string | null
  applications: string[]
  countries: string[]
  price: number | null
  unit: string | null
  lastUpdated: string | null
  benchmarks: MaterialBenchmarkInfo[]
  sources: MaterialSourceInfo[]
  countryRoles: { country: string; stage: string; sharePct: number | null; dataYear: number | null }[]
  effectivePrice: {
    price: number
    unit: string
    currency: string
    asOf: string | null
    label: string
    isLive: boolean
    isProxy: boolean
    change: number | null
    changePercent: number | null
  } | null
}

export interface MaterialListItem {
  id: string | null
  materialKey: string
  name: string
  symbol: string
  category: string
  description: string
  price: number | null
  unit: string | null
  effectivePrice: number | null
  effectiveUnit: string | null
  priceAsOf: string | null
  priceIsLive: boolean
  priceChange: number | null
  priceChangePercent: number | null
  benchmarkLabel: string | null
  lastUpdated: string | null
}

function seedToDetail(seed: CriticalMaterialSeed): MaterialDetail {
  const materialKey = toMaterialKey(seed.name)
  const benchmarks: MaterialBenchmarkInfo[] = benchmarksForMaterial(materialKey).map((b) => ({
    id: null,
    productForm: b.productForm,
    grade: b.grade ?? null,
    benchmarkName: b.benchmarkName ?? null,
    market: b.market ?? null,
    currency: b.currency ?? 'USD',
    unit: b.unit,
    updateFrequency: b.updateFrequency ?? null,
    isProxy: b.isProxy ?? false,
    isLive: Boolean(b.feed),
    latest: null,
    change: null,
    changePercent: null,
    source: b.sourcePublisher ? { publisher: b.sourcePublisher, url: null } : null,
  }))

  return {
    id: null,
    materialKey,
    name: seed.name,
    symbol: seed.symbol,
    category: seed.category,
    materialFamily: seed.category,
    description: seed.description,
    supply: seed.supply ?? null,
    demand: seed.demand ?? null,
    applications: seed.applications,
    countries: seed.countries,
    price: seed.price ?? null,
    unit: seed.unit ?? 'kg',
    lastUpdated: null,
    benchmarks,
    sources: parseSourceEntries(seed.source).map((s) => ({
      publisher: s.publisher,
      document: s.document,
      url: null,
      dataYear: s.dataYear,
    })),
    countryRoles: [],
    effectivePrice:
      seed.price != null
        ? {
            price: seed.price,
            unit: seed.unit ?? 'kg',
            currency: 'USD',
            asOf: null,
            label: `${seed.name} reference price`,
            isLive: false,
            isProxy: false,
            change: null,
            changePercent: null,
          }
        : null,
  }
}


type DbMaterialWithRelations = NonNullable<Awaited<ReturnType<typeof loadDbMaterial>>>

async function loadDbMaterial(symbolOrKey: string) {
  return prisma.rareEarthMaterial.findFirst({
    where: {
      OR: [
        { symbol: { equals: symbolOrKey } },
        { materialKey: { equals: symbolOrKey } },
        { name: { equals: symbolOrKey } },
      ],
    },
    include: {
      priceBenchmarks: {
        include: {
          source: { select: { publisher: true, url: true } },
          observations: { orderBy: { asOf: 'desc' as const }, take: 2 },
        },
      },
      sourceLinks: { include: { source: true } },
      countryRoles: true,
    },
  })
}

function dbToDetail(row: DbMaterialWithRelations): MaterialDetail {
  const feedSeeds = new Set(
    benchmarksForMaterial(row.materialKey ?? '').map((b) => `${b.productForm}::${b.unit}`),
  )

  const benchmarks: MaterialBenchmarkInfo[] = row.priceBenchmarks.map((b) => {
    const latest = b.observations[0] ?? null
    const previous = b.observations[1] ?? null
    const change = latest && previous ? latest.price - previous.price : null
    const changePercent =
      change != null && previous && previous.price !== 0 ? (change / previous.price) * 100 : null
    return {
      id: b.id,
      productForm: b.productForm,
      grade: b.grade,
      benchmarkName: b.benchmarkName,
      market: b.market,
      currency: b.currency,
      unit: b.unit,
      updateFrequency: b.updateFrequency,
      isProxy: /proxy/i.test(b.benchmarkName ?? ''),
      isLive: feedSeeds.has(`${b.productForm}::${b.unit}`),
      latest: latest ? { price: latest.price, asOf: latest.asOf.toISOString() } : null,
      change,
      changePercent,
      source: b.source ? { publisher: b.source.publisher, url: b.source.url } : null,
    }
  })

  // Headline price: primary benchmark with an observation, otherwise any
  // observation, otherwise the legacy display price.
  const primarySeed = benchmarksForMaterial(row.materialKey ?? '').find((b) => b.isPrimary)
  const primaryInfo =
    benchmarks.find(
      (b) => primarySeed && b.productForm === primarySeed.productForm && b.unit === primarySeed.unit && b.latest,
    ) ?? benchmarks.find((b) => b.latest) ?? null

  const effectivePrice = primaryInfo?.latest
    ? {
        price: primaryInfo.latest.price,
        unit: primaryInfo.unit,
        currency: primaryInfo.currency,
        asOf: primaryInfo.latest.asOf,
        label: primaryInfo.benchmarkName ?? primaryInfo.productForm,
        isLive: primaryInfo.isLive,
        isProxy: primaryInfo.isProxy,
        change: primaryInfo.change,
        changePercent: primaryInfo.changePercent,
      }
    : row.price != null
      ? {
          price: row.price,
          unit: row.unit ?? 'kg',
          currency: 'USD',
          asOf: row.lastUpdated?.toISOString() ?? null,
          label: `${row.name} reference price`,
          isLive: false,
          isProxy: false,
          change: null,
          changePercent: null,
        }
      : null

  // Merge linked sources with any provenance parsed from the legacy suffix.
  const sources: MaterialSourceInfo[] = row.sourceLinks.map((l) => ({
    publisher: l.source.publisher,
    document: l.source.document,
    url: l.source.url,
    dataYear: l.source.dataYear,
  }))
  if (sources.length === 0) {
    const legacySource = row.description?.split(/\n\nSource:/i)[1]?.trim()
    for (const entry of parseSourceEntries(legacySource)) {
      sources.push({ publisher: entry.publisher, document: entry.document, url: null, dataYear: entry.dataYear })
    }
  }

  return {
    id: row.id,
    materialKey: row.materialKey ?? toMaterialKey(row.name),
    name: row.name,
    symbol: row.symbol,
    category: row.category,
    materialFamily: row.materialFamily,
    description: stripSourceSuffix(row.description),
    supply: row.supply,
    demand: row.demand,
    applications: parseJsonArray(row.applications),
    countries: parseJsonArray(row.countries),
    price: row.price,
    unit: row.unit,
    lastUpdated: row.lastUpdated?.toISOString() ?? null,
    benchmarks,
    sources,
    countryRoles: row.countryRoles.map((r) => ({
      country: r.country,
      stage: r.stage,
      sharePct: r.sharePct,
      dataYear: r.dataYear,
    })),
    effectivePrice,
  }
}


export interface MaterialDetailResponse {
  material: MaterialDetail
  related: MaterialListItem[]
}

// Detail read with fallback to the static seed dataset so a valid material
// never renders "not found" just because the DB row is missing/unreachable.
export async function getMaterialDetail(symbolOrKey: string): Promise<MaterialDetailResponse | null> {
  const key = decodeURIComponent(symbolOrKey).trim()
  if (!key) return null

  try {
    const row = await loadDbMaterial(key)
    if (row) {
      const related = await prisma.rareEarthMaterial.findMany({
        where: { category: row.category, id: { not: row.id } },
        orderBy: { name: 'asc' },
        take: 4,
      })
      return {
        material: dbToDetail(row),
        related: related.map(dbRowToListItem),
      }
    }
  } catch (error) {
    console.error('getMaterialDetail: database lookup failed, using seed fallback:', error)
  }

  const lower = key.toLowerCase()
  const seed = CRITICAL_MATERIALS_DATA.find(
    (m) =>
      m.symbol.toLowerCase() === lower ||
      m.name.toLowerCase() === lower ||
      toMaterialKey(m.name) === lower,
  )
  if (!seed) return null

  return {
    material: seedToDetail(seed),
    related: CRITICAL_MATERIALS_DATA.filter((m) => m.category === seed.category && m.symbol !== seed.symbol)
      .slice(0, 4)
      .map(seedToListItem),
  }
}

function dbRowToListItem(row: {
  id: string
  materialKey: string | null
  name: string
  symbol: string
  category: string
  description: string | null
  price: number | null
  unit: string | null
  lastUpdated: Date
}): MaterialListItem {
  return {
    id: row.id,
    materialKey: row.materialKey ?? toMaterialKey(row.name),
    name: row.name,
    symbol: row.symbol,
    category: row.category,
    description: stripSourceSuffix(row.description),
    price: row.price,
    unit: row.unit,
    effectivePrice: row.price,
    effectiveUnit: row.unit,
    priceAsOf: row.lastUpdated?.toISOString() ?? null,
    priceIsLive: false,
    priceChange: null,
    priceChangePercent: null,
    benchmarkLabel: null,
    lastUpdated: row.lastUpdated?.toISOString() ?? null,
  }
}

function seedToListItem(seed: CriticalMaterialSeed): MaterialListItem {
  return {
    id: null,
    materialKey: toMaterialKey(seed.name),
    name: seed.name,
    symbol: seed.symbol,
    category: seed.category,
    description: seed.description,
    price: seed.price ?? null,
    unit: seed.unit ?? 'kg',
    effectivePrice: seed.price ?? null,
    effectiveUnit: seed.unit ?? 'kg',
    priceAsOf: null,
    priceIsLive: false,
    priceChange: null,
    priceChangePercent: null,
    benchmarkLabel: null,
    lastUpdated: null,
  }
}

// List read: DB materials enriched with the latest primary-benchmark
// observation; falls back to the static dataset when the table is empty.
export async function listMaterialsWithPrices(): Promise<MaterialListItem[]> {
  try {
    const rows = await prisma.rareEarthMaterial.findMany({
      orderBy: { name: 'asc' },
      include: {
        priceBenchmarks: {
          include: { observations: { orderBy: { asOf: 'desc' as const }, take: 2 } },
        },
      },
    })
    if (rows.length === 0) return CRITICAL_MATERIALS_DATA.map(seedToListItem)

    return rows.map((row) => {
      const item = dbRowToListItem(row)
      const primarySeed = benchmarksForMaterial(item.materialKey).find((b) => b.isPrimary)
      const primary =
        row.priceBenchmarks.find(
          (b) => primarySeed && b.productForm === primarySeed.productForm && b.unit === primarySeed.unit && b.observations.length > 0,
        ) ?? row.priceBenchmarks.find((b) => b.observations.length > 0)
      const latest = primary?.observations[0]
      const previous = primary?.observations[1]
      if (primary && latest) {
        item.effectivePrice = latest.price
        item.effectiveUnit = primary.unit
        item.priceAsOf = latest.asOf.toISOString()
        item.benchmarkLabel = primary.benchmarkName ?? primary.productForm
        item.priceIsLive = benchmarksForMaterial(item.materialKey).some(
          (b) => b.feed && b.productForm === primary.productForm && b.unit === primary.unit,
        )
        if (previous && previous.price !== 0) {
          item.priceChange = latest.price - previous.price
          item.priceChangePercent = ((latest.price - previous.price) / previous.price) * 100
        }
      }
      return item
    })
  } catch (error) {
    console.error('listMaterialsWithPrices: database lookup failed, using seed fallback:', error)
    return CRITICAL_MATERIALS_DATA.map(seedToListItem)
  }
}


// ---------------------------------------------------------------------------
// Price scraper (F5 ingestion)
// ---------------------------------------------------------------------------

function toFiniteNumber(value: unknown): number | null {
  const num = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  return Number.isFinite(num) ? num : null
}

function dayBucket(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export interface MaterialPriceSyncResult {
  updated: number
  failed: string[]
  skipped: string[]
  details: { materialKey: string; benchmark: string; price: number; unit: string; asOf: string }[]
}

// Polls every benchmark configured with a live feed and appends a
// PriceObservation (append-only, unique per benchmark/day). Also refreshes
// the legacy display price for primary benchmarks so cards stay current.
export async function syncMaterialPrices(): Promise<MaterialPriceSyncResult> {
  const result: MaterialPriceSyncResult = { updated: 0, failed: [], skipped: [], details: [] }
  const yahooFinance = new YahooFinance()
  const feedSeeds = MATERIAL_BENCHMARKS.filter((b) => b.feed)

  for (const seed of feedSeeds) {
    const label = `${seed.materialKey}/${seed.productForm}`
    try {
      const material = await prisma.rareEarthMaterial.findFirst({
        where: { materialKey: seed.materialKey },
      })
      if (!material) {
        result.skipped.push(`${label} (material not seeded)`)
        continue
      }

      let benchmark = await prisma.priceBenchmark.findFirst({
        where: { materialId: material.id, productForm: seed.productForm, unit: seed.unit },
      })
      if (!benchmark) {
        benchmark = await prisma.priceBenchmark.create({
          data: {
            materialId: material.id,
            productForm: seed.productForm,
            grade: seed.grade ?? null,
            benchmarkName: seed.benchmarkName ?? null,
            market: seed.market ?? null,
            currency: seed.currency ?? 'USD',
            unit: seed.unit,
            updateFrequency: seed.updateFrequency ?? null,
          },
        })
      }

      const quote = (await yahooFinance.quote(seed.feed!.symbol)) as Record<string, unknown> | undefined
      const price =
        toFiniteNumber(quote?.regularMarketPrice) ??
        toFiniteNumber(quote?.postMarketPrice) ??
        toFiniteNumber(quote?.preMarketPrice)
      if (!price) {
        result.failed.push(`${label} (no price from ${seed.feed!.symbol})`)
        continue
      }

      const marketTime = toFiniteNumber(quote?.regularMarketTime)
      const asOf = dayBucket(marketTime ? new Date(marketTime * 1000) : new Date())

      await prisma.priceObservation.upsert({
        where: { benchmarkId_asOf: { benchmarkId: benchmark.id, asOf } },
        create: { benchmarkId: benchmark.id, price, asOf },
        update: { price },
      })

      if (seed.isPrimary && !seed.isProxy) {
        await prisma.rareEarthMaterial.update({
          where: { id: material.id },
          data: { price, unit: seed.unit, lastUpdated: new Date() },
        })
      }

      result.updated++
      result.details.push({
        materialKey: seed.materialKey,
        benchmark: seed.benchmarkName ?? seed.productForm,
        price,
        unit: seed.unit,
        asOf: asOf.toISOString(),
      })
    } catch (error) {
      console.error(`syncMaterialPrices: ${label} failed:`, error)
      result.failed.push(`${label} (${error instanceof Error ? error.message : 'unknown error'})`)
    }
  }

  return result
}


// ---------------------------------------------------------------------------
// Price history (powers the detail-page chart)
// ---------------------------------------------------------------------------

export interface MaterialPriceHistoryPoint {
  asOf: string
  price: number
}

export interface MaterialPriceHistoryResponse {
  benchmark: {
    id: string
    productForm: string
    grade: string | null
    benchmarkName: string | null
    market: string | null
    currency: string
    unit: string
  }
  points: MaterialPriceHistoryPoint[]
}

// Returns the observation series for a material's benchmark. When
// `benchmarkId` is omitted the primary benchmark (or the first with data) is
// used. Newest last for charting.
export async function getMaterialPriceHistory(
  symbolOrKey: string,
  benchmarkId?: string | null,
  days = 365,
): Promise<MaterialPriceHistoryResponse | null> {
  try {
    const key = decodeURIComponent(symbolOrKey).trim()
    if (!key) return null

    const material = await prisma.rareEarthMaterial.findFirst({
      where: { OR: [{ symbol: key }, { materialKey: key }, { name: key }] },
      include: { priceBenchmarks: true },
    })
    if (!material || material.priceBenchmarks.length === 0) return null

    const primarySeed = benchmarksForMaterial(material.materialKey ?? '').find((b) => b.isPrimary)
    const benchmark =
      (benchmarkId ? material.priceBenchmarks.find((b) => b.id === benchmarkId) : undefined) ??
      material.priceBenchmarks.find(
        (b) => primarySeed && b.productForm === primarySeed.productForm && b.unit === primarySeed.unit,
      ) ??
      material.priceBenchmarks[0]

    const since = new Date()
    since.setDate(since.getDate() - days)

    const observations = await prisma.priceObservation.findMany({
      where: { benchmarkId: benchmark.id, asOf: { gte: since } },
      orderBy: { asOf: 'asc' },
      take: 1500,
    })

    return {
      benchmark: {
        id: benchmark.id,
        productForm: benchmark.productForm,
        grade: benchmark.grade,
        benchmarkName: benchmark.benchmarkName,
        market: benchmark.market,
        currency: benchmark.currency,
        unit: benchmark.unit,
      },
      points: observations.map((o) => ({ asOf: o.asOf.toISOString(), price: o.price })),
    }
  } catch (error) {
    console.error('getMaterialPriceHistory: query failed:', error)
    return null
  }
}

