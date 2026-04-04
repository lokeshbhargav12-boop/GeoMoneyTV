import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const category = searchParams.get('category')
        const search = searchParams.get('search')
        const limit = parseInt(searchParams.get('limit') || '100')

        // Debug: check total articles and published count
        const totalCount = await prisma.article.count()
        const publishedCount = await prisma.article.count({ where: { published: true } })
        console.log(`[Articles API] Total articles: ${totalCount}, Published: ${publishedCount}`)

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
                content: true,
                imageUrl: true,
                sourceName: true,
                category: true,
                published: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        })

        console.log(`[Articles API] Returning ${articles.length} articles`)
        return NextResponse.json(articles)
    } catch (error) {
        console.error('Error fetching articles:', error)
        return NextResponse.json([], { status: 200 })
    }
}
