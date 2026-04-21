import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { publishToSocialMedia } from '@/lib/social-post-service'

export async function GET() {
    return NextResponse.json({
        ok: true,
        endpoint: '/api/cron/social-post/approve',
        method: 'POST',
        auth: 'Bearer N8N_WEBHOOK_SECRET',
        status: process.env.N8N_WEBHOOK_SECRET ? 'ready' : 'missing_n8n_webhook_secret',
        message: 'n8n social-post approval endpoint is deployed',
    })
}

/**
 * Email Reply Webhook
 * Called by n8n when admin replies "YES" to the post-ready email.
 * n8n monitors the inbox and forwards the approval here.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}))
        const authHeader = req.headers.get('authorization')
        const secret = process.env.N8N_WEBHOOK_SECRET

        if (secret) {
            const provided = authHeader?.replace('Bearer ', '') || body.secret
            if (provided !== secret) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }
        }

        // Find the latest pending post
        const postId = body.postId
        let post

        if (postId) {
            post = await prisma.socialPost.findUnique({ where: { id: postId } })
        } else {
            // Auto-find the most recent pending post
            post = await prisma.socialPost.findFirst({
                where: { status: 'pending' },
                orderBy: { createdAt: 'desc' },
            })
        }

        if (!post) {
            return NextResponse.json({ error: 'No pending post found' }, { status: 404 })
        }

        // Approve and publish
        await prisma.socialPost.update({
            where: { id: post.id },
            data: { status: 'approved' },
        })

        const results = await publishToSocialMedia(post.id)

        return NextResponse.json({
            success: true,
            postId: post.id,
            results,
            message: 'Post approved and published',
        })
    } catch (error) {
        console.error('Email approval webhook failed:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Approval failed' },
            { status: 500 },
        )
    }
}
