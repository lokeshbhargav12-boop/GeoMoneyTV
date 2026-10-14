import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSinceLastChecked } from '@/lib/material-events-service'

export const dynamic = 'force-dynamic'

// GET /api/materials/[symbol]/last-seen — the "Since You Last Checked" delta
// (C6) for the signed-in user. Uses TrackedMaterial.lastSeenAt, never
// inferred from newsletter delivery.
export async function GET(_req: Request, { params }: { params: { symbol: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const delta = await getSinceLastChecked(user.id, params.symbol)
    if (!delta) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }
    return NextResponse.json(delta)
  } catch (error) {
    console.error('Error computing since-last-checked delta:', error)
    return NextResponse.json({ error: 'Failed to compute delta' }, { status: 500 })
  }
}
