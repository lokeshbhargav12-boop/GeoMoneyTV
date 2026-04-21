import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
    generateSocialPost,
    sendPostReadyEmail,
    publishToSocialMedia,
    type SocialPostGeneratorSettings,
} from '@/lib/social-post-service'

// GET — List all social posts
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if ((session?.user as any)?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const status = searchParams.get('status')
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
        const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'))

        const where = status ? { status } : {}

        const [posts, total] = await Promise.all([
            prisma.socialPost.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.socialPost.count({ where }),
        ])

        return NextResponse.json({ posts, total, page, limit })
    } catch (error) {
        console.error('Failed to fetch social posts:', error)
        return NextResponse.json({ error: 'Failed to fetch social posts' }, { status: 500 })
    }
}

// POST — Actions: generate, approve, publish, reject, retry
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if ((session?.user as any)?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { action, postId, platforms, generatorSettings, templateId } = body as {
            action: string
            postId?: string
            platforms?: string[]
            generatorSettings?: Partial<SocialPostGeneratorSettings>
            templateId?: string
        }

        switch (action) {
            case 'generate': {
                const { text, imagePrompt, imageUrl } = await generateSocialPost({
                    settings: generatorSettings,
                    templateId,
                })
                const post = await prisma.socialPost.create({
                    data: {
                        text,
                        imagePrompt,
                        imageUrl,
                        status: 'pending',
                        platforms: JSON.stringify(platforms || ['linkedin', 'x', 'instagram']),
                    },
                })
                // Send email notification
                try {
                    await sendPostReadyEmail(post.id)
                } catch (emailErr) {
                    console.warn('Email notification failed:', emailErr)
                }
                return NextResponse.json({ success: true, post })
            }

            case 'approve': {
                if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })
                const post = await prisma.socialPost.update({
                    where: { id: postId },
                    data: { status: 'approved' },
                })
                return NextResponse.json({ success: true, post })
            }

            case 'publish': {
                if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })
                const results = await publishToSocialMedia(postId)
                const post = await prisma.socialPost.findUnique({ where: { id: postId } })
                return NextResponse.json({ success: true, results, post })
            }

            case 'approve-and-publish': {
                if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })
                await prisma.socialPost.update({
                    where: { id: postId },
                    data: { status: 'approved' },
                })
                const results = await publishToSocialMedia(postId)
                const post = await prisma.socialPost.findUnique({ where: { id: postId } })
                return NextResponse.json({ success: true, results, post })
            }

            case 'reject': {
                if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })
                const post = await prisma.socialPost.update({
                    where: { id: postId },
                    data: { status: 'rejected' },
                })
                return NextResponse.json({ success: true, post })
            }

            case 'retry': {
                if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })
                // Get original post to increment retry count
                const original = await prisma.socialPost.findUnique({ where: { id: postId } })
                if (!original) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

                // Mark old post as rejected
                await prisma.socialPost.update({
                    where: { id: postId },
                    data: { status: 'rejected' },
                })

                // Generate new post
                const { text, imagePrompt, imageUrl } = await generateSocialPost({
                    settings: generatorSettings,
                    templateId,
                    retryCount: original.retryCount + 1,
                })
                const post = await prisma.socialPost.create({
                    data: {
                        text,
                        imagePrompt,
                        imageUrl,
                        status: 'pending',
                        platforms: original.platforms || JSON.stringify(['linkedin', 'x', 'instagram']),
                        retryCount: original.retryCount + 1,
                    },
                })
                try {
                    await sendPostReadyEmail(post.id)
                } catch (emailErr) {
                    console.warn('Email notification failed:', emailErr)
                }
                return NextResponse.json({ success: true, post })
            }

            case 'update-text': {
                if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })
                const { text: newText } = body
                if (!newText) return NextResponse.json({ error: 'text required' }, { status: 400 })
                const post = await prisma.socialPost.update({
                    where: { id: postId },
                    data: { text: typeof newText === 'string' ? newText : JSON.stringify(newText) },
                })
                return NextResponse.json({ success: true, post })
            }

            default:
                return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
        }
    } catch (error) {
        console.error('Social post action failed:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Social post action failed' },
            { status: 500 },
        )
    }
}

// DELETE — Delete a social post
export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if ((session?.user as any)?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const postId = searchParams.get('id')
        if (!postId) return NextResponse.json({ error: 'id required' }, { status: 400 })

        await prisma.socialPost.delete({ where: { id: postId } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete social post:', error)
        return NextResponse.json({ error: 'Failed to delete social post' }, { status: 500 })
    }
}
