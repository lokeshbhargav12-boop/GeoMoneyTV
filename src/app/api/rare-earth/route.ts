import { NextResponse } from 'next/server'
import { listMaterialsWithPrices, seedMaterialIntelligence } from '@/lib/material-intel-service'
import { ingestArticlesAsEvents, recomputeAllMaterialRisk, seedPilotApplications } from '@/lib/material-events-service'

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
// MaterialSourceLink rows, PriceBenchmark definitions (F4/F5), pilot
// structured applications, and initial Risk Pulse / Early-Warning states.
export async function POST() {
  try {
    const { materials, sources, benchmarks } = await seedMaterialIntelligence()
    const pilot = await seedPilotApplications()
    const ingestion = await ingestArticlesAsEvents({ sinceDays: 14, limit: 100 })
    const risk = await recomputeAllMaterialRisk()

    return NextResponse.json({
      message: 'Critical materials seeded successfully',
      count: materials.created + materials.updated,
      created: materials.created,
      updated: materials.updated,
      sourcesCreated: sources.sources,
      sourceLinks: sources.links,
      benchmarksCreated: benchmarks.benchmarks,
      pilotApplications: pilot.created + pilot.updated,
      eventsCreated: ingestion.created,
      pulsesComputed: risk.pulses,
      statesComputed: risk.states,
    })
  } catch (error) {
    console.error('Error seeding critical materials:', error)
    return NextResponse.json(
      { error: 'Failed to seed critical materials' },
      { status: 500 }
    )
  }
}

