import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isWaitlistRecord(materialPreferences: string | null): boolean {
  if (!materialPreferences) return false

  try {
    const parsed = JSON.parse(materialPreferences)
    return !!parsed?.waitlist
  } catch {
    return materialPreferences.toLowerCase().includes('waitlist')
  }
}

function extractWaitlistName(materialPreferences: string | null): string | null {
  if (!materialPreferences) return null

  try {
    const parsed = JSON.parse(materialPreferences)
    return parsed?.name || parsed?.previous?.name || null
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscribers = await prisma.newsletter.findMany({
      select: {
        id: true,
        email: true,
        active: true,
        materialPreferences: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const waitlist = subscribers
      .filter((subscriber) => isWaitlistRecord(subscriber.materialPreferences))
      .map((subscriber) => ({
        id: subscriber.id,
        name: extractWaitlistName(subscriber.materialPreferences),
        email: subscriber.email,
        active: subscriber.active,
        createdAt: subscriber.createdAt,
        updatedAt: subscriber.updatedAt,
      }))

    const activeOnly = waitlist.filter((person) => person.active)

    return NextResponse.json({
      count: activeOnly.length,
      waitlist: activeOnly,
    })
  } catch (error) {
    console.error('Failed to fetch waitlist export:', error)
    return NextResponse.json(
      { error: 'Failed to fetch waitlist export' },
      { status: 500 },
    )
  }
}
