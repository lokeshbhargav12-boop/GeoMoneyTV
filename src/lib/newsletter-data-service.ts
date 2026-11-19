import { prisma } from '@/lib/prisma'
import { syncNewsToDatabase } from '@/lib/news-service'
import { ensureTickerDataFresh } from '@/lib/ticker-service'
import {
  listMaterialsWithPrices,
  syncMaterialPrices,
  type MaterialListItem,
} from '@/lib/material-intel-service'

export interface NewsletterDataSources {
  articles: boolean
  materials: boolean
  tickers: boolean
}

export interface NewsletterArticle {
  title: string
  category: string
  description: string | null
  content: string
  aiSummary: string | null
  aiAnalysis: string | null
  sourceName: string | null
  sourceUrl: string | null
  createdAt: Date
}

export interface NewsletterMaterial {
  id: string | null
  materialKey: string
  name: string
  symbol: string
  category: string
  price: number | null
  unit: string | null
  supply: string | null
  demand: string | null
  countries: string
  priceAsOf: string | null
  priceIsLive: boolean
  priceChange: number | null
  priceChangePercent: number | null
  benchmarkLabel: string | null
}

export interface NewsletterTicker {
  label: string
  symbol: string
  price: number
  change: number | null
  changePercent: number | null
  previousClose: number | null
  type: string
  updatedAt: Date
}

export interface NewsletterDataSyncStatus {
  newsAdded: number | null
  tickersUpdated: number | null
  materialPricesUpdated: number | null
  errors: string[]
}

export interface NewsletterDataContext {
  articles: NewsletterArticle[]
  materials: NewsletterMaterial[]
  tickers: NewsletterTicker[]
  refreshedAt: Date
  sync: NewsletterDataSyncStatus
}

interface LoadNewsletterDataOptions {
  articleLimit?: number
  refresh?: boolean
  enabledDataSources?: Partial<NewsletterDataSources>
}

const DEFAULT_SOURCES: NewsletterDataSources = {
  articles: true,
  materials: true,
  tickers: true,
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error'
}

/**
 * Refresh the same upstream feeds used by the public dashboards before taking
 * the report snapshot. A provider failure is isolated so a report can still be
 * generated from the last persisted observations, with the failure exposed in
 * the sync status rather than silently treating the snapshot as newly synced.
 */
async function refreshSources(
  sources: NewsletterDataSources,
): Promise<NewsletterDataSyncStatus> {
  const status: NewsletterDataSyncStatus = {
    newsAdded: null,
    tickersUpdated: null,
    materialPricesUpdated: null,
    errors: [],
  }

  const jobs: Promise<void>[] = []

  if (sources.articles) {
    jobs.push(
      syncNewsToDatabase()
        .then((count) => {
          status.newsAdded = count
        })
        .catch((error) => {
          status.errors.push(`News refresh failed: ${errorMessage(error)}`)
        }),
    )
  }

  if (sources.tickers) {
    jobs.push(
      ensureTickerDataFresh(60_000)
        .then((count) => {
          status.tickersUpdated = count
        })
        .catch((error) => {
          status.errors.push(`Ticker refresh failed: ${errorMessage(error)}`)
        }),
    )
  }

  if (sources.materials) {
    jobs.push(
      syncMaterialPrices()
        .then((result) => {
          status.materialPricesUpdated = result.updated
          for (const failure of result.failed) {
            status.errors.push(`Material price refresh failed: ${failure}`)
          }
        })
        .catch((error) => {
          status.errors.push(`Material price refresh failed: ${errorMessage(error)}`)
        }),
    )
  }

  await Promise.all(jobs)
  return status
}

function mergeMaterialPrice(
  row: {
    id: string
    materialKey: string | null
    name: string
    symbol: string
    category: string
    price: number | null
    unit: string | null
    supply: string | null
    demand: string | null
    countries: string | null
    lastUpdated: Date
  },
  priced: MaterialListItem | undefined,
): NewsletterMaterial {
  return {
    id: row.id,
    materialKey: row.materialKey ?? priced?.materialKey ?? row.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
    name: row.name,
    symbol: row.symbol,
    category: row.category,
    // effectivePrice is the same primary-benchmark value used by /api/rare-earth.
    price: priced?.effectivePrice ?? row.price,
    unit: priced?.effectiveUnit ?? row.unit,
    supply: row.supply,
    demand: row.demand,
    countries: row.countries ?? '[]',
    priceAsOf: priced?.priceAsOf ?? row.lastUpdated?.toISOString() ?? null,
    priceIsLive: priced?.priceIsLive ?? false,
    priceChange: priced?.priceChange ?? null,
    priceChangePercent: priced?.priceChangePercent ?? null,
    benchmarkLabel: priced?.benchmarkLabel ?? null,
  }
}

export async function loadNewsletterData(
  options: LoadNewsletterDataOptions = {},
): Promise<NewsletterDataContext> {
  const sources = { ...DEFAULT_SOURCES, ...options.enabledDataSources }
  const sync = options.refresh === false
    ? { newsAdded: null, tickersUpdated: null, materialPricesUpdated: null, errors: [] }
    : await refreshSources(sources)

  const [articles, materialRows, pricedMaterials, tickers] = await Promise.all([
    sources.articles
      ? prisma.article.findMany({
          where: { published: true },
          orderBy: { createdAt: 'desc' },
          take: options.articleLimit ?? 15,
          select: {
            title: true,
            category: true,
            description: true,
            content: true,
            aiSummary: true,
            aiAnalysis: true,
            sourceName: true,
            sourceUrl: true,
            createdAt: true,
          },
        })
      : Promise.resolve([]),
    sources.materials
      ? prisma.rareEarthMaterial.findMany({
          orderBy: { name: 'asc' },
          select: {
            id: true,
            materialKey: true,
            name: true,
            symbol: true,
            category: true,
            price: true,
            unit: true,
            supply: true,
            demand: true,
            countries: true,
            lastUpdated: true,
          },
        })
      : Promise.resolve([]),
    sources.materials ? listMaterialsWithPrices() : Promise.resolve([]),
    sources.tickers
      ? prisma.commodityPrice.findMany({
          orderBy: { updatedAt: 'desc' },
          select: {
            label: true,
            symbol: true,
            price: true,
            change: true,
            previousClose: true,
            type: true,
            updatedAt: true,
          },
        })
      : Promise.resolve([]),
  ])

  const pricedById = new Map(pricedMaterials.filter((m) => m.id).map((m) => [m.id, m]))
  const pricedByKey = new Map(pricedMaterials.map((m) => [m.materialKey, m]))
  const materials = materialRows.map((row) =>
    mergeMaterialPrice(
      row,
      (row.id ? pricedById.get(row.id) : undefined) ??
        (row.materialKey ? pricedByKey.get(row.materialKey) : undefined),
    ),
  )

  // If the database has not been seeded, use the same reference dataset exposed
  // by the public materials endpoint instead of silently dropping all materials.
  if (sources.materials && materials.length === 0) {
    materials.push(...pricedMaterials.map((m) => ({
      id: m.id,
      materialKey: m.materialKey,
      name: m.name,
      symbol: m.symbol,
      category: m.category,
      price: m.effectivePrice,
      unit: m.effectiveUnit,
      supply: null,
      demand: null,
      countries: '[]',
      priceAsOf: m.priceAsOf,
      priceIsLive: m.priceIsLive,
      priceChange: m.priceChange,
      priceChangePercent: m.priceChangePercent,
      benchmarkLabel: m.benchmarkLabel,
    })))
  }

  return {
    articles,
    materials,
    tickers: tickers.map((ticker) => ({
      ...ticker,
      changePercent:
        ticker.previousClose && ticker.previousClose !== 0
          ? ((ticker.price - ticker.previousClose) / ticker.previousClose) * 100
          : null,
    })),
    refreshedAt: new Date(),
    sync,
  }
}

function plainText(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: Math.abs(value) < 10 ? 4 : 2,
  })
}

function formatDate(value: string | Date | null): string {
  if (!value) return 'date unavailable'
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime())
    ? 'date unavailable'
    : date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC'
}

export function formatArticlesForPrompt(articles: NewsletterArticle[]): string {
  return articles.map((article) => {
    // Automated ingestion populates description/content, not aiSummary. Using
    // only the AI fields previously reduced most report context to headlines.
    const summary = article.description?.trim() ||
      article.aiSummary?.trim() ||
      article.aiAnalysis?.trim() ||
      plainText(article.content).slice(0, 1200) ||
      'No summary available'
    const source = article.sourceName || 'Unknown source'
    return `• [${article.category.toUpperCase()}] ${article.title} — ${source}, ${formatDate(article.createdAt)}: ${summary}${article.sourceUrl ? ` | ${article.sourceUrl}` : ''}`
  }).join('\n') || 'No recent articles in the database.'
}

export function formatMaterialPrice(material: NewsletterMaterial): string {
  if (material.price == null || !Number.isFinite(material.price)) return 'Price N/A'
  const change = material.priceChangePercent != null
    ? ` (${material.priceChangePercent >= 0 ? '+' : ''}${material.priceChangePercent.toFixed(2)}% benchmark change)`
    : ''
  return `$${formatNumber(material.price)} per ${material.unit || 'unit'}${change}`
}

export function formatMaterialsForPrompt(materials: NewsletterMaterial[]): string {
  return materials.map((material) => {
    let countries = ''
    try {
      const parsed = JSON.parse(material.countries || '[]')
      countries = Array.isArray(parsed) ? parsed.join(', ') : ''
    } catch {}
    const provenance = material.price == null
      ? ''
      : ` | Benchmark: ${material.benchmarkLabel || 'reference price'} | ${material.priceIsLive ? 'Live-feed backed' : 'Reference/not live'} | As of: ${formatDate(material.priceAsOf)}`
    return `• ${material.name} (${material.symbol}) [${material.category}]: ${formatMaterialPrice(material)}${provenance} | Supply: ${material.supply || 'N/A'} | Demand: ${material.demand || 'N/A'} | Countries: ${countries || 'N/A'}`
  }).join('\n') || 'No critical materials data available.'
}

export function formatTickersForPrompt(tickers: NewsletterTicker[]): string {
  return tickers.map((ticker) => {
    const change = ticker.change != null
      ? `${ticker.change >= 0 ? '+' : ''}${formatNumber(ticker.change)}`
      : 'N/A'
    const percent = ticker.changePercent != null
      ? ` (${ticker.changePercent >= 0 ? '+' : ''}${ticker.changePercent.toFixed(2)}%)`
      : ''
    return `• ${ticker.label} (${ticker.symbol}): $${formatNumber(ticker.price)} [${change}${percent}] | Updated: ${formatDate(ticker.updatedAt)}`
  }).join('\n') || 'No ticker data available.'
}

export function selectMarketSnapshotTickers(tickers: NewsletterTicker[]): NewsletterTicker[] {
  const preferredSymbols = ['REMX', 'MP', 'UUP', 'USO', 'CRUDE', 'URANIUM', 'LITHIUM', 'GOLD']
  const selected: NewsletterTicker[] = []
  const used = new Set<string>()

  for (const symbol of preferredSymbols) {
    const ticker = tickers.find((item) => item.symbol.toUpperCase() === symbol && !used.has(item.symbol))
    if (ticker) {
      selected.push(ticker)
      used.add(ticker.symbol)
    }
    if (selected.length === 4) break
  }

  for (const ticker of tickers) {
    if (selected.length === 4) break
    if (!used.has(ticker.symbol)) {
      selected.push(ticker)
      used.add(ticker.symbol)
    }
  }

  return selected
}

export interface ReportMaterialHighlight {
  name: string
  priceNote: string
  supplyChainStatus: string
  geopoliticalExposure: string
}

function normalizeMaterialName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

/** Keep AI analysis, but bind names and numeric prices to the loaded snapshot. */
export function reconcileMaterialHighlights(
  generated: Array<Partial<ReportMaterialHighlight>>,
  materials: NewsletterMaterial[],
): ReportMaterialHighlight[] {
  const used = new Set<string>()
  const highlights: ReportMaterialHighlight[] = []

  for (const item of generated) {
    const generatedName = normalizeMaterialName(item.name || '')
    const material = materials.find((candidate) => {
      if (used.has(candidate.materialKey)) return false
      const name = normalizeMaterialName(candidate.name)
      const symbol = candidate.symbol.toLowerCase()
      return generatedName.includes(name) || generatedName.includes(` ${symbol} `) ||
        generatedName === symbol || generatedName.endsWith(` ${symbol}`)
    })
    if (!material) continue
    used.add(material.materialKey)
    highlights.push({
      name: `${material.name} (${material.symbol})`,
      priceNote: formatMaterialPrice(material),
      supplyChainStatus: item.supplyChainStatus || material.supply || 'No current supply-chain note available.',
      geopoliticalExposure: item.geopoliticalExposure || 'No material-specific geopolitical exposure was identified in the supplied articles.',
    })
  }

  if (highlights.length === 0) {
    for (const material of materials.filter((m) => m.price != null).slice(0, 5)) {
      highlights.push({
        name: `${material.name} (${material.symbol})`,
        priceNote: formatMaterialPrice(material),
        supplyChainStatus: material.supply || 'No current supply-chain note available.',
        geopoliticalExposure: 'No material-specific geopolitical exposure was identified in the supplied articles.',
      })
    }
  }

  return highlights.slice(0, 6)
}
