import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { runShockSimulation } from '@/lib/material-events-service'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// POST /api/materials/[symbol]/simulate — run a constrained shock-propagation
// scenario (C7). Output is ranges + directional effects with confidence and
// visible assumptions; never a single precise price prediction.
export async function POST(req: Request, { params }: { params: { symbol: string } }) {
  try {
    const body = await req.json().catch(() => ({}))
    const { shockType, magnitudePct, geography, durationDays, note } = body ?? {}

    const result = await runShockSimulation(
      {
        symbolOrKey: params.symbol,
        shockType: String(shockType ?? ''),
        magnitudePct: Number(magnitudePct),
        geography: geography ? String(geography) : null,
        durationDays: Number(durationDays ?? 90),
        note: note ? String(note).slice(0, 500) : null,
      },
      await getUserId(),
    )

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error running shock simulation:', error)
    return NextResponse.json({ error: 'Failed to run simulation' }, { status: 500 })
  }
}

async function getUserId(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return null
    const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
    return user?.id ?? null
  } catch {
    return null
  }
}
