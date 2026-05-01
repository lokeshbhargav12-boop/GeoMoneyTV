import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if ((session?.user as any)?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { aiModel } = await req.json()

        if (!aiModel) {
            return NextResponse.json({ error: 'AI Model is required' }, { status: 400 })
        }

        // Save AI Model
        await prisma.siteSettings.upsert({
            where: { key: 'ai_model' },
            update: { value: aiModel },
            create: { key: 'ai_model', value: aiModel },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('AI settings save error:', error)
        return NextResponse.json({ error: 'Failed to save AI settings' }, { status: 500 })
    }
}
