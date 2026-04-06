import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const category = searchParams.get('category')
        const search = searchParams.get('search')
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

        const where: any = { published: true }

        if (category && category !== 'all') {
            where.category = category
        }

        if (search) {
            where.OR = [
                { title: { contains: search } },
                { description: { contains: search } },
            ]
        }

        const articles = await prisma.article.findMany({
            where,
            select: {
                id: true,
                title: true,
                slug: true,
                description: true,
                imageUrl: true,
                sourceName: true,
                category: true,
                published: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        })

        return NextResponse.json(articles, {
            headers: {
                'Cache-Control': 's-maxage=60, stale-while-revalidate=120',
            },
        })
    } catch (error) {
        console.error('Error fetching articles:', error)
        return NextResponse.json([], { status: 200 })
    }
}
