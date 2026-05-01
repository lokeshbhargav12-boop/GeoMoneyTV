import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// ─── Location extraction from article text ───────────────────
const LOCATION_MAP: Record<string, { lat: number; lng: number; region: string }> = {
    'united states': { lat: 39.8, lng: -98.5, region: 'North America' },
    'usa': { lat: 39.8, lng: -98.5, region: 'North America' },
    'canada': { lat: 56.1, lng: -106.3, region: 'North America' },
    'ukraine': { lat: 48.3, lng: 31.1, region: 'Europe' },
    'russia': { lat: 61.5, lng: 105.3, region: 'Europe' },
    'germany': { lat: 51.1, lng: 10.4, region: 'Europe' },
    'france': { lat: 46.2, lng: 2.2, region: 'Europe' },
    'uk': { lat: 55.3, lng: -3.4, region: 'Europe' },
    'china': { lat: 35.8, lng: 104.1, region: 'Asia-Pacific' },
    'taiwan': { lat: 23.6, lng: 120.9, region: 'Asia-Pacific' },
    'japan': { lat: 36.2, lng: 138.2, region: 'Asia-Pacific' },
    'india': { lat: 20.5, lng: 78.9, region: 'Asia-Pacific' },
    'south korea': { lat: 35.9, lng: 127.7, region: 'Asia-Pacific' },
    'australia': { lat: -25.2, lng: 133.7, region: 'Asia-Pacific' },
    'iran': { lat: 32.4, lng: 53.6, region: 'Middle East' },
    'israel': { lat: 31.0, lng: 34.8, region: 'Middle East' },
    'saudi arabia': { lat: 23.8, lng: 45.0, region: 'Middle East' },
    'turkey': { lat: 38.9, lng: 35.2, region: 'Middle East' },
    'brazil': { lat: -14.2, lng: -51.9, region: 'South America' },
    'nigeria': { lat: 9.0, lng: 8.6, region: 'Africa' },
    'south africa': { lat: -30.5, lng: 22.9, region: 'Africa' },
    'congo': { lat: -4.0, lng: 21.7, region: 'Africa' },
    'drc': { lat: -4.0, lng: 21.7, region: 'Africa' },
}

function extractLocations(text: string) {
    const lower = text.toLowerCase()
    const found: Array<{ name: string; lat: number; lng: number; region: string }> = []
    const seen = new Set<string>()
    for (const [key, loc] of Object.entries(LOCATION_MAP)) {
        if (lower.includes(key) && !seen.has(key)) {
            seen.add(key)
            found.push({ name: key, ...loc })
        }
    }
    return found
}

export async function GET() {
    try {
        const articles = await prisma.article.findMany({
            where: { published: true },
            select: {
                id: true,
                title: true,
                slug: true,
                description: true,
                imageUrl: true,
                sourceName: true,
                category: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        })

        const events = articles.map(article => {
            const text = `${article.title} ${article.description || ''}`
            const locations = extractLocations(text)

            return {
                id: article.id,
                title: article.title,
                slug: article.slug,
                description: article.description,
                imageUrl: article.imageUrl,
                source: 'geomoney',
                sourceDetail: article.sourceName || 'GeoMoney Intel',
                category: article.category,
                timestamp: article.createdAt,
                locations,
                region: locations[0]?.region || 'Global',
                link: `/news/${article.slug}`,
            }
        })

        return NextResponse.json({
            success: true,
            totalEvents: events.length,
            events,
        }, {
            headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' },
        })
    } catch (error) {
        console.error('Events fetch error:', error)
        return NextResponse.json({ success: false, totalEvents: 0, events: [] }, { status: 200 })
    }
}
