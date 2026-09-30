import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import path from 'path'
import fs from 'fs'

const KEY = 'hero_carousel'

type CarouselSlide = {
    url: string
    title: string
    subtitle: string
    mediaType: 'image' | 'video'
}

const defaultSlide = (): CarouselSlide => ({
    url: '',
    title: '',
    subtitle: '',
    mediaType: 'image',
})

function getFreshDefaultSlides() {
    return Array(5)
        .fill(null)
        .map(() => defaultSlide())
}

function inferMediaType(url: string): CarouselSlide['mediaType'] {
    if (/\.(mp4|webm|mov)(\?.*)?$/i.test(url)) {
        return 'video'
    }

    return 'image'
}

function normalizeSlide(slide: unknown): CarouselSlide {
    if (!slide || typeof slide !== 'object') {
        return defaultSlide()
    }

    const rawSlide = slide as Partial<CarouselSlide> & {
        url?: unknown
        title?: unknown
        subtitle?: unknown
        mediaType?: unknown
    }

    const url = typeof rawSlide.url === 'string' ? rawSlide.url : ''
    const title = typeof rawSlide.title === 'string' ? rawSlide.title : ''
    const subtitle = typeof rawSlide.subtitle === 'string' ? rawSlide.subtitle : ''
    const mediaType =
        rawSlide.mediaType === 'video' || rawSlide.mediaType === 'image'
            ? rawSlide.mediaType
            : inferMediaType(url)

    return {
        url,
        title,
        subtitle,
        mediaType,
    }
}

function isSlideUrlAvailable(url: string) {
    if (!url) {
        return false
    }

    if (url.startsWith('/api/media/')) {
        return true
    }

    if (url.startsWith('/uploads/')) {
        const relativePath = url.replace(/^\/uploads\//, '')
        const localFilePath = path.join(process.cwd(), 'public', 'uploads', relativePath)
        return fs.existsSync(localFilePath)
    }

    return true
}

export async function GET() {
    try {
        const setting = await prisma.siteSettings.findUnique({ where: { key: KEY } })
        let slides = getFreshDefaultSlides()
        if (setting) {
            try {
                const parsedValue = JSON.parse(setting.value)
                slides = Array.isArray(parsedValue)
                    ? parsedValue.map(normalizeSlide)
                    : getFreshDefaultSlides()
                // Ensure exactly 5 slides
                while (slides.length < 5) slides.push(defaultSlide())
                slides = slides.slice(0, 5)
                const sanitizedSlides = slides.map((slide) =>
                    slide?.url && !isSlideUrlAvailable(slide.url)
                        ? { ...slide, url: '' }
                        : slide,
                )

                const didSanitize = sanitizedSlides.some(
                    (slide, index) => slide.url !== slides[index]?.url,
                )

                slides = sanitizedSlides

                if (didSanitize && setting) {
                    await prisma.siteSettings.update({
                        where: { key: KEY },
                        data: { value: JSON.stringify(slides) },
                    })
                }
            } catch {
                slides = getFreshDefaultSlides()
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

        const normalizedSlides = slides.map(normalizeSlide)

        await prisma.siteSettings.upsert({
            where: { key: KEY },
            update: { value: JSON.stringify(normalizedSlides) },
            create: { key: KEY, value: JSON.stringify(normalizedSlides) },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save carousel settings' }, { status: 500 })
    }
}
