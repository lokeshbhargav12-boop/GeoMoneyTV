import { NextResponse } from 'next/server'
import { getMaterialIntel } from '@/lib/material-events-service'

export const dynamic = 'force-dynamic'

// GET /api/materials/[symbol]/intel — everything the material detail page
// needs for the intelligence modules: early-warning state (C2), Risk Pulse
// with history and event-linked contributions (C4), relevant events with
// why-relevant + structured implications (C1 + C3) and cross-material
// impact links (C5). Returns null-safe empty modules when no data exists.
export async function GET(_req: Request, { params }: { params: { symbol: string } }) {
  try {
    const intel = await getMaterialIntel(params.symbol)
    if (!intel) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }
    return NextResponse.json(intel)
  } catch (error) {
    console.error('Error fetching material intel:', error)
    return NextResponse.json({ error: 'Failed to fetch material intelligence' }, { status: 500 })
  }
}
