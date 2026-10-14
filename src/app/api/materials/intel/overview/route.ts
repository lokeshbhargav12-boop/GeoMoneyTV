import { NextResponse } from 'next/server'
import { getIntelOverview } from '@/lib/material-events-service'

export const dynamic = 'force-dynamic'

// GET /api/materials/intel/overview — powers the list-page modules:
// "What Moved Critical Materials Today?" (C5) and the early-warning status
// board with per-material Risk Pulse scores (C2 + C4).
export async function GET() {
  try {
    const overview = await getIntelOverview()
    return NextResponse.json(overview)
  } catch (error) {
    console.error('Error fetching materials intel overview:', error)
    return NextResponse.json({ error: 'Failed to fetch intelligence overview' }, { status: 500 })
  }
}
