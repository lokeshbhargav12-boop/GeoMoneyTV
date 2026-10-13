import { NextResponse } from 'next/server'
import { getMaterialDetail } from '@/lib/material-intel-service'

export const dynamic = 'force-dynamic'

// GET /api/rare-earth/[symbol] — full material detail: profile, price
// benchmarks with latest observations, source provenance, country roles and
// related materials. Falls back to the static seed dataset when the DB row is
// missing so valid materials never 404.
export async function GET(_req: Request, { params }: { params: { symbol: string } }) {
  try {
    const detail = await getMaterialDetail(params.symbol)
    if (!detail) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }
    return NextResponse.json(detail)
  } catch (error) {
    console.error('Error fetching material detail:', error)
    return NextResponse.json({ error: 'Failed to fetch material detail' }, { status: 500 })
  }
}
