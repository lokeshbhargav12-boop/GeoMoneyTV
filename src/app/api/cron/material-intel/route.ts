import { NextResponse } from 'next/server'
import { ingestArticlesAsEvents, recomputeAllMaterialRisk, seedPilotApplications } from '@/lib/material-events-service'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// GET /api/cron/material-intel — the scheduled intelligence pipeline:
//   1. Ingest recent published articles into canonical events, score
//      relevance against all materials (C1) and derive implications (C3).
//   2. Recompute Risk Pulse history (C4) and early-warning states (C2) for
//      every material.
// Protected by CRON_SECRET like the other scheduled jobs.
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    console.log('Starting Material Intelligence pipeline...')

    // 0. Idempotent pilot enrichment (structured applications, F2).
    const pilot = await seedPilotApplications()
    console.log(`Pilot applications seeded: materials=${pilot.materials}, created=${pilot.created}, updated=${pilot.updated}.`)

    // 1. Ingest -> relevance (C1) -> implications (C3).
    const ingestion = await ingestArticlesAsEvents({ sinceDays: 14, limit: 150 })
    console.log(
      `Ingestion: scanned=${ingestion.scanned}, created=${ingestion.created}, ` +
        `linked=${ingestion.linked}, implications=${ingestion.implications}, skipped=${ingestion.skippedExisting}.`,
    )

    const risk = await recomputeAllMaterialRisk()
    console.log(`Risk recompute: pulses=${risk.pulses}, states=${risk.states}, failed=${risk.failed.length}.`)

    return NextResponse.json({
      success: true,
      pilot,
      ingestion,
      risk,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Material Intelligence cron job failed:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
