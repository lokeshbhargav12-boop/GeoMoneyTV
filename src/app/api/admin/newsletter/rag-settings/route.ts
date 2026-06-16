import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Default RAG settings
const defaultRagSettings = {
  dailyPromptTemplate: '',
  weeklyPromptTemplate: '',
  contextWindowSize: 10,
  temperature: 0.4,
  maxTokens: 3500,
  enabledDataSources: {
    articles: true,
    materials: true,
    tickers: true,
    userPreferences: true,
  },
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get RAG settings from database
    const settings = await prisma.siteSettings.findUnique({
      where: { key: 'newsletter_rag_settings' },
    })

    if (settings?.value) {
      try {
        const parsedSettings = JSON.parse(settings.value)
        return NextResponse.json({ 
          settings: { ...defaultRagSettings, ...parsedSettings } 
        })
      } catch {
        return NextResponse.json({ settings: defaultRagSettings })
      }
    }

    return NextResponse.json({ settings: defaultRagSettings })
  } catch (error: any) {
    console.error('RAG settings fetch error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch RAG settings',
      settings: defaultRagSettings 
    }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { settings } = body

    if (!settings) {
      return NextResponse.json({ error: 'Settings are required' }, { status: 400 })
    }

    // Validate and merge with defaults
    const validatedSettings = {
      ...defaultRagSettings,
      ...settings,
      enabledDataSources: {
        ...defaultRagSettings.enabledDataSources,
        ...settings.enabledDataSources,
      },
    }

    // Save to database
    await prisma.siteSettings.upsert({
      where: { key: 'newsletter_rag_settings' },
      update: { value: JSON.stringify(validatedSettings) },
      create: { 
        key: 'newsletter_rag_settings', 
        value: JSON.stringify(validatedSettings) 
      },
    })

    return NextResponse.json({ 
      success: true, 
      settings: validatedSettings 
    })
  } catch (error: any) {
    console.error('RAG settings save error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to save RAG settings' 
    }, { status: 500 })
  }
}
