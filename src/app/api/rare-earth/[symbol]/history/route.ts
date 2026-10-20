import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'
import {
  getMaterialPriceHistory,
  toMaterialKey,
  type MaterialPriceHistoryResponse,
} from '@/lib/material-intel-service'
import { CRITICAL_MATERIALS_DATA } from '@/data/critical-materials'
import { benchmarksForMaterial, type MaterialBenchmarkSeed } from '@/data/material-benchmarks'

export const dynamic = 'force-dynamic'

type HistoryApiResponse = MaterialPriceHistoryResponse & {
  source: 'observations' | 'yahoo'
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

function feedHistoryResponse(
  seed: MaterialBenchmarkSeed,
  benchmarkId: string | null,
  points: MaterialPriceHistoryResponse['points'],
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
    source: 'yahoo',
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

  return feedHistoryResponse(seed, benchmarkId, points)
}

// GET /api/rare-earth/[symbol]/history?benchmark=<id>&feed=<yahoo-symbol>&days=365
// Prefers accumulated append-only observations for database-backed benchmarks.
// A configured Yahoo Finance series backfills the display while observations
// are still sparse (or for static fallback pages). `feed` is validated against
// the server-side benchmark seeds, so callers cannot request arbitrary Yahoo
// symbols through this route.
export async function GET(req: Request, { params }: { params: { symbol: string } }) {
  try {
    const { searchParams } = new URL(req.url)
    const benchmarkId = searchParams.get('benchmark')
    const requestedFeed = searchParams.get('feed')
    const daysParam = parseInt(searchParams.get('days') ?? '365', 10)
    const days = Number.isFinite(daysParam) ? Math.min(Math.max(daysParam, 7), 1825) : 365

    const materialSeed = findMaterialSeed(params.symbol)
    const materialKey = materialSeed ? toMaterialKey(materialSeed.name) : null
    const feedSeed =
      materialKey && requestedFeed
        ? benchmarksForMaterial(materialKey).find((seed) => seed.feed?.symbol === requestedFeed) ?? null
        : null

    const storedHistory = benchmarkId
      ? await getMaterialPriceHistory(params.symbol, benchmarkId, days)
      : null
    if (storedHistory && (storedHistory.points.length >= MIN_STORED_HISTORY_POINTS || !feedSeed)) {
      const response: HistoryApiResponse = { ...storedHistory, source: 'observations' }
      return NextResponse.json(response)
    }

    if (feedSeed) {
      try {
        const feedHistory = await getYahooFeedHistory(feedSeed, benchmarkId, days)
        if (feedHistory && feedHistory.points.length > 0) {
          return NextResponse.json(feedHistory, {
            headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' },
          })
        }
      } catch (error) {
        console.error('Yahoo material history fallback failed:', error)
      }
    }

    if (storedHistory) {
      const response: HistoryApiResponse = { ...storedHistory, source: 'observations' }
      return NextResponse.json(response)
    }

    // Return a valid empty series for a configured feed that is temporarily
    // unavailable; the client can then render a purposeful empty state.
    if (feedSeed) {
      return NextResponse.json(feedHistoryResponse(feedSeed, benchmarkId, []))
    }

    return NextResponse.json({ error: 'Material or benchmark not found' }, { status: 404 })
  } catch (error) {
    console.error('Error fetching material price history:', error)
    return NextResponse.json({ error: 'Failed to fetch price history' }, { status: 500 })
  }
}
