import { NextResponse } from 'next/server'
import { listMaterialsWithPrices, seedMaterialIntelligence } from '@/lib/material-intel-service'

export const dynamic = 'force-dynamic'

// GET /api/rare-earth — all critical materials enriched with the latest
// primary-benchmark price (effectivePrice) where the scraper has collected
// one. Falls back to the static seed dataset when the DB is empty.
export async function GET() {
  try {
    const materials = await listMaterialsWithPrices()
    return NextResponse.json({ materials })
  } catch (error) {
    console.error('Error fetching critical materials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch critical materials' },
      { status: 500 }
    )
  }
}

// POST /api/rare-earth — full idempotent seed: materials (matched by
// materialKey -> symbol -> name, updated in place), provenance Sources +
// MaterialSourceLink rows, and PriceBenchmark definitions (F4/F5).
export async function POST() {
  try {
    const { materials, sources, benchmarks } = await seedMaterialIntelligence()

    return NextResponse.json({
      message: 'Critical materials seeded successfully',
      count: materials.created + materials.updated,
      created: materials.created,
      updated: materials.updated,
      sourcesCreated: sources.sources,
      sourceLinks: sources.links,
      benchmarksCreated: benchmarks.benchmarks,
    })
  } catch (error) {
    console.error('Error seeding critical materials:', error)
    return NextResponse.json(
      { error: 'Failed to seed critical materials' },
      { status: 500 }
    )
  }
}

