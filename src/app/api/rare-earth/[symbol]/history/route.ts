import { NextResponse } from 'next/server'
import { getMaterialPriceHistory } from '@/lib/material-intel-service'

export const dynamic = 'force-dynamic'

// GET /api/rare-earth/[symbol]/history?benchmark=<id>&days=365
// Observation series (ascending) for the material's primary benchmark, or a
// specific benchmark when `benchmark` is provided. Powers the price chart.
export async function GET(req: Request, { params }: { params: { symbol: string } }) {
  try {
    const { searchParams } = new URL(req.url)
    const benchmarkId = searchParams.get('benchmark')
    const daysParam = parseInt(searchParams.get('days') ?? '365', 10)
    const days = Number.isFinite(daysParam) ? Math.min(Math.max(daysParam, 7), 1825) : 365

    const history = await getMaterialPriceHistory(params.symbol, benchmarkId, days)
    if (!history) {
      return NextResponse.json({ error: 'Material or benchmark not found' }, { status: 404 })
    }
    return NextResponse.json(history)
  } catch (error) {
    console.error('Error fetching material price history:', error)
    return NextResponse.json({ error: 'Failed to fetch price history' }, { status: 500 })
  }
}
