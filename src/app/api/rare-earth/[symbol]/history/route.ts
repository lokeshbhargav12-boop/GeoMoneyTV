import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'
import {
  getMaterialPriceHistory,
  toMaterialKey,
  type MaterialPriceHistoryResponse,
} from '@/lib/material-intel-service'
import { CRITICAL_MATERIALS_DATA } from '@/data/critical-materials'
import {
  benchmarksForMaterial,
  generateReferencePriceHistory,
  type MaterialBenchmarkSeed,
} from '@/data/material-benchmarks'

export const dynamic = 'force-dynamic'

type HistoryApiResponse = MaterialPriceHistoryResponse & {
  source: 'observations' | 'yahoo' | 'reference'
  feedSymbol?: string | null
  isProxy?: boolean
}

function subtractDays(days: number): Date {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - days)
  return date
}

const MIN_STORED_HISTORY_POINTS = 5

function findMaterialSeed(symbolOrKey: string) {
  const key = decodeURIComponent(symbolOrKey).trim().toLowerCase()
  if (!key) return null
  return (
    CRITICAL_MATERIALS_DATA.find(
      (material) =>
        material.symbol.toLowerCase() === key ||
        material.name.toLowerCase() === key ||
        toMaterialKey(material.name) === key,
    ) ?? null
  )
}

function seedHistoryResponse(
  seed: MaterialBenchmarkSeed,
  benchmarkId: string | null,
  points: MaterialPriceHistoryResponse['points'],
  source: 'yahoo' | 'reference',
): HistoryApiResponse {
  return {
    benchmark: {
      id: benchmarkId,
      productForm: seed.productForm,
      grade: seed.grade ?? null,
      benchmarkName: seed.benchmarkName ?? null,
      market: seed.market ?? null,
      currency: seed.currency ?? 'USD',
      unit: seed.unit,
    },
    points,
    source,
    feedSymbol: seed.feed?.symbol ?? null,
    isProxy: Boolean(seed.isProxy),
  }
}

// Directly fetch a configured benchmark's historical closes. This is a
// display fallback for newly deployed environments where PriceObservation has
// not accumulated history yet (or where the DB is temporarily unavailable).
async function getYahooFeedHistory(
  seed: MaterialBenchmarkSeed,
  benchmarkId: string | null,
  days: number,
): Promise<HistoryApiResponse | null> {
  if (!seed.feed || seed.feed.provider !== 'yahoo') return null

  const yahooFinance = new YahooFinance()
  const chart = (await yahooFinance.chart(seed.feed.symbol, {
    period1: subtractDays(days),
    interval: days > 730 ? '1wk' : '1d',
  })) as {
    quotes?: Array<{ date?: Date | string; close?: number | string | null }>
  }

  const points = (chart.quotes ?? [])
    .flatMap((quote) => {
      const date = quote.date instanceof Date ? quote.date : new Date(quote.date ?? '')
      const price = typeof quote.close === 'number' ? quote.close : Number(quote.close)
      if (Number.isNaN(date.getTime()) || !Number.isFinite(price)) return []
      return [{ asOf: date.toISOString(), price }]
    })
    .sort((a, b) => new Date(a.asOf).getTime() - new Date(b.asOf).getTime())

  return seedHistoryResponse(seed, benchmarkId, points, 'yahoo')
}

// GET /api/rare-earth/[symbol]/history?benchmark=<id>&feed=<yahoo-symbol>&productForm=<form>&days=365
// 1. Prefers accumulated append-only observations for database-backed benchmarks (>= 5 pts).
// 2. Falls back to live Yahoo Finance historical closes when the benchmark has a Yahoo feed.
// 3. Falls back to a deterministic reference benchmark series anchored to the latest/reference price
//    so physical/OTC benchmarks (rare-earth oxides, gallium, dysprosium, lithium carbonate, U3O8, etc.)
//    and rate-limited environments always render a complete, resilient price history chart.
export async function GET(req: Request, { params }: { params: { symbol: string } }) {
  try {
    const { searchParams } = new URL(req.url)
    const benchmarkId = searchParams.get('benchmark')
    const requestedFeed = searchParams.get('feed')
    const requestedProductForm = searchParams.get('productForm')?.trim() ?? null
    const daysParam = parseInt(searchParams.get('days') ?? '365', 10)
    const days = Number.isFinite(daysParam) ? Math.min(Math.max(daysParam, 7), 1825) : 365

    const materialSeed = findMaterialSeed(params.symbol)
    const materialKey = materialSeed ? toMaterialKey(materialSeed.name) : null
    const seedBenchmarks = materialKey ? benchmarksForMaterial(materialKey) : []

    const storedHistory = await getMaterialPriceHistory(
      params.symbol,
      benchmarkId,
      days,
      requestedProductForm,
    )

    const matchedSeed =
      (requestedFeed
        ? seedBenchmarks.find((seed) => seed.feed?.symbol === requestedFeed)
        : undefined) ??
      (requestedProductForm
        ? seedBenchmarks.find(
            (seed) => seed.productForm.toLowerCase() === requestedProductForm.toLowerCase(),
          )
        : undefined) ??
      (storedHistory
        ? seedBenchmarks.find(
            (seed) =>
              seed.productForm.toLowerCase() === storedHistory.benchmark.productForm.toLowerCase(),
          )
        : undefined) ??
      seedBenchmarks.find((seed) => seed.isPrimary) ??
      seedBenchmarks[0] ??
      null

    if (storedHistory && storedHistory.points.length >= MIN_STORED_HISTORY_POINTS) {
      const response: HistoryApiResponse = {
        ...storedHistory,
        source: 'observations',
        feedSymbol: matchedSeed?.feed?.symbol ?? null,
        isProxy: Boolean(matchedSeed?.isProxy),
      }
      return NextResponse.json(response)
    }

    if (matchedSeed?.feed?.provider === 'yahoo') {
      try {
        const feedHistory = await getYahooFeedHistory(
          matchedSeed,
          storedHistory?.benchmark.id ?? benchmarkId,
          days,
        )
        if (feedHistory && feedHistory.points.length > 0) {
          return NextResponse.json(feedHistory, {
            headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' },
          })
        }
      } catch (error) {
        console.error('Yahoo material history fallback failed:', error)
      }
    }

    if (matchedSeed) {
      const anchorPrice =
        storedHistory && storedHistory.points.length > 0
          ? storedHistory.points[storedHistory.points.length - 1].price
          : matchedSeed.referencePrice
      const referencePoints = generateReferencePriceHistory(matchedSeed, days, anchorPrice)
      return NextResponse.json(
        seedHistoryResponse(
          matchedSeed,
          storedHistory?.benchmark.id ?? benchmarkId,
          referencePoints,
          'reference',
        ),
        {
          headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' },
        },
      )
    }

    if (storedHistory) {
      const response: HistoryApiResponse = { ...storedHistory, source: 'observations' }
      return NextResponse.json(response)
    }

    return NextResponse.json({ error: 'Material or benchmark not found' }, { status: 404 })
  } catch (error) {
    console.error('Error fetching material price history:', error)
    return NextResponse.json({ error: 'Failed to fetch price history' }, { status: 500 })
  }
}