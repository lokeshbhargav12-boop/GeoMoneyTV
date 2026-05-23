import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import path from 'path'

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

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, WEBP, GIF' }, { status: 400 })
        }

        const maxSize = 5 * 1024 * 1024 // 5MB
        if (file.size > maxSize) {
            return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const ext = path.extname(file.name).toLowerCase() || '.jpg'
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

        return NextResponse.json({ url: `/api/media/${asset.id}` })
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }
}
