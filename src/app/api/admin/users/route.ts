import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { isWaitlistRecord } from '@/lib/waitlist'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [users, subscribers] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.newsletter.findMany({
        where: { active: true },
        select: {
          email: true,
          materialPreferences: true,
        },
      }),
    ])

    const waitlistEmails = new Set(
      subscribers
        .filter((s) => isWaitlistRecord(s.materialPreferences))
        .map((s) => s.email.trim().toLowerCase())
    )

    const enrichedUsers = users.map((u) => ({
      ...u,
      onWaitlist: waitlistEmails.has(u.email.trim().toLowerCase()),
    }))

    return NextResponse.json(enrichedUsers)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}