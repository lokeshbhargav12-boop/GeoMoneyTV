import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const KEY = 'hero_carousel'

const defaultSlides = Array(5).fill(null).map(() => ({ url: '', title: '', subtitle: '' }))

export async function GET() {
    try {
        const setting = await prisma.siteSettings.findUnique({ where: { key: KEY } })
        let slides = defaultSlides
        if (setting) {
            try {
                slides = JSON.parse(setting.value)
                // Ensure exactly 5 slides
                while (slides.length < 5) slides.push({ url: '', title: '', subtitle: '' })
                slides = slides.slice(0, 5)
            } catch {
                slides = defaultSlides
            }
        }
        return NextResponse.json({ slides })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch carousel settings' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if ((session?.user as any)?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { slides } = await req.json()

        if (!Array.isArray(slides) || slides.length !== 5) {
            return NextResponse.json({ error: 'Invalid slides data' }, { status: 400 })
        }

        await prisma.siteSettings.upsert({
            where: { key: KEY },
            update: { value: JSON.stringify(slides) },
            create: { key: KEY, value: JSON.stringify(slides) },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save carousel settings' }, { status: 500 })
    }
}
