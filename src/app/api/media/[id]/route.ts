import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type RouteContext = {
    params: {
        id: string
    }
}

export const dynamic = 'force-dynamic'

export async function GET(_: Request, context: RouteContext) {
    try {
        const asset = await prisma.mediaAsset.findUnique({
            where: { id: context.params.id },
            select: {
                data: true,
                mimeType: true,
                filename: true,
            },
        })

        if (!asset) {
            return new NextResponse('Not found', { status: 404 })
        }

        return new NextResponse(asset.data, {
            headers: {
                'Content-Type': asset.mimeType,
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Content-Disposition': `inline; filename="${asset.filename}"`,
            },
        })
    } catch (error) {
        console.error('Media asset fetch error:', error)
        return new NextResponse('Failed to load media', { status: 500 })
    }
}