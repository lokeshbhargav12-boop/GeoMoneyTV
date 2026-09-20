import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const articles = await prisma.article.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        featured: true,
        published: true,
        createdAt: true,
        updatedAt: true,
        sourceName: true,
        sourceUrl: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      count: articles.length,
      articles,
    })
  } catch (error) {
    console.error('Failed to fetch articles export:', error)
    return NextResponse.json(
      { error: 'Failed to fetch articles export' },
      { status: 500 },
    )
  }
}
