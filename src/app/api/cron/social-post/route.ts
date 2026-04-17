import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSocialPost, sendPostReadyEmail } from '@/lib/social-post-service'

/**
 * n8n Cron Trigger Endpoint
 * Called by n8n workflow daily at 12:00 AM IST to generate a social media post.
 * Protected by a shared secret (N8N_WEBHOOK_SECRET).
 */
export async function POST(req: Request) {
    try {
        // Authenticate via shared secret
        const body = await req.json().catch(() => ({}))
        const authHeader = req.headers.get('authorization')
        const secret = process.env.N8N_WEBHOOK_SECRET

        if (secret) {
            const provided = authHeader?.replace('Bearer ', '') || body.secret
            if (provided !== secret) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }
        }

        const platforms = body.platforms || ['linkedin', 'x', 'instagram']

        // Generate AI social post
        const { text, imagePrompt, imageUrl } = await generateSocialPost()

        // Save to DB
        const post = await prisma.socialPost.create({
            data: {
                text,
                imagePrompt,
                imageUrl,
                status: 'pending',
                platforms: JSON.stringify(platforms),
                scheduledAt: new Date(),
            },
        })

        // Send notification email to admin
        try {
            await sendPostReadyEmail(post.id)
        } catch (emailErr) {
            console.warn('Email notification failed:', emailErr)
        }

        return NextResponse.json({
            success: true,
            postId: post.id,
            message: 'Social post generated and admin notified',
        })
    } catch (error) {
        console.error('n8n social post generation failed:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Generation failed' },
            { status: 500 },
        )
    }
}
