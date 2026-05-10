import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const category = searchParams.get('category')
        const search = searchParams.get('search')
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
        const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
        const paginate = searchParams.get('paginate') === 'true'

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

        const skip = (page - 1) * limit;

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
            skip,
        })

        if (paginate) {
            const total = await prisma.article.count({ where });
            return NextResponse.json({
                articles,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }, {
                headers: {
                    'Cache-Control': 's-maxage=60, stale-while-revalidate=120',
                },
            });
        }

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
