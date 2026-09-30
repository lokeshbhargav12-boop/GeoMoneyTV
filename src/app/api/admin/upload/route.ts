import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import path from 'path'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

function resolveMediaType(mimeType: string): 'image' | 'video' | null {
    if (IMAGE_TYPES.includes(mimeType)) return 'image'
    if (VIDEO_TYPES.includes(mimeType)) return 'video'
    return null
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if ((session?.user as any)?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
        }

        const mediaType = resolveMediaType(file.type)
        if (!mediaType) {
            return NextResponse.json(
                {
                    error:
                        'Invalid file type. Allowed images: JPEG, PNG, WEBP, GIF. Allowed videos: MP4, WEBM, MOV',
                },
                { status: 400 },
            )
        }

        const maxSize = mediaType === 'video' ? 50 * 1024 * 1024 : 5 * 1024 * 1024
        if (file.size > maxSize) {
            return NextResponse.json(
                {
                    error:
                        mediaType === 'video'
                            ? 'Video file too large (max 50MB)'
                            : 'Image file too large (max 5MB)',
                },
                { status: 400 },
            )
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const ext =
            path.extname(file.name).toLowerCase() ||
            (mediaType === 'video' ? '.mp4' : '.jpg')
        const filename = `carousel-${Date.now()}${ext}`
        const asset = await prisma.mediaAsset.create({
            data: {
                kind: 'hero-carousel',
                filename,
                mimeType: file.type,
                data: buffer,
            },
            select: { id: true },
        })

        return NextResponse.json({ url: `/api/media/${asset.id}`, mimeType: file.type, mediaType })
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }
}
