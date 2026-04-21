import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
    getSocialPostGeneratorSettings,
    HUGGINGFACE_FREE_IMAGE_MODELS,
    HUGGINGFACE_FREE_TEXT_MODELS,
    OPENROUTER_FREE_MODELS,
    saveSocialPostGeneratorSettings,
} from '@/lib/social-post-service'

async function requireAdmin() {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return null
}

export async function GET() {
    const unauthorized = await requireAdmin()
    if (unauthorized) return unauthorized

    try {
        const settings = await getSocialPostGeneratorSettings()
        return NextResponse.json({
            settings,
            modelOptions: {
                openrouter: OPENROUTER_FREE_MODELS,
                huggingfaceText: HUGGINGFACE_FREE_TEXT_MODELS,
                huggingfaceImage: HUGGINGFACE_FREE_IMAGE_MODELS,
            },
        })
    } catch (error) {
        console.error('Failed to load social post generator settings:', error)
        return NextResponse.json({ error: 'Failed to load social post generator settings' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const unauthorized = await requireAdmin()
    if (unauthorized) return unauthorized

    try {
        const body = await req.json()
        const settings = await saveSocialPostGeneratorSettings(body.settings || {})
        return NextResponse.json({ success: true, settings })
    } catch (error) {
        console.error('Failed to save social post generator settings:', error)
        return NextResponse.json({ error: 'Failed to save social post generator settings' }, { status: 500 })
    }
}