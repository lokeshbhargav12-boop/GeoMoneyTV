import { NextResponse } from 'next/server'
import { seedMaterialIntelligence, syncMaterialPrices } from '@/lib/material-intel-service'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// GET /api/cron/materials — seeds the critical materials intelligence layer
// (materials, provenance sources, price benchmarks) and runs the price
// scraper for all feed-backed benchmarks. Protected by CRON_SECRET like the
// other scheduled jobs.
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    console.log('Starting Critical Materials sync job...')

    const seed = await seedMaterialIntelligence()
    console.log(
      `Materials seeded (created=${seed.materials.created}, updated=${seed.materials.updated}), ` +
        `sources +${seed.sources.sources}, links=${seed.sources.links}, benchmarks +${seed.benchmarks.benchmarks}.`,
    )

    const prices = await syncMaterialPrices()
    console.log(`Material prices synced: ${prices.updated} updated, ${prices.failed.length} failed.`)

    return NextResponse.json({
      success: true,
      seed,
      prices: {
        updated: prices.updated,
        failed: prices.failed,
        skipped: prices.skipped,
        details: prices.details,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Critical Materials cron job failed:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
