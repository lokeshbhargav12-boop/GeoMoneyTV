import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isWaitlistRecord, parseWaitlistMetadata } from '@/lib/waitlist'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format')

    const [subscribers, users] = await Promise.all([
      prisma.newsletter.findMany({
        select: {
          id: true,
          email: true,
          active: true,
          materialPreferences: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.findMany({
        select: {
          email: true,
          name: true,
        },
      }),
    ])

    const userByEmail = new Map(
      users.map((u) => [u.email.trim().toLowerCase(), u.name])
    )

    const waitlist = subscribers
      .filter((subscriber) => isWaitlistRecord(subscriber.materialPreferences))
      .map((subscriber) => {
        const meta = parseWaitlistMetadata(subscriber.materialPreferences)
        const matchedName = userByEmail.get(subscriber.email.trim().toLowerCase())
        return {
          id: subscriber.id,
          name: meta.name || matchedName || null,
          email: subscriber.email,
          source: meta.source || 'waitlist',
          joinedAt: meta.joinedAt || subscriber.createdAt.toISOString(),
          active: subscriber.active,
          createdAt: subscriber.createdAt,
          updatedAt: subscriber.updatedAt,
        }
      })

    const activeOnly = waitlist.filter((person) => person.active)

    if (format === 'csv') {
      const escapeCsv = (val: string | null | undefined) => {
        const str = val ?? ''
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }

      const rows = [
        ['Name', 'Email', 'Source', 'Status', 'Joined Date'],
        ...activeOnly.map((item) => [
          escapeCsv(item.name || ''),
          escapeCsv(item.email),
          escapeCsv(item.source),
          item.active ? 'Active' : 'Inactive',
          escapeCsv(new Date(item.joinedAt).toISOString()),
        ]),
      ]

      const csvContent = rows.map((r) => r.join(',')).join('\n')
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="geomoney-pro-waitlist-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

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